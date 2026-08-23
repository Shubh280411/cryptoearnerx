"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icons";

const SPARK_ADDRESS = "0x6142ea089A7E2dC39752e956c22Db974CDD0E8E7";
const TOTAL_SUPPLY = 10000;
const MIN_WITHDRAW = 10;

function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

export default function WithdrawAirdropPage() {
  const [sparkBalance, setSparkBalance] = useState(0);
  const [onChainBalance, setOnChainBalance] = useState<number | null>(null);
  const [totalDistributed, setTotalDistributed] = useState(0);
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
    loadInfo();
    fetchOnChainBalance();
    const interval = setInterval(fetchOnChainBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const fetchOnChainBalance = async () => {
    try {
      const res = await fetch(`/api/wallet/spark-balance?address=${SPARK_ADDRESS}`);
      const data = await res.json();
      if (data.balance !== undefined) setOnChainBalance(data.balance);
    } catch {}
  };

  const loadInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [walletRes, wdRes, txRes] = await Promise.all([
      supabase.from("wallet").select("airdrop_balance").eq("user_id", user.id).single(),
      supabase.from("withdrawals").select("*").eq("user_id", user.id).eq("token_type", "spark").order("created_at", { ascending: false }).limit(10),
      supabase.from("transactions").select("amount").eq("type", "spark_airdrop"),
    ]);
    setSparkBalance(walletRes.data?.airdrop_balance || 0);
    setWithdrawals(wdRes.data || []);
    if (txRes.data) {
      setTotalDistributed(txRes.data.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0));
    }
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
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== "")) verifyOTP(newOtp.join(""));
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
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
    if (!otpVerified) { setError("Please verify OTP first"); return; }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/wallet/withdraw-airdrop", {
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
        loadInfo();
        fetchOnChainBalance();
      } else {
        setError(data.error || "Failed to submit withdrawal");
      }
    } catch { setError("Network error"); }
    setSubmitting(false);
  };

  const resetOTP = () => { setOtpSent(false); setOtpVerified(false); setOtp(["", "", "", "", "", ""]); setError(""); };
  const remaining = TOTAL_SUPPLY - totalDistributed;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spark-loader">
          <div className="spark-loader-coin" />
          <div className="spark-loader-ring" />
          <p className="text-zinc-400 mt-8 text-sm animate-pulse">Loading SPARK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Withdraw SPARK</h1>
        <p className="text-zinc-400 text-sm mt-1">Withdraw your SPARK airdrop tokens to any Polygon wallet</p>
      </div>

      {/* ===== SPARK HERO CARD with Animated Coin ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-amber-600/20 border border-purple-500/20 rounded-2xl p-6 min-h-[260px]">

        {/* Background Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`spark-particle spark-particle-${i % 4}`}
              style={{
                left: `${8 + (i * 7.5) % 90}%`,
                top: `${15 + (i * 17) % 70}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${3 + (i % 3)}s`,
              }}
            />
          ))}
        </div>

        <div className="relative flex items-center justify-between flex-wrap gap-6">

          {/* Left: Coin + Balance */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {/* Animated SPARK Coin */}
              <div className="spark-coin-wrapper">
                <div className="spark-coin-glow" />
                <div className="spark-coin-ring" />
                <div className="spark-coin">
                  <div className="spark-coin-face spark-coin-front">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <div className="spark-coin-face spark-coin-back">
                    <span className="text-white text-lg font-bold">S</span>
                  </div>
                </div>
                <div className="spark-coin-status" />
              </div>

              <div>
                <p className="text-white font-bold text-2xl tracking-wide">SPARK</p>
                <p className="text-purple-300 text-xs">CryptoEarnerX Airdrop Token</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-xs">Live on Polygon</span>
                </div>
              </div>
            </div>

            <div className="ml-1">
              <p className="text-zinc-400 text-sm">Your SPARK Balance</p>
              <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 mt-1">
                <AnimatedCounter value={sparkBalance} /> <span className="text-lg font-bold">SPARK</span>
              </p>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="text-right space-y-2">
            {onChainBalance !== null && (
              <div className="spark-stat-card">
                <p className="text-zinc-500 text-xs">Contract Supply (Live)</p>
                <p className="text-white font-mono text-sm flex items-center justify-end gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <AnimatedCounter value={onChainBalance} /> SPARK
                </p>
              </div>
            )}
            <div className="spark-stat-card">
              <p className="text-zinc-500 text-xs">Remaining Airdrop</p>
              <p className="text-amber-400 font-bold text-sm"><AnimatedCounter value={remaining} /> SPARK</p>
            </div>
            <div className="spark-stat-card">
              <p className="text-zinc-500 text-xs">Total Distributed</p>
              <p className="text-pink-400 font-bold text-sm"><AnimatedCounter value={totalDistributed} /> SPARK</p>
            </div>
          </div>
        </div>

        {/* Supply Progress Bar */}
        <div className="relative mt-5">
          <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
            <span>Airdrop Progress</span>
            <span className="text-purple-400 font-medium">{((totalDistributed / TOTAL_SUPPLY) * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2.5 bg-zinc-800/80 rounded-full overflow-hidden">
            <div className="spark-progress-bar" style={{ width: `${(totalDistributed / TOTAL_SUPPLY) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* ===== Token Info Cards with Hover ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Supply", value: "10,000", color: "text-white", icon: "layers" },
          { label: "Chain", value: "Polygon PoS", color: "text-purple-400", icon: "activity" },
          { label: "Min Withdraw", value: "10 SPARK", color: "text-amber-400", icon: "download" },
          { label: "Fee", value: "0%", color: "text-green-400", icon: "shield" },
        ].map((item, i) => (
          <div key={i} className="spark-info-card group">
            <div className="spark-info-card-icon">
              <Icon name={item.icon as any} size={16} />
            </div>
            <p className="text-zinc-500 text-xs mt-2">{item.label}</p>
            <p className={`font-bold text-sm mt-0.5 ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* ===== Contract Address ===== */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-purple-500/30 transition-colors duration-300">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <p className="text-zinc-500 text-xs mb-1">Token Contract Address</p>
            <p className="text-zinc-300 font-mono text-sm truncate">{SPARK_ADDRESS}</p>
          </div>
          <a
            href={`https://polygonscan.com/token/${SPARK_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="spark-link-btn flex items-center gap-1.5 text-purple-400 hover:text-purple-300 text-xs font-medium bg-purple-600/10 px-4 py-2.5 rounded-lg transition-all duration-300 hover:bg-purple-600/20 hover:shadow-lg hover:shadow-purple-500/10 shrink-0"
          >
            View on Polygonscan
            <Icon name="externalLink" size={12} />
          </a>
        </div>
      </div>

      {/* ===== What is SPARK? - Enhanced Visual ===== */}
      <Card title="What is SPARK?">
        <div className="space-y-0">
          {/* Item 1 */}
          <div className="spark-info-row">
            <div className="spark-info-dot bg-purple-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            </div>
            <div className="spark-info-line" />
            <div className="flex-1 pb-5">
              <p className="text-sm text-white font-semibold">Limited Edition Airdrop Token</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">SPARK is a special ERC-20 token on Polygon with a fixed supply of only 10,000 tokens. Earned through registration and referral bonuses.</p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="spark-info-row">
            <div className="spark-info-dot bg-green-500">
              <Icon name="check" size={16} className="text-white" />
            </div>
            <div className="spark-info-line" />
            <div className="flex-1 pb-5">
              <p className="text-sm text-white font-semibold">Fully Withdrawable Anytime</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Withdraw your SPARK tokens anytime to any Polygon wallet. Min 10 SPARK, zero fees. Auto-executed on-chain in ~2 seconds.</p>
            </div>
          </div>

          {/* Item 3 - How to Earn */}
          <div className="spark-info-row">
            <div className="spark-info-dot bg-amber-500">
              <Icon name="users" size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white font-semibold mb-3">How to Earn SPARK</p>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: "Signup", amount: "5", color: "from-purple-500 to-purple-600" },
                  { label: "L1 Referral", amount: "3", color: "from-blue-500 to-blue-600" },
                  { label: "L2 Referral", amount: "2", color: "from-pink-500 to-pink-600" },
                  { label: "L3 Referral", amount: "1", color: "from-amber-500 to-amber-600" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`spark-earn-badge bg-gradient-to-r ${item.color}`}>
                      <span className="text-white font-bold text-sm">+{item.amount}</span>
                      <span className="text-white/70 text-xs">SPARK</span>
                    </div>
                    {i < 3 && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-600 mt-2">Max per chain: 11 SPARK (5 + 3 + 2 + 1)</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== Withdrawal Form ===== */}
        <Card title="Withdraw SPARK">
          <form onSubmit={handleWithdraw} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2 animate-shake">
                <Icon name="alertTriangle" size={16} />{error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2 animate-success-flash">
                <Icon name="checkCircle" size={16} />{success}
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
              label="Amount (SPARK)"
              type="number"
              placeholder={`Min ${MIN_WITHDRAW} SPARK`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={MIN_WITHDRAW}
              required
              disabled={otpVerified}
            />

            {amount && Number(amount) >= MIN_WITHDRAW && (
              <div className="bg-zinc-800 rounded-lg p-3 text-sm space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Amount</span>
                  <span className="text-purple-300 font-medium">{Number(amount).toLocaleString()} SPARK</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Fee</span>
                  <span className="text-green-400 font-medium">0 SPARK</span>
                </div>
                <div className="border-t border-zinc-700 pt-1.5 flex justify-between text-white font-semibold">
                  <span>You Receive</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{Number(amount).toLocaleString()} SPARK</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <Icon name="activity" size={12} className="text-green-500" />
                  Auto-executed on Polygon. Arrives in ~2 seconds.
                </div>
              </div>
            )}

            {walletAddress && amount && Number(amount) >= MIN_WITHDRAW && !otpVerified && (
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-300 font-medium flex items-center gap-2">
                    <Icon name="lock" size={14} className="text-blue-400" />
                    OTP Verification Required
                  </p>
                  {otpSent && <button type="button" onClick={resetOTP} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Change</button>}
                </div>
                {!otpSent ? (
                  <Button type="button" variant="secondary" className="w-full" onClick={handleSendOTP} disabled={otpLoading}>
                    {otpLoading ? "Sending..." : "Send OTP to Email"}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-center gap-2.5">
                      {otp.map((digit, i) => (
                        <input key={i} ref={(el) => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
                          onChange={(e) => handleOTPChange(i, e.target.value)} onKeyDown={(e) => handleOTPKeyDown(i, e)} onPaste={handleOTPPaste} disabled={otpVerifying}
                          className={`w-10 h-12 text-center text-xl font-bold bg-zinc-900 border rounded-lg text-white outline-none transition-all disabled:opacity-50 ${digit ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                        />
                      ))}
                    </div>
                    {otpVerifying && <p className="text-center text-blue-400 text-xs flex items-center justify-center gap-1"><Icon name="refresh" size={12} className="animate-spin" />Verifying...</p>}
                    <div className="text-center">
                      {otpTimer > 0 ? (
                        <p className="text-zinc-500 text-xs">Resend in <span className="text-zinc-300 font-mono">{otpTimer}s</span></p>
                      ) : (
                        <button type="button" onClick={handleSendOTP} className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors">Resend OTP</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {otpVerified && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-emerald-400 text-sm flex items-center gap-2 animate-success-flash">
                <Icon name="checkCircle" size={16} />
                OTP Verified — You can now withdraw
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={submitting || !otpVerified}>
              {submitting ? "Processing..." : otpVerified ? "Withdraw SPARK" : "Verify OTP to Withdraw"}
            </Button>
          </form>
        </Card>

        {/* ===== Withdrawal History ===== */}
        <Card title="Withdrawal History">
          {withdrawals.length === 0 ? (
            <div className="text-center py-8">
              <div className="spark-empty-coin mx-auto mb-3">
                <Icon name="clock" size={24} className="text-zinc-600" />
              </div>
              <p className="text-zinc-400 text-sm">No SPARK withdrawals yet</p>
              <p className="text-zinc-600 text-xs mt-1">Your withdrawal history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((wd, i) => (
                <div key={wd.id} className="spark-wd-item" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`spark-status-dot ${
                        wd.status === "completed" ? "spark-status-completed" :
                        wd.status === "pending" ? "spark-status-pending" :
                        wd.status === "processing" ? "spark-status-processing" : "spark-status-rejected"
                      }`} />
                      <span className="text-sm text-zinc-300 capitalize font-medium">{wd.status}</span>
                    </div>
                    <span className="text-sm font-bold text-purple-400">{Number(wd.amount).toLocaleString()} SPARK</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1.5 font-mono">{truncateAddr(wd.wallet_address)}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{new Date(wd.created_at).toLocaleDateString()}</p>
                  {wd.tx_hash && (
                    <a href={`https://polygonscan.com/tx/${wd.tx_hash}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors">
                      Tx: {wd.tx_hash.slice(0, 6)}...{wd.tx_hash.slice(-4)}
                      <Icon name="externalLink" size={10} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ===== ALL ANIMATIONS ===== */}
      <style jsx global>{`
        /* === SPARK Coin Animation === */
        .spark-coin-wrapper {
          position: relative;
          width: 64px;
          height: 64px;
          perspective: 400px;
        }
        .spark-coin-glow {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.3), transparent 70%);
          animation: coinGlow 3s ease-in-out infinite;
        }
        .spark-coin-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid rgba(168, 85, 247, 0.2);
          animation: coinRingSpin 6s linear infinite;
        }
        .spark-coin {
          position: relative;
          width: 64px;
          height: 64px;
          transform-style: preserve-3d;
          animation: coinSpin 4s ease-in-out infinite;
        }
        .spark-coin-face {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          backface-visibility: hidden;
          box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4), inset 0 -2px 6px rgba(0,0,0,0.3);
        }
        .spark-coin-front {
          background: linear-gradient(135deg, #a855f7, #ec4899, #f59e0b);
        }
        .spark-coin-back {
          background: linear-gradient(135deg, #f59e0b, #ec4899, #a855f7);
          transform: rotateY(180deg);
        }
        .spark-coin-status {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #22c55e;
          border: 3px solid #09090b;
          animation: statusPulse 2s ease-in-out infinite;
        }

        @keyframes coinSpin {
          0%, 100% { transform: rotateY(0deg) scale(1); }
          25% { transform: rotateY(90deg) scale(0.95); }
          50% { transform: rotateY(180deg) scale(1); }
          75% { transform: rotateY(270deg) scale(0.95); }
        }
        @keyframes coinGlow {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes coinRingSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes statusPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { transform: scale(1.1); box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
        }

        /* === Background Particles === */
        .spark-particle {
          position: absolute;
          border-radius: 50%;
          opacity: 0;
          animation: particleFloat 4s ease-in-out infinite;
        }
        .spark-particle-0 { width: 4px; height: 4px; background: #a855f7; }
        .spark-particle-1 { width: 6px; height: 6px; background: #ec4899; clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); border-radius: 0; }
        .spark-particle-2 { width: 3px; height: 3px; background: #f59e0b; }
        .spark-particle-3 { width: 5px; height: 5px; background: linear-gradient(135deg, #a855f7, #ec4899); clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); border-radius: 0; }

        @keyframes particleFloat {
          0% { transform: translateY(0px) translateX(0px) scale(0); opacity: 0; }
          20% { opacity: 0.6; transform: scale(1); }
          50% { transform: translateY(-30px) translateX(10px) scale(1.1); opacity: 0.3; }
          80% { opacity: 0.5; }
          100% { transform: translateY(-50px) translateX(-5px) scale(0.8); opacity: 0; }
        }

        /* === Progress Bar === */
        .spark-progress-bar {
          height: 100%;
          border-radius: 9999px;
          background: linear-gradient(90deg, #a855f7, #ec4899, #f59e0b);
          background-size: 200% 100%;
          animation: progressShimmer 3s ease-in-out infinite;
          transition: width 1s ease-out;
        }
        @keyframes progressShimmer {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 0%; }
        }

        /* === Stat Cards === */
        .spark-stat-card {
          background: rgba(24, 24, 27, 0.6);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          padding: 10px 14px;
          border: 1px solid rgba(63, 63, 70, 0.3);
          transition: all 0.3s ease;
        }
        .spark-stat-card:hover {
          border-color: rgba(168, 85, 247, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.1);
        }

        /* === Info Cards Hover === */
        .spark-info-card {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          transition: all 0.3s ease;
          cursor: default;
        }
        .spark-info-card:hover {
          border-color: rgba(168, 85, 247, 0.4);
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(168, 85, 247, 0.1);
        }
        .spark-info-card-icon {
          width: 32px;
          height: 32px;
          margin: 0 auto;
          border-radius: 8px;
          background: rgba(168, 85, 247, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a855f7;
          transition: transform 0.3s ease;
        }
        .spark-info-card:hover .spark-info-card-icon {
          transform: scale(1.15) rotate(5deg);
        }

        /* === What is SPARK - Visual Flow === */
        .spark-info-row {
          display: flex;
          gap: 14px;
          position: relative;
        }
        .spark-info-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
          transition: transform 0.3s ease;
        }
        .spark-info-row:hover .spark-info-dot {
          transform: scale(1.1);
        }
        .spark-info-line {
          position: absolute;
          left: 15px;
          top: 32px;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, #3f3f46, transparent);
        }
        .spark-earn-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12px;
          transition: transform 0.2s ease;
        }
        .spark-earn-badge:hover {
          transform: scale(1.08);
        }

        /* === Withdrawal History Items === */
        .spark-wd-item {
          padding: 12px;
          background: rgba(24, 24, 27, 0.5);
          border-radius: 10px;
          border: 1px solid rgba(39, 39, 42, 0.5);
          animation: slideInUp 0.4s ease-out both;
          transition: border-color 0.3s ease;
        }
        .spark-wd-item:hover {
          border-color: rgba(168, 85, 247, 0.2);
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .spark-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .spark-status-completed { background: #22c55e; box-shadow: 0 0 6px rgba(34, 197, 94, 0.5); animation: dotPulseGreen 2s infinite; }
        .spark-status-pending { background: #f59e0b; animation: dotPulseAmber 2s infinite; }
        .spark-status-processing { background: #3b82f6; animation: dotSpin 1s linear infinite; }
        .spark-status-rejected { background: #ef4444; }

        @keyframes dotPulseGreen {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
        }
        @keyframes dotPulseAmber {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 0 4px rgba(245, 158, 11, 0); }
        }
        @keyframes dotSpin {
          from { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          to { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0); }
        }

        /* === Empty State Coin === */
        .spark-empty-coin {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #27272a;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: emptyCoinBounce 3s ease-in-out infinite;
        }
        @keyframes emptyCoinBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.05); }
        }

        /* === Error Shake === */
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }

        /* === Success Flash === */
        .animate-success-flash {
          animation: successFlash 0.6s ease-out;
        }
        @keyframes successFlash {
          0% { background-color: rgba(34, 197, 94, 0.3); }
          100% { background-color: rgba(34, 197, 94, 0.1); }
        }

        /* === Loading State === */
        .spark-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        .spark-loader-coin {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          animation: loaderSpin 2s ease-in-out infinite;
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
        }
        .spark-loader-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #a855f7;
          border-right-color: #ec4899;
          animation: loaderRingSpin 1.5s linear infinite;
        }
        @keyframes loaderSpin {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(0.9) rotate(180deg); }
        }
        @keyframes loaderRingSpin {
          to { transform: rotate(360deg); }
        }

        /* === Link Button Hover === */
        .spark-link-btn:hover {
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

function truncateAddr(addr: string) {
  return addr ? `${addr.slice(0, 10)}...${addr.slice(-8)}` : "";
}
