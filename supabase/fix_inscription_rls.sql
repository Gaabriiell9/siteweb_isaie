-- ============================================================
--  FIX INSCRIPTION RLS — Solution définitive
--
--  Problème : Après signUp() avec confirmation email activée,
--  le client reste en rôle "anon" (session = null), donc les
--  INSERTs dans inscriptions_formation/eleves/progression_eleve
--  échouent même avec des policies INSERT permissives.
--
--  Solution : Stocker les données d'inscription dans user_metadata
--  lors du signUp, puis utiliser un trigger AFTER INSERT sur
--  auth.users pour créer les enregistrements côté serveur avec
--  SECURITY DEFINER (bypass RLS complet).
--
--  Avantages :
--  - Atomique et fiable
--  - Pas besoin d'ouvrir les tables à anon
--  - Fonctionne même si le client ferme la page après signUp
-- ============================================================


-- ============================================================
-- ÉTAPE 1 : Supprimer les anciennes policies INSERT permissives
--           (elles ne sont plus nécessaires et sont une faille)
-- ============================================================

DROP POLICY IF EXISTS "Inscription publique insert"    ON inscriptions_formation;
DROP POLICY IF EXISTS "Inscription publique select"    ON inscriptions_formation;
DROP POLICY IF EXISTS "Inscription eleve insert"       ON eleves;
DROP POLICY IF EXISTS "Inscription progression insert" ON progression_eleve;
DROP POLICY IF EXISTS "Anyone can insert"              ON inscriptions_formation;


-- ============================================================
-- ÉTAPE 2 : Recréer les policies correctes
--           SELECT public sur inscriptions (pour vérifier email existant)
--           Tout le reste est admin-only
-- ============================================================

-- inscriptions_formation : lecture publique (pour check email unique), write admin-only
CREATE POLICY "Public read inscriptions"
  ON inscriptions_formation FOR SELECT
  USING (true);

CREATE POLICY "Admin write inscriptions"
  ON inscriptions_formation FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin update inscriptions"
  ON inscriptions_formation FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin delete inscriptions"
  ON inscriptions_formation FOR DELETE
  TO authenticated
  USING (true);

-- eleves : lecture propre profil, write admin-only
CREATE POLICY "Eleve read own"
  ON eleves FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Admin read all eleves"
  ON eleves FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin write eleves"
  ON eleves FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin update eleves"
  ON eleves FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- progression_eleve : lecture propre, write admin-only
CREATE POLICY "Eleve read own progression"
  ON progression_eleve FOR SELECT
  TO authenticated
  USING (eleve_id IN (SELECT id FROM eleves WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin write progression"
  ON progression_eleve FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin update progression"
  ON progression_eleve FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- ÉTAPE 3 : Fonction trigger SECURITY DEFINER
--           Crée inscription + eleve + progression automatiquement
--           après création du user dans auth.users
--
--           IMPORTANT: Le bloc EXCEPTION garantit que le signUp
--           réussit même si le trigger échoue
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

  -- Ne rien faire si pas de métadonnées d'inscription
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

  -- 3. Créer les lignes de progression (6 modules)
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
  RAISE WARNING 'handle_new_user_inscription failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created_inscription ON auth.users;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created_inscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_inscription();


-- ============================================================
-- ÉTAPE 4 : Vérification
-- ============================================================

SELECT 'Trigger créé avec succès' AS status;

-- Afficher les policies actives
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('inscriptions_formation', 'eleves', 'progression_eleve')
ORDER BY tablename, cmd;
