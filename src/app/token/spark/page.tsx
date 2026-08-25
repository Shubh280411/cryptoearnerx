"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const SPARK_ADDRESS = "0x6142ea089A7E2dC39752e956c22Db974CDD0E8E7";
const SPARK_WALLET = "0x22c0E6AB45cAFc15b304F2D0dBfB3A09e765eAfC";
const TOTAL_SUPPLY = 10000;

function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
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

export default function SparkTokenPage() {
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch(`/api/wallet/spark-balance?address=${SPARK_WALLET}`);
        const data = await res.json();
        if (data.balance !== undefined) setWalletBalance(data.balance);
      } catch {}
      setLoading(false);
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  const remaining = walletBalance !== null ? walletBalance : TOTAL_SUPPLY;
  const distributed = TOTAL_SUPPLY - remaining;
  const usedPercent = ((distributed / TOTAL_SUPPLY) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="CryptoEarnerX" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-bold text-white">CryptoEarnerX</span>
          </Link>
          <Link href="/register" className="px-5 py-2 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all">
            Get SPARK
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-20 left-1/3 w-72 h-72 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-60 h-60 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex-1">
              <div className="inline-flex items-center gap-2 bg-purple-600/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-medium">Live on Polygon</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400">SPARK</span> Token
              </h1>
              <p className="text-lg text-zinc-400 leading-relaxed mb-6">
                A limited edition ERC-20 airdrop token on Polygon with a fixed supply of only 10,000. Earn through registration and referral bonuses.
              </p>
              <div className="flex items-center gap-4">
                <a href={`https://polygonscan.com/token/${SPARK_ADDRESS}`} target="_blank" rel="noopener noreferrer"
                  className="px-6 py-3 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-xl font-medium text-sm hover:bg-purple-600/20 transition-all flex items-center gap-2">
                  View on Polygonscan
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </a>
                <Link href="/register" className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium text-sm transition-all">
                  Earn SPARK
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="shrink-0">
              <div className="relative">
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center animate-glow-pulse">
                  <img src="/spark-logo-64.png" alt="SPARK" className="w-36 h-36 rounded-full" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Remaining Supply */}
      <section className="py-12 border-y border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Supply", value: TOTAL_SUPPLY, suffix: "", color: "text-white" },
              { label: "Distributed", value: distributed, suffix: "", color: "text-purple-400" },
              { label: "Remaining", value: remaining, suffix: "", color: "text-green-400" },
              { label: "Used", value: null, suffix: `${usedPercent}%`, color: "text-amber-400", display: usedPercent + "%" },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center">
                <p className="text-zinc-500 text-xs uppercase tracking-wider">{item.label}</p>
                <p className={`text-2xl font-extrabold mt-2 ${item.color}`}>
                  {item.display ? item.display : <><AnimatedCounter value={item.value!} /> <span className="text-sm font-bold">SPARK</span></>}
                </p>
              </motion.div>
            ))}
          </div>
          {/* Progress Bar */}
          <div className="mt-6 bg-zinc-800 rounded-full h-3 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${usedPercent}%` }} transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 rounded-full" />
          </div>
        </div>
      </section>

      {/* How to Earn */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">Earning Methods</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white">How to Earn SPARK</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Signup Bonus", amount: "5 SPARK", desc: "Register on CryptoEarnerX and get 5 SPARK instantly", icon: "gift", color: "from-purple-500 to-purple-600" },
              { title: "L1 Referral", amount: "3 SPARK", desc: "Invite a friend directly and earn 3 SPARK", icon: "users", color: "from-blue-500 to-blue-600" },
              { title: "L2 Referral", amount: "2 SPARK", desc: "When your referral invites someone, earn 2 SPARK", icon: "link", color: "from-pink-500 to-pink-600" },
              { title: "L3 Referral", amount: "1 SPARK", desc: "Third level referral earns you 1 SPARK", icon: "layers", color: "from-amber-500 to-amber-600" },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center hover:border-purple-500/30 transition-all hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-2xl font-extrabold text-white">+{item.amount.split(" ")[0]}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-purple-400 font-semibold text-sm mt-1">{item.amount}</p>
                <p className="text-zinc-500 text-xs mt-2 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-3">
              <span className="text-zinc-400 text-sm">Max per chain:</span>
              <span className="text-white font-bold">11 SPARK</span>
              <span className="text-zinc-500 text-xs">(5 + 3 + 2 + 1)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Token Details */}
      <section className="py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">Token Info</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white">Token Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-5">
              {[
                { label: "Token Name", value: "SPARK" },
                { label: "Standard", value: "ERC-20" },
                { label: "Chain", value: "Polygon PoS" },
                { label: "Total Supply", value: "10,000" },
                { label: "Decimals", value: "18" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                  <span className="text-zinc-400 text-sm">{item.label}</span>
                  <span className="text-white font-medium text-sm">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-5">
              {[
                { label: "Min Withdrawal", value: "10 SPARK" },
                { label: "Withdrawal Fee", value: "0%" },
                { label: "Withdrawal Speed", value: "~2 seconds" },
                { label: "Auth Method", value: "OTP Verified" },
                { label: "Contract", value: "Verified ✓" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                  <span className="text-zinc-400 text-sm">{item.label}</span>
                  <span className="text-white font-medium text-sm">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center">
            <a href={`https://polygonscan.com/token/${SPARK_ADDRESS}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
              Contract: {SPARK_ADDRESS.slice(0, 10)}...{SPARK_ADDRESS.slice(-8)}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* Withdrawal Info */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-purple-600/10 via-pink-600/5 to-amber-600/10 border border-purple-500/20 rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Withdraw SPARK Anytime</h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
              No lock-in period. Withdraw your SPARK tokens anytime to any Polygon wallet. Zero fees, instant settlement in ~2 seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/withdraw-airdrop" className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all">
                Withdraw SPARK
              </Link>
              <Link href="/register" className="px-8 py-3 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-xl font-medium transition-all">
                Earn More SPARK
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-zinc-600 text-xs">CryptoEarnerX &copy; 2026. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
