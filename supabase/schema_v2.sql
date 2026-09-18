-- ============================================================================
-- SCHEMA V2 - Source de verite pour la migration front-end
-- Genere depuis la base Supabase de production (2026-09-18)
-- ============================================================================

-- TABLES PRESENTES EN PRODUCTION
-- (toutes avec RLS active)

-- ─────────────────────────────────────────────────────────────────────────────
-- admins
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id),
  nom text,
  email text,
  role text DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'editor')),
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- site_settings (cle, valeur)
-- Cles attendues: nom_eglise, facebook_url, youtube_url
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  cle text PRIMARY KEY,
  valeur text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- announcements (nouvelle table)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  contenu text NOT NULL,
  image_url text,
  pinned boolean DEFAULT false,
  visible boolean DEFAULT true,
  date_publi date DEFAULT CURRENT_DATE,
  date_fin date,
  author_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- services (remplace cultes)
-- type: 'culte' ou 'evenement' (plus de 'cellule')
-- replay_url pour les replays YouTube
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text DEFAULT 'culte' CHECK (type IN ('culte', 'evenement')),
  titre text DEFAULT 'Culte du dimanche',
  description text,
  date_service date NOT NULL,
  heure_debut time DEFAULT '10:00',
  heure_fin time DEFAULT '11:30',
  lieu text,
  predicateur text,
  theme text,
  lien_live text,
  replay_url text,
  visible boolean DEFAULT true,
  author_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- cell_groups (nouvelle table, remplace les cellules dans cultes)
-- jour_semaine: 'Lundi'..'Dimanche'
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cell_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  lieu text,
  adresse text,
  jour_semaine text CHECK (jour_semaine IN ('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche')),
  heure_debut time DEFAULT '19:00',
  heure_fin time DEFAULT '20:30',
  responsable_nom text,
  responsable_contact text,
  description text,
  capacite integer CHECK (capacite IS NULL OR capacite > 0),
  visible boolean DEFAULT true,
  author_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- videos
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  legende text,
  description text,
  youtube_url text NOT NULL CHECK (youtube_url ~* '^https?://'),
  date_publi date DEFAULT CURRENT_DATE,
  is_live boolean DEFAULT false,
  visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- messages_priere
-- Unicite: (famille, jour_semaine, semaine)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages_priere (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  famille text,
  fils text,
  jour_semaine text CHECK (jour_semaine IN ('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche')),
  semaine integer DEFAULT 1 CHECK (semaine >= 1 AND semaine <= 2),
  titre text NOT NULL,
  contenu text NOT NULL,
  verset text,
  visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (famille, jour_semaine, semaine)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- donations
-- montant_cents (integer, en centimes)
-- statut: 'pending', 'succeeded', 'failed', 'refunded'
-- Pas d'insertion publique (webhook Stripe ou admin)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_donateur text,
  email text,
  montant_cents integer NOT NULL CHECK (montant_cents > 0),
  devise text DEFAULT 'EUR',
  stripe_payment_intent_id text UNIQUE,
  statut text DEFAULT 'pending' CHECK (statut IN ('pending', 'succeeded', 'failed', 'refunded')),
  message text,
  date_don timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- formules_paiement
-- type: 'integral' ou 'echelonne' (plus 'unique')
-- Montants en centimes: prix_total_cents, montant_echeance_cents
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.formules_paiement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  type text NOT NULL CHECK (type IN ('integral', 'echelonne')),
  prix_total_cents integer NOT NULL CHECK (prix_total_cents >= 0),
  nombre_echeances integer DEFAULT 1 CHECK (nombre_echeances >= 1),
  montant_echeance_cents integer DEFAULT 0 CHECK (montant_echeance_cents >= 0),
  description text,
  avantages jsonb DEFAULT '[]',
  actif boolean DEFAULT true,
  ordre_affichage integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- eleves
-- Montants figes en centimes: formule_prix_total_cents, formule_montant_echeance_cents
-- formule: 'integral' ou 'echelonne' (plus 'unique')
-- Colonnes nouvelles: pasteur_referent, niveau_biblique, motivation, communications_ok
-- Colonnes supprimees: formule_type, inscription_id
-- progression_pct: calcule par trigger serveur (ne pas ecrire cote front)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.eleves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id),
  prenom text DEFAULT '',
  nom text DEFAULT 'Inconnu',
  email text NOT NULL,
  telephone text,
  date_naissance date,
  pays text,
  ville text,
  eglise text,
  pasteur_referent text,
  niveau_biblique text,
  motivation text,
  communications_ok boolean DEFAULT false,
  formule text DEFAULT 'echelonne' CHECK (formule IN ('integral', 'echelonne')),
  formule_id uuid REFERENCES formules_paiement(id),
  formule_nom text,
  formule_prix_total_cents integer CHECK (formule_prix_total_cents >= 0),
  formule_nombre_echeances integer CHECK (formule_nombre_echeances >= 1),
  formule_montant_echeance_cents integer CHECK (formule_montant_echeance_cents >= 0),
  formule_avantages jsonb DEFAULT '[]',
  statut text DEFAULT 'actif' CHECK (statut IN ('actif', 'suspendu', 'termine')),
  raison_suspension text,
  notes_admin text,
  progression_pct integer DEFAULT 0 CHECK (progression_pct >= 0 AND progression_pct <= 100),
  date_inscription timestamptz DEFAULT now(),
  derniere_connexion timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- modules_formation
