
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'info',
  mensagem text NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professor manages own notifications"
ON public.notifications FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, lida) WHERE lida = false;

-- Add roulette fields to shop_items
ALTER TABLE public.shop_items ADD COLUMN is_roleta boolean NOT NULL DEFAULT false;
ALTER TABLE public.shop_items ADD COLUMN roleta_opcoes jsonb DEFAULT '[]';

-- Add ciente and roleta_resultado to shop_purchases
ALTER TABLE public.shop_purchases ADD COLUMN ciente boolean NOT NULL DEFAULT false;
ALTER TABLE public.shop_purchases ADD COLUMN roleta_resultado text;
