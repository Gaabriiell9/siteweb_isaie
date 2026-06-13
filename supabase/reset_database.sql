-- ============================================================
--  E-T-C Church — Script de reset complet et idempotent
--  Supabase > SQL Editor > Run
--
--  Peut être exécuté plusieurs fois sans erreur.
--  Ne supprime PAS les comptes auth.users.
-- ============================================================


-- ============================================================
-- 0. NETTOYAGE PRÉLIMINAIRE
--    Triggers → Fonctions → Policies (toutes versions connues)
--    Les tables ne sont PAS supprimées (idempotence via IF NOT EXISTS)
-- ============================================================

-- ── Triggers ────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_login ON auth.sessions;
DROP TRIGGER IF EXISTS on_auth_user_created_inscription ON auth.users;

-- ── Fonctions ───────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.update_last_login();
DROP FUNCTION IF EXISTS public.get_eleves_email_confirmed();
DROP FUNCTION IF EXISTS public.handle_new_user_inscription();

-- ── Policies storage.objects (non liées à une table applicative) ──
DROP POLICY IF EXISTS "Lecture publique fichiers"   ON storage.objects;
DROP POLICY IF EXISTS "Upload admin seulement"       ON storage.objects;
DROP POLICY IF EXISTS "Suppression admin seulement"  ON storage.objects;

-- ── Policies tables publiques ────────────────────────────────
DROP POLICY IF EXISTS "Lecture publique"  ON videos;
DROP POLICY IF EXISTS "Admin insert"      ON videos;
DROP POLICY IF EXISTS "Admin update"      ON videos;
DROP POLICY IF EXISTS "Admin delete"      ON videos;

DROP POLICY IF EXISTS "Lecture publique"  ON fichiers;
DROP POLICY IF EXISTS "Admin insert"      ON fichiers;
DROP POLICY IF EXISTS "Admin update"      ON fichiers;
DROP POLICY IF EXISTS "Admin delete"      ON fichiers;

DROP POLICY IF EXISTS "Lecture publique"  ON messages_priere;
DROP POLICY IF EXISTS "Admin insert"      ON messages_priere;
DROP POLICY IF EXISTS "Admin update"      ON messages_priere;
DROP POLICY IF EXISTS "Admin delete"      ON messages_priere;

DROP POLICY IF EXISTS "Lecture publique"  ON cultes;
DROP POLICY IF EXISTS "Admin insert"      ON cultes;
DROP POLICY IF EXISTS "Admin update"      ON cultes;
DROP POLICY IF EXISTS "Admin delete"      ON cultes;

-- ── Policies inscriptions_formation (toutes versions) ────────
DROP POLICY IF EXISTS "Anyone can insert"           ON inscriptions_formation;
DROP POLICY IF EXISTS "Authenticated can read"       ON inscriptions_formation;
DROP POLICY IF EXISTS "Authenticated can update"     ON inscriptions_formation;
DROP POLICY IF EXISTS "Inscription publique insert"  ON inscriptions_formation;
DROP POLICY IF EXISTS "Inscription publique select"  ON inscriptions_formation;
DROP POLICY IF EXISTS "Admin update inscriptions"    ON inscriptions_formation;
DROP POLICY IF EXISTS "Admin delete inscriptions"    ON inscriptions_formation;
DROP POLICY IF EXISTS "Public read inscriptions"     ON inscriptions_formation;
DROP POLICY IF EXISTS "Admin manage inscriptions"    ON inscriptions_formation;

-- ── Policies eleves (toutes versions) ───────────────────────
DROP POLICY IF EXISTS "Eleve voit son profil"        ON eleves;
DROP POLICY IF EXISTS "Eleve modifie son profil"     ON eleves;
DROP POLICY IF EXISTS "Admin voit tous les eleves"   ON eleves;
DROP POLICY IF EXISTS "Admin gere tout eleves"       ON eleves;
DROP POLICY IF EXISTS "Admin gere eleves"            ON eleves;
DROP POLICY IF EXISTS "Inscription eleve insert"     ON eleves;
DROP POLICY IF EXISTS "Service can insert eleve"     ON eleves;

-- ── Policies progression_eleve ───────────────────────────────
DROP POLICY IF EXISTS "Eleve voit sa progression"    ON progression_eleve;
DROP POLICY IF EXISTS "Admin gere progression"       ON progression_eleve;
DROP POLICY IF EXISTS "Inscription progression insert" ON progression_eleve;
DROP POLICY IF EXISTS "Service can insert progression" ON progression_eleve;

