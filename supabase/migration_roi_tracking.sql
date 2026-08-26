-- ROI Tracking Migration
-- Run this in Supabase SQL Editor

-- 1. Add last_roi_date to investments (tracks when ROI was last paid)
ALTER TABLE investments ADD COLUMN IF NOT EXISTS last_roi_date DATE;

-- 2. Add last_roi_date to staking table
ALTER TABLE staking ADD COLUMN IF NOT EXISTS last_roi_date DATE;

-- 3. Add daily_roi to staking table (fixed POL amount per day)
ALTER TABLE staking ADD COLUMN IF NOT EXISTS daily_roi DECIMAL(18,8) DEFAULT 0;
