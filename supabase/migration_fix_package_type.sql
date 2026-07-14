-- Migration: Fix package_type CHECK constraint to match actual package names
-- Old constraint: bronze, silver, gold, platinum, diamond
-- New constraint: starter, basic, premium, vip, elite
-- Run this in Supabase SQL Editor

-- Drop old constraint and add new one
ALTER TABLE investments DROP CONSTRAINT IF EXISTS investments_package_type_check;
ALTER TABLE investments ADD CONSTRAINT investments_package_type_check CHECK (package_type IN ('starter','basic','premium','vip','elite'));

-- Also fix daily_roi precision: DECIMAL(5,4) max is 9.9999 which is fine for percentages
-- But let's widen it slightly to be safe
ALTER TABLE investments ALTER COLUMN daily_roi TYPE DECIMAL(6,2);
