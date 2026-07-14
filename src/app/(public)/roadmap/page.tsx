import Link from "next/link";
import Image from "next/image";

const phases = [
  {
    phase: "Phase 1",
    title: "Foundation",
    status: "completed",
    color: "#22c55e",
    items: [
      "Platform development & smart contracts",
      "Binary MLM tree system",
      "5 investment packages (Starter to Elite)",
      "CEX virtual token system",
      "User dashboard & wallet integration",
      "HD wallet auto-sweep system",
      "Admin panel & controls",
      "OTP email verification",
      "Ban & appeal system",
    ],
  },
  {
    phase: "Phase 2",
    title: "Growth",
    status: "active",
    color: "#3b82f6",
    items: [
      "Referral Rewards Hub",
      "5-level CEX registration bonus",
      "Root admin extended commissions (L6-L7)",
      "Leaderboard & ranking system",
      "Support ticket system",
      "Daily ROI auto-payout (12 AM UTC)",
      "Deposit auto-detection & sweep",
      "On-chain deposit verification",
    ],
  },
  {
    phase: "Phase 3",
    title: "Expansion",
    status: "upcoming",
    color: "#f59e0b",
    items: [
      "CEX to POL conversion (unlocks at 10,000 members)",
      "Mobile app (iOS & Android)",
      "Staking with POL rewards",
      "Advanced analytics dashboard",
      "Bulk referral tools",
      "API for third-party integrations",
      "Multi-language support",
    ],
  },
  {
    phase: "Phase 4",
    title: "Ecosystem",
    status: "upcoming",
    color: "#a855f7",
    items: [
      "CEX token listing on DEX",
      "Governance & voting system",
      "NFT rewards for top earners",
      "Cross-chain bridge (Polygon → ETH → BSC)",
      "Institutional partnerships",
      "Audit by certified security firm",
      "CEX token burn events",
    ],
  },
];

const tokenomics = [
  { name: "Team Rewards", percent: 35, color: "#a78bfa", desc: "Referral bonuses, level commissions, binary matching" },
  { name: "Staking Pool", percent: 25, color: "#3b82f6", desc: "POL staking rewards for CEX holders" },
  { name: "Liquidity", percent: 20, color: "#22c55e", desc: "DEX listing liquidity & trading pairs" },
  { name: "Development", percent: 10, color: "#f59e0b", desc: "Platform upgrades, mobile app, new features" },
  { name: "Marketing", percent: 5, color: "#f472b6", desc: "Partnerships, influencer campaigns, ads" },
  { name: "Team & Operations", percent: 5, color: "#ef4444", desc: "Core team allocation & operational costs" },
];

export default function RoadmapPage() {
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
        {/* Roadmap */}
        <h1 className="text-3xl font-bold text-white mb-2">Roadmap</h1>
        <p className="text-zinc-400 mb-12">Our journey to build the ultimate crypto earning ecosystem</p>

        <div className="space-y-6">
          {phases.map((phase, i) => (
            <div key={i} className="relative">
              {i < phases.length - 1 && (
                <div className="absolute left-5 top-14 w-0.5 h-[calc(100%+24px)] bg-zinc-800" />
              )}
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                  style={{ backgroundColor: `${phase.color}20`, border: `2px solid ${phase.color}40` }}
                >
                  <span style={{ color: phase.color, fontSize: "11px", fontWeight: 800 }}>
                    {i + 1}
                  </span>
                </div>
                <div className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold text-white">{phase.title}</h3>
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full uppercase"
                      style={{
                        backgroundColor: `${phase.color}15`,
                        color: phase.color,
                        border: `1px solid ${phase.color}30`,
                      }}
                    >
                      {phase.status}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {phase.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-zinc-400">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={phase.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                          {phase.status === "completed" ? (
                            <polyline points="20 6 9 17 4 12" />
                          ) : phase.status === "active" ? (
                            <circle cx="12" cy="12" r="4" fill={phase.color} stroke="none" />
                          ) : (
                            <circle cx="12" cy="12" r="3" />
                          )}
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CEX Tokenomics */}
        <div className="mt-20">
          <h1 className="text-3xl font-bold text-white mb-2">CEX Tokenomics</h1>
          <p className="text-zinc-400 mb-8">How CEX Coins are distributed across the ecosystem</p>

          {/* Token Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">CEX</p>
              <p className="text-xs text-zinc-500 mt-1">Token Name</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">∞</p>
              <p className="text-xs text-zinc-500 mt-1">Max Supply</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">1:20</p>
              <p className="text-xs text-zinc-500 mt-1">POL Rate</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">Locked</p>
              <p className="text-xs text-zinc-500 mt-1">Until 10K Users</p>
            </div>
          </div>

          {/* Distribution */}
          <h2 className="text-xl font-bold text-white mb-6">Token Distribution</h2>
          <div className="space-y-4 mb-10">
            {tokenomics.map((item, i) => (
              <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-white font-medium text-sm">{item.name}</span>
                  </div>
                  <span className="text-lg font-bold" style={{ color: item.color }}>
                    {item.percent}%
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                  />
                </div>
                <p className="text-xs text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CEX Earning Methods */}
          <h2 className="text-xl font-bold text-white mb-6">How to Earn CEX</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/60 border border-purple-500/20 rounded-xl p-5">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-sm mb-1">Signup Bonus</h3>
              <p className="text-zinc-400 text-xs">Get 100 CEX free on registration. Additional bonuses from your sponsor&apos;s team up to L5.</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">L1: 50</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">L2: 40</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">L3: 30</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">L4: 20</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400">L5: 10</span>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-blue-500/20 rounded-xl p-5">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-sm mb-1">CEX → POL Conversion</h3>
              <p className="text-zinc-400 text-xs">Convert your CEX Coins to POL at the 1:20 rate. Feature unlocks when platform reaches 10,000 active members.</p>
              <div className="mt-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">1 CEX = 0.05 POL</span>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-green-500/20 rounded-xl p-5">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-sm mb-1">Team Growth Rewards</h3>
              <p className="text-zinc-400 text-xs">Earn additional CEX as your team grows. Root admin members earn extra bonuses at L6-L7 depth.</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">L6: 5 CEX</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">L7: 3 CEX</span>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-amber-500/20 rounded-xl p-5">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-sm mb-1">All CEX is Locked</h3>
              <p className="text-zinc-400 text-xs">CEX earned through bonuses are locked until the conversion feature is enabled. This protects token value during growth phase.</p>
              <div className="mt-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">10,000 Members</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
