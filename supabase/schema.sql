-- CryptoEarnerX Database Schema v2 (SECURE)
-- Run this in Supabase SQL Editor
-- WARNING: Drops ALL existing tables. Run only on fresh setup or if you accept data loss.

DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS crypto_wallets CASCADE;
DROP TABLE IF EXISTS staking CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS investments CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS wallet CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS credit_wallet(uuid, decimal);
DROP FUNCTION IF EXISTS increment_binary_volume(uuid, decimal, decimal);

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL DEFAULT 'managed_by_supabase',
  name VARCHAR(100) NOT NULL DEFAULT 'User',
  wallet_address VARCHAR(100),
  sponsor_id UUID REFERENCES users(id),
  left_child_id UUID REFERENCES users(id),
  right_child_id UUID REFERENCES users(id),
  left_volume DECIMAL(18,8) DEFAULT 0 CHECK (left_volume >= 0),
  right_volume DECIMAL(18,8) DEFAULT 0 CHECK (right_volume >= 0),
  rank VARCHAR(20) DEFAULT 'member' CHECK (rank IN ('member','bronze','silver','gold','platinum','diamond')),
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  referral_code VARCHAR(20) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  balance DECIMAL(18,8) DEFAULT 0 CHECK (balance >= 0),
  bonus_balance DECIMAL(18,8) DEFAULT 0 CHECK (bonus_balance >= 0),
  locked_bonus_balance DECIMAL(18,8) DEFAULT 0 CHECK (locked_bonus_balance >= 0),
  total_deposited DECIMAL(18,8) DEFAULT 0 CHECK (total_deposited >= 0),
  total_withdrawn DECIMAL(18,8) DEFAULT 0 CHECK (total_withdrawn >= 0),
  total_invested DECIMAL(18,8) DEFAULT 0 CHECK (total_invested >= 0),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  package_type VARCHAR(20) NOT NULL CHECK (package_type IN ('bronze','silver','gold','platinum','diamond')),
  amount DECIMAL(18,8) NOT NULL CHECK (amount > 0),
  investment_source VARCHAR(10) DEFAULT 'pol' CHECK (investment_source IN ('pol','cex')),
  daily_roi DECIMAL(5,4) NOT NULL CHECK (daily_roi > 0),
  duration_days INT NOT NULL CHECK (duration_days > 0),
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP NOT NULL,
  total_earned DECIMAL(18,8) DEFAULT 0 CHECK (total_earned >= 0),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  tx_hash VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('deposit','withdrawal','investment','roi_payout','referral_bonus','binary_bonus','level_commission','leadership_bonus','sweep','staking_reward','withdrawal_fee')),
  amount DECIMAL(18,8) NOT NULL,
  balance_before DECIMAL(18,8) DEFAULT 0,
  balance_after DECIMAL(18,8) DEFAULT 0,
  description TEXT,
  tx_hash VARCHAR(100),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed','pending','failed')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(18,8) NOT NULL CHECK (amount > 0),
  wallet_address VARCHAR(100) NOT NULL,
  tx_hash VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE staking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(18,8) NOT NULL CHECK (amount > 0),
  apy DECIMAL(5,2) NOT NULL CHECK (apy > 0),
  duration_days INT NOT NULL CHECK (duration_days > 0),
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP NOT NULL,
  rewards_earned DECIMAL(18,8) DEFAULT 0 CHECK (rewards_earned >= 0),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE crypto_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  address VARCHAR(100) NOT NULL,
  private_key TEXT NOT NULL,
  derivation_index INT NOT NULL,
  network VARCHAR(20) DEFAULT 'polygon',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','closed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_sponsor ON users(sponsor_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral ON users(referral_code);
CREATE INDEX idx_wallet_user ON wallet(user_id);
CREATE INDEX idx_investments_user ON investments(user_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_investments_created ON investments(created_at);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_transactions_txhash ON transactions(tx_hash);
CREATE INDEX idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_staking_user ON staking(user_id);
CREATE INDEX idx_staking_status ON staking(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_messages_ticket ON support_messages(ticket_id);
CREATE INDEX idx_crypto_wallets_user ON crypto_wallets(user_id);
CREATE INDEX idx_crypto_wallets_address ON crypto_wallets(address);
CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created ON admin_logs(created_at);

-- ============================================================
-- ATOMIC FUNCTIONS (prevents double-spend / race conditions)
-- ============================================================

CREATE OR REPLACE FUNCTION credit_wallet(p_user_id UUID, p_amount DECIMAL)
RETURNS TABLE(success BOOLEAN, new_balance DECIMAL, previous_balance DECIMAL, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  SELECT balance INTO v_balance FROM wallet WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 0::DECIMAL, 'Wallet not found'::TEXT;
    RETURN;
  END IF;

  UPDATE wallet
  SET balance = balance + p_amount,
      total_deposited = CASE WHEN p_amount > 0 THEN total_deposited + p_amount ELSE total_deposited END,
      total_withdrawn = CASE WHEN p_amount < 0 THEN total_withdrawn + ABS(p_amount) ELSE total_withdrawn END,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING wallet.balance INTO new_balance;

  previous_balance := v_balance;

  RETURN QUERY SELECT true, new_balance, previous_balance, NULL::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION increment_binary_volume(p_user_id UUID, p_left_add DECIMAL, p_right_add DECIMAL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET left_volume = left_volume + p_left_add,
      right_volume = right_volume + p_right_add
  WHERE id = p_user_id;
END;
$$;

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER wallet_updated_at
  BEFORE UPDATE ON wallet
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- HELPER FUNCTION (bypasses RLS, avoids self-reference recursion)
-- ============================================================

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

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Registration insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can read all users" ON users FOR SELECT USING (
  is_admin()
);
CREATE POLICY "Admins can update all users" ON users FOR UPDATE USING (
  is_admin()
);

-- Wallet (SECURE: INSERT requires balance = 0)
CREATE POLICY "Users can read own wallet" ON wallet FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet with zero balance" ON wallet FOR INSERT
  WITH CHECK (auth.uid() = user_id AND balance = 0);
CREATE POLICY "Users can update own wallet" ON wallet FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all wallets" ON wallet FOR SELECT USING (
  is_admin()
);
CREATE POLICY "Admins can update all wallets" ON wallet FOR UPDATE USING (
  is_admin()
);

-- Investments
CREATE POLICY "Users can read own investments" ON investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investments" ON investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all investments" ON investments FOR SELECT USING (
  is_admin()
);
CREATE POLICY "Admins can update all investments" ON investments FOR UPDATE USING (
  is_admin()
);

-- Transactions
CREATE POLICY "Users can read own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all transactions" ON transactions FOR SELECT USING (
  is_admin()
);

-- Withdrawals
CREATE POLICY "Users can read own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all withdrawals" ON withdrawals FOR SELECT USING (
  is_admin()
);
CREATE POLICY "Admins can update all withdrawals" ON withdrawals FOR UPDATE USING (
  is_admin()
);

-- Staking
CREATE POLICY "Users can read own staking" ON staking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own staking" ON staking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own staking" ON staking FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all staking" ON staking FOR SELECT USING (
  is_admin()
);

-- Crypto Wallets
CREATE POLICY "Users can read own crypto wallets" ON crypto_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own crypto wallets" ON crypto_wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all crypto wallets" ON crypto_wallets FOR SELECT USING (
  is_admin()
);

-- Notifications
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all notifications" ON notifications FOR SELECT USING (
  is_admin()
);
CREATE POLICY "Admins can insert notifications" ON notifications FOR INSERT WITH CHECK (
  is_admin()
);

-- Support Tickets
CREATE POLICY "Users can read own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tickets" ON support_tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all tickets" ON support_tickets FOR SELECT USING (
  is_admin()
);
CREATE POLICY "Admins can update all tickets" ON support_tickets FOR UPDATE USING (
  is_admin()
);

