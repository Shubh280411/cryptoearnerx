import Link from "next/link";
import Image from "next/image";

const faqs = [
  {
    q: "What is CryptoEarnerX?",
    a: "CryptoEarnerX is a crypto earning platform where you can invest in packages and earn up to 2% daily ROI. You can also grow your team through our binary network system and earn referral and level commissions.",
  },
  {
    q: "How do I get started?",
    a: "Create a free account, deposit POL to your unique wallet address, choose an investment package, and start earning daily ROI. No minimum deposit required to start.",
  },
  {
    q: "What is the minimum deposit?",
    a: "Minimum deposit is 0.1 POL. Each deposit generates a unique wallet address for enhanced privacy and security.",
  },
  {
    q: "What is the minimum withdrawal?",
    a: "Minimum withdrawal is 25 POL. A 5% fee is applied on all withdrawals. Withdrawals are processed within 24 hours.",
  },
  {
    q: "What are CEX Coins?",
    a: "CEX Coins are the platform's virtual token. You earn CEX through registration bonuses (up to 100 CEX on signup), referral level bonuses (L1-L5), and team growth rewards. CEX can be converted to POL when the feature unlocks at 10,000 members.",
  },
  {
    q: "How does the referral system work?",
    a: "Share your referral link with others. When someone registers using your code, they become your direct referral (L1). You earn 10% commission on their investments. Your team grows in a binary tree structure with Left and Right legs.",
  },
  {
    q: "What are Level Commissions?",
    a: "When anyone in your team (up to 5 levels deep) invests, you earn a commission: L2 (5%), L3 (3%), L4 (2%), L5 (1%). Root admin members earn additional commissions at L6 (0.5%) and L7 (0.5%).",
  },
  {
    q: "How does the binary matching bonus work?",
    a: "When you have activity on both your Left and Right legs, you earn a 10% binary matching bonus on the matched volume. This incentivizes building a balanced team.",
  },
  {
    q: "What are the investment packages?",
    a: "We offer 5 packages: Starter (25-499 POL, 1% daily), Basic (500-2499 POL, 1.2% daily), Premium (2500-9999 POL, 1.5% daily), VIP (10000-49999 POL, 1.8% daily), and Elite (50000+ POL, 2% daily).",
  },
  {
    q: "When is ROI credited?",
    a: "Daily ROI is automatically credited to your wallet at 12:00 AM UTC every day. The process is fully automated.",
  },
  {
    q: "Is my investment safe?",
    a: "We implement industry-standard security measures including encrypted private keys, rate-limited APIs, OTP verification for withdrawals, and automated fund sweeping to cold storage. However, all investments carry risk — only invest what you can afford to lose.",
  },
  {
    q: "Can I have multiple accounts?",
    a: "No. Each user is allowed one account only. Multiple accounts will be banned without notice.",
  },
  {
    q: "How do I contact support?",
    a: "You can create a support ticket from the Support section in your dashboard. Our team typically responds within 24 hours. You can also join our Telegram community for quick help.",
  },
];

export default function FAQPage() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Frequently Asked Questions</h1>
        <p className="text-zinc-400 mb-10">Everything you need to know about CryptoEarnerX</p>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden"
            >
              <summary className="flex items-center justify-between px-6 py-4 cursor-pointer select-none hover:bg-zinc-800/50 transition-colors">
                <span className="text-white font-medium text-sm pr-4">{faq.q}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-zinc-500 group-open:rotate-180 transition-transform flex-shrink-0"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <div className="px-6 pb-4 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-3">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-zinc-500 text-sm mb-3">Still have questions?</p>
          <a
            href="https://t.me/cryptoearnerxofficial"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Join Our Telegram
          </a>
        </div>
      </main>
    </div>
  );
}
