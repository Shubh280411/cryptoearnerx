ALTER TABLE investments ADD COLUMN IF NOT EXISTS roi_enabled BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN investments.roi_enabled IS 'Admin toggle: if false, daily-roi cron skips this investment';
