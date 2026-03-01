
-- Add sala_ids column to shop_items (array of sala UUIDs, null = all salas)
ALTER TABLE public.shop_items ADD COLUMN sala_ids uuid[] DEFAULT NULL;
