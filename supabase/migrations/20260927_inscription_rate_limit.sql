-- Rate limiting pour create-checkout-session-inscription
-- Table technique accessible uniquement via service_role

CREATE TABLE IF NOT EXISTS public.inscription_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inscription_rate_limit_ip_created
  ON public.inscription_rate_limit (ip_address, created_at DESC);

ALTER TABLE public.inscription_rate_limit ENABLE ROW LEVEL SECURITY;

-- Pas de policy: acces service_role uniquement

-- Nettoyage automatique des entrees de plus de 24h (optionnel, via cron pg_cron si disponible)
COMMENT ON TABLE public.inscription_rate_limit IS 'Rate limiting pour inscription checkout sessions - max 5/heure/IP';
