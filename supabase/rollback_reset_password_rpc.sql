-- =========================================================================
-- ROLLBACK SCRIPT: Suppression de la fonction de contournement RPC
-- Ce script annule et supprime la fonction public.reset_customer_password
-- pour fermer tout accès public et utiliser exclusivement le client admin sécurisé.
-- =========================================================================

-- 1. Révoque immédiatement tous les privilèges publics accordés aux rôles anon/authenticated
REVOKE ALL ON FUNCTION public.reset_customer_password(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_customer_password(TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.reset_customer_password(TEXT, TEXT) FROM authenticated;

-- 2. Supprime définitivement la fonction du schéma public
DROP FUNCTION IF EXISTS public.reset_customer_password(TEXT, TEXT);
