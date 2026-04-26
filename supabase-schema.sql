-- ============================================================
--  E-T-C Church — Supabase Schema
--  Copiez ce SQL dans Supabase > SQL Editor > Run
-- ============================================================

-- 1. TABLE VIDEOS (prédication)
CREATE TABLE IF NOT EXISTS videos (
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

-- Migration (si la table existe déjà) :
-- ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_live boolean DEFAULT false;

-- 2. TABLE FICHIERS (PDF, images, supports)
CREATE TABLE IF NOT EXISTS fichiers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         text NOT NULL,
  description text,
  type        text CHECK (type IN ('pdf','image','autre')) DEFAULT 'pdf',
  storage_path text NOT NULL,
  categorie   text DEFAULT 'general',
  visible     boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- 3. TABLE MESSAGES MONTAGNE DE PRIÈRE
CREATE TABLE IF NOT EXISTS messages_priere (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  famille     text NOT NULL,
  jour_semaine text NOT NULL,
  semaine     int  DEFAULT 1,
  titre       text NOT NULL,
  contenu     text NOT NULL,
  verset      text,
  date_debut  date,
  date_fin    date,
  visible     boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- 4. TABLE CULTES
CREATE TABLE IF NOT EXISTS cultes (
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

-- ============================================================
-- STORAGE BUCKET pour les fichiers uploadés
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('etc-files', 'etc-files', true)
ON CONFLICT DO NOTHING;

-- Politique : lecture publique
CREATE POLICY "Lecture publique fichiers"
ON storage.objects FOR SELECT
USING (bucket_id = 'etc-files');

-- Politique : upload par admin connecté uniquement
CREATE POLICY "Upload admin seulement"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'etc-files' AND auth.role() = 'authenticated');

CREATE POLICY "Suppression admin seulement"
ON storage.objects FOR DELETE
USING (bucket_id = 'etc-files' AND auth.role() = 'authenticated');

-- ============================================================
-- RLS (Row Level Security) — lecture publique, écriture admin
-- ============================================================
ALTER TABLE videos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichiers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_priere  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultes           ENABLE ROW LEVEL SECURITY;

-- Lecture publique (tous les visitors)
CREATE POLICY "Lecture publique" ON videos          FOR SELECT USING (visible = true);
CREATE POLICY "Lecture publique" ON fichiers        FOR SELECT USING (visible = true);
CREATE POLICY "Lecture publique" ON messages_priere FOR SELECT USING (visible = true);
CREATE POLICY "Lecture publique" ON cultes          FOR SELECT USING (visible = true);

-- Écriture admin seulement (utilisateur connecté)
CREATE POLICY "Admin insert" ON videos          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update" ON videos          FOR UPDATE USING     (auth.role() = 'authenticated');
CREATE POLICY "Admin delete" ON videos          FOR DELETE USING     (auth.role() = 'authenticated');

CREATE POLICY "Admin insert" ON fichiers        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update" ON fichiers        FOR UPDATE USING     (auth.role() = 'authenticated');
CREATE POLICY "Admin delete" ON fichiers        FOR DELETE USING     (auth.role() = 'authenticated');

CREATE POLICY "Admin insert" ON messages_priere FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update" ON messages_priere FOR UPDATE USING     (auth.role() = 'authenticated');
CREATE POLICY "Admin delete" ON messages_priere FOR DELETE USING     (auth.role() = 'authenticated');

CREATE POLICY "Admin insert" ON cultes          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update" ON cultes          FOR UPDATE USING     (auth.role() = 'authenticated');
CREATE POLICY "Admin delete" ON cultes          FOR DELETE USING     (auth.role() = 'authenticated');

-- 5. TABLE INSCRIPTIONS FORMATION
CREATE TABLE IF NOT EXISTS inscriptions_formation (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom               text NOT NULL,
  email             text NOT NULL,
  telephone         text,
  date_naissance    date,
  pays              text,
  ville             text,
  eglise            text,
  pasteur_referent  text,
  motivation        text,
  formule           text CHECK (formule IN ('integral', 'echelonne')),
  statut            text DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'paye', 'actif', 'termine')),
  paiement_effectue boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE inscriptions_formation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert"        ON inscriptions_formation FOR INSERT TO anon        WITH CHECK (true);
CREATE POLICY "Authenticated can read"   ON inscriptions_formation FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update" ON inscriptions_formation FOR UPDATE TO authenticated USING (true);

-- 6. TABLE ÉLÈVES
CREATE TABLE IF NOT EXISTS eleves (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  inscription_id   uuid REFERENCES inscriptions_formation(id),
  nom              text NOT NULL,
  email            text UNIQUE NOT NULL,
  telephone        text,
  pays             text,
  ville            text,
  date_naissance   date,
  eglise           text,
  formule          text CHECK (formule IN ('integral', 'echelonne')),
  date_inscription timestamptz DEFAULT now(),
  statut           text DEFAULT 'actif' CHECK (statut IN ('actif', 'suspendu', 'termine')),
  progression_pct  integer DEFAULT 0 CHECK (progression_pct >= 0 AND progression_pct <= 100),
  notes_admin      text
);

-- 7. TABLE MODULES DE FORMATION
CREATE TABLE IF NOT EXISTS modules_formation (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero          integer NOT NULL UNIQUE,
  titre           text NOT NULL,
  description     text,
  contenu         text,
  duree_semaines  integer DEFAULT 8
);

-- 8. TABLE PROGRESSION ÉLÈVE
CREATE TABLE IF NOT EXISTS progression_eleve (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id       uuid REFERENCES eleves(id) ON DELETE CASCADE,
  module_id      uuid REFERENCES modules_formation(id),
  debloque       boolean DEFAULT false,
  complete       boolean DEFAULT false,
  date_debloque  timestamptz,
  date_complete  timestamptz,
  UNIQUE(eleve_id, module_id)
);

-- 9. TABLE ÉVALUATIONS
CREATE TABLE IF NOT EXISTS evaluations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id    uuid REFERENCES eleves(id) ON DELETE CASCADE,
  module_id   uuid REFERENCES modules_formation(id),
  type        text CHECK (type IN ('partiel', 'final', 'devoir')),
  titre       text NOT NULL,
  note        decimal(4,2),
  note_max    decimal(4,2) DEFAULT 20,
  commentaire text,
  date_eval   timestamptz DEFAULT now()
);

