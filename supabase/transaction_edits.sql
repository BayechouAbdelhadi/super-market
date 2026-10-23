-- Transaction corrections (wrong amount or points entered at the till).
-- Admins already have full access to transactions ("Admins have full access to transactions").
-- Cashiers may only correct transactions recorded today (Europe/Paris day).
-- The Next.js API enforces the same rule; this policy is the database-side guarantee.

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Cashiers can update today's transactions" ON transactions;
CREATE POLICY "Cashiers can update today's transactions"
ON transactions FOR UPDATE
USING (
  get_current_user_role() = 'CASHIER'
  AND (created_at AT TIME ZONE 'Europe/Paris')::date = (now() AT TIME ZONE 'Europe/Paris')::date
)
WITH CHECK (
  get_current_user_role() = 'CASHIER'
  AND (created_at AT TIME ZONE 'Europe/Paris')::date = (now() AT TIME ZONE 'Europe/Paris')::date
);
