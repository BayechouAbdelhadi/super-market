-- 1. Add the missing email column to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 2. Ensure phone_number exists just in case
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT UNIQUE;

-- 3. Update the trigger to correctly insert the email AND the new phone_number we enforced in the frontend!
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, phone_number, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name', 
    new.email, 
    new.raw_user_meta_data->>'phone_number',
    COALESCE(new.raw_user_meta_data->>'role', 'CUSTOMER')::public.user_role
  );
  
  -- If role is CUSTOMER, create a customer record as well
  IF COALESCE(new.raw_user_meta_data->>'role', 'CUSTOMER') = 'CUSTOMER' THEN
    INSERT INTO public.customers (id) VALUES (new.id);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
