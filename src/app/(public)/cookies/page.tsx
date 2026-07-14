import Link from "next/link";
import Image from "next/image";

export default function CookiesPage() {
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
        <h1 className="text-3xl font-bold text-white mb-8">Cookies Policy</h1>

        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">What Are Cookies</h2>
            <p className="text-zinc-400">
              Cookies are small text files stored on your device when you visit our website.
              They help us provide you with a better experience by remembering your preferences
              and understanding how you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">How We Use Cookies</h2>
            <p className="text-zinc-400 mb-3">We use cookies for the following purposes:</p>
            <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4">
              <li><strong className="text-zinc-300">Authentication:</strong> To keep you logged in and maintain your session.</li>
              <li><strong className="text-zinc-300">Security:</strong> To protect against fraud and unauthorized access.</li>
              <li><strong className="text-zinc-300">Preferences:</strong> To remember your settings and preferences.</li>
              <li><strong className="text-zinc-300">Analytics:</strong> To understand how visitors interact with our platform.</li>
              <li><strong className="text-zinc-300">Performance:</strong> To optimize loading times and platform speed.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Types of Cookies We Use</h2>
            <div className="space-y-3">
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <p className="text-white font-medium">Essential Cookies</p>
                <p className="text-zinc-400 text-xs mt-1">Required for the platform to function. Cannot be disabled.</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <p className="text-white font-medium">Functional Cookies</p>
                <p className="text-zinc-400 text-xs mt-1">Remember your preferences and settings.</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <p className="text-white font-medium">Analytics Cookies</p>
                <p className="text-zinc-400 text-xs mt-1">Help us understand how users interact with the platform.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Managing Cookies</h2>
            <p className="text-zinc-400">
              You can control and manage cookies through your browser settings. Disabling certain
              cookies may affect the functionality of the platform. Most browsers allow you to
              refuse or delete cookies at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Third-Party Cookies</h2>
            <p className="text-zinc-400">
              Some cookies may be placed by third-party services integrated into our platform,
              such as analytics providers. We do not control these third-party cookies and
              encourage you to review their respective privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Updates to This Policy</h2>
            <p className="text-zinc-400">
              We may update this Cookies Policy from time to time. Any changes will be posted
              on this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Contact</h2>
            <p className="text-zinc-400">
              For questions about our use of cookies, contact us at{" "}
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
