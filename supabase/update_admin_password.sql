-- Script to update the password of the ADMIN user
-- Run this script in the Supabase SQL Editor

DO $$
DECLARE
  target_email TEXT := 'admin@supermarket.com';
  new_password TEXT := 'AdminSecurePass123!';
BEGIN
  -- Mettre à jour le mot de passe hashé dans auth.users
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = current_timestamp
  WHERE email = target_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur avec email % introuvable.', target_email;
  ELSE
    RAISE NOTICE 'Mot de passe mis à jour avec succès pour % !', target_email;
  END IF;
END $$;
