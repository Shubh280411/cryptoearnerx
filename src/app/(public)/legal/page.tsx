import Link from "next/link";
import Image from "next/image";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="CryptoEarnerX" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-bold text-white">CryptoEarnerX</span>
          </Link>
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">Back to Home</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-white mb-8">Legal Information</h1>

        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Terms of Service</h2>
            <p className="text-zinc-400">
              By accessing and using CryptoEarnerX, you agree to be bound by these Terms of Service.
              If you do not agree with any part of these terms, you may not access the platform.
              We reserve the right to modify these terms at any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Eligibility</h2>
            <p className="text-zinc-400">
              You must be at least 18 years of age to use CryptoEarnerX. By using our platform,
              you represent and warrant that you have the legal capacity to enter into a binding agreement
              in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Account Responsibilities</h2>
            <p className="text-zinc-400">
              You are responsible for maintaining the confidentiality of your account credentials.
              You agree to notify us immediately of any unauthorized use of your account.
              CryptoEarnerX shall not be liable for any loss arising from unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Intellectual Property</h2>
            <p className="text-zinc-400">
              All content, trademarks, logos, and intellectual property on CryptoEarnerX are owned by
              or licensed to us. You may not reproduce, distribute, or create derivative works without
              our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Limitation of Liability</h2>
            <p className="text-zinc-400">
              CryptoEarnerX and its affiliates shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages resulting from your use of the platform. Our total
              liability shall not exceed the amount you have deposited on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Governing Law</h2>
            <p className="text-zinc-400">
              These terms shall be governed by and construed in accordance with applicable laws.
              Any disputes shall be resolved through arbitration in accordance with the rules of
              the applicable arbitration authority.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Contact</h2>
            <p className="text-zinc-400">
              For legal inquiries, contact us at{" "}
              <a href="mailto:cryptoearnerx.support@gmail.com" className="text-blue-400 hover:text-blue-300">
                cryptoearnerx.support@gmail.com
              </a>
            </p>
          </section>
        </div>

        <p className="text-zinc-600 text-xs mt-12">Last updated: January 2026</p>
      </main>
    </div>
  );
}
