-- SPARK Airdrop Token Migration
-- Run this in Supabase SQL Editor

-- Add airdrop_balance column to wallet table
ALTER TABLE wallet ADD COLUMN IF NOT EXISTS airdrop_balance DECIMAL(18,8) DEFAULT 0 CHECK (airdrop_balance >= 0);

-- Add token_type to withdrawals table
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS token_type VARCHAR(10) DEFAULT 'pol' CHECK (token_type IN ('pol', 'cex', 'spark'));

-- Add SPARK-related transaction types to transactions CHECK constraint
-- (need to drop and recreate the constraint)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (
  type IN ('deposit','withdrawal','investment','roi_payout','referral_bonus','binary_bonus',
  'level_commission','leadership_bonus','sweep','staking_reward','withdrawal_fee',
  'invest_locked_cex','registration_bonus','cex_unlock','spark_airdrop','spark_withdrawal')
);

-- Atomic function to credit airdrop_balance
CREATE OR REPLACE FUNCTION credit_airdrop(p_user_id UUID, p_amount DECIMAL)
RETURNS TABLE(success BOOLEAN, new_balance DECIMAL, previous_balance DECIMAL, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  SELECT airdrop_balance INTO v_balance FROM wallet WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 0::DECIMAL, 'Wallet not found'::TEXT;
    RETURN;
  END IF;

  UPDATE wallet
  SET airdrop_balance = airdrop_balance + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING wallet.airdrop_balance INTO new_balance;

  previous_balance := v_balance;

  RETURN QUERY SELECT true, new_balance, previous_balance, NULL::TEXT;
END;
$$;

-- Settings for SPARK airdrop
INSERT INTO settings (key, value) VALUES
  ('spark_airdrop_enabled', 'true'),
  ('spark_registration_bonus', '5'),
  ('spark_total_distributed', '0')
ON CONFLICT (key) DO NOTHING;
