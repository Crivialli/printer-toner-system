-- Create toners table
CREATE TABLE IF NOT EXISTS public.toners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cilindro', 'toner')),
  brand TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toner_id UUID NOT NULL REFERENCES public.toners(id) ON DELETE CASCADE,
  toner_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  quantity INTEGER NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.toners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth required for this simple system)
CREATE POLICY "Allow all access to toners" ON public.toners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to stock_movements" ON public.stock_movements FOR ALL USING (true) WITH CHECK (true);

-- Seed default toner data
INSERT INTO public.toners (name, type, brand, quantity, min_quantity) VALUES
  ('TEC DR4510', 'cilindro', 'Ricoh', 0, 1),
  ('TEC 4510', 'toner', 'Ricoh', 0, 2),
  ('TEC 280/505A', 'toner', 'HP', 0, 2);
