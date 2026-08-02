-- ============================================================
-- FIX: is_admin() et policy admins
--
-- Problème: La policy sur admins utilise is_admin() qui lit admins
-- → potentielle référence circulaire ou échec RLS
--
-- Solution: Permettre à tout utilisateur authentifié de lire admins
-- pour vérifier s'il est admin (la table ne contient pas de données sensibles)
-- ============================================================

-- Supprimer l'ancienne policy circulaire
DROP POLICY IF EXISTS "admins_admin_read" ON public.admins;

-- Nouvelle policy: tout utilisateur authentifié peut lire admins
-- (nécessaire pour que is_admin() fonctionne)
CREATE POLICY "admins_authenticated_read" ON public.admins
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Alternative si le problème persiste: recréer is_admin() pour bypasser RLS explicitement
-- (SECURITY DEFINER devrait déjà le faire, mais au cas où)

-- Vérification: tester is_admin()
-- SELECT public.is_admin();

-- ============================================================
-- Si ça ne marche toujours pas, le problème est peut-être
-- dans la propagation du JWT. Vérifier avec:
-- SELECT auth.uid(), auth.role();
-- ============================================================
