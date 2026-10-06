-- Script to create a default ADMIN user
-- Remember to change the email and password below before running in production!

DO $$
DECLARE
  new_admin_id UUID := gen_random_uuid();
  admin_email TEXT := 'admin@supermarket.com';
  admin_password TEXT := 'AdminSecurePass123!';
BEGIN
  -- 1. Insert the user into the Supabase auth.users table
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_admin_id,
    'authenticated',
    'authenticated',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"role":"ADMIN", "first_name": "Super", "last_name": "Admin"}',
    current_timestamp,
    current_timestamp,
    '',
    '',
    '',
    ''
  );

  -- 2. Insert the identity for email login into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_admin_id,
    new_admin_id::text,
    format('{"sub":"%s","email":"%s"}', new_admin_id::text, admin_email)::jsonb,
    'email',
    current_timestamp,
    current_timestamp,
    current_timestamp
  );

  -- FIX: Supabase GoTrue crashes if these columns are NULL
  UPDATE auth.users
  SET confirmation_token = '',
      recovery_token = '',
      email_change_token_new = '',
      email_change = ''
  WHERE confirmation_token IS NULL OR recovery_token IS NULL;

  RAISE NOTICE 'Admin user created successfully!';
END $$;
