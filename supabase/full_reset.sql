-- ============================================================
-- E·T·C CHURCH — FULL DATABASE RESET
-- Supabase Schema complet basé sur l'analyse du code React
-- Version: 2026-08-01
-- ============================================================
--
-- TABLES IDENTIFIÉES DANS LE CODE :
-- ─────────────────────────────────
-- SITE PUBLIC :
--   • videos (prédications YouTube)
--   • fichiers (PDF, images uploadés)
--   • messages_priere (Montagne de Prière)
--   • cultes (cultes et cellules)
--
-- ESPACE FORMATION/ÉLÈVE :
--   • inscriptions_formation (drafts et inscriptions finalisées)
--   • eleves (profils élèves liés à auth.users)
--   • modules_formation (6 modules de la formation)
--   • progression_eleve (progression par module)
--   • evaluations (notes et examens)
--   • paiements (mensualités et paiements intégraux)
--   • sessions_live (cours en visio Zoom)
--   • sessions_participants (inscriptions aux sessions)
--   • messages (messagerie admin ↔ élève)
--   • ressources_module (PDF, vidéos par module)
--
-- ADMINISTRATION :
--   • admins (utilisateurs administrateurs)
--
-- STORAGE :
--   • etc-files (fichiers uploadés)
--
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- PARTIE 1 : NETTOYAGE COMPLET (DROP)
-- ════════════════════════════════════════════════════════════

-- Supprimer les triggers d'abord (y compris l'ancien trigger problématique)
DROP TRIGGER IF EXISTS on_auth_user_created_inscription ON auth.users;
DROP TRIGGER IF EXISTS on_auth_login ON auth.sessions;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS public.handle_new_user_inscription() CASCADE;
DROP FUNCTION IF EXISTS public.update_last_login() CASCADE;
DROP FUNCTION IF EXISTS public.update_ma_derniere_connexion() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_eleves_email_confirmed() CASCADE;

-- Supprimer les tables dans l'ordre (respect des FK)
DROP TABLE IF EXISTS public.ressources_module CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.sessions_participants CASCADE;
DROP TABLE IF EXISTS public.sessions_live CASCADE;
DROP TABLE IF EXISTS public.paiements CASCADE;
DROP TABLE IF EXISTS public.evaluations CASCADE;
DROP TABLE IF EXISTS public.progression_eleve CASCADE;
DROP TABLE IF EXISTS public.eleves CASCADE;
DROP TABLE IF EXISTS public.inscriptions_formation CASCADE;
DROP TABLE IF EXISTS public.modules_formation CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.cultes CASCADE;
DROP TABLE IF EXISTS public.messages_priere CASCADE;
DROP TABLE IF EXISTS public.fichiers CASCADE;
DROP TABLE IF EXISTS public.videos CASCADE;

-- ════════════════════════════════════════════════════════════
-- PARTIE 2 : CRÉATION DES TABLES
-- ════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 2.1 SITE PUBLIC
-- ──────────────────────────────────────────────────────────────

-- VIDEOS (prédications YouTube)
CREATE TABLE public.videos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre         text NOT NULL,
  legende       text,
  description   text,
  youtube_url   text NOT NULL,
  date_publi    date NOT NULL DEFAULT CURRENT_DATE,
  is_live       boolean NOT NULL DEFAULT false,
  visible       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_videos_date_publi ON public.videos(date_publi DESC);
CREATE INDEX idx_videos_visible ON public.videos(visible) WHERE visible = true;

-- FICHIERS (PDF, images uploadés)
CREATE TABLE public.fichiers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom           text NOT NULL,
  description   text,
  type          text NOT NULL DEFAULT 'pdf' CHECK (type IN ('pdf', 'image', 'autre')),
  storage_path  text NOT NULL,
  categorie     text DEFAULT 'general',
  visible       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fichiers_categorie ON public.fichiers(categorie);