-- 10. TABLE PAIEMENTS
CREATE TABLE IF NOT EXISTS paiements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id       uuid REFERENCES eleves(id) ON DELETE CASCADE,
  montant        decimal(10,2) NOT NULL,
  devise         text DEFAULT 'EUR',
  type_paiement  text CHECK (type_paiement IN ('integral', 'mensualite', 'remboursement')),
  statut         text CHECK (statut IN ('en_attente', 'reussi', 'echec', 'rembourse')),
  methode        text,
  reference      text,
  date_paiement  timestamptz DEFAULT now()
);

-- RLS espace élève
ALTER TABLE eleves            ENABLE ROW LEVEL SECURITY;
ALTER TABLE progression_eleve ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules_formation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eleve voit son profil"      ON eleves            FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Eleve modifie son profil"   ON eleves            FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Eleve voit sa progression"  ON progression_eleve FOR SELECT USING (eleve_id IN (SELECT id FROM eleves WHERE auth_user_id = auth.uid()));
CREATE POLICY "Eleve voit ses evaluations" ON evaluations       FOR SELECT USING (eleve_id IN (SELECT id FROM eleves WHERE auth_user_id = auth.uid()));
CREATE POLICY "Eleve voit ses paiements"   ON paiements         FOR SELECT USING (eleve_id IN (SELECT id FROM eleves WHERE auth_user_id = auth.uid()));
CREATE POLICY "Lecture publique modules"   ON modules_formation FOR SELECT USING (true);
CREATE POLICY "Admin gere tout eleves"     ON eleves            FOR ALL TO authenticated USING (true);

-- Seed 6 modules
INSERT INTO modules_formation (numero, titre, description) VALUES
(1, 'Introduction à la Bible',      'Canon, inspiration, interprétation biblique'),
(2, 'Ancien Testament',             'Pentateuque, prophètes, écrits'),
(3, 'Nouveau Testament',            'Évangiles, épîtres, Apocalypse'),
(4, 'Théologie systématique',       'Doctrines fondamentales de la foi'),
(5, 'Histoire de l''Église',        'Des apôtres à nos jours'),
(6, 'Vie chrétienne et ministère',  'Spiritualité, éthique, service')
ON CONFLICT (numero) DO NOTHING;

-- ============================================================
-- MIGRATIONS v2 — Système d'inscription complet
-- ============================================================

-- Nouvelles colonnes inscriptions_formation
ALTER TABLE inscriptions_formation
  ADD COLUMN IF NOT EXISTS prenom text,
  ADD COLUMN IF NOT EXISTS niveau_biblique text,
  ADD COLUMN IF NOT EXISTS communications_ok boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS draft boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Nouvelles colonnes eleves
ALTER TABLE eleves
  ADD COLUMN IF NOT EXISTS prenom text,
  ADD COLUMN IF NOT EXISTS derniere_connexion timestamptz,
  ADD COLUMN IF NOT EXISTS raison_suspension text;

-- notes_admin était déjà dans le schema initial, mais au cas où
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS notes_admin text;

