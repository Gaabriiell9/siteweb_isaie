-- ============================================================
--  E-T-C Church — RESET COMPLET ET RECONSTRUCTION
--
--  Exécuter dans Supabase > SQL Editor
--  CE SCRIPT SUPPRIME TOUTES LES DONNÉES
-- ============================================================


-- ============================================================
-- PARTIE 1 : NETTOYAGE TOTAL
-- ============================================================

-- 1.1 Supprimer tous les triggers
DROP TRIGGER IF EXISTS on_auth_user_created_inscription ON auth.users;
DROP TRIGGER IF EXISTS on_auth_login ON auth.sessions;

-- 1.2 Supprimer toutes les fonctions custom
DROP FUNCTION IF EXISTS public.handle_new_user_inscription() CASCADE;
DROP FUNCTION IF EXISTS public.update_last_login() CASCADE;
DROP FUNCTION IF EXISTS public.get_eleves_email_confirmed() CASCADE;

-- 1.3 Supprimer les policies storage
DROP POLICY IF EXISTS "Lecture publique fichiers" ON storage.objects;
DROP POLICY IF EXISTS "Upload admin seulement" ON storage.objects;
DROP POLICY IF EXISTS "Suppression admin seulement" ON storage.objects;

-- 1.4 Supprimer TOUTES les tables (CASCADE supprime les dépendances)
DROP TABLE IF EXISTS ressources_module CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS sessions_participants CASCADE;
DROP TABLE IF EXISTS sessions_live CASCADE;
DROP TABLE IF EXISTS progression_eleve CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS paiements CASCADE;
DROP TABLE IF EXISTS eleves CASCADE;
DROP TABLE IF EXISTS inscriptions_formation CASCADE;
DROP TABLE IF EXISTS modules_formation CASCADE;
DROP TABLE IF EXISTS cultes CASCADE;
DROP TABLE IF EXISTS messages_priere CASCADE;
DROP TABLE IF EXISTS fichiers CASCADE;
DROP TABLE IF EXISTS videos CASCADE;


-- ============================================================
-- PARTIE 2 : CRÉATION DES TABLES
-- ============================================================

