import Link from "next/link";
import Image from "next/image";

export default function RiskDisclosurePage() {
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
        <h1 className="text-3xl font-bold text-white mb-8">Risk Disclosure</h1>

        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8">
          <p className="text-red-400 font-bold text-lg mb-2">Important Risk Warning</p>
          <p className="text-red-400/80 text-sm">
            Investing in cryptocurrencies and digital assets involves significant risk. You could
            lose some or all of your investment. Past performance does not guarantee future results.
          </p>
        </div>

        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. General Risk</h2>
            <p className="text-zinc-400">
              Cryptocurrency investments are highly volatile and speculative. The value of digital
              assets can fluctuate dramatically in short periods. You should only invest what you
              can afford to lose entirely.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Market Risk</h2>
            <p className="text-zinc-400">
              Cryptocurrency markets are largely unregulated and subject to extreme price volatility.
              Market manipulation, regulatory changes, and macroeconomic factors can significantly
              impact asset values at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Technology Risk</h2>
            <p className="text-zinc-400">
              Blockchain technology, while innovative, is still evolving. Smart contract
              vulnerabilities, network congestion, and software bugs may result in loss of funds
              or platform downtime.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Regulatory Risk</h2>
            <p className="text-zinc-400">
              The regulatory environment for cryptocurrencies varies by jurisdiction and is subject
              to change. New regulations or enforcement actions could adversely affect the
              functionality, value, or legality of our services in your region.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Liquidity Risk</h2>
            <p className="text-zinc-400">
              There may be limited liquidity for certain digital assets, which could make it
              difficult to buy or sell at desired prices. Withdrawals may be delayed during periods
              of high demand or network congestion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Platform Risk</h2>
            <p className="text-zinc-400">
              While we implement robust security measures, no platform is immune to cyberattacks,
              hacking, or technical failures. Users are responsible for securing their own accounts
              with strong passwords and two-factor authentication.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. ROI Disclaimer</h2>
            <p className="text-zinc-400">
              Any projected returns, daily ROI percentages, or earning figures mentioned on the
              platform are not guaranteed. Returns may vary based on market conditions, platform
              performance, and other factors beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. No Financial Advice</h2>
            <p className="text-zinc-400">
              Nothing on CryptoEarnerX constitutes financial, investment, or legal advice. You
              should consult with a qualified financial advisor before making any investment
              decisions. Use our platform at your own discretion and risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Contact</h2>
            <p className="text-zinc-400">
              For questions about these risk disclosures, contact us at{" "}
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
