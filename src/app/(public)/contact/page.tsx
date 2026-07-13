import Link from "next/link";
import Image from "next/image";

export default function ContactPage() {
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
        <h1 className="text-4xl font-bold text-white mb-6">Contact Us</h1>
        <div className="space-y-8 text-zinc-400">
          <p>Have questions? We&apos;re here to help.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">Email Support</h3>
              <p className="text-zinc-400">support@cryptoearnerx.online</p>
              <p className="text-sm text-zinc-500 mt-1">Response within 24 hours</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">Telegram</h3>
              <p className="text-zinc-400">@CryptoEarnerX</p>
              <p className="text-sm text-zinc-500 mt-1">Join our community</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">Website</h3>
              <p className="text-zinc-400">cryptoearnerx.online</p>
              <p className="text-sm text-zinc-500 mt-1">24/7 Platform Access</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">In-App Support</h3>
              <p className="text-zinc-400">Use the Support tab in your dashboard</p>
              <p className="text-sm text-zinc-500 mt-1">Fastest response time</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
