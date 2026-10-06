-- Create User Role Enum
CREATE TYPE user_role AS ENUM ('ADMIN', 'CASHIER', 'CUSTOMER');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone_number TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Customers table (for loyalty and rewards data)
CREATE TABLE customers (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    loyalty_points INTEGER DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'BRONZE' NOT NULL, -- e.g., BRONZE, SILVER, GOLD, VIP
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Transactions table
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    cashier_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    amount_total DECIMAL(10, 2) NOT NULL,
    points_earned INTEGER DEFAULT 0 NOT NULL,
    points_redeemed INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Handle automatic profile creation on user signup (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', new.email, COALESCE((new.raw_user_meta_data->>'role')::user_role, 'CUSTOMER'::user_role));
  
  -- If role is CUSTOMER, create a customer record as well
  IF COALESCE((new.raw_user_meta_data->>'role')::user_role, 'CUSTOMER'::user_role) = 'CUSTOMER' THEN
    INSERT INTO public.customers (id) VALUES (new.id);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