-- Trigger pour mettre à jour derniere_connexion à chaque login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS trigger AS $$
BEGIN
  UPDATE eleves SET derniere_connexion = NOW()
  WHERE auth_user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attacher le trigger sur auth.sessions (si disponible)
DROP TRIGGER IF EXISTS on_auth_login ON auth.sessions;
CREATE TRIGGER on_auth_login
  AFTER INSERT ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION update_last_login();

-- Politiques RLS supplémentaires pour les nouvelles colonnes
-- (admin peut tout voir et modifier)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'eleves' AND policyname = 'Admin voit tous les eleves'
  ) THEN
    CREATE POLICY "Admin voit tous les eleves" ON eleves FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ============================================================
-- DONNÉES DE TEST (optionnel — à supprimer en production)
-- ============================================================
INSERT INTO videos (titre, legende, description, youtube_url, date_publi) VALUES
('La puissance de la louange',    'Culte du Dimanche',      'Psaume 150 — Louez Dieu dans sa sainteté.',          'https://www.youtube.com/watch?v=EXEMPLE1', '2026-04-06'),
('Marcher dans la foi',           'Prédication dominicale', 'Hébreux 11 — La foi, certitude des choses espérées.', 'https://www.youtube.com/watch?v=EXEMPLE2', '2026-03-30'),
('L''adoration en esprit',        'Enseignement biblique',  'Jean 4:24 — Adorer en esprit et en vérité.',          'https://www.youtube.com/watch?v=EXEMPLE3', '2026-03-23');

INSERT INTO messages_priere (famille, jour_semaine, semaine, titre, contenu, verset) VALUES
('Ruben',    'Lundi',    1, 'La première naissance', 'Ruben, premier-né de Jacob, nous rappelle que Dieu reconnaît notre place dans sa famille. Intercédons aujourd''hui pour les aînés et les responsables de nos familles.', 'Genèse 49:3'),
('Siméon',   'Mardi',    1, 'La transformation par la grâce', 'Siméon fut transformé par la grâce de Dieu. Prions pour que nos familles connaissent cette transformation.', 'Genèse 49:5'),
('Lévi',     'Mercredi', 1, 'Le ministère consacré', 'La tribu de Lévi fut consacrée au service de Dieu. Intercédons pour les serviteurs de l''église.', 'Nombres 3:12'),
('Juda',     'Jeudi',    1, 'La louange qui précède la victoire', 'Juda signifie "louange". Avant toute victoire, il y a la louange. Prions avec un cœur de louange.', 'Genèse 49:8'),
('Dan',      'Vendredi', 1, 'La justice et le discernement', 'Dan représente le discernement et la justice de Dieu. Prions pour la sagesse dans nos décisions.', 'Genèse 49:16'),
('Nephtali', 'Samedi',   1, 'La liberté et la légèreté', 'Nephtali est comparé à une biche en liberté. Prions pour la libération de nos familles.', 'Genèse 49:21'),
('Gad',      'Dimanche', 1, 'La victoire après l''épreuve', 'Gad surmontera les assauts. Prions pour la persévérance de nos familles dans l''épreuve.', 'Genèse 49:19');

-- ── Sessions live ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions_live (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  module_id uuid REFERENCES modules_formation(id),
  type_session text CHECK (type_session IN ('ponctuel', 'recurrent')) DEFAULT 'ponctuel',
  date_session timestamptz NOT NULL,
  duree_minutes integer DEFAULT 60,
  recurrence_pattern text,
  recurrence_jour_semaine integer,
  recurrence_heure time,
  lien_zoom text NOT NULL,
  zoom_meeting_id text,
  zoom_password text,
  statut text DEFAULT 'programme' CHECK (statut IN ('programme', 'en_cours', 'termine', 'annule')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions_live(id) ON DELETE CASCADE,
  eleve_id uuid REFERENCES eleves(id) ON DELETE CASCADE,
  invite_at timestamptz DEFAULT now(),
  a_rejoint boolean DEFAULT false,
  date_rejoint timestamptz,
  UNIQUE(session_id, eleve_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expediteur_id uuid REFERENCES auth.users(id),
  expediteur_type text CHECK (expediteur_type IN ('admin', 'eleve')),
  destinataire_id uuid,
  destinataire_type text DEFAULT 'eleve',
  sujet text,
  contenu text NOT NULL,
  lu boolean DEFAULT false,
  date_lu timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ressources_module (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES modules_formation(id) ON DELETE CASCADE,
  titre text NOT NULL,
  description text,
  type_ressource text CHECK (type_ressource IN ('pdf', 'video', 'lien', 'image', 'audio')),
  url text NOT NULL,
  taille_ko integer,
  ordre integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions_live DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE ressources_module DISABLE ROW LEVEL SECURITY;
