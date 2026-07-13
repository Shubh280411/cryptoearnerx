import Link from "next/link";
import Image from "next/image";
import { PACKAGES } from "@/lib/constants";

const CEX_RATE = 20;

export default function InvestPage() {
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
      <section className="py-16 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">Investment Packages</h1>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
            Choose a package, invest POL, earn up to 2% daily ROI + get free CEX coins. The more you invest, the higher your returns.
          </p>
        </div>
      </section>

      {/* Package Cards */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.type}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all flex flex-col"
              >
                <div className="text-center flex-1">
                  <div
                    className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: pkg.color + "20" }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={pkg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                  <p className="text-3xl font-bold mt-2" style={{ color: pkg.color }}>
                    {pkg.dailyROI}%
                  </p>
                  <p className="text-xs text-zinc-500">daily ROI</p>

                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex justify-between text-zinc-400">
                      <span>Min Investment</span>
                      <span className="text-white font-medium">{pkg.minInvest} POL</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Max Investment</span>
                      <span className="text-white font-medium">{pkg.maxInvest.toLocaleString()} POL</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Duration</span>
                      <span className="text-white font-medium">{pkg.durationDays} Days</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Total ROI</span>
                      <span className="text-green-400 font-bold">{pkg.totalROI}%</span>
                    </div>
                    <div className="flex justify-between text-zinc-400 border-t border-zinc-700 pt-3">
                      <span>CEX Bonus</span>
                      <span className="text-purple-400 font-bold">
                        +{(pkg.minInvest * CEX_RATE).toLocaleString()} CEX
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/register"
                  className="mt-6 block text-center py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: pkg.color + "20", color: pkg.color, border: `1px solid ${pkg.color}30` }}
                >
                  Start Investing
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Invest Section */}
      <section className="py-16 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Why Invest With CryptoEarnerX?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <h3 className="text-white font-bold mb-1">Daily ROI</h3>
              <p className="text-sm text-zinc-400">Earn 1% - 2% returns on your investment every single day, credited to your wallet.</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M18.09 10.37A6 6 0 1110.34 18" />
                  <path d="M7 6h2v4" />
                  <line x1="14" y1="13" x2="20" y2="13" />
                </svg>
              </div>
              <h3 className="text-white font-bold mb-1">Free CEX Coins</h3>
              <p className="text-sm text-zinc-400">Get up to 100 free CEX coins on signup. Invest and earn 20 CEX per POL invested.</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <h3 className="text-white font-bold mb-1">Build Your Team</h3>
              <p className="text-sm text-zinc-400">Earn 10% referral bonus + binary matching bonuses from your growing team.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="CryptoEarnerX" width={28} height={28} className="rounded-lg" />
            <span className="text-sm text-zinc-500">CryptoEarnerX &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
