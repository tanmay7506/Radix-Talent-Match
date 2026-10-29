-- Resume profile skills are stored as structured JSON so extraction metadata
-- (level, confidence, evidence, and category) survives a profile save.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS skills jsonb NOT NULL DEFAULT '[]'::jsonb;
