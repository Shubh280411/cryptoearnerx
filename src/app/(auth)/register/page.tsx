"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icons";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-950"><p className="text-zinc-400">Loading...</p></div>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState(refCode);
  const [referralValid, setReferralValid] = useState<boolean | null>(refCode ? null : null);
  const [referralName, setReferralName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const generateReferralCode = () => {
    return "CEX" + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const validateReferral = async (code: string) => {
    if (!code.trim()) { setReferralValid(null); setReferralName(""); return; }
    const { data } = await supabase.from("users").select("id, name").eq("referral_code", code.trim()).single();
    if (data) { setReferralValid(true); setReferralName(data.name || "User"); }
    else { setReferralValid(false); setReferralName(""); }
  };

  const sendOTP = async () => {
    if (!email || !email.includes("@") || email.includes("+")) {
      setError("Enter a valid email address");
      return;
    }
    setOtpLoading(true);
    setError("");

    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.toLowerCase().trim(), purpose: "register" }),
    });

    const data = await res.json();
    if (res.ok) {
      setOtpSent(true);
      setSuccess("OTP sent! Check your email.");
      setOtpTimer(60);
      const interval = setInterval(() => {
        setOtpTimer((t) => {
          if (t <= 1) { clearInterval(interval); return 0; }
          return t - 1;
        });
      }, 1000);
    } else {
      setError(data.error || "Failed to send OTP");
    }
    setOtpLoading(false);
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError("Enter 6-digit OTP");
      return;
    }
    setOtpLoading(true);
    setError("");

    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.toLowerCase().trim(), otp, purpose: "register" }),
    });

    const data = await res.json();
    if (res.ok && data.verified) {
      setOtpVerified(true);
      setSuccess("Email verified!");
    } else {
      setError(data.error || "Invalid OTP");
    }
    setOtpLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!otpVerified) {
      setError("Please verify your email with OTP first");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const emailLower = email.toLowerCase().trim();
    if (emailLower.includes("+")) {
      setError("Email aliases (with +) are not allowed");
      setLoading(false);
      return;
    }

    if (!referralCode.trim()) {
      setError("Referral code is required. Ask someone for their referral code.");
      setLoading(false);
      return;
    }

    const { data: sponsorCheck } = await supabase
      .from("users")
      .select("id, left_child_id, right_child_id")
      .eq("referral_code", referralCode.trim())
      .single();

    if (!sponsorCheck) {
      setError("Invalid referral code. Please check and try again.");
      setLoading(false);
      return;
    }

    const newReferralCode = generateReferralCode();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailLower,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      let sponsorId = null;
      let side: "left_child_id" | "right_child_id" = "left_child_id";

      if (sponsorCheck) {
        sponsorId = sponsorCheck.id;
        if (!sponsorCheck.left_child_id) {
          side = "left_child_id";
        } else if (!sponsorCheck.right_child_id) {
          side = "right_child_id";
        } else {
          side = "left_child_id";
        }
      }

      const { error: insertError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: emailLower,
        name,
        password_hash: "managed_by_supabase",
        sponsor_id: sponsorId,
        referral_code: newReferralCode,
        [side]: null,
      });

      if (insertError) {
        setError("Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      const { data: bonusSetting } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "registration_bonus")
        .single();

      const bonusAmount = Number(bonusSetting?.value) || 100;

      await supabase.from("wallet").insert({
        user_id: authData.user.id,
        balance: 0,
        bonus_balance: bonusAmount,
      });

      await supabase.from("transactions").insert({
        user_id: authData.user.id,
        type: "referral_bonus",
        amount: bonusAmount,
        balance_before: 0,
        balance_after: bonusAmount,
        description: `Welcome bonus! ${bonusAmount} CEX coins credited on signup`,
        status: "completed",
      });

      if (sponsorId) {
        const { data: sponsorUser } = await supabase
          .from("users")
          .select("left_child_id, right_child_id")
          .eq("id", sponsorId)
          .single();

        if (sponsorUser) {
          const updateData: Record<string, string> = {};
          if (!sponsorUser.left_child_id) {
            updateData.left_child_id = authData.user.id;
          } else if (!sponsorUser.right_child_id) {
            updateData.right_child_id = authData.user.id;
          }
          if (Object.keys(updateData).length > 0) {
            await supabase.from("users").update(updateData).eq("id", sponsorId);
          }
        }
      }

      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <Image src="/logo.png" alt="CryptoEarnerX" width={48} height={48} className="rounded-lg" />
            <span className="text-2xl font-bold text-white">CryptoEarnerX</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-zinc-400 mt-2">Start earning crypto today</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
                <Icon name="alertTriangle" size={16} />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2">
                <Icon name="check" size={16} />
                {success}
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {/* Email + OTP */}
            <div>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setOtpSent(false); setOtpVerified(false); setOtp(""); }}
                disabled={otpVerified}
                required
              />
              {!otpVerified && (
                <div className="mt-2">
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={sendOTP}
                      disabled={otpLoading || !email || !email.includes("@") || email.includes("+")}
                      className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-blue-400 border border-zinc-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      {otpLoading ? "Sending..." : "Send Verification Code"}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          maxLength={6}
                          className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm tracking-widest text-center"
                        />
                        <button
                          type="button"
                          onClick={verifyOTP}
                          disabled={otpLoading || otp.length !== 6}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          {otpLoading ? "..." : "Verify"}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={sendOTP}
                          disabled={otpTimer > 0 || otpLoading}
                          className="text-xs text-zinc-500 hover:text-zinc-300 disabled:cursor-not-allowed"
                        >
                          {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend OTP"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {otpVerified && (
                <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
                  <Icon name="check" size={14} />
                  Email verified
                </div>
              )}
            </div>

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-zinc-500 hover:text-zinc-300"
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
              </button>
            </div>

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div>
              <Input
                label="Referral Code"
                type="text"
                placeholder="Ask someone for their code"
                value={referralCode}
                onChange={(e) => { setReferralCode(e.target.value); setReferralValid(null); setReferralName(""); }}
                onBlur={() => validateReferral(referralCode)}
                required
              />
              {referralValid === true && (
                <p className="text-xs text-green-400 mt-1">Referred by: {referralName}</p>
              )}
              {referralValid === false && referralCode.trim() && (
                <p className="text-xs text-red-400 mt-1">Invalid referral code</p>
              )}
            </div>

            <Button type="submit" variant="primary" className="w-full" size="lg" disabled={loading || !otpVerified}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
