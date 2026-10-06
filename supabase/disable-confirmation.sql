-- 1. Instantly fix all existing users who are currently locked out
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 2. Create a function that automatically sets email_confirmed_at to the current time
CREATE OR REPLACE FUNCTION public.auto_confirm_users()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop the trigger if it already exists to avoid duplication errors
DROP TRIGGER IF EXISTS auto_confirm_users_trigger ON auth.users;

-- 4. Attach the trigger to the auth.users table
-- This guarantees that every time GoTrue tries to create a new user, 
-- their email is instantly marked as confirmed before it even hits the database!
CREATE TRIGGER auto_confirm_users_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_users();
