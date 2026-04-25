import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Waveform } from "@/components/Waveform";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Brain,
  LineChart,
  Mic,
  Sparkles,
  Users,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VoxPulse AI — Real-time voice emotion analysis for support teams" },
      {
        name: "description",
        content:
          "Detect frustration, confusion, and joy in live customer calls. AI-powered response suggestions help agents resolve faster and lift CSAT.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Activity,
    title: "Real-Time Emotion Detection",
    desc: "Live waveform classifies caller emotion with confidence scores — calm, frustrated, confused, happy, or angry.",
  },
  {
    icon: Brain,
    title: "AI Response Suggestions",
    desc: "Context-aware prompts surface the moment a customer's tone shifts. Agents always know what to say next.",
  },
  {
    icon: LineChart,
    title: "Call Analytics Dashboard",
    desc: "Post-call emotion timelines, key moments, and CSAT-predictive scores for every conversation.",
  },
  {
    icon: Users,
    title: "Agent & Team Management",
    desc: "Add agents, organize teams, and track individual KPIs across your entire support floor.",
  },
  {
    icon: Sparkles,
    title: "Integrations Hub",
    desc: "Plug into Zendesk, Twilio, Salesforce, and Genesys in clicks. No engineering required.",
  },
  {
    icon: Mic,
    title: "On-Device Privacy",
    desc: "Voice analysis runs at the edge. No raw audio leaves your infrastructure.",
  },
];

const steps = [
  { n: "01", title: "Connect your call platform", desc: "OAuth into Zendesk, Twilio, or your dialer in under 60 seconds." },
  { n: "02", title: "VoxPulse listens live", desc: "Our voice models analyze tone, cadence, and pitch in real time." },
  { n: "03", title: "Agents get the right move", desc: "Whisper-prompts appear on screen with the perfect next sentence." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-8 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface-elevated/50 px-4 py-1.5 text-xs font-medium backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Now in private beta — limited spots
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Hear every <span className="text-gradient">emotion</span>.<br />
              Win every call.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
              VoxPulse AI listens to your customer calls in real time, detects emotional shifts, and tells your agents exactly what to say next.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup">
                  Start Free Trial <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="glass" size="xl">
                Watch 90s Demo
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" /> No credit card
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" /> SOC 2 ready
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" /> 14-day trial
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-md">
              {/* Glowing card */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-primary opacity-30 blur-3xl" />
              <div className="relative rounded-3xl border border-border bg-surface-elevated/80 p-8 shadow-elegant backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Live call
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">02:14</span>
                </div>

                <div className="h-32 rounded-xl border border-border bg-background/40 p-4">
                  <Waveform className="h-full" />
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-accent/30 bg-accent/10 p-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Detected emotion</div>
                    <div className="font-display font-semibold text-foreground">Frustrated</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Confidence</div>
                    <div className="font-display font-semibold text-accent">94%</div>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-primary/40 bg-primary/10 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-glow">
                    <Sparkles className="h-3 w-3" /> Suggested response
                  </div>
                  <p className="text-sm text-foreground">
                    "I completely understand why this is frustrating. Let me fix this for you right now — here's what I'll do…"
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-t border-border/50 bg-surface/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 max-w-2xl">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">
              Built for support teams
            </div>
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Every conversation, <span className="text-gradient">decoded</span>.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Five capabilities that turn average call centers into empathy-driven CX engines.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group relative rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:border-primary/40 hover:shadow-elegant"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">
              How it works
            </div>
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Live in three steps.
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.n}
                className="relative rounded-2xl border border-border bg-card p-8 shadow-card"
              >
                <div className="font-display text-5xl font-bold text-gradient">{s.n}</div>
                <h3 className="mt-4 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-primary p-12 text-center shadow-elegant md:p-16">
            <div className="absolute inset-0 bg-gradient-radial opacity-50" />
            <div className="relative">
              <h2 className="font-display text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl">
                Stop missing what your customers really mean.
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80">
                Join the beta and turn your next 100 calls into your best 100 calls.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button variant="glass" size="xl" asChild>
                  <Link to="/signup">
                    Claim Your Spot <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} VoxPulse AI. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