CREATE INDEX idx_fichiers_visible ON public.fichiers(visible) WHERE visible = true;

-- MESSAGES_PRIERE (Montagne de Prière)
CREATE TABLE public.messages_priere (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  famille       text,
  fils          text,
  jour_semaine  text NOT NULL CHECK (jour_semaine IN ('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche')),
  semaine       integer NOT NULL DEFAULT 1 CHECK (semaine >= 1 AND semaine <= 2),
  titre         text NOT NULL,
  contenu       text NOT NULL,
  verset        text,
  visible       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_priere_jour ON public.messages_priere(jour_semaine, semaine);

-- CULTES (cultes du dimanche et cellules)
CREATE TABLE public.cultes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text NOT NULL DEFAULT 'culte' CHECK (type IN ('culte', 'cellule')),
  titre         text NOT NULL,
  description   text,
  date_culte    date NOT NULL,
  heure_debut   time NOT NULL DEFAULT '10:00',
  heure_fin     time NOT NULL DEFAULT '11:30',
  lieu          text,
  predicateur   text,
  theme         text,
  groupe        text,
  lien_live     text,
  visible       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cultes_date ON public.cultes(date_culte);
CREATE INDEX idx_cultes_type ON public.cultes(type);

-- ──────────────────────────────────────────────────────────────
-- 2.2 FORMATION - MODULES
-- ──────────────────────────────────────────────────────────────

-- MODULES_FORMATION (les 6 modules de la formation)
CREATE TABLE public.modules_formation (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero          integer NOT NULL UNIQUE CHECK (numero >= 1),
  titre           text NOT NULL,
  description     text,
  contenu         text,
  duree_semaines  integer NOT NULL DEFAULT 8,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_modules_numero ON public.modules_formation(numero);

-- ──────────────────────────────────────────────────────────────
-- 2.3 FORMATION - INSCRIPTIONS & ÉLÈVES
-- ──────────────────────────────────────────────────────────────

-- INSCRIPTIONS_FORMATION (drafts et inscriptions finalisées)
CREATE TABLE public.inscriptions_formation (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  prenom              text,
  nom                 text NOT NULL DEFAULT 'Inconnu',
  email               text NOT NULL,
  telephone           text,
  date_naissance      date,
  pays                text,
  ville               text,
  eglise              text,
  pasteur_referent    text,
  niveau_biblique     text,
  motivation          text,
  formule             text NOT NULL DEFAULT 'echelonne' CHECK (formule IN ('integral', 'echelonne')),
  communications_ok   boolean NOT NULL DEFAULT false,
  statut              text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'paye', 'actif', 'termine')),
  paiement_effectue   boolean NOT NULL DEFAULT false,
  draft               boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inscriptions_email ON public.inscriptions_formation(email);
CREATE INDEX idx_inscriptions_created ON public.inscriptions_formation(created_at DESC);

-- ELEVES (profils élèves liés à auth.users)
CREATE TABLE public.eleves (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id        uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  inscription_id      uuid REFERENCES public.inscriptions_formation(id) ON DELETE SET NULL,
  prenom              text NOT NULL DEFAULT '',
  nom                 text NOT NULL DEFAULT 'Inconnu',
  email               text UNIQUE NOT NULL,
  telephone           text,
  date_naissance      date,
  pays                text,
  ville               text,
  eglise              text,
  formule             text NOT NULL DEFAULT 'echelonne' CHECK (formule IN ('integral', 'echelonne')),
  statut              text NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'suspendu', 'termine')),
  progression_pct     integer NOT NULL DEFAULT 0 CHECK (progression_pct >= 0 AND progression_pct <= 100),
  date_inscription    timestamptz NOT NULL DEFAULT now(),
  derniere_connexion  timestamptz,
  raison_suspension   text,
  notes_admin         text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_eleves_auth_user ON public.eleves(auth_user_id);
