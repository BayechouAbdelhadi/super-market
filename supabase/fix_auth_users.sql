-- 1. Fix the auth.users table using a BEFORE INSERT trigger
-- Supabase GoTrue explicitly sends NULL in its INSERT queries, which bypasses DEFAULT values.
-- We MUST intercept the INSERT and forcefully convert NULLs to empty strings.

CREATE OR REPLACE FUNCTION auth.force_empty_string_tokens() RETURNS trigger AS $$
BEGIN
  IF NEW.confirmation_token IS NULL THEN NEW.confirmation_token := ''; END IF;
  IF NEW.recovery_token IS NULL THEN NEW.recovery_token := ''; END IF;
  IF NEW.email_change_token_new IS NULL THEN NEW.email_change_token_new := ''; END IF;
  IF NEW.email_change IS NULL THEN NEW.email_change := ''; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS force_empty_string_tokens_trigger ON auth.users;
CREATE TRIGGER force_empty_string_tokens_trigger
BEFORE INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION auth.force_empty_string_tokens();
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'first_name', 'Inconnu'), 
    COALESCE(new.raw_user_meta_data->>'last_name', 'Inconnu'), 
    new.email, 
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'CUSTOMER'::user_role)
  );
  
  -- If role is CUSTOMER, create a customer record as well
  IF COALESCE((new.raw_user_meta_data->>'role')::user_role, 'CUSTOMER'::user_role) = 'CUSTOMER' THEN
    INSERT INTO public.customers (id) VALUES (new.id);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
