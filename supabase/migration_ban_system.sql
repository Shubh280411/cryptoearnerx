-- Ban system: add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;

-- Appeals table
CREATE TABLE IF NOT EXISTS ban_appeals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id)
);

-- RLS
ALTER TABLE ban_appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appeals" ON ban_appeals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appeals" ON ban_appeals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin full access on appeals" ON ban_appeals
  FOR ALL USING (is_admin());

-- Index
CREATE INDEX IF NOT EXISTS idx_ban_appeals_user_id ON ban_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_ban_appeals_status ON ban_appeals(status);
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);