CREATE INDEX idx_eleves_email ON public.eleves(email);
CREATE INDEX idx_eleves_statut ON public.eleves(statut);

-- ──────────────────────────────────────────────────────────────
-- 2.4 FORMATION - PROGRESSION & ÉVALUATIONS
-- ──────────────────────────────────────────────────────────────

-- PROGRESSION_ELEVE (progression par module)
CREATE TABLE public.progression_eleve (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id        uuid NOT NULL REFERENCES public.eleves(id) ON DELETE CASCADE,
  module_id       uuid NOT NULL REFERENCES public.modules_formation(id) ON DELETE CASCADE,
  debloque        boolean NOT NULL DEFAULT false,
  complete        boolean NOT NULL DEFAULT false,
  date_debloque   timestamptz,
  date_complete   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(eleve_id, module_id)
);

CREATE INDEX idx_progression_eleve ON public.progression_eleve(eleve_id);
CREATE INDEX idx_progression_module ON public.progression_eleve(module_id);

-- EVALUATIONS (notes et examens)
CREATE TABLE public.evaluations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id      uuid NOT NULL REFERENCES public.eleves(id) ON DELETE CASCADE,
  module_id     uuid REFERENCES public.modules_formation(id) ON DELETE SET NULL,
  type          text NOT NULL DEFAULT 'devoir' CHECK (type IN ('partiel', 'final', 'devoir')),
  titre         text NOT NULL,
  note          decimal(5,2),
  note_max      decimal(5,2) NOT NULL DEFAULT 20,
  commentaire   text,
  date_eval     timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_evaluations_eleve ON public.evaluations(eleve_id);
CREATE INDEX idx_evaluations_date ON public.evaluations(date_eval DESC);

-- PAIEMENTS (mensualités et paiements intégraux)
CREATE TABLE public.paiements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id        uuid NOT NULL REFERENCES public.eleves(id) ON DELETE CASCADE,
  montant         decimal(10,2) NOT NULL,
  devise          text NOT NULL DEFAULT 'EUR',
  type_paiement   text NOT NULL DEFAULT 'mensualite' CHECK (type_paiement IN ('integral', 'mensualite', 'remboursement')),
  statut          text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'reussi', 'echec', 'rembourse')),
  methode         text,
  reference       text,
  date_paiement   timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_paiements_eleve ON public.paiements(eleve_id);
CREATE INDEX idx_paiements_date ON public.paiements(date_paiement DESC);
CREATE INDEX idx_paiements_statut ON public.paiements(statut);

-- ──────────────────────────────────────────────────────────────
-- 2.5 FORMATION - SESSIONS LIVE & RESSOURCES
-- ──────────────────────────────────────────────────────────────

-- SESSIONS_LIVE (cours en visio Zoom)
CREATE TABLE public.sessions_live (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre                   text NOT NULL,
  description             text,
  module_id               uuid REFERENCES public.modules_formation(id) ON DELETE SET NULL,
  type_session            text NOT NULL DEFAULT 'ponctuel' CHECK (type_session IN ('ponctuel', 'recurrent')),
  date_session            timestamptz NOT NULL,
  duree_minutes           integer NOT NULL DEFAULT 60,
  recurrence_pattern      text,
  recurrence_jour_semaine integer,
  recurrence_heure        time,
  lien_zoom               text NOT NULL,
  zoom_meeting_id         text,
  zoom_password           text,
  statut                  text NOT NULL DEFAULT 'programme' CHECK (statut IN ('programme', 'en_cours', 'termine', 'annule')),
  created_by              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_date ON public.sessions_live(date_session);
CREATE INDEX idx_sessions_statut ON public.sessions_live(statut);

-- SESSIONS_PARTICIPANTS (inscriptions aux sessions)
CREATE TABLE public.sessions_participants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid NOT NULL REFERENCES public.sessions_live(id) ON DELETE CASCADE,
  eleve_id      uuid NOT NULL REFERENCES public.eleves(id) ON DELETE CASCADE,
  invite_at     timestamptz NOT NULL DEFAULT now(),
  a_rejoint     boolean NOT NULL DEFAULT false,
  date_rejoint  timestamptz,
  UNIQUE(session_id, eleve_id)
);

