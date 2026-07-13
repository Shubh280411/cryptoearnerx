import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="CryptoEarnerX" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-bold text-white">CryptoEarnerX</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/register" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Earn Crypto.
            <br />
            <span className="text-blue-500">Build Teams.</span>
            <br />
            Grow Wealth.
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
            Invest in crypto packages and earn up to 2% daily ROI. Grow your team through our binary network and unlock unlimited earning potential.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-purple-600/20 border border-purple-600/30 rounded-full px-5 py-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="6" />
              <path d="M18.09 10.37A6 6 0 1110.34 18" />
              <path d="M7 6h1v4" />
              <path d="M16.71 13.88l.7.71-2.82 2.82" />
            </svg>
            <span className="text-purple-300 font-medium text-sm">Get 100 CEX Coins FREE on signup — no deposit needed!</span>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-lg">
              Start Earning Now
            </Link>
            <Link href="/register" className="px-8 py-3 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-lg font-medium transition-colors">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-white">1000+</p>
              <p className="text-zinc-400 mt-1">Active Users</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-400">5M+</p>
              <p className="text-zinc-400 mt-1">Total Invested (POL)</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-400">10M+</p>
              <p className="text-zinc-400 mt-1">Total Paid Out (POL)</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">2%</p>
              <p className="text-zinc-400 mt-1">Max Daily ROI</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Account", desc: "Sign up with your email and get a unique referral link to share with others." },
              { step: "02", title: "Deposit POL", desc: "Send POL to your unique wallet address. Funds are credited instantly." },
              { step: "03", title: "Start Earning", desc: "Choose a package and earn up to 2% daily ROI plus team bonuses." },
            ].map((item) => (
              <div key={item.step} className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                <div className="text-4xl font-bold text-blue-600/30 mb-4">{item.step}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Plans */}
      <section className="py-20 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Investment Packages</h2>
          <p className="text-zinc-400 text-center mb-12">Choose the package that fits your goals</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { name: "Starter", min: "25", roi: "1.0%", days: "30", color: "#22c55e" },
              { name: "Basic", min: "500", roi: "1.2%", days: "60", color: "#3b82f6" },
              { name: "Premium", min: "2,500", roi: "1.5%", days: "90", color: "#a855f7" },
              { name: "VIP", min: "10,000", roi: "1.8%", days: "120", color: "#f59e0b" },
              { name: "Elite", min: "50,000", roi: "2.0%", days: "180", color: "#ef4444" },
            ].map((plan) => (
              <div key={plan.name} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-3xl font-bold mt-2" style={{ color: plan.color }}>{plan.roi}</p>
                <p className="text-xs text-zinc-500">daily ROI</p>
                <div className="mt-4 space-y-2 text-sm text-zinc-400">
                  <p>Min: {plan.min} POL</p>
                  <p>Duration: {plan.days} days</p>
                </div>
                <Link href="/register" className="block mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors" style={{ backgroundColor: plan.color + "20", color: plan.color }}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Binary Network System</h2>
              <p className="text-zinc-400 mb-6">
                Build your team with our powerful binary compensation plan. Earn from every level of your organization.
              </p>
              <div className="space-y-4">
                {[
                  { label: "Direct Referral", value: "10%", desc: "Earn 10% on every referral investment" },
                  { label: "Binary Matching", value: "10%", desc: "Earn 10% per matched pair" },
                  { label: "Leadership Bonus", value: "2-5%", desc: "Rank-based bonus on team volume" },
                  { label: "Unlimited Depth", value: "∞", desc: "No limit on how deep you can grow" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-16 text-right">
                      <span className="text-xl font-bold text-blue-400">{item.value}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-sm text-zinc-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <p className="text-white font-medium">Your Team</p>
              </div>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-400 font-bold">L</span>
                  </div>
                  <p className="text-xs text-zinc-500">Left Leg</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-400 font-bold">R</span>
                  </div>
                  <p className="text-xs text-zinc-500">Right Leg</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-600/20 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Earning?</h2>
            <p className="text-zinc-400 mb-8">Join thousands of users earning crypto daily</p>
            <Link href="/register" className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-lg">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="CryptoEarnerX" width={28} height={28} className="rounded-lg" />
              <span className="text-lg font-bold text-white">CryptoEarnerX</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-400">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-zinc-500">2026 CryptoEarnerX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