-- ── Policies evaluations ─────────────────────────────────────
DROP POLICY IF EXISTS "Eleve voit ses evaluations"   ON evaluations;
DROP POLICY IF EXISTS "Admin gere evaluations"       ON evaluations;

-- ── Policies paiements ───────────────────────────────────────
DROP POLICY IF EXISTS "Eleve voit ses paiements"     ON paiements;
DROP POLICY IF EXISTS "Admin gere paiements"         ON paiements;

-- ── Policies modules_formation ───────────────────────────────
DROP POLICY IF EXISTS "Lecture publique modules"       ON modules_formation;
DROP POLICY IF EXISTS "Admin gere modules"             ON modules_formation;
DROP POLICY IF EXISTS "Admin gere modules_formation"   ON modules_formation;


-- ============================================================
-- 1. TABLES PUBLIQUES
-- ============================================================

CREATE TABLE IF NOT EXISTS videos (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  titre       text        NOT NULL,
  legende     text,
  description text,
  youtube_url text        NOT NULL,
  date_publi  date        NOT NULL DEFAULT CURRENT_DATE,
  is_live     boolean     DEFAULT false,
  visible     boolean     DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fichiers (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nom          text        NOT NULL,
  description  text,
  type         text        CHECK (type IN ('pdf','image','autre')) DEFAULT 'pdf',
  storage_path text        NOT NULL,
  categorie    text        DEFAULT 'general',
  visible      boolean     DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages_priere (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  famille      text        NOT NULL,
  jour_semaine text        NOT NULL,
  semaine      integer     DEFAULT 1,
  titre        text        NOT NULL,
  contenu      text        NOT NULL,
  verset       text,
  date_debut   date,
  date_fin     date,
  visible      boolean     DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cultes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  titre       text        NOT NULL DEFAULT 'Culte du Dimanche',
  date_culte  date        NOT NULL,
  heure_debut time        NOT NULL DEFAULT '10:00',
  heure_fin   time        NOT NULL DEFAULT '11:30',
  type        text        CHECK (type IN ('culte','cellule')) DEFAULT 'culte',
  groupe      text,
  description text,
  lien_live   text,
  visible     boolean     DEFAULT true,
  created_at  timestamptz DEFAULT now()
);


-- ============================================================
-- 2. TABLES FORMATION
-- ============================================================

CREATE TABLE IF NOT EXISTS inscriptions_formation (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom            text,
  nom               text        NOT NULL,
  email             text        NOT NULL,
  telephone         text,
  date_naissance    date,
  pays              text,
  ville             text,
  eglise            text,
  pasteur_referent  text,
  niveau_biblique   text,
  motivation        text,
  formule           text        CHECK (formule IN ('integral','echelonne')),
  communications_ok boolean     DEFAULT false,
  statut            text        DEFAULT 'en_attente'
                                CHECK (statut IN ('en_attente','valide','paye','actif','termine')),
  paiement_effectue boolean     DEFAULT false,
  draft             boolean     DEFAULT false,
  auth_user_id      uuid,
  created_at        timestamptz DEFAULT now()
);

-- Colonnes ajoutées progressivement — idempotentes
ALTER TABLE inscriptions_formation ADD COLUMN IF NOT EXISTS prenom            text;
ALTER TABLE inscriptions_formation ADD COLUMN IF NOT EXISTS niveau_biblique   text;
ALTER TABLE inscriptions_formation ADD COLUMN IF NOT EXISTS communications_ok boolean DEFAULT false;
ALTER TABLE inscriptions_formation ADD COLUMN IF NOT EXISTS draft             boolean DEFAULT false;
ALTER TABLE inscriptions_formation ADD COLUMN IF NOT EXISTS auth_user_id      uuid;

CREATE TABLE IF NOT EXISTS modules_formation (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  numero         integer NOT NULL UNIQUE,
  ordre          integer,
  titre          text    NOT NULL,
  description    text,
  contenu        text,
  duree_semaines integer DEFAULT 8
);

ALTER TABLE modules_formation ADD COLUMN IF NOT EXISTS ordre integer;

CREATE TABLE IF NOT EXISTS eleves (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  inscription_id     uuid        REFERENCES inscriptions_formation(id),
  prenom             text,
  nom                text        NOT NULL,
  email              text        UNIQUE NOT NULL,
  telephone          text,
  pays               text,
  ville              text,
  date_naissance     date,
  eglise             text,
  formule            text        CHECK (formule IN ('integral','echelonne')),
  statut             text        DEFAULT 'actif'
                                 CHECK (statut IN ('actif','suspendu','termine')),
  progression_pct    integer     DEFAULT 0
                                 CHECK (progression_pct >= 0 AND progression_pct <= 100),
  derniere_connexion timestamptz,
  date_inscription   timestamptz DEFAULT now(),
  notes_admin        text,
  raison_suspension  text
);

ALTER TABLE eleves ADD COLUMN IF NOT EXISTS prenom             text;
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS derniere_connexion timestamptz;
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS raison_suspension  text;
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS notes_admin        text;

CREATE TABLE IF NOT EXISTS progression_eleve (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id      uuid        NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  module_id     uuid        NOT NULL REFERENCES modules_formation(id),
  debloque      boolean     DEFAULT false,
  complete      boolean     DEFAULT false,
  date_debloque timestamptz,
  date_complete timestamptz,
  UNIQUE(eleve_id, module_id)
);

CREATE TABLE IF NOT EXISTS evaluations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id    uuid        NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  module_id   uuid        REFERENCES modules_formation(id),
  type        text        CHECK (type IN ('partiel','final','devoir')),
  titre       text        NOT NULL,
  note        decimal(4,2),
  note_max    decimal(4,2) DEFAULT 20,
  commentaire text,
  date_eval   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS paiements (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id      uuid        NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  montant       decimal(10,2) NOT NULL,
  devise        text        DEFAULT 'EUR',
  type_paiement text        CHECK (type_paiement IN ('integral','mensualite','remboursement')),
  statut        text        CHECK (statut IN ('en_attente','reussi','echec','rembourse')),
  methode       text,
  reference     text,
  date_paiement timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions_live (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  titre                   text        NOT NULL,
  description             text,
  module_id               uuid        REFERENCES modules_formation(id),
  type_session            text        CHECK (type_session IN ('ponctuel','recurrent')) DEFAULT 'ponctuel',
  date_session            timestamptz NOT NULL,
  duree_minutes           integer     DEFAULT 60,
  recurrence_pattern      text,
  recurrence_jour_semaine integer,
  recurrence_heure        time,
  lien_zoom               text        NOT NULL,
  zoom_meeting_id         text,
  zoom_password           text,
  statut                  text        DEFAULT 'programme'
                                      CHECK (statut IN ('programme','en_cours','termine','annule')),
  created_by              uuid        REFERENCES auth.users(id),
  created_at              timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions_participants (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid        NOT NULL REFERENCES sessions_live(id) ON DELETE CASCADE,
  eleve_id     uuid        NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  invite_at    timestamptz DEFAULT now(),
  a_rejoint    boolean     DEFAULT false,
  date_rejoint timestamptz,
  UNIQUE(session_id, eleve_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  expediteur_id     uuid        REFERENCES auth.users(id),
  expediteur_type   text        CHECK (expediteur_type IN ('admin','eleve')),
  destinataire_id   uuid,
  destinataire_type text        DEFAULT 'eleve',
  sujet             text,
  contenu           text        NOT NULL,
  lu                boolean     DEFAULT false,
  date_lu           timestamptz,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ressources_module (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id      uuid        NOT NULL REFERENCES modules_formation(id) ON DELETE CASCADE,
  titre          text        NOT NULL,
  description    text,
  type_ressource text        CHECK (type_ressource IN ('pdf','video','lien','image','audio')),
  url            text        NOT NULL,
  taille_ko      integer,
  ordre          integer     DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);


-- ============================================================
-- 3. STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('etc-files', 'etc-files', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Lecture publique fichiers"  ON storage.objects;
CREATE POLICY "Lecture publique fichiers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'etc-files');

DROP POLICY IF EXISTS "Upload admin seulement"      ON storage.objects;
CREATE POLICY "Upload admin seulement"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'etc-files' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Suppression admin seulement" ON storage.objects;
CREATE POLICY "Suppression admin seulement"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'etc-files' AND auth.role() = 'authenticated');


-- ============================================================
-- 4. RLS — Tables publiques
-- ============================================================

ALTER TABLE videos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichiers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_priere  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultes           ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique" ON videos;
CREATE POLICY "Lecture publique" ON videos FOR SELECT USING (visible = true);
DROP POLICY IF EXISTS "Admin insert"     ON videos;
CREATE POLICY "Admin insert"     ON videos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin update"     ON videos;
CREATE POLICY "Admin update"     ON videos FOR UPDATE USING     (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin delete"     ON videos;
CREATE POLICY "Admin delete"     ON videos FOR DELETE USING     (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Lecture publique" ON fichiers;
CREATE POLICY "Lecture publique" ON fichiers FOR SELECT USING (visible = true);
DROP POLICY IF EXISTS "Admin insert"     ON fichiers;
CREATE POLICY "Admin insert"     ON fichiers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin update"     ON fichiers;
CREATE POLICY "Admin update"     ON fichiers FOR UPDATE USING     (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin delete"     ON fichiers;
CREATE POLICY "Admin delete"     ON fichiers FOR DELETE USING     (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Lecture publique" ON messages_priere;
CREATE POLICY "Lecture publique" ON messages_priere FOR SELECT USING (visible = true);
DROP POLICY IF EXISTS "Admin insert"     ON messages_priere;
CREATE POLICY "Admin insert"     ON messages_priere FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin update"     ON messages_priere;
CREATE POLICY "Admin update"     ON messages_priere FOR UPDATE USING     (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin delete"     ON messages_priere;
CREATE POLICY "Admin delete"     ON messages_priere FOR DELETE USING     (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Lecture publique" ON cultes;
CREATE POLICY "Lecture publique" ON cultes FOR SELECT USING (visible = true);
DROP POLICY IF EXISTS "Admin insert"     ON cultes;
CREATE POLICY "Admin insert"     ON cultes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin update"     ON cultes;
CREATE POLICY "Admin update"     ON cultes FOR UPDATE USING     (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin delete"     ON cultes;
CREATE POLICY "Admin delete"     ON cultes FOR DELETE USING     (auth.role() = 'authenticated');


-- ============================================================
-- 5. RLS — Flux d'inscription
--
--    Le trigger handle_new_user_inscription() s'exécute avec
--    SECURITY DEFINER et bypass RLS. Les policies INSERT
--    publiques ne sont plus nécessaires.
-- ============================================================

-- ── inscriptions_formation ───────────────────────────────────
ALTER TABLE inscriptions_formation ENABLE ROW LEVEL SECURITY;

-- Lecture publique (pour vérifier si email déjà inscrit)
DROP POLICY IF EXISTS "Public read inscriptions"     ON inscriptions_formation;
CREATE POLICY "Public read inscriptions"
  ON inscriptions_formation FOR SELECT
  USING (true);

-- Admin gère tout
DROP POLICY IF EXISTS "Admin manage inscriptions"    ON inscriptions_formation;
CREATE POLICY "Admin manage inscriptions"
  ON inscriptions_formation FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ── eleves ───────────────────────────────────────────────────
ALTER TABLE eleves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eleve voit son profil"        ON eleves;
CREATE POLICY "Eleve voit son profil"
  ON eleves FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Eleve modifie son profil"     ON eleves;
CREATE POLICY "Eleve modifie son profil"
  ON eleves FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Admin gere eleves"            ON eleves;
CREATE POLICY "Admin gere eleves"
  ON eleves FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ── progression_eleve ────────────────────────────────────────
ALTER TABLE progression_eleve ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eleve voit sa progression"    ON progression_eleve;
CREATE POLICY "Eleve voit sa progression"
  ON progression_eleve FOR SELECT
  TO authenticated
  USING (
    eleve_id IN (SELECT id FROM eleves WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin gere progression"       ON progression_eleve;
CREATE POLICY "Admin gere progression"
  ON progression_eleve FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ── evaluations ──────────────────────────────────────────────
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eleve voit ses evaluations"   ON evaluations;
CREATE POLICY "Eleve voit ses evaluations"
  ON evaluations FOR SELECT
  TO authenticated
  USING (
    eleve_id IN (SELECT id FROM eleves WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin gere evaluations"       ON evaluations;
CREATE POLICY "Admin gere evaluations"
  ON evaluations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ── paiements ────────────────────────────────────────────────
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eleve voit ses paiements"     ON paiements;
CREATE POLICY "Eleve voit ses paiements"
  ON paiements FOR SELECT
  TO authenticated
  USING (
    eleve_id IN (SELECT id FROM eleves WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin gere paiements"         ON paiements;
CREATE POLICY "Admin gere paiements"
  ON paiements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ── modules_formation ────────────────────────────────────────
ALTER TABLE modules_formation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique modules"     ON modules_formation;
CREATE POLICY "Lecture publique modules"
  ON modules_formation FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin gere modules"           ON modules_formation;
CREATE POLICY "Admin gere modules"
  ON modules_formation FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ── Tables sans RLS (accès contrôlé côté application) ────────
ALTER TABLE sessions_live        DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages             DISABLE ROW LEVEL SECURITY;
ALTER TABLE ressources_module    DISABLE ROW LEVEL SECURITY;


-- ============================================================
-- 6. FONCTIONS SECURITY DEFINER
-- ============================================================

-- Accède à auth.users (inaccessible au rôle authenticated sans SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_eleves_email_confirmed()
RETURNS TABLE(eleve_auth_id uuid, email_confirmed_at timestamptz)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE sql AS $$
  SELECT u.id AS eleve_auth_id, u.email_confirmed_at
  FROM auth.users u
  WHERE u.id IN (
    SELECT auth_user_id FROM public.eleves WHERE auth_user_id IS NOT NULL
  );
$$;

-- S'exécute avec les droits du propriétaire (postgres) pour bypasser RLS
-- Le EXISTS évite toute erreur si l'élève n'est pas encore dans la table
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS trigger AS $$
BEGIN
  UPDATE eleves
  SET derniere_connexion = NOW()
  WHERE auth_user_id = NEW.user_id
    AND EXISTS (SELECT 1 FROM eleves WHERE auth_user_id = NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_login ON auth.sessions;
CREATE TRIGGER on_auth_login
  AFTER INSERT ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_last_login();


-- ============================================================
-- 6b. TRIGGER INSCRIPTION AUTOMATIQUE
--     Crée inscription + eleve + progression lors du signUp
--     Les données sont passées via raw_user_meta_data
--
--     IMPORTANT: Le bloc EXCEPTION garantit que le signUp réussit
--     même si le trigger échoue (contrainte, RLS, etc.)
-- ============================================================

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
  -- Récupérer les métadonnées passées lors du signUp
  v_meta := NEW.raw_user_meta_data;

  -- Ne rien faire si pas de métadonnées d'inscription formation
  IF v_meta IS NULL OR v_meta->>'inscription_type' IS DISTINCT FROM 'formation' THEN
    RETURN NEW;
  END IF;

  v_formule := COALESCE(v_meta->>'formule', 'echelonne');

  -- 1. Créer l'inscription
  INSERT INTO inscriptions_formation (
    prenom, nom, email, telephone, date_naissance,
    pays, ville, eglise, pasteur_referent, niveau_biblique,
    motivation, formule, communications_ok, statut, draft, auth_user_id
  ) VALUES (
    COALESCE(v_meta->>'prenom', ''),
    COALESCE(v_meta->>'nom', 'Inconnu'),
    NEW.email,
    v_meta->>'telephone',
    NULLIF(v_meta->>'date_naissance', '')::date,
    v_meta->>'pays',
    v_meta->>'ville',
    v_meta->>'eglise',
    v_meta->>'pasteur_referent',
    v_meta->>'niveau_biblique',
    v_meta->>'motivation',
    v_formule,
    COALESCE((v_meta->>'communications_ok')::boolean, false),
    'actif',
    false,
    NEW.id
  )
  RETURNING id INTO v_inscription_id;

  -- 2. Créer l'élève
  INSERT INTO eleves (
    auth_user_id, inscription_id, prenom, nom, email,
    telephone, date_naissance, pays, ville, eglise,
    formule, statut, progression_pct
  ) VALUES (
    NEW.id,
    v_inscription_id,
    COALESCE(v_meta->>'prenom', ''),
    COALESCE(v_meta->>'nom', 'Inconnu'),
    NEW.email,
    v_meta->>'telephone',
    NULLIF(v_meta->>'date_naissance', '')::date,
    v_meta->>'pays',
    v_meta->>'ville',
    v_meta->>'eglise',
    v_formule,
    'actif',
    0
  )
  RETURNING id INTO v_eleve_id;

  -- 3. Créer les lignes de progression (tous les modules)
  FOR v_module IN
    SELECT id, numero FROM modules_formation ORDER BY numero
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
  -- Ne JAMAIS faire échouer le signUp si le trigger plante
  -- L'admin pourra créer manuellement l'élève si nécessaire
  RAISE WARNING 'handle_new_user_inscription failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_inscription ON auth.users;
CREATE TRIGGER on_auth_user_created_inscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_inscription();


-- ============================================================
-- 7. DONNÉES INITIALES
-- ============================================================

-- 6 modules (insérés seulement si la table est vide)
INSERT INTO modules_formation (numero, ordre, titre, description)
SELECT v.numero, v.numero, v.titre, v.description
FROM (VALUES
  (1, 'Introduction à la Bible',     'Canon, inspiration, interprétation biblique'),
  (2, 'Ancien Testament',            'Pentateuque, prophètes, écrits'),
  (3, 'Nouveau Testament',           'Évangiles, épîtres, Apocalypse'),
  (4, 'Théologie systématique',      'Doctrines fondamentales de la foi'),
  (5, 'Histoire de l''Église',       'Des apôtres à nos jours'),
  (6, 'Vie chrétienne et ministère', 'Spiritualité, éthique, service')
) AS v(numero, titre, description)
WHERE NOT EXISTS (SELECT 1 FROM modules_formation);

-- Vidéos de démo — supprimer avant mise en production
INSERT INTO videos (titre, legende, description, youtube_url, date_publi)
SELECT titre, legende, description, youtube_url, date_publi
FROM (VALUES
  ('La puissance de la louange',  'Culte du Dimanche',      'Psaume 150 — Louez Dieu dans sa sainteté.',           'https://www.youtube.com/watch?v=EXEMPLE1', '2026-04-06'::date),
  ('Marcher dans la foi',         'Prédication dominicale', 'Hébreux 11 — La foi, certitude des choses espérées.', 'https://www.youtube.com/watch?v=EXEMPLE2', '2026-03-30'::date),
  ('L''adoration en esprit',      'Enseignement biblique',  'Jean 4:24 — Adorer en esprit et en vérité.',          'https://www.youtube.com/watch?v=EXEMPLE3', '2026-03-23'::date)
) AS v(titre, legende, description, youtube_url, date_publi)
WHERE NOT EXISTS (SELECT 1 FROM videos);

-- Messages Montagne de Prière — semaine 1
INSERT INTO messages_priere (famille, jour_semaine, semaine, titre, contenu, verset)
SELECT famille, jour_semaine, semaine, titre, contenu, verset
FROM (VALUES
  ('Ruben',    'Lundi',    1, 'La première naissance',              'Ruben, premier-né de Jacob, nous rappelle que Dieu reconnaît notre place dans sa famille. Intercédons aujourd''hui pour les aînés et les responsables de nos familles.', 'Genèse 49:3'),
  ('Siméon',   'Mardi',    1, 'La transformation par la grâce',    'Siméon fut transformé par la grâce de Dieu. Prions pour que nos familles connaissent cette transformation.',                                                            'Genèse 49:5'),
  ('Lévi',     'Mercredi', 1, 'Le ministère consacré',             'La tribu de Lévi fut consacrée au service de Dieu. Intercédons pour les serviteurs de l''église.',                                                                    'Nombres 3:12'),
  ('Juda',     'Jeudi',    1, 'La louange qui précède la victoire','Juda signifie "louange". Avant toute victoire, il y a la louange. Prions avec un cœur de louange.',                                                                    'Genèse 49:8'),
  ('Dan',      'Vendredi', 1, 'La justice et le discernement',     'Dan représente le discernement et la justice de Dieu. Prions pour la sagesse dans nos décisions.',                                                                    'Genèse 49:16'),
  ('Nephtali', 'Samedi',   1, 'La liberté et la légèreté',         'Nephtali est comparé à une biche en liberté. Prions pour la libération de nos familles.',                                                                            'Genèse 49:21'),
  ('Gad',      'Dimanche', 1, 'La victoire après l''épreuve',      'Gad surmontera les assauts. Prions pour la persévérance de nos familles dans l''épreuve.',                                                                           'Genèse 49:19')
) AS v(famille, jour_semaine, semaine, titre, contenu, verset)
WHERE NOT EXISTS (SELECT 1 FROM messages_priere);


-- ============================================================
-- 8. VÉRIFICATION FINALE
--    Affiche le statut RLS et le nombre de policies par table
-- ============================================================

SELECT
  t.tablename,
  t.rowsecurity                AS rls_active,
  COUNT(p.policyname)          AS nb_policies,
  STRING_AGG(p.policyname, ', ' ORDER BY p.policyname) AS policies
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'videos','fichiers','messages_priere','cultes',
    'inscriptions_formation','eleves','modules_formation',
    'progression_eleve','evaluations','paiements',
    'sessions_live','sessions_participants','messages','ressources_module'
  )
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