CREATE INDEX idx_participants_session ON public.sessions_participants(session_id);
CREATE INDEX idx_participants_eleve ON public.sessions_participants(eleve_id);

-- RESSOURCES_MODULE (PDF, vidéos par module)
CREATE TABLE public.ressources_module (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id       uuid NOT NULL REFERENCES public.modules_formation(id) ON DELETE CASCADE,
  titre           text NOT NULL,
  description     text,
  type_ressource  text NOT NULL DEFAULT 'pdf' CHECK (type_ressource IN ('pdf', 'video', 'lien', 'image', 'audio')),
  url             text NOT NULL,
  taille_ko       integer,
  ordre           integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ressources_module ON public.ressources_module(module_id);
CREATE INDEX idx_ressources_ordre ON public.ressources_module(module_id, ordre);

-- ──────────────────────────────────────────────────────────────
-- 2.6 MESSAGERIE
-- ──────────────────────────────────────────────────────────────

-- MESSAGES (messagerie admin ↔ élève)
-- Convention :
--   • expediteur_id = auth.users.id (auth_user_id)
--   • destinataire_id = eleves.id (pour grouper les conversations)
CREATE TABLE public.messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expediteur_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expediteur_type   text NOT NULL CHECK (expediteur_type IN ('admin', 'eleve')),
  destinataire_id   uuid NOT NULL,  -- eleves.id (convention)
  destinataire_type text NOT NULL DEFAULT 'eleve' CHECK (destinataire_type IN ('admin', 'eleve')),
  sujet             text,
  contenu           text NOT NULL,
  lu                boolean NOT NULL DEFAULT false,
  date_lu           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_destinataire ON public.messages(destinataire_id);
CREATE INDEX idx_messages_expediteur ON public.messages(expediteur_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX idx_messages_non_lus ON public.messages(destinataire_id, lu) WHERE lu = false;

-- ──────────────────────────────────────────────────────────────
-- 2.7 ADMINISTRATION
-- ──────────────────────────────────────────────────────────────

-- ADMINS (utilisateurs administrateurs)
CREATE TABLE public.admins (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom           text NOT NULL,
  email         text NOT NULL,
  role          text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admins_auth_user ON public.admins(auth_user_id);

-- ════════════════════════════════════════════════════════════
-- PARTIE 3 : STORAGE BUCKET
-- ════════════════════════════════════════════════════════════

-- Créer le bucket pour les fichiers uploadés
INSERT INTO storage.buckets (id, name, public)
VALUES ('etc-files', 'etc-files', true)
ON CONFLICT (id) DO NOTHING;

-- Policies Storage
DROP POLICY IF EXISTS "Lecture publique fichiers" ON storage.objects;
DROP POLICY IF EXISTS "Upload admin seulement" ON storage.objects;
DROP POLICY IF EXISTS "Suppression admin seulement" ON storage.objects;
DROP POLICY IF EXISTS "Upload utilisateur connecté" ON storage.objects;
DROP POLICY IF EXISTS "Suppression utilisateur connecté" ON storage.objects;

CREATE POLICY "Lecture publique fichiers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'etc-files');

CREATE POLICY "Upload utilisateur connecté"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'etc-files' AND auth.role() = 'authenticated');

CREATE POLICY "Suppression utilisateur connecté"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'etc-files' AND auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════
-- PARTIE 4 : FONCTIONS UTILITAIRES
-- ════════════════════════════════════════════════════════════

-- Fonction pour vérifier si l'utilisateur courant est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE auth_user_id = auth.uid()
  );
$$;

-- Fonction admin : récupérer le statut de confirmation email de chaque élève
CREATE OR REPLACE FUNCTION public.get_eleves_email_confirmed()
RETURNS TABLE(eleve_auth_id uuid, email_confirmed_at timestamptz)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE sql
STABLE
AS $$
  SELECT u.id AS eleve_auth_id, u.email_confirmed_at
  FROM auth.users u
  WHERE u.id IN (SELECT auth_user_id FROM public.eleves WHERE auth_user_id IS NOT NULL);
$$;

-- ════════════════════════════════════════════════════════════
-- PARTIE 4b : FONCTION RPC POUR DERNIÈRE CONNEXION
-- (Remplace le trigger sur auth.sessions qui causait des erreurs 500)
-- ════════════════════════════════════════════════════════════

-- Fonction RPC appelée par le frontend après un login réussi
-- L'élève ne peut mettre à jour QUE sa propre ligne (auth.uid())
CREATE OR REPLACE FUNCTION public.update_ma_derniere_connexion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.eleves
  SET derniere_connexion = NOW()
  WHERE auth_user_id = auth.uid();
END;
$$;

-- ════════════════════════════════════════════════════════════
-- PARTIE 5 : TRIGGER INSCRIPTION
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user_inscription()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_eleve_id uuid;
  v_module record;
  v_inscription_type text;
  v_formule text;
  v_date_naissance date;
  v_communications_ok boolean;
BEGIN
  -- Vérifier si c'est une inscription formation
  v_inscription_type := NEW.raw_user_meta_data->>'inscription_type';

  IF v_inscription_type IS NULL OR v_inscription_type != 'formation' THEN
    RETURN NEW;
  END IF;

  -- Valider formule (whitelist stricte)
  v_formule := NEW.raw_user_meta_data->>'formule';
  IF v_formule IS NULL OR v_formule NOT IN ('integral', 'echelonne') THEN
    v_formule := 'echelonne';
  END IF;

  -- Parser date_naissance de façon sécurisée
  BEGIN
    v_date_naissance := (NEW.raw_user_meta_data->>'date_naissance')::date;
  EXCEPTION WHEN OTHERS THEN
    v_date_naissance := NULL;
  END;

  -- Parser communications_ok de façon sécurisée
  BEGIN
    v_communications_ok := COALESCE((NEW.raw_user_meta_data->>'communications_ok')::boolean, false);
  EXCEPTION WHEN OTHERS THEN
    v_communications_ok := false;
  END;

  -- Créer l'élève (statut, progression_pct, notes_admin HARDCODÉS)
  INSERT INTO public.eleves (
    auth_user_id,
    prenom,
    nom,
    email,
    telephone,
    date_naissance,
    pays,
    ville,
    eglise,
    formule,
    statut,
    date_inscription,
    progression_pct,
    notes_admin
  ) VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'prenom'), ''), ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'nom'), ''), 'Inconnu'),
    NEW.email,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'telephone'), ''),
    v_date_naissance,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'pays'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'ville'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'eglise'), ''),
    v_formule,
    'actif',      -- HARDCODÉ
    NOW(),
    0,            -- HARDCODÉ
    NULL          -- HARDCODÉ
  )
  RETURNING id INTO v_eleve_id;

  -- Créer la progression initiale (module 1 débloqué)
  FOR v_module IN
    SELECT id, numero FROM public.modules_formation ORDER BY numero
  LOOP
    INSERT INTO public.progression_eleve (
      eleve_id,
      module_id,
      debloque,
      complete,
      date_debloque
    ) VALUES (
      v_eleve_id,
      v_module.id,
      v_module.numero = 1,
      false,
      CASE WHEN v_module.numero = 1 THEN NOW() ELSE NULL END
    );
  END LOOP;

  -- Créer l'inscription pour historique (statut et draft HARDCODÉS)
  INSERT INTO public.inscriptions_formation (
    auth_user_id,
    prenom,
    nom,
    email,
    telephone,
    date_naissance,
    pays,
    ville,
    eglise,
    pasteur_referent,
    niveau_biblique,
    motivation,
    formule,
    communications_ok,
    statut,
    draft
  ) VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'prenom'), ''), ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'nom'), ''), 'Inconnu'),
    NEW.email,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'telephone'), ''),
    v_date_naissance,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'pays'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'ville'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'eglise'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'pasteur_referent'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'niveau_biblique'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'motivation'), ''),
    v_formule,
    v_communications_ok,
    'actif',      -- HARDCODÉ
    false         -- HARDCODÉ
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[handle_new_user_inscription] Error: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_inscription ON auth.users;
CREATE TRIGGER on_auth_user_created_inscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_inscription();

