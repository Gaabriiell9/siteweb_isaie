-- ============================================================
-- Ajout du champ avantages (jsonb) sur formules_paiement
-- ============================================================

-- Ajouter la colonne avantages si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'formules_paiement' AND column_name = 'avantages'
  ) THEN
    ALTER TABLE formules_paiement ADD COLUMN avantages JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Migrer les données existantes : mettre à jour les avantages pour les formules existantes
UPDATE formules_paiement
SET avantages = '["Paiement unique", "Accès immédiat à tous les modules", "Économisez 10%"]'::jsonb
WHERE type = 'unique' AND (avantages IS NULL OR avantages = '[]'::jsonb);

UPDATE formules_paiement
SET avantages = '["Paiement en plusieurs fois", "Déblocage progressif des modules", "Budget maîtrisé"]'::jsonb
WHERE type = 'echelonne' AND (avantages IS NULL OR avantages = '[]'::jsonb);
