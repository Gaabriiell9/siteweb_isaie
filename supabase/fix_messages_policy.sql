-- ============================================================
-- FIX COMPLET : Policies de messages (élève + admin)
-- Exécutez ce SQL dans Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. S'assurer que RLS est activé
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer TOUTES les anciennes policies sur messages
DROP POLICY IF EXISTS "messages_own_read" ON public.messages;
DROP POLICY IF EXISTS "messages_own_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_admin_all" ON public.messages;

-- 3. Vérifier/créer la fonction is_admin()
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

-- 4. Policy SELECT pour l'élève : peut lire où il est destinataire OU expéditeur
CREATE POLICY "messages_own_read" ON public.messages
  FOR SELECT USING (
    destinataire_id IN (SELECT id FROM public.eleves WHERE auth_user_id = auth.uid())
    OR expediteur_id = auth.uid()
  );

-- 5. Policy INSERT pour l'élève : peut insérer s'il est l'expéditeur type 'eleve'
CREATE POLICY "messages_own_insert" ON public.messages
  FOR INSERT WITH CHECK (
    expediteur_type = 'eleve'
    AND expediteur_id = auth.uid()
  );

-- 6. Policy ADMIN : peut tout faire (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "messages_admin_all" ON public.messages
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 7. DIAGNOSTIC : Vérifier si l'admin existe
-- ============================================================
DO $$
DECLARE
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.admins;
  IF admin_count = 0 THEN
    RAISE NOTICE '⚠️  ATTENTION : La table admins est VIDE !';
    RAISE NOTICE '    L''admin ne peut pas envoyer de messages.';
    RAISE NOTICE '    Exécutez la section "AJOUTER UN ADMIN" ci-dessous.';
  ELSE
    RAISE NOTICE '✅ % admin(s) trouvé(s) dans la table admins.', admin_count;
  END IF;
END $$;

-- Afficher les admins existants
SELECT auth_user_id, nom, email FROM public.admins;

-- ============================================================
-- 8. AJOUTER UN ADMIN (décommentez et adaptez)
-- ============================================================
-- OPTION A : Depuis un élève existant (si l'admin s'est inscrit via le formulaire)
-- INSERT INTO public.admins (auth_user_id, nom, email)
-- SELECT auth_user_id, CONCAT(prenom, ' ', nom), email
-- FROM public.eleves
-- WHERE email = 'votre@email.com';

-- OPTION B : Directement avec l'auth_user_id (visible dans Authentication > Users)
-- INSERT INTO public.admins (auth_user_id, nom, email)
-- VALUES ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'Votre Nom', 'votre@email.com');

-- ============================================================
-- 9. Vérification finale des policies
-- ============================================================
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual AS "USING clause",
  with_check AS "WITH CHECK clause"
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;
