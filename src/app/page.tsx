"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";

function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref} className="counter-number">{count.toLocaleString()}{suffix}</span>;
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 overflow-hidden">
      {/* ===== HEADER ===== */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="CryptoEarnerX" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-bold text-white">CryptoEarnerX</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Login</Link>
            <Link href="/register" className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative py-24 lg:py-36">
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="hero-particle"
              style={{
                width: `${3 + (i % 4) * 2}px`,
                height: `${3 + (i % 4) * 2}px`,
                left: `${(i * 5) % 100}%`,
                bottom: `-${10 + (i % 5) * 5}%`,
                background: ["#3b82f6", "#a855f7", "#ec4899", "#facc15"][i % 4],
                animationDuration: `${8 + (i % 5) * 3}s`,
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}
        </div>

        {/* Glow Orbs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-purple-600/10 border border-purple-500/20 rounded-full px-5 py-2.5 mb-8 float-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span className="text-purple-300 font-medium text-sm">100 CEX Coins FREE on signup</span>
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
            <span className="gradient-text">Earn Crypto.</span>
            <br />
            <span className="text-white">Build Teams.</span>
            <br />
            <span className="gradient-text">Grow Wealth.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Invest in crypto packages and earn up to 2.5% daily ROI. Grow your team through our binary network and unlock unlimited earning potential.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register"
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold text-lg transition-all glow-pulse hover:scale-105">
              Start Earning Now
            </Link>
            <Link href="/about"
              className="px-8 py-4 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/50 rounded-xl font-medium transition-all">
              Learn More
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <Section>
        <section className="py-16 border-y border-zinc-800/50 bg-zinc-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {[
                { value: 5000, suffix: "+", label: "Active Members", color: "text-white" },
                { value: 2, suffix: "%", label: "Max Daily ROI", color: "text-blue-400" },
                { value: 10, suffix: "%", label: "Referral Bonus", color: "text-green-400" },
                { value: 100, suffix: "", label: "Free CEX on Signup", color: "text-purple-400" },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-xl p-6 text-center">
                  <p className={`text-3xl lg:text-4xl font-extrabold ${stat.color}`}>
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-zinc-400 mt-2 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Section>

      {/* ===== HOW IT WORKS ===== */}
      <Section>
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Simple Process</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-white">How It Works</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-blue-600/50 via-purple-600/50 to-pink-600/50" />

              {[
                { step: "01", title: "Create Account", desc: "Sign up with your email and get a unique referral link instantly.", icon: "user", color: "from-blue-500 to-blue-600" },
                { step: "02", title: "Deposit POL", desc: "Send POL to your unique wallet. Funds credited in seconds on Polygon.", icon: "wallet", color: "from-purple-500 to-purple-600" },
                { step: "03", title: "Start Earning", desc: "Choose a package and earn daily ROI plus team bonuses.", icon: "trending", color: "from-pink-500 to-pink-600" },
              ].map((item, i) => (
                <motion.div key={item.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.5 }}
                  className="relative text-center">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10`}>
                    <span className="text-2xl font-extrabold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </Section>

      {/* ===== INVESTMENT PACKAGES ===== */}
      <Section>
        <section className="py-24 bg-zinc-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Investment Plans</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">Choose Your Package</h2>
              <p className="text-zinc-400">Higher packages = Higher daily returns</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {[
                { name: "Starter", min: "25", roi: "1.0%", days: "30", color: "#22c55e", popular: false },
                { name: "Basic", min: "500", roi: "1.2%", days: "60", color: "#3b82f6", popular: false },
                { name: "Premium", min: "2,500", roi: "1.5%", days: "90", color: "#a855f7", popular: true },
                { name: "VIP", min: "10,000", roi: "1.8%", days: "120", color: "#f59e0b", popular: false },
                { name: "Elite", min: "50,000", roi: "2.0%", days: "180", color: "#ef4444", popular: false },
              ].map((plan, i) => (
                <motion.div key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className={`glass-card rounded-2xl p-6 text-center package-card relative ${plan.popular ? "ring-2 ring-purple-500/50" : ""}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-white mt-2">{plan.name}</h3>
                  <p className="text-3xl font-extrabold mt-3" style={{ color: plan.color }}>{plan.roi}</p>
                  <p className="text-xs text-zinc-500 mb-4">daily ROI</p>
                  <div className="space-y-2 text-sm text-zinc-400 border-t border-zinc-800 pt-4">
                    <p>Min: <span className="text-white font-medium">{plan.min} POL</span></p>
                    <p>Duration: <span className="text-white font-medium">{plan.days} days</span></p>
                  </div>
                  <Link href="/register"
                    className="block mt-5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                    style={{ backgroundColor: plan.color + "15", color: plan.color, border: `1px solid ${plan.color}30` }}>
                    Get Started
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </Section>

      {/* ===== BINARY NETWORK ===== */}
      <Section>
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">MLM System</p>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Binary Network System</h2>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                  Build your team with our powerful binary compensation plan. Earn from every level of your growing organization.
                </p>
                <div className="space-y-5">
                  {[
                    { label: "Direct Referral", value: "10%", desc: "Earn on every referral investment", color: "text-blue-400" },
                    { label: "Binary Matching", value: "20%", desc: "Match 20% of your smaller leg volume", color: "text-green-400" },
                    { label: "Level Commission", value: "3-1%", desc: "L1: 3%, L2: 2%, L3: 1% ongoing", color: "text-purple-400" },
                    { label: "Unlimited Depth", value: "∞", desc: "No limit on how deep you can grow", color: "text-amber-400" },
                  ].map((item, i) => (
                    <motion.div key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-4">
                      <div className="glass-card rounded-xl px-4 py-2 shrink-0">
                        <span className={`text-xl font-extrabold ${item.color}`}>{item.value}</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold">{item.label}</p>
                        <p className="text-sm text-zinc-500">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Binary Tree Visual */}
              <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                className="glass-card rounded-2xl p-8">
                <div className="flex flex-col items-center">
                  {/* Root */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 node-pulse relative z-10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                  </div>
                  <div className="w-[2px] h-10 connect-line" />
                  {/* Level 1 */}
                  <div className="flex gap-16 relative">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center">
                        <span className="text-blue-400 text-xs font-bold">L</span>
                      </div>
                      <div className="w-[2px] h-6 bg-blue-500/30" />
                      <div className="flex gap-6">
                        <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
                          <span className="text-blue-400 text-[10px]">L1</span>
                        </div>
                        <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
                          <span className="text-blue-400 text-[10px]">L2</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-purple-600/20 border border-purple-500/30 rounded-full flex items-center justify-center">
                        <span className="text-purple-400 text-xs font-bold">R</span>
                      </div>
                      <div className="w-[2px] h-6 bg-purple-500/30" />
                      <div className="flex gap-6">
                        <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center">
                          <span className="text-purple-400 text-[10px]">R1</span>
                        </div>
                        <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center">
                          <span className="text-purple-400 text-[10px]">R2</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-6 pt-4 border-t border-zinc-800">
                  <p className="text-white font-semibold">Binary Matching Bonus</p>
                  <p className="text-zinc-500 text-xs mt-1">Earn 20% of smaller leg volume</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </Section>

      {/* ===== CTA ===== */}
      <Section>
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="cta-gradient border border-zinc-800 rounded-3xl p-12 lg:p-16 text-center relative overflow-hidden">
              {/* Background Particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="hero-particle"
                    style={{
                      width: `${3 + (i % 3) * 2}px`,
                      height: `${3 + (i % 3) * 2}px`,
                      left: `${10 + i * 12}%`,
                      bottom: "0%",
                      background: ["#3b82f6", "#a855f7", "#ec4899"][i % 3],
                      animationDuration: `${6 + i * 2}s`,
                      animationDelay: `${i * 0.8}s`,
                    }}
                  />
                ))}
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Start Earning?</h2>
                <p className="text-zinc-400 mb-8 text-lg">Join thousands of users earning crypto daily on Polygon</p>
                <Link href="/register"
                  className="inline-block px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold text-lg transition-all glow-pulse hover:scale-105">
                  Create Free Account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="CryptoEarnerX" width={28} height={28} className="rounded-lg" />
              <span className="text-lg font-bold text-white">CryptoEarnerX</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-400 flex-wrap justify-center">
              {["About", "FAQ", "Roadmap", "Legal", "Privacy", "Risk Disclosure"].map((link) => (
                <Link key={link} href={`/${link.toLowerCase().replace(" ", "-")}`} className="hover:text-white transition-colors">
                  {link}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <a href="https://t.me/cryptoearnerxofficial" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-zinc-800 hover:bg-blue-600/20 border border-zinc-700 hover:border-blue-500/30 rounded-lg flex items-center justify-center text-zinc-400 hover:text-blue-400 transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
              <p className="text-xs text-zinc-600">2026 CryptoEarnerX</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
