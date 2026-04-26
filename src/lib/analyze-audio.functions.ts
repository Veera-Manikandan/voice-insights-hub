import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  uploadId: z.string().uuid(),
  filePath: z.string().min(1).max(1024),
});

const ResultSchema = z.object({
  happy: z.number(),
  angry: z.number(),
  neutral: z.number(),
  frustrated: z.number(),
  summary: z.string(),
  suggestions: z.string(),
});

export type AnalysisResult = z.infer<typeof ResultSchema>;

function clamp01(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

export const analyzeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    // Verify the upload belongs to the user (RLS also enforces this)
    const { data: upload, error: upErr } = await supabase
      .from("uploads")
      .select("id, user_id, file_url, mime_type, file_name")
      .eq("id", data.uploadId)
      .single();
    if (upErr || !upload) throw new Error("Upload not found");
    if (upload.user_id !== userId) throw new Error("Forbidden");

    // Download the file via the user-scoped client (RLS allows their folder)
    const { data: fileBlob, error: dlErr } = await supabase.storage
      .from("call-recordings")
      .download(data.filePath);
    if (dlErr || !fileBlob) throw new Error(`Could not download audio: ${dlErr?.message ?? ""}`);

    const buf = Buffer.from(await fileBlob.arrayBuffer());
    const base64 = buf.toString("base64");
    const mimeType = upload.mime_type || fileBlob.type || "audio/mpeg";

    const prompt = `You are an expert customer-service call analyst. Analyze the attached call recording.
Return STRICT JSON only, no prose, matching exactly this schema:
{
  "happy": number 0-1,
  "angry": number 0-1,
  "neutral": number 0-1,
  "frustrated": number 0-1,
  "summary": "1-3 sentence summary of the call",
  "suggestions": "2-4 bullet points (use - prefixes) of concrete suggestions for the agent"
}
The four emotion scores should sum to approximately 1.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64 } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", geminiRes.status, errText);
      throw new Error(`Gemini API error (${geminiRes.status})`);
    }

    const geminiJson = (await geminiRes.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Gemini did not return JSON");
      parsed = JSON.parse(match[0]);
    }

    const result: AnalysisResult = {
      happy: clamp01(parsed.happy),
      angry: clamp01(parsed.angry),
      neutral: clamp01(parsed.neutral),
      frustrated: clamp01(parsed.frustrated),
      summary: String(parsed.summary ?? ""),
      suggestions: String(parsed.suggestions ?? ""),
    };

    // Save to analysis table (delete prior analysis for this upload first)
    await supabase.from("analysis").delete().eq("upload_id", data.uploadId);
    const { error: insErr } = await supabase.from("analysis").insert({
      upload_id: data.uploadId,
      user_id: userId,
      happy: result.happy,
      angry: result.angry,
      neutral: result.neutral,
      frustrated: result.frustrated,
      summary: result.summary,
      suggestions: result.suggestions,
    });
    if (insErr) throw new Error(`Failed to save analysis: ${insErr.message}`);

    return result;
  });
