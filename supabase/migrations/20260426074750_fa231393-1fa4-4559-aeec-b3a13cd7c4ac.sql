
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Uploads
CREATE TABLE public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_uploads_user_id ON public.uploads(user_id);

CREATE POLICY "Users view own uploads" ON public.uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own uploads" ON public.uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own uploads" ON public.uploads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own uploads" ON public.uploads FOR DELETE USING (auth.uid() = user_id);

-- Analysis
CREATE TABLE public.analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES public.uploads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  happy NUMERIC NOT NULL DEFAULT 0,
  angry NUMERIC NOT NULL DEFAULT 0,
  neutral NUMERIC NOT NULL DEFAULT 0,
  frustrated NUMERIC NOT NULL DEFAULT 0,
  summary TEXT,
  suggestions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analysis ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_analysis_upload_id ON public.analysis(upload_id);
CREATE INDEX idx_analysis_user_id ON public.analysis(user_id);

CREATE POLICY "Users view own analysis" ON public.analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own analysis" ON public.analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own analysis" ON public.analysis FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own analysis" ON public.analysis FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('call-recordings', 'call-recordings', false);

-- Storage policies: users access their own folder (user_id/<file>)
CREATE POLICY "Users read own recordings"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'call-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own recordings"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'call-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own recordings"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'call-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own recordings"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'call-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
