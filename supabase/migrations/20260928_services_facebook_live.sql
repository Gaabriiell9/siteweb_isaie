-- Migration: Ajouter la colonne facebook_live_url a la table services
-- Permet de saisir un lien de live Facebook distinct du lien YouTube

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS facebook_live_url text;

COMMENT ON COLUMN public.services.facebook_live_url IS 'URL du live Facebook pour ce culte (optionnel)';
