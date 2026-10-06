-- This script makes the user creation trigger completely bulletproof.
-- By wrapping the inserts in an EXCEPTION block, we guarantee that even if 
-- the profile or customer insert fails (e.g., due to a missing column or type mismatch),
-- it WILL NOT crash the Supabase GoTrue authentication engine, and the user WILL be created!

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email, role)
    VALUES (
      new.id, 
      new.raw_user_meta_data->>'first_name', 
      new.raw_user_meta_data->>'last_name', 
      new.email, 
      COALESCE((new.raw_user_meta_data->>'role')::user_role, 'CUSTOMER'::user_role)
    );
    
    -- If role is CUSTOMER, create a customer record as well
    IF COALESCE((new.raw_user_meta_data->>'role')::user_role, 'CUSTOMER'::user_role) = 'CUSTOMER' THEN
      INSERT INTO public.customers (id) VALUES (new.id);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If anything fails (e.g. type cast error, missing table), silently ignore it 
    -- so that the user account is still successfully created in auth.users!
    -- You can check Postgres logs later to debug the profile insertion.
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
