-- OTP store table
ALTER TABLE otp_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on otp_store" ON otp_store
  FOR ALL USING (true);

-- Auto-delete expired OTPs
CREATE INDEX IF NOT EXISTS idx_otp_store_email ON otp_store(email);
CREATE INDEX IF NOT EXISTS idx_otp_store_expires ON otp_store(expires_at);
