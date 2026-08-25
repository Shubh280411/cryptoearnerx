"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function CexTokenPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="CryptoEarnerX" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-bold text-white">CryptoEarnerX</span>
          </Link>
          <Link href="/register" className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all">
            Get CEX
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-20 left-1/3 w-72 h-72 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-60 h-60 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex-1">
              <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-medium">Platform Token</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">CEX</span> Token
              </h1>
              <p className="text-lg text-zinc-400 leading-relaxed mb-6">
                The company reward token of CryptoEarnerX. Earn CEX through registration bonuses, referral rewards, and platform activities. Convert to POL at 5,000 members.
              </p>
              <div className="flex items-center gap-4">
                <Link href="/register" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition-all">
                  Earn CEX Now
                </Link>
                <Link href="/convert" className="px-6 py-3 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-xl font-medium text-sm transition-all flex items-center gap-2">
                  Convert to POL
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="shrink-0">
              <div className="relative">
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-600/30 to-cyan-600/30 flex items-center justify-center animate-glow-pulse">
                  <img src="/cex-logo-64.png" alt="CEX" className="w-36 h-36 rounded-full" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Stats */}
      <section className="py-12 border-y border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Signup Bonus", value: "10", suffix: "CEX", color: "text-blue-400" },
              { label: "Max L1 Bonus", value: "50", suffix: "CEX", color: "text-green-400" },
              { label: "Conversion Target", value: "5,000", suffix: "Members", color: "text-amber-400" },
              { label: "Levels Deep", value: "7", suffix: "Levels", color: "text-purple-400" },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center">
                <p className="text-zinc-500 text-xs uppercase tracking-wider">{item.label}</p>
                <p className={`text-2xl font-extrabold mt-2 ${item.color}`}>{item.value} <span className="text-sm font-bold">{item.suffix}</span></p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Earn */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Earning Methods</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white">How to Earn CEX</h2>
          </div>

          {/* Registration Bonus */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-500/20 rounded-2xl p-8 mb-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                <span className="text-2xl font-extrabold text-white">+10</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Registration Bonus</h3>
                <p className="text-zinc-400 text-sm mt-1">Get 10 CEX instantly when you create a free account. No deposit required!</p>
              </div>
            </div>
          </motion.div>

          {/* Referral Bonuses */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { level: "L1", label: "Direct Referral", amount: 50, desc: "Invite someone directly with your referral link", color: "from-blue-500 to-blue-600" },
              { level: "L2", label: "2nd Level", amount: 40, desc: "When your referral invites a new member", color: "from-cyan-500 to-cyan-600" },
              { level: "L3", label: "3rd Level", amount: 30, desc: "Third level deep referral bonus", color: "from-purple-500 to-purple-600" },
              { level: "L4", label: "4th Level", amount: 20, desc: "Fourth level network bonus", color: "from-pink-500 to-pink-600" },
              { level: "L5", label: "5th Level", amount: 10, desc: "Fifth level network bonus", color: "from-amber-500 to-amber-600" },
              { level: "L6-7", label: "6th-7th Level", amount: 5, desc: "Deep network bonuses for power builders", color: "from-green-500 to-green-600" },
            ].map((item, i) => (
              <motion.div key={item.level} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                    <span className="text-white font-extrabold text-sm">{item.level}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{item.label}</h3>
                    <p className="text-blue-400 font-bold">+{item.amount} CEX</p>
                  </div>
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CEX to POL Conversion */}
      <section className="py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Token Conversion</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white">CEX to POL Conversion</h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <div className="flex items-center justify-center gap-8 mb-8">
                <div className="text-center">
                  <img src="/cex-logo-sm.png" alt="CEX" className="w-16 h-16 rounded-full mx-auto mb-2" />
                  <p className="text-white font-bold">CEX</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-[2px] bg-gradient-to-r from-blue-500 to-green-500" />
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-purple-400">POL</span>
                  </div>
                  <p className="text-white font-bold">POL</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-zinc-800/50">
                  <span className="text-zinc-400 text-sm">Conversion Target</span>
                  <span className="text-white font-bold">5,000 Members</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-zinc-800/50">
                  <span className="text-zinc-400 text-sm">Conversion Rate</span>
                  <span className="text-white font-bold">1 CEX = Market Rate</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-zinc-800/50">
                  <span className="text-zinc-400 text-sm">Current Status</span>
                  <span className="text-amber-400 font-bold">Locked (Building Community)</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-zinc-400 text-sm">How to Convert</span>
                  <span className="text-white font-medium text-sm">Visit CEX to POL page</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link href="/convert" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition-all">
                  Convert CEX to POL
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-600/10 to-cyan-600/10 border border-blue-500/20 rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Start Earning CEX Today</h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
              Join CryptoEarnerX, get 10 CEX free on signup, and earn up to 50 CEX per referral across 7 levels.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all">
                Create Free Account
              </Link>
              <Link href="/" className="px-8 py-3 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-xl font-medium transition-all">
                Back to Home
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
