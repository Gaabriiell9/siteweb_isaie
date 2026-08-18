-- ============================================================
-- Colonnes figées pour la tarification élève
-- Les données de formule sont copiées à l'inscription et ne changent plus
-- ============================================================

-- Ajout des colonnes figées sur eleves
DO $$
BEGIN
  -- Nom de la formule figé
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eleves' AND column_name = 'formule_nom'
  ) THEN
    ALTER TABLE eleves ADD COLUMN formule_nom TEXT;
  END IF;

  -- Type de formule figé ('unique' ou 'echelonne')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eleves' AND column_name = 'formule_type'
  ) THEN
    ALTER TABLE eleves ADD COLUMN formule_type TEXT;
  END IF;

  -- Prix total figé (en centimes)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eleves' AND column_name = 'formule_prix_total'
  ) THEN
    ALTER TABLE eleves ADD COLUMN formule_prix_total INTEGER;
  END IF;

  -- Nombre d'échéances figé
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eleves' AND column_name = 'formule_nombre_echeances'
  ) THEN
    ALTER TABLE eleves ADD COLUMN formule_nombre_echeances INTEGER;
  END IF;

  -- Montant par échéance figé (en centimes)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eleves' AND column_name = 'formule_montant_echeance'
  ) THEN
    ALTER TABLE eleves ADD COLUMN formule_montant_echeance INTEGER;
  END IF;

  -- Avantages figés (copie JSONB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eleves' AND column_name = 'formule_avantages'
  ) THEN
    ALTER TABLE eleves ADD COLUMN formule_avantages JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ============================================================
-- Migration des élèves existants : copier les données depuis leur formule
-- ============================================================

UPDATE eleves e
SET
  formule_nom = f.nom,
  formule_type = f.type,
  formule_prix_total = f.prix_total,
  formule_nombre_echeances = f.nombre_echeances,
  formule_montant_echeance = f.montant_echeance,
  formule_avantages = COALESCE(f.avantages, '[]'::jsonb)
FROM formules_paiement f
WHERE e.formule_id = f.id
  AND e.formule_prix_total IS NULL;

-- Pour les élèves sans formule_id mais avec formule (ancien système)
UPDATE eleves e
SET
  formule_nom = f.nom,
  formule_type = f.type,
  formule_prix_total = f.prix_total,
  formule_nombre_echeances = f.nombre_echeances,
  formule_montant_echeance = f.montant_echeance,
  formule_avantages = COALESCE(f.avantages, '[]'::jsonb)
FROM formules_paiement f
WHERE e.formule_id IS NULL
  AND e.formule_prix_total IS NULL
  AND e.formule IS NOT NULL
  AND (
    (e.formule = 'echelonne' AND f.type = 'echelonne')
    OR (e.formule = 'integral' AND f.type = 'unique')
  )
  AND f.actif = true;

-- ============================================================
-- Commentaires pour documentation
-- ============================================================

COMMENT ON COLUMN eleves.formule_nom IS 'Nom de la formule figé au moment de l''inscription';
COMMENT ON COLUMN eleves.formule_type IS 'Type de formule figé: unique ou echelonne';
COMMENT ON COLUMN eleves.formule_prix_total IS 'Prix total figé en centimes au moment de l''inscription';
COMMENT ON COLUMN eleves.formule_nombre_echeances IS 'Nombre d''échéances figé au moment de l''inscription';
COMMENT ON COLUMN eleves.formule_montant_echeance IS 'Montant par échéance figé en centimes au moment de l''inscription';
COMMENT ON COLUMN eleves.formule_avantages IS 'Liste des avantages figée au moment de l''inscription';
