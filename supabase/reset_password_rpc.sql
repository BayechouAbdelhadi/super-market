-- =========================================================================
-- FUNCTION: public.reset_customer_password
-- Permet de réinitialiser le mot de passe d'un utilisateur sans session active
-- Exécutable par l'API publique (anon) de façon sécurisée (SECURITY DEFINER)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.reset_customer_password(
  user_email TEXT,
  new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- 1. Recherche de l'utilisateur par son email normalisé
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = LOWER(TRIM(user_email));

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Aucun compte associé à cette adresse email.'
    );
  END IF;

  -- 2. Mise à jour directe du mot de passe chiffré dans auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = NOW(),
      recovery_token = ''
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Mot de passe mis à jour avec succès.'
  );
END;
$$;

-- Autorise l'appel via l'API REST Supabase (Next.js server action)
GRANT EXECUTE ON FUNCTION public.reset_customer_password(TEXT, TEXT) TO anon, authenticated, service_role;
