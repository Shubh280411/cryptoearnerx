import Link from "next/link";
import Image from "next/image";

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold text-white mb-6">Terms of Service</h1>
        <div className="space-y-6 text-zinc-400 text-sm">
          <p>Last updated: July 2026</p>
          <h2 className="text-xl font-bold text-white pt-4">1. Acceptance of Terms</h2>
          <p>By accessing and using CryptoEarnerX, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our platform.</p>
          <h2 className="text-xl font-bold text-white pt-4">2. Eligibility</h2>
          <p>You must be at least 18 years old to use CryptoEarnerX. By using our platform, you represent and warrant that you are at least 18 years of age.</p>
          <h2 className="text-xl font-bold text-white pt-4">3. Investment Risk</h2>
          <p>Cryptocurrency investments carry inherent risks. The value of your investments may go up or down. CryptoEarnerX does not guarantee returns. You should only invest what you can afford to lose.</p>
          <h2 className="text-xl font-bold text-white pt-4">4. Account Responsibility</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.</p>
          <h2 className="text-xl font-bold text-white pt-4">5. Team Structure</h2>
          <p>CryptoEarnerX operates a binary team compensation plan. Earnings are based on team building and individual investment. We are not a pyramid scheme. Our income is derived from platform fees and trading profits.</p>
          <h2 className="text-xl font-bold text-white pt-4">6. Withdrawals</h2>
          <p>Withdrawals are processed within 24 hours. A minimum withdrawal amount and platform fees apply. We reserve the right to delay withdrawals for security verification.</p>
          <h2 className="text-xl font-bold text-white pt-4">7. Prohibited Activities</h2>
          <p>Users may not engage in fraudulent activities, money laundering, or any illegal activities through our platform. Violation will result in account termination.</p>
          <h2 className="text-xl font-bold text-white pt-4">8. Limitation of Liability</h2>
          <p>CryptoEarnerX shall not be liable for any losses incurred through use of the platform. Users assume full responsibility for their investment decisions.</p>
        </div>
      </main>
    </div>
  );
}
