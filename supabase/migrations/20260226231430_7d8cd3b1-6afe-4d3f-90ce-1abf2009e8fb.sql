
-- Add cristais column to equipes
ALTER TABLE public.equipes ADD COLUMN IF NOT EXISTS cristais integer NOT NULL DEFAULT 0;

-- Add xp_necessario column to shop_items (minimum XP to unlock)
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS xp_necessario integer NOT NULL DEFAULT 0;

-- Rename xp_gasto to cristais_gasto in shop_purchases for clarity
ALTER TABLE public.shop_purchases RENAME COLUMN xp_gasto TO cristais_gasto;
