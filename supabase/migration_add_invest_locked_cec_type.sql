-- Add invest_locked_cec transaction type
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('deposit','withdrawal','investment','roi_payout','referral_bonus','binary_bonus','level_commission','leadership_bonus','sweep','staking_reward','withdrawal_fee','invest_locked_cec'));
