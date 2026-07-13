import Link from "next/link";
import Image from "next/image";

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold text-white mb-6">Privacy Policy</h1>
        <div className="space-y-6 text-zinc-400 text-sm">
          <p>Last updated: July 2026</p>
          <h2 className="text-xl font-bold text-white pt-4">1. Information We Collect</h2>
          <p>We collect personal information including your name, email address, and wallet addresses when you create an account. We also collect usage data and transaction history.</p>
          <h2 className="text-xl font-bold text-white pt-4">2. How We Use Your Information</h2>
          <p>We use your information to provide and improve our services, process transactions, send notifications, and ensure platform security.</p>
          <h2 className="text-xl font-bold text-white pt-4">3. Data Security</h2>
          <p>We implement industry-standard security measures including encryption, secure socket layer (SSL) technology, and regular security audits to protect your personal information.</p>
          <h2 className="text-xl font-bold text-white pt-4">4. Data Sharing</h2>
          <p>We do not sell or rent your personal information to third parties. We may share data with service providers who assist in operating our platform.</p>
          <h2 className="text-xl font-bold text-white pt-4">5. Cookies</h2>
          <p>We use cookies and similar technologies to maintain session authentication and improve user experience.</p>
          <h2 className="text-xl font-bold text-white pt-4">6. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data. Contact our support team to exercise these rights.</p>
          <h2 className="text-xl font-bold text-white pt-4">7. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. Continued use of the platform constitutes acceptance of the updated policy.</p>
        </div>
      </main>
    </div>
  );
}
