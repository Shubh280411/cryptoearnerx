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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateReferralCode = () => {
    return "CEX" + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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

    const newReferralCode = generateReferralCode();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
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

      if (referralCode) {
        const { data: sponsor } = await supabase
          .from("users")
          .select("id, left_child_id, right_child_id")
          .eq("referral_code", referralCode)
          .single();

        if (sponsor) {
          sponsorId = sponsor.id;
          if (!sponsor.left_child_id) {
            side = "left_child_id";
          } else if (!sponsor.right_child_id) {
            side = "right_child_id";
          } else {
            side = "left_child_id";
          }
        }
      }

      const { error: insertError } = await supabase.from("users").insert({
        id: authData.user.id,
        email,
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

            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

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

            <Input
              label="Referral Code (Optional)"
              type="text"
              placeholder="Enter referral code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />

            <Button type="submit" variant="primary" className="w-full" size="lg" disabled={loading}>
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