-- ════════════════════════════════════════════════════════════
-- PARTIE 6 : ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════════════════

-- Activer RLS sur toutes les tables
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fichiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages_priere ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cultes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules_formation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscriptions_formation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eleves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progression_eleve ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ressources_module ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────
-- 6.1 SITE PUBLIC (lecture publique, écriture admin)
-- ──────────────────────────────────────────────────────────────

-- VIDEOS
CREATE POLICY "videos_public_read" ON public.videos
  FOR SELECT USING (visible = true);
CREATE POLICY "videos_admin_all" ON public.videos
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- FICHIERS
CREATE POLICY "fichiers_public_read" ON public.fichiers
  FOR SELECT USING (visible = true);
CREATE POLICY "fichiers_admin_all" ON public.fichiers
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- MESSAGES_PRIERE
CREATE POLICY "messages_priere_public_read" ON public.messages_priere
  FOR SELECT USING (visible = true);
CREATE POLICY "messages_priere_admin_all" ON public.messages_priere
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CULTES
CREATE POLICY "cultes_public_read" ON public.cultes
  FOR SELECT USING (visible = true);
CREATE POLICY "cultes_admin_all" ON public.cultes
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 6.2 MODULES (lecture publique, écriture admin)
-- ──────────────────────────────────────────────────────────────

