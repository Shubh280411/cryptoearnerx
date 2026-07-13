-- Fix infinite recursion on users table RLS policies
-- Problem: Admin policies query users table FROM within users policy -> recursion
-- Fix: Create is_admin() SECURITY DEFINER function that bypasses RLS

-- Step 1: Create helper function (runs as owner, bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = auth.uid()),
    false
  );
$$;

-- Step 2: Drop ALL old admin policies that use EXISTS subquery
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can read all wallets" ON wallet;
DROP POLICY IF EXISTS "Admins can update all wallets" ON wallet;
DROP POLICY IF EXISTS "Admins can read all investments" ON investments;
DROP POLICY IF EXISTS "Admins can update all investments" ON investments;
DROP POLICY IF EXISTS "Admins can read all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can read all withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can update all withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can read all staking" ON staking;
DROP POLICY IF EXISTS "Admins can read all crypto wallets" ON crypto_wallets;
DROP POLICY IF EXISTS "Admins can read all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can read all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can read all messages" ON support_messages;
DROP POLICY IF EXISTS "Admins can insert messages" ON support_messages;
DROP POLICY IF EXISTS "Admins can read logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can insert logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can read settings" ON settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON settings;
DROP POLICY IF EXISTS "Admins can update settings" ON settings;

-- Step 3: Recreate all admin policies using is_admin() function
-- Users
CREATE POLICY "Admins can read all users" ON users FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all users" ON users FOR UPDATE USING (is_admin());

-- Wallet
CREATE POLICY "Admins can read all wallets" ON wallet FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all wallets" ON wallet FOR UPDATE USING (is_admin());

-- Investments
CREATE POLICY "Admins can read all investments" ON investments FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all investments" ON investments FOR UPDATE USING (is_admin());

-- Transactions
CREATE POLICY "Admins can read all transactions" ON transactions FOR SELECT USING (is_admin());

-- Withdrawals
CREATE POLICY "Admins can read all withdrawals" ON withdrawals FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all withdrawals" ON withdrawals FOR UPDATE USING (is_admin());

-- Staking
CREATE POLICY "Admins can read all staking" ON staking FOR SELECT USING (is_admin());

-- Crypto Wallets
CREATE POLICY "Admins can read all crypto wallets" ON crypto_wallets FOR SELECT USING (is_admin());

-- Notifications
CREATE POLICY "Admins can read all notifications" ON notifications FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert notifications" ON notifications FOR INSERT WITH CHECK (is_admin());

-- Support Tickets
CREATE POLICY "Admins can read all tickets" ON support_tickets FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all tickets" ON support_tickets FOR UPDATE USING (is_admin());

-- Support Messages
CREATE POLICY "Admins can read all messages" ON support_messages FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert messages" ON support_messages FOR INSERT WITH CHECK (is_admin());

-- Admin Logs
CREATE POLICY "Admins can read logs" ON admin_logs FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert logs" ON admin_logs FOR INSERT WITH CHECK (is_admin());

-- Settings
CREATE POLICY "Admins can read settings" ON settings FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert settings" ON settings FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update settings" ON settings FOR UPDATE USING (is_admin());
