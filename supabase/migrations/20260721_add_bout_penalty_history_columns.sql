-- Add missing bout scoring/penalty columns expected by UI and db client.
ALTER TABLE public.bouts
  ADD COLUMN IF NOT EXISTS penalties_c1_a TEXT DEFAULT '0',
  ADD COLUMN IF NOT EXISTS penalties_c2_a TEXT DEFAULT '0',
  ADD COLUMN IF NOT EXISTS penalties_c3_a TEXT DEFAULT '0',
  ADD COLUMN IF NOT EXISTS penalties_c1_b TEXT DEFAULT '0',
  ADD COLUMN IF NOT EXISTS penalties_c2_b TEXT DEFAULT '0',
  ADD COLUMN IF NOT EXISTS penalties_c3_b TEXT DEFAULT '0',
  ADD COLUMN IF NOT EXISTS points_aka_history TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS points_ao_history TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS victory_method TEXT DEFAULT '';

-- Backfill null rows to match application expectations.
UPDATE public.bouts
SET
  penalties_c1_a = COALESCE(penalties_c1_a, '0'),
  penalties_c2_a = COALESCE(penalties_c2_a, '0'),
  penalties_c3_a = COALESCE(penalties_c3_a, '0'),
  penalties_c1_b = COALESCE(penalties_c1_b, '0'),
  penalties_c2_b = COALESCE(penalties_c2_b, '0'),
  penalties_c3_b = COALESCE(penalties_c3_b, '0'),
  points_aka_history = COALESCE(points_aka_history, ''),
  points_ao_history = COALESCE(points_ao_history, ''),
  victory_method = COALESCE(victory_method, '')
WHERE
  penalties_c1_a IS NULL OR penalties_c2_a IS NULL OR penalties_c3_a IS NULL
  OR penalties_c1_b IS NULL OR penalties_c2_b IS NULL OR penalties_c3_b IS NULL
  OR points_aka_history IS NULL OR points_ao_history IS NULL OR victory_method IS NULL;
