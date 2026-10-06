-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Helper function to get the current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-------------------------------------------------------------------------
-- PROFILES RLS POLICIES
-------------------------------------------------------------------------
-- Admin has full access to all profiles
CREATE POLICY "Admins have full access to profiles" 
ON profiles FOR ALL 
USING (get_current_user_role() = 'ADMIN');

-- Users can read their own profile
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Cashiers can view profiles (to search for customers)
CREATE POLICY "Cashiers can view profiles" 
ON profiles FOR SELECT 
USING (get_current_user_role() = 'CASHIER' AND role = 'CUSTOMER');

-- Cashiers can create customer profiles
CREATE POLICY "Cashiers can insert customer profiles" 
ON profiles FOR INSERT 
WITH CHECK (get_current_user_role() = 'CASHIER' AND role = 'CUSTOMER');

-- Cashiers can update customer profiles
CREATE POLICY "Cashiers can update customer profiles" 
ON profiles FOR UPDATE 
USING (get_current_user_role() = 'CASHIER' AND role = 'CUSTOMER');

-------------------------------------------------------------------------
-- CUSTOMERS RLS POLICIES
-------------------------------------------------------------------------
-- Admin has full access to all customers
CREATE POLICY "Admins have full access to customers" 
ON customers FOR ALL 
USING (get_current_user_role() = 'ADMIN');

-- Cashiers have full access to customers (need to read, and update points/status)
CREATE POLICY "Cashiers have full access to customers" 
ON customers FOR ALL 
USING (get_current_user_role() = 'CASHIER');

-- Customers can view their own loyalty info
CREATE POLICY "Customers can view their own loyalty info" 
ON customers FOR SELECT 
USING (auth.uid() = id);

-------------------------------------------------------------------------
-- TRANSACTIONS RLS POLICIES
-------------------------------------------------------------------------
-- Admin has full access to all transactions
CREATE POLICY "Admins have full access to transactions" 
ON transactions FOR ALL 
USING (get_current_user_role() = 'ADMIN');

-- Cashiers can view transactions
CREATE POLICY "Cashiers can view transactions" 
ON transactions FOR SELECT 
USING (get_current_user_role() = 'CASHIER');

-- Cashiers can insert new transactions (for a sale)
CREATE POLICY "Cashiers can insert transactions" 
ON transactions FOR INSERT 
WITH CHECK (get_current_user_role() = 'CASHIER');

-- Customers can view their own transaction history
CREATE POLICY "Customers can view their own transactions" 
ON transactions FOR SELECT 
USING (customer_id = auth.uid());
