-- Migration 2: Locked CEX + reduced registration bonus
-- Run this in Supabase SQL Editor

-- Add locked CEX balance (CEX from investing stays locked until listing)
ALTER TABLE wallet ADD COLUMN IF NOT EXISTS locked_bonus_balance DECIMAL(18,8) DEFAULT 0 CHECK (locked_bonus_balance >= 0);

-- Reduce registration bonus from 1000 to 100
UPDATE settings SET value = '100' WHERE key = 'registration_bonus';

-- Add cex_unlocked setting (admin toggle to unlock locked CEX)
INSERT INTO settings (key, value) VALUES ('cex_unlocked', 'false') ON CONFLICT (key) DO NOTHING;

-- Function to unlock all locked CEX for a user (admin action)
CREATE OR REPLACE FUNCTION unlock_cec(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, unlocked_amount DECIMAL, new_bonus_balance DECIMAL, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_locked DECIMAL;
BEGIN
  SELECT locked_bonus_balance INTO v_locked FROM wallet WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 0::DECIMAL, 'Wallet not found'::TEXT;
    RETURN;
  END IF;

  UPDATE wallet
  SET bonus_balance = bonus_balance + v_locked,
      locked_bonus_balance = 0,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING wallet.bonus_balance INTO new_bonus_balance;

  RETURN QUERY SELECT true, v_locked, new_bonus_balance, NULL::TEXT;
END;
$$;

-- Function to unlock ALL users' locked CEX (batch admin action)
CREATE OR REPLACE FUNCTION unlock_all_cec()
RETURNS TABLE(success BOOLEAN, total_unlocked DECIMAL, users_affected INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total DECIMAL := 0;
  v_count INTEGER := 0;
BEGIN
  UPDATE wallet
  SET bonus_balance = bonus_balance + locked_bonus_balance,
      locked_bonus_balance = 0,
      updated_at = NOW()
  WHERE locked_bonus_balance > 0;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  SELECT COALESCE(SUM(locked_bonus_balance), 0) INTO v_total
  FROM wallet WHERE locked_bonus_balance = 0 AND bonus_balance > 0;

  -- Just count total that was unlocked
  SELECT SUM(bonus_balance) INTO v_total FROM wallet;

  RETURN QUERY SELECT true, COALESCE(v_total, 0), v_count;
END;
$$;