-- Support Messages
CREATE POLICY "Users can read ticket messages" ON support_messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() IN (SELECT user_id FROM support_tickets WHERE id = ticket_id)
);
CREATE POLICY "Users can insert messages" ON support_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Admins can read all messages" ON support_messages FOR SELECT USING (
  is_admin()
);
CREATE POLICY "Admins can insert messages" ON support_messages FOR INSERT WITH CHECK (
  is_admin()
);

-- Admin Logs (admin only)
CREATE POLICY "Admins can read logs" ON admin_logs FOR SELECT USING (
  is_admin()
);
CREATE POLICY "Admins can insert logs" ON admin_logs FOR INSERT WITH CHECK (
  is_admin()
);

-- Settings (SECURE: only admin can read/write)
CREATE POLICY "Admins can read settings" ON settings FOR SELECT USING (
  is_admin()
);
CREATE POLICY "Admins can insert settings" ON settings FOR INSERT WITH CHECK (
  is_admin()
);
CREATE POLICY "Admins can update settings" ON settings FOR UPDATE USING (
  is_admin()
);

-- ============================================================
-- DEFAULT SETTINGS
-- ============================================================

INSERT INTO settings (key, value) VALUES
  ('platform_name', 'CryptoEarnerX'),
  ('min_deposit', '25'),
  ('min_withdrawal', '25'),
  ('platform_fee', '2'),
  ('withdrawal_fee', '1'),
  ('referral_rate', '10'),
  ('binary_rate', '10'),
  ('master_wallet', '0x0000000000000000000000000000000000000000'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;
