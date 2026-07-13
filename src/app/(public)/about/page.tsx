import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="CryptoEarnerX" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-bold text-white">CryptoEarnerX</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Login</Link>
            <Link href="/register" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl font-bold text-white mb-6">About CryptoEarnerX</h1>
        <div className="space-y-6 text-zinc-400">
          <p>CryptoEarnerX is a next-generation cryptocurrency earning platform built on the Polygon blockchain. We combine the power of DeFi with a proven binary team compensation plan to create unprecedented earning opportunities.</p>
          <h2 className="text-2xl font-bold text-white pt-4">Our Mission</h2>
          <p>To democratize crypto earnings by providing accessible investment opportunities paired with a fair and transparent team system that rewards both individual effort and team building.</p>
          <h2 className="text-2xl font-bold text-white pt-4">How It Works</h2>
          <p>Users invest POL (Polygon) into one of our five investment tiers, earning daily ROI returns. Simultaneously, users build their team through our binary team structure, earning referral bonuses and matching bonuses from their team&apos;s activity.</p>
          <h2 className="text-2xl font-bold text-white pt-4">Security</h2>
          <p>Platform security is our top priority. We use HD wallet technology for unique deposit addresses, encrypted key storage, and multi-layer authentication to protect user funds and data.</p>
        </div>
      </main>
    </div>
  );
}
