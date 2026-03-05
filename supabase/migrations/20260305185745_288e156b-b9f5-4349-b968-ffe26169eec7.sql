
-- Economia config table
CREATE TABLE public.economia_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  inflacao_ativa boolean NOT NULL DEFAULT true,
  faixas jsonb NOT NULL DEFAULT '[{"limite": 200, "multiplicador": 1.0}, {"limite": 400, "multiplicador": 1.25}, {"limite": 600, "multiplicador": 1.5}, {"limite": 999999, "multiplicador": 2.0}]'::jsonb,
  promocao_ativa boolean NOT NULL DEFAULT false,
  promocao_multiplicador numeric NOT NULL DEFAULT 0.75,
  promocao_fim timestamptz,
  promocao_item_ids text[] DEFAULT NULL,
  promocao_global boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.economia_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professor manages own economia_config"
ON public.economia_config
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add multiplier tracking to purchases
ALTER TABLE public.shop_purchases
  ADD COLUMN IF NOT EXISTS multiplicador_aplicado numeric NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS em_promocao boolean NOT NULL DEFAULT false;
