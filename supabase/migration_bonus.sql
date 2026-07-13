-- Migration: Add CEX bonus balance to wallet
-- Run this in Supabase SQL Editor

-- Add bonus_balance column to wallet
ALTER TABLE wallet ADD COLUMN IF NOT EXISTS bonus_balance DECIMAL(18,8) DEFAULT 0 CHECK (bonus_balance >= 0);

-- Add investment source tracking (pol or cex)
ALTER TABLE investments ADD COLUMN IF NOT EXISTS investment_source VARCHAR(10) DEFAULT 'pol' CHECK (investment_source IN ('pol', 'cex'));

-- Add registration_bonus setting
INSERT INTO settings (key, value) VALUES ('registration_bonus', '1000') ON CONFLICT (key) DO NOTHING;

-- Create function to credit bonus (atomic)
CREATE OR REPLACE FUNCTION credit_bonus(p_user_id UUID, p_amount DECIMAL)
RETURNS TABLE(success BOOLEAN, new_bonus_balance DECIMAL, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bonus DECIMAL;
BEGIN
  SELECT bonus_balance INTO v_bonus FROM wallet WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Wallet not found'::TEXT;
    RETURN;
  END IF;

  UPDATE wallet
  SET bonus_balance = bonus_balance + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING wallet.bonus_balance INTO new_bonus_balance;

  RETURN QUERY SELECT true, new_bonus_balance, NULL::TEXT;
END;
$$;

-- Create function to invest from bonus (deducts bonus, creates investment)
CREATE OR REPLACE FUNCTION invest_from_bonus(
  p_user_id UUID,
  p_amount DECIMAL
)
RETURNS TABLE(success BOOLEAN, remaining_bonus DECIMAL, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bonus DECIMAL;
BEGIN
  SELECT bonus_balance INTO v_bonus FROM wallet WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Wallet not found'::TEXT;
    RETURN;
  END IF;

  IF v_bonus < p_amount THEN
    RETURN QUERY SELECT false, v_bonus, 'Insufficient CEX balance'::TEXT;
    RETURN;
  END IF;

  UPDATE wallet
  SET bonus_balance = bonus_balance - p_amount,
      total_invested = total_invested + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING wallet.bonus_balance INTO remaining_bonus;

  RETURN QUERY SELECT true, remaining_bonus, NULL::TEXT;
END;
$$;

-- Create function to invest from real balance (deducts balance, creates investment)
CREATE OR REPLACE FUNCTION invest_from_balance(
  p_user_id UUID,
  p_amount DECIMAL
)
RETURNS TABLE(success BOOLEAN, remaining_balance DECIMAL, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  SELECT balance INTO v_balance FROM wallet WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Wallet not found'::TEXT;
    RETURN;
  END IF;

  IF v_balance < p_amount THEN
    RETURN QUERY SELECT false, v_balance, 'Insufficient POL balance'::TEXT;
    RETURN;
  END IF;

  UPDATE wallet
  SET balance = balance - p_amount,
      total_invested = total_invested + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING wallet.balance INTO remaining_balance;

  RETURN QUERY SELECT true, remaining_balance, NULL::TEXT;
END;
$$;
