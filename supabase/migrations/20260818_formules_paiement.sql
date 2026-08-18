-- ============================================================
-- Table formules_paiement
-- Formules de paiement configurables pour la formation
-- ============================================================

CREATE TABLE IF NOT EXISTS formules_paiement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('unique', 'echelonne')),
  prix_total INTEGER NOT NULL,
  nombre_echeances INTEGER NOT NULL DEFAULT 1,
  montant_echeance INTEGER NOT NULL,
  description TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  ordre_affichage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_formules_paiement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_formules_paiement_updated_at ON formules_paiement;
CREATE TRIGGER trigger_formules_paiement_updated_at
  BEFORE UPDATE ON formules_paiement
  FOR EACH ROW EXECUTE FUNCTION update_formules_paiement_updated_at();

-- RLS Policies
ALTER TABLE formules_paiement ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les formules actives
CREATE POLICY "formules_paiement_read_public" ON formules_paiement
  FOR SELECT USING (actif = true);

-- Lecture complète pour les admins (y compris formules inactives)
CREATE POLICY "formules_paiement_read_admin" ON formules_paiement
  FOR SELECT USING (
    auth.uid() IN (SELECT auth_user_id FROM admins)
  );

-- Écriture réservée aux admins
CREATE POLICY "formules_paiement_write_admin" ON formules_paiement
  FOR ALL USING (
    auth.uid() IN (SELECT auth_user_id FROM admins)
  );

-- ============================================================
-- Données initiales
-- ============================================================

INSERT INTO formules_paiement (nom, type, prix_total, nombre_echeances, montant_echeance, description, actif, ordre_affichage)
VALUES
  ('Intégral', 'unique', 45000, 1, 45000, 'Accès immédiat à tous les modules · Économisez 10%', true, 1),
  ('Échelonné', 'echelonne', 50000, 10, 5000, 'Paiement en 10 mensualités de 50€', true, 2)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Ajout colonne formule_id sur eleves (optionnel, pour référence)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eleves' AND column_name = 'formule_id'
  ) THEN
    ALTER TABLE eleves ADD COLUMN formule_id UUID REFERENCES formules_paiement(id);
  END IF;
END $$;

-- ============================================================
-- Ajout colonne formule_id sur inscriptions_formation (optionnel)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inscriptions_formation' AND column_name = 'formule_id'
  ) THEN
    ALTER TABLE inscriptions_formation ADD COLUMN formule_id UUID REFERENCES formules_paiement(id);
  END IF;
END $$;
