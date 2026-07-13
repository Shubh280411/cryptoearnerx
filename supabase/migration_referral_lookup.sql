-- Allow anyone to validate referral codes (public signup flow)
CREATE POLICY "Anyone can lookup referral code for registration"
  ON users FOR SELECT
  USING (true);
