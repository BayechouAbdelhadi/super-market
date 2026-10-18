-- Script to update the password of the ADMIN user
-- Run this script in the Supabase SQL Editor

DO $$
DECLARE
  target_email TEXT := 'admin@supermarket.com';
  new_password TEXT := 'CHANGE_ME'; -- never commit the real password
BEGIN
  IF new_password = 'CHANGE_ME' OR length(new_password) < 12 THEN
    RAISE EXCEPTION 'Set a strong, unique password (12+ characters) before running this script.';
  END IF;

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
