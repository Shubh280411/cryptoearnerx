"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";

export default function WithdrawPage() {
  const [balance, setBalance] = useState(0);
  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    loadWithdrawInfo();
  }, []);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const loadWithdrawInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [walletRes, wdRes] = await Promise.all([
      supabase.from("wallet").select("balance").eq("user_id", user.id).single(),
      supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);

    setBalance(walletRes.data?.balance || 0);
    setWithdrawals(wdRes.data || []);
    setLoading(false);
  };

  const handleSendOTP = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setOtpLoading(true);
    setError("");

    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, purpose: "withdrawal" }),
    });

    const data = await res.json();

    if (res.ok) {
      setOtpSent(true);
      setOtpTimer(60);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } else {
      setError(data.error || "Failed to send OTP");
    }

    setOtpLoading(false);
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1 || (value && !/^\d$/.test(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "")) {
      verifyOTP(newOtp.join(""));
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((d) => d === "");
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();

    if (pasted.length === 6) verifyOTP(pasted);
  };

  const verifyOTP = async (otpValue: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setOtpVerifying(true);
    setError("");

    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, otp: otpValue, purpose: "withdrawal" }),
    });

    const data = await res.json();

    if (res.ok) {
      setOtpVerified(true);
    } else {
      setError(data.error || "Invalid OTP");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }

    setOtpVerifying(false);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) {
      setError("Please verify OTP first");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), walletAddress }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        setAmount("");
        setWalletAddress("");
        setOtpSent(false);
        setOtpVerified(false);
        setOtp(["", "", "", "", "", ""]);
        loadWithdrawInfo();
      } else {
        setError(data.error || "Failed to submit withdrawal");
      }
    } catch {
      setError("Network error");
    }

    setSubmitting(false);
  };

  const resetOTP = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Withdraw POL</h1>
        <p className="text-zinc-400 text-sm mt-1">Withdraw your POL to external wallet</p>
      </div>

      <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-600/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm">Available for Withdrawal</p>
            <p className="text-3xl font-bold text-white mt-1">{formatPOL(balance)} POL</p>
            <p className="text-xs text-zinc-500 mt-1">Min: 25 POL | Fee: 1 POL</p>
          </div>
          <div className="w-16 h-16 bg-amber-600/10 rounded-xl flex items-center justify-center">
            <Icon name="upload" size={32} className="text-amber-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Withdraw">
          <form onSubmit={handleWithdraw} className="space-y-4">
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
              label="Wallet Address (Polygon)"
              placeholder="0x..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              required
              disabled={otpVerified}
            />

            <Input
              label="Amount (POL)"
              type="number"
              placeholder="Min 25 POL"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="25"
              required
              disabled={otpVerified}
            />

            {amount && Number(amount) >= 25 && (
              <div className="bg-zinc-800 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Amount</span>
                  <span>{formatPOL(Number(amount))} POL</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Fee</span>
                  <span>1.00 POL</span>
                </div>
                <div className="border-t border-zinc-700 pt-1 flex justify-between text-white font-medium">
                  <span>You Receive</span>
                  <span>{formatPOL(Number(amount) - 1)} POL</span>
                </div>
              </div>
            )}

            {/* OTP Section */}
            {walletAddress && amount && Number(amount) >= 25 && !otpVerified && (
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-300 font-medium flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    OTP Verification Required
                  </p>
                  {otpSent && (
                    <button type="button" onClick={resetOTP} className="text-xs text-zinc-500 hover:text-zinc-300">
                      Change
                    </button>
                  )}
                </div>

                {!otpSent ? (
                  <Button type="button" variant="secondary" className="w-full" onClick={handleSendOTP} disabled={otpLoading}>
                    {otpLoading ? "Sending..." : "Send OTP to Email"}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-center gap-2.5">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { inputRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOTPChange(i, e.target.value)}
                          onKeyDown={(e) => handleOTPKeyDown(i, e)}
                          onPaste={handleOTPPaste}
                          disabled={otpVerifying}
                          className="w-10 h-12 text-center text-xl font-bold bg-zinc-900 border border-zinc-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                        />
                      ))}
                    </div>

                    {otpVerifying && (
                      <p className="text-center text-blue-400 text-xs flex items-center justify-center gap-1">
                        <Icon name="loader" size={12} className="animate-spin" />
                        Verifying...
                      </p>
                    )}

                    <div className="text-center">
                      {otpTimer > 0 ? (
                        <p className="text-zinc-500 text-xs">
                          Resend in <span className="text-zinc-300">{otpTimer}s</span>
                        </p>
                      ) : (
                        <button type="button" onClick={handleSendOTP} className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {otpVerified && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-emerald-400 text-sm flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                OTP Verified — You can now withdraw
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={submitting || !otpVerified}>
              {submitting ? "Processing..." : otpVerified ? "Confirm Withdrawal" : "Verify OTP to Withdraw"}
            </Button>
          </form>
        </Card>

        <Card title="Withdrawal History">
          {withdrawals.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="clock" size={32} className="text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm">No withdrawals yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((wd) => (
                <div key={wd.id} className="p-3 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        wd.status === "completed" ? "bg-green-400" :
                        wd.status === "pending" ? "bg-amber-400" :
                        wd.status === "processing" ? "bg-blue-400" : "bg-red-400"
                      }`} />
                      <span className="text-sm text-zinc-300 capitalize">{wd.status}</span>
                    </div>
                    <span className="text-sm font-medium text-white">{formatPOL(wd.amount)} POL</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 font-mono">{truncateAddr(wd.wallet_address)}</p>
                  <p className="text-xs text-zinc-600 mt-1">{new Date(wd.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function truncateAddr(addr: string) {
  return addr ? `${addr.slice(0, 10)}...${addr.slice(-8)}` : "";
}