-- La colonne contenu n'existe plus (supports dans ressources_module)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.modules_formation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer UNIQUE CHECK (numero >= 1),
  titre text NOT NULL,
  description text,
  duree_semaines integer DEFAULT 8 CHECK (duree_semaines > 0),
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- progression_eleve (anciennement progressions_module)
-- date_debloque et date_complete sont geres par trigger serveur
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.progression_eleve (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id uuid NOT NULL REFERENCES eleves(id),
  module_id uuid NOT NULL REFERENCES modules_formation(id),
  debloque boolean DEFAULT false,
  complete boolean DEFAULT false,
  date_debloque timestamptz,
  date_complete timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (eleve_id, module_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ressources_module
-- storage_path pour fichiers dans bucket prive 'ressources'
-- url pour liens externes (si storage_path est null)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ressources_module (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules_formation(id),
  titre text NOT NULL,
  description text,
  type_ressource text DEFAULT 'pdf' CHECK (type_ressource IN ('pdf', 'video', 'lien', 'image', 'audio')),
  url text,
  storage_path text,
  taille_ko integer CHECK (taille_ko IS NULL OR taille_ko >= 0),
  ordre integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- evaluations
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id uuid NOT NULL REFERENCES eleves(id),
  module_id uuid REFERENCES modules_formation(id),
  type text DEFAULT 'devoir' CHECK (type IN ('partiel', 'final', 'devoir')),
  titre text NOT NULL,
  note numeric,
  note_max numeric DEFAULT 20 CHECK (note_max > 0),
  commentaire text,
  date_eval timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- paiements
-- montant_cents (integer, en centimes)
-- type_paiement: 'integral', 'mensualite', 'remboursement'
-- statut: 'en_attente', 'reussi', 'echec', 'rembourse'
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.paiements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id uuid NOT NULL REFERENCES eleves(id),
  montant_cents integer NOT NULL CHECK (montant_cents > 0),
  devise text DEFAULT 'EUR',
  type_paiement text DEFAULT 'mensualite' CHECK (type_paiement IN ('integral', 'mensualite', 'remboursement')),
  echeance_numero integer CHECK (echeance_numero >= 1),
  statut text DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'reussi', 'echec', 'rembourse')),
  methode text,
  reference text,
  stripe_payment_intent_id text UNIQUE,
  date_paiement timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- sessions_live
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions_live (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  module_id uuid REFERENCES modules_formation(id),
  type_session text DEFAULT 'ponctuel' CHECK (type_session IN ('ponctuel', 'recurrent')),
  date_session timestamptz NOT NULL,
  duree_minutes integer DEFAULT 60 CHECK (duree_minutes > 0),
  recurrence_pattern text,
  recurrence_jour_semaine integer CHECK (recurrence_jour_semaine >= 0 AND recurrence_jour_semaine <= 6),
  recurrence_heure time,
  lien_zoom text NOT NULL,
  zoom_meeting_id text,
  zoom_password text,
  statut text DEFAULT 'programme' CHECK (statut IN ('programme', 'en_cours', 'termine', 'annule')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- sessions_participants
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions_live(id),
  eleve_id uuid NOT NULL REFERENCES eleves(id),
  invite_at timestamptz DEFAULT now(),
  a_rejoint boolean DEFAULT false,
  date_rejoint timestamptz,
  UNIQUE (session_id, eleve_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- messages (nouveau modele)
-- Une conversation = un eleve (eleve_id)
-- sender_role: 'eleve' ou 'admin'
-- contenu: 1 a 5000 caracteres
-- L'eleve ne peut mettre a jour que lu et date_lu sur les messages de l'admin
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id uuid NOT NULL REFERENCES eleves(id),
  sender_role text NOT NULL CHECK (sender_role IN ('eleve', 'admin')),
  sender_auth_id uuid REFERENCES auth.users(id),
  sujet text,
  contenu text NOT NULL CHECK (char_length(contenu) >= 1 AND char_length(contenu) <= 5000),
  lu boolean DEFAULT false,
  date_lu timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- FONCTIONS RPC
-- ─────────────────────────────────────────────────────────────────────────────
-- update_ma_derniere_connexion() : appele par l'eleve connecte
-- get_eleves_email_confirmed() : admin uniquement

-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────────────────────
-- etc-files (public) : images du site uniquement (jpeg, png, webp, svg, 5 Mo max)
--   Prefixe: site/
--   Pas de PDF!
-- ressources (prive) : supports de cours
--   Path: ressources/<module_id>/<timestamp>-<nom>
--   Acces eleve via signed URL (1h)

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLES SUPPRIMEES (ne plus utiliser)
-- ─────────────────────────────────────────────────────────────────────────────
-- users
-- members
-- prayer_weeks
-- inscriptions_formation
-- fichiers
-- cultes (remplace par services et cell_groups)
-- progressions_module (renomme en progression_eleve)