CREATE POLICY "modules_public_read" ON public.modules_formation
  FOR SELECT USING (true);
CREATE POLICY "modules_admin_all" ON public.modules_formation
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 6.3 INSCRIPTIONS (aucun accès client direct, admin uniquement)
-- ──────────────────────────────────────────────────────────────

CREATE POLICY "inscriptions_admin_all" ON public.inscriptions_formation
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 6.4 ELEVES (chaque élève voit/modifie son propre profil)
-- ──────────────────────────────────────────────────────────────

CREATE POLICY "eleves_own_read" ON public.eleves
  FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "eleves_own_update" ON public.eleves
  FOR UPDATE USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "eleves_admin_all" ON public.eleves
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 6.5 PROGRESSION (élève voit sa progression, admin tout)
-- ──────────────────────────────────────────────────────────────

CREATE POLICY "progression_own_read" ON public.progression_eleve
  FOR SELECT USING (
    eleve_id IN (SELECT id FROM public.eleves WHERE auth_user_id = auth.uid())
  );
CREATE POLICY "progression_admin_all" ON public.progression_eleve
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 6.6 EVALUATIONS (élève voit ses évaluations, admin tout)
-- ──────────────────────────────────────────────────────────────

CREATE POLICY "evaluations_own_read" ON public.evaluations
  FOR SELECT USING (
    eleve_id IN (SELECT id FROM public.eleves WHERE auth_user_id = auth.uid())
  );
CREATE POLICY "evaluations_admin_all" ON public.evaluations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 6.7 PAIEMENTS (élève voit ses paiements, admin tout)
-- ──────────────────────────────────────────────────────────────

CREATE POLICY "paiements_own_read" ON public.paiements
  FOR SELECT USING (
    eleve_id IN (SELECT id FROM public.eleves WHERE auth_user_id = auth.uid())
  );