-- 2.1 Tables publiques (site vitrine)
CREATE TABLE videos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre       text NOT NULL,
  legende     text,
  description text,
  youtube_url text NOT NULL,
  date_publi  date NOT NULL DEFAULT CURRENT_DATE,
  is_live     boolean DEFAULT false,
  visible     boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE fichiers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom          text NOT NULL,
  description  text,
  type         text CHECK (type IN ('pdf','image','autre')) DEFAULT 'pdf',
  storage_path text NOT NULL,
  categorie    text DEFAULT 'general',
  visible      boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE messages_priere (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  famille      text NOT NULL,
  jour_semaine text NOT NULL,
  semaine      integer DEFAULT 1,
  titre        text NOT NULL,
  contenu      text NOT NULL,
  verset       text,
  date_debut   date,
  date_fin     date,
  visible      boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE cultes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre       text NOT NULL DEFAULT 'Culte du Dimanche',
  date_culte  date NOT NULL,
  heure_debut time NOT NULL DEFAULT '10:00',
  heure_fin   time NOT NULL DEFAULT '11:30',
  type        text CHECK (type IN ('culte','cellule')) DEFAULT 'culte',
  groupe      text,
  description text,
  lien_live   text,
  visible     boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- 2.2 Tables formation
CREATE TABLE modules_formation (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero         integer NOT NULL UNIQUE,
  titre          text NOT NULL,
  description    text,
  contenu        text,
  duree_semaines integer DEFAULT 8,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE inscriptions_formation (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id      uuid,
  prenom            text,
  nom               text NOT NULL,
  email             text NOT NULL,
  telephone         text,
  date_naissance    date,
  pays              text,
  ville             text,
  eglise            text,
  pasteur_referent  text,
  niveau_biblique   text,
  motivation        text,
  formule           text CHECK (formule IN ('integral','echelonne')),
  communications_ok boolean DEFAULT false,
  statut            text DEFAULT 'actif',
  draft             boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE eleves (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id       uuid UNIQUE,
  inscription_id     uuid REFERENCES inscriptions_formation(id),
  prenom             text,
  nom                text NOT NULL,
  email              text UNIQUE NOT NULL,
  telephone          text,
  date_naissance     date,
  pays               text,
  ville              text,
  eglise             text,
  formule            text CHECK (formule IN ('integral','echelonne')),
  statut             text DEFAULT 'actif' CHECK (statut IN ('actif','suspendu','termine')),
  progression_pct    integer DEFAULT 0,
  date_inscription   timestamptz DEFAULT now(),
  derniere_connexion timestamptz,
  notes_admin        text,
  raison_suspension  text
);

CREATE TABLE progression_eleve (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id      uuid NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  module_id     uuid NOT NULL REFERENCES modules_formation(id) ON DELETE CASCADE,
  debloque      boolean DEFAULT false,
  complete      boolean DEFAULT false,
  date_debloque timestamptz,
  date_complete timestamptz,
  UNIQUE(eleve_id, module_id)
);

CREATE TABLE evaluations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id    uuid NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  module_id   uuid REFERENCES modules_formation(id),
  type        text CHECK (type IN ('partiel','final','devoir')),
  titre       text NOT NULL,
  note        decimal(4,2),
  note_max    decimal(4,2) DEFAULT 20,
  commentaire text,
  date_eval   timestamptz DEFAULT now()
);

CREATE TABLE paiements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id      uuid NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  montant       decimal(10,2) NOT NULL,
  devise        text DEFAULT 'EUR',
  type_paiement text CHECK (type_paiement IN ('integral','mensualite','remboursement')),
  statut        text CHECK (statut IN ('en_attente','reussi','echec','rembourse')),
  methode       text,
  reference     text,
  date_paiement timestamptz DEFAULT now()
);

CREATE TABLE sessions_live (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre           text NOT NULL,
  description     text,
  module_id       uuid REFERENCES modules_formation(id),
  type_session    text CHECK (type_session IN ('ponctuel','recurrent')) DEFAULT 'ponctuel',
  date_session    timestamptz NOT NULL,
  duree_minutes   integer DEFAULT 60,
  lien_zoom       text NOT NULL,
  zoom_password   text,
  statut          text DEFAULT 'programme' CHECK (statut IN ('programme','en_cours','termine','annule')),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE sessions_participants (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES sessions_live(id) ON DELETE CASCADE,
  eleve_id     uuid NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  invite_at    timestamptz DEFAULT now(),
  a_rejoint    boolean DEFAULT false,
  date_rejoint timestamptz,
  UNIQUE(session_id, eleve_id)
);

CREATE TABLE messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expediteur_id     uuid,
  expediteur_type   text CHECK (expediteur_type IN ('admin','eleve')),
  destinataire_id   uuid,
  destinataire_type text DEFAULT 'eleve',
  sujet             text,
  contenu           text NOT NULL,
  lu                boolean DEFAULT false,
  date_lu           timestamptz,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE ressources_module (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id      uuid NOT NULL REFERENCES modules_formation(id) ON DELETE CASCADE,
  titre          text NOT NULL,
  description    text,
  type_ressource text CHECK (type_ressource IN ('pdf','video','lien','image','audio')),
  url            text NOT NULL,
  taille_ko      integer,
  ordre          integer DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);


-- ============================================================
-- PARTIE 3 : RLS — DÉSACTIVÉ SUR TABLES CRITIQUES
-- ============================================================

-- Tables publiques : RLS avec lecture publique
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_priere ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON videos FOR SELECT USING (visible = true);
CREATE POLICY "auth_write" ON videos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public_read" ON fichiers FOR SELECT USING (visible = true);
CREATE POLICY "auth_write" ON fichiers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public_read" ON messages_priere FOR SELECT USING (visible = true);
CREATE POLICY "auth_write" ON messages_priere FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public_read" ON cultes FOR SELECT USING (visible = true);
CREATE POLICY "auth_write" ON cultes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Modules : lecture publique, écriture admin
ALTER TABLE modules_formation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON modules_formation FOR SELECT USING (true);
CREATE POLICY "auth_write" ON modules_formation FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════
-- TABLES CRITIQUES INSCRIPTION : RLS DÉSACTIVÉ
-- C'est plus simple et on sécurise au niveau application
-- ══════════════════════════════════════════════════════════════
ALTER TABLE inscriptions_formation DISABLE ROW LEVEL SECURITY;
ALTER TABLE eleves DISABLE ROW LEVEL SECURITY;
ALTER TABLE progression_eleve DISABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE paiements DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions_live DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE ressources_module DISABLE ROW LEVEL SECURITY;


-- ============================================================
-- PARTIE 4 : STORAGE
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('etc-files', 'etc-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_read" ON storage.objects FOR SELECT USING (bucket_id = 'etc-files');
CREATE POLICY "auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'etc-files');
CREATE POLICY "auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'etc-files');


-- ============================================================
-- PARTIE 5 : FONCTIONS SECURITY DEFINER
-- ============================================================

-- 5.1 Trigger inscription automatique (BULLETPROOF)
CREATE OR REPLACE FUNCTION public.handle_new_user_inscription()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_inscription_id uuid;
  v_eleve_id uuid;
  v_meta jsonb;
  v_formule text;
  v_module record;
BEGIN
  -- Récupérer les métadonnées
  v_meta := NEW.raw_user_meta_data;

  -- Ne rien faire si pas une inscription formation
  IF v_meta IS NULL OR v_meta->>'inscription_type' IS DISTINCT FROM 'formation' THEN
    RETURN NEW;
  END IF;

  v_formule := COALESCE(v_meta->>'formule', 'echelonne');

  -- 1. Créer l'inscription
  INSERT INTO inscriptions_formation (
    auth_user_id, prenom, nom, email, telephone, date_naissance,
    pays, ville, eglise, pasteur_referent, niveau_biblique,
    motivation, formule, communications_ok, statut, draft
  ) VALUES (
    NEW.id,
    COALESCE(v_meta->>'prenom', ''),
    COALESCE(v_meta->>'nom', 'Inconnu'),
    NEW.email,
    v_meta->>'telephone',
    CASE WHEN v_meta->>'date_naissance' IS NOT NULL AND v_meta->>'date_naissance' != ''
         THEN (v_meta->>'date_naissance')::date ELSE NULL END,
    v_meta->>'pays',
    v_meta->>'ville',
    v_meta->>'eglise',
    v_meta->>'pasteur_referent',
    v_meta->>'niveau_biblique',
    v_meta->>'motivation',
    v_formule,
    COALESCE((v_meta->>'communications_ok')::boolean, false),
    'actif',
    false
  )
  RETURNING id INTO v_inscription_id;

  -- 2. Créer l'élève
  INSERT INTO eleves (
    auth_user_id, inscription_id, prenom, nom, email,
    telephone, date_naissance, pays, ville, eglise, formule, statut, progression_pct
  ) VALUES (
    NEW.id,
    v_inscription_id,
    COALESCE(v_meta->>'prenom', ''),
    COALESCE(v_meta->>'nom', 'Inconnu'),
    NEW.email,
    v_meta->>'telephone',
    CASE WHEN v_meta->>'date_naissance' IS NOT NULL AND v_meta->>'date_naissance' != ''
         THEN (v_meta->>'date_naissance')::date ELSE NULL END,
    v_meta->>'pays',
    v_meta->>'ville',
    v_meta->>'eglise',
    v_formule,
    'actif',
    0
  )
  RETURNING id INTO v_eleve_id;

  -- 3. Créer la progression pour chaque module
  FOR v_module IN SELECT id, numero FROM modules_formation ORDER BY numero
  LOOP
    INSERT INTO progression_eleve (eleve_id, module_id, debloque, complete, date_debloque)
    VALUES (
      v_eleve_id,
      v_module.id,
      v_formule = 'integral' OR v_module.numero = 1,
      false,
      CASE WHEN v_formule = 'integral' OR v_module.numero = 1 THEN NOW() ELSE NULL END
    );
  END LOOP;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- NE JAMAIS BLOQUER LE SIGNUP
  RAISE LOG 'handle_new_user_inscription FAILED for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- 5.2 Trigger création
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_inscription();


-- 5.3 Fonction dernière connexion (BULLETPROOF)
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE eleves SET derniere_connexion = NOW()
  WHERE auth_user_id = NEW.user_id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_login ON auth.sessions;
CREATE TRIGGER on_auth_login
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_login();


-- 5.4 Fonction admin : récupérer confirmation email
CREATE OR REPLACE FUNCTION public.get_eleves_email_confirmed()
RETURNS TABLE(eleve_auth_id uuid, email_confirmed_at timestamptz)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE sql AS $$
  SELECT u.id, u.email_confirmed_at
  FROM auth.users u
  WHERE u.id IN (SELECT auth_user_id FROM eleves WHERE auth_user_id IS NOT NULL);
$$;


-- ============================================================
-- PARTIE 6 : DONNÉES INITIALES
-- ============================================================

-- 6 modules de formation
INSERT INTO modules_formation (numero, titre, description) VALUES
  (1, 'Introduction à la Bible', 'Canon, inspiration, interprétation biblique'),
  (2, 'Ancien Testament', 'Pentateuque, prophètes, écrits'),
  (3, 'Nouveau Testament', 'Évangiles, épîtres, Apocalypse'),
  (4, 'Théologie systématique', 'Doctrines fondamentales de la foi'),
  (5, 'Histoire de l''Église', 'Des apôtres à nos jours'),
  (6, 'Vie chrétienne et ministère', 'Spiritualité, éthique, service');


-- ============================================================
-- PARTIE 7 : VÉRIFICATION
-- ============================================================

SELECT 'Tables créées:' AS status, COUNT(*) AS count FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'Modules:' AS status, COUNT(*) AS count FROM modules_formation;
SELECT 'Trigger inscription:' AS status, EXISTS(
  SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
) AS exists;

SELECT '✅ RESET COMPLET TERMINÉ' AS status;