CREATE POLICY "paiements_admin_all" ON public.paiements
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 6.8 SESSIONS LIVE (élève voit ses sessions, admin tout)
-- ──────────────────────────────────────────────────────────────

CREATE POLICY "sessions_own_read" ON public.sessions_live
  FOR SELECT USING (
    id IN (
      SELECT session_id FROM public.sessions_participants sp
      JOIN public.eleves e ON sp.eleve_id = e.id
      WHERE e.auth_user_id = auth.uid()
    )
  );
CREATE POLICY "sessions_admin_all" ON public.sessions_live
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- SESSIONS_PARTICIPANTS
CREATE POLICY "participants_own_read" ON public.sessions_participants
  FOR SELECT USING (
    eleve_id IN (SELECT id FROM public.eleves WHERE auth_user_id = auth.uid())
  );
CREATE POLICY "participants_admin_all" ON public.sessions_participants
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 6.9 RESSOURCES (élève voit ressources débloquées, admin tout)
-- ──────────────────────────────────────────────────────────────

CREATE POLICY "ressources_own_read" ON public.ressources_module
  FOR SELECT USING (
    module_id IN (
      SELECT pe.module_id FROM public.progression_eleve pe
      JOIN public.eleves e ON pe.eleve_id = e.id
      WHERE e.auth_user_id = auth.uid() AND pe.debloque = true
    )
  );
CREATE POLICY "ressources_admin_all" ON public.ressources_module
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 6.10 MESSAGES (élève voit/envoie ses messages, admin tout)
-- Convention : expediteur_id = auth_user_id, destinataire_id = eleves.id
-- ──────────────────────────────────────────────────────────────

-- L'élève peut lire :
-- 1. Les messages où il est destinataire (destinataire_id = son eleves.id)
-- 2. Les messages qu'il a envoyés (expediteur_id = son auth.uid())
-- Ceci couvre la convention où tous les messages d'une conv ont destinataire_id = eleves.id,
-- MAIS aussi le cas où l'insert réussit et le SELECT immédiat doit pouvoir relire le message
CREATE POLICY "messages_own_read" ON public.messages
  FOR SELECT USING (
    destinataire_id IN (SELECT id FROM public.eleves WHERE auth_user_id = auth.uid())
    OR expediteur_id = auth.uid()
  );
-- L'élève peut insérer un message s'il est l'expéditeur
-- La vérification de destinataire_id n'est PAS nécessaire pour la sécurité :
-- l'élève ne peut pas usurper un autre expéditeur car expediteur_id = auth.uid()
CREATE POLICY "messages_own_insert" ON public.messages
  FOR INSERT WITH CHECK (
    expediteur_type = 'eleve'
    AND expediteur_id = auth.uid()
  );
CREATE POLICY "messages_admin_all" ON public.messages
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 6.11 ADMINS (seuls les admins voient la table admins)
-- ──────────────────────────────────────────────────────────────

CREATE POLICY "admins_admin_read" ON public.admins
  FOR SELECT USING (public.is_admin());

-- ════════════════════════════════════════════════════════════
-- PARTIE 7 : DONNÉES DE SEED
-- ════════════════════════════════════════════════════════════

-- Les 6 modules de la formation
INSERT INTO public.modules_formation (numero, titre, description, duree_semaines) VALUES
  (1, 'Introduction à la Bible', 'Canon, inspiration, herméneutique et méthodes d''étude de l''Écriture.', 8),
  (2, 'Ancien Testament', 'Pentateuque, livres historiques, prophètes et écrits sapientiaux.', 8),
  (3, 'Nouveau Testament', 'Évangiles, Actes, épîtres pauliniennes et littérature johannique.', 8),
  (4, 'Théologie systématique', 'Doctrine de Dieu, christologie, pneumatologie et eschatologie.', 8),
  (5, 'Histoire de l''Église', 'Des apôtres aux mouvements évangéliques contemporains.', 8),
  (6, 'Vie chrétienne et ministère', 'Spiritualité, leadership serviteur, éthique et appel au service.', 8);

-- ════════════════════════════════════════════════════════════
-- PARTIE 8 : VÉRIFICATION FINALE
-- ════════════════════════════════════════════════════════════

-- Vérifier que toutes les tables existent
DO $$
DECLARE
  tables_expected text[] := ARRAY[
    'videos', 'fichiers', 'messages_priere', 'cultes',
    'modules_formation', 'inscriptions_formation', 'eleves',
    'progression_eleve', 'evaluations', 'paiements',
    'sessions_live', 'sessions_participants', 'ressources_module',
    'messages', 'admins'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tables_expected LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      RAISE EXCEPTION 'Table % manquante !', t;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ Toutes les tables ont été créées avec succès.';
END $$;

-- Vérifier que le trigger existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_inscription'
  ) THEN
    RAISE EXCEPTION 'Trigger on_auth_user_created_inscription manquant !';
  END IF;
  RAISE NOTICE '✅ Trigger d''inscription actif.';
END $$;

-- Vérifier que la fonction RPC existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_ma_derniere_connexion'
  ) THEN
    RAISE EXCEPTION 'Fonction update_ma_derniere_connexion manquante !';
  END IF;
  RAISE NOTICE '✅ Fonction RPC update_ma_derniere_connexion disponible.';
END $$;

-- Vérifier les modules
DO $$
DECLARE
  c integer;
BEGIN
  SELECT COUNT(*) INTO c FROM public.modules_formation;
  IF c != 6 THEN
    RAISE EXCEPTION 'Attendu 6 modules, trouvé %', c;
  END IF;
  RAISE NOTICE '✅ 6 modules de formation créés.';
END $$;

-- ════════════════════════════════════════════════════════════
-- ÉTAPES MANUELLES RESTANTES
-- ════════════════════════════════════════════════════════════
--
-- 1. CRÉER VOTRE COMPTE ADMIN
--    ─────────────────────────
--    Inscrivez-vous via le formulaire d'inscription normal (vous aurez
--    un compte élève), puis exécutez :
--
--    INSERT INTO public.admins (auth_user_id, nom, email)
--    SELECT auth_user_id, CONCAT(prenom, ' ', nom), email
--    FROM public.eleves
--    WHERE email = 'votre@email.com';
--
--    OU si vous connaissez votre auth_user_id (visible dans
--    Authentication > Users) :
--
--    INSERT INTO public.admins (auth_user_id, nom, email)
--    VALUES ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'Votre Nom', 'votre@email.com');
--
-- 2. DÉSACTIVER LA CONFIRMATION EMAIL (si pas déjà fait)
--    ────────────────────────────────────────────────────
--    Dans Supabase Dashboard :
--    • Authentication > Providers > Email
--    • Décocher "Confirm email"
--    • Sauvegarder
--
-- 3. CONFIGURER LES VARIABLES D'ENVIRONNEMENT
--    ─────────────────────────────────────────
--    Dans votre projet React (.env.local) :
--    REACT_APP_SUPABASE_URL=https://votre-projet.supabase.co
--    REACT_APP_SUPABASE_ANON_KEY=votre_anon_key
--
-- 4. MODIFIER LE CODE REACT POUR LA DERNIÈRE CONNEXION
--    ──────────────────────────────────────────────────
--    Dans src/lib/supabase.js, fonction signInEleve, après le login réussi,
--    appeler la fonction RPC :
--
--    // Après: return { data: data?.session ? data : { user: data?.user }, error };
--    // Ajouter avant le return:
--    if (data?.user) {
--      supabase.rpc('update_ma_derniere_connexion').catch(() => {});
--    }
--
-- ════════════════════════════════════════════════════════════
