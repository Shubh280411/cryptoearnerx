"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { supabase } from "@/lib/supabase/client";

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({ cex: 0, referralEarned: 0, teamSize: 0 });

  useEffect(() => {
    loadLeaderboard();
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [walletRes, txRes, teamRes] = await Promise.all([
      supabase.from("wallet").select("bonus_balance, locked_bonus_balance").eq("user_id", user.id).single(),
      supabase.from("transactions").select("amount, type").eq("user_id", user.id).eq("status", "completed"),
      supabase.from("users").select("id").eq("sponsor_id", user.id),
    ]);

    const cex = (walletRes.data?.bonus_balance || 0) + (walletRes.data?.locked_bonus_balance || 0);
    const referralEarned = (txRes.data || [])
      .filter((t: any) => t.type === "referral_bonus" && t.amount > 0)
      .reduce((s: number, t: any) => s + t.amount, 0);

    // Recursive team count
    let teamSize = 0;
    async function countTeam(sponsorId: string) {
      const { data: children } = await supabase.from("users").select("id").eq("sponsor_id", sponsorId);
      if (!children || children.length === 0) return;
      teamSize += children.length;
      for (const child of children) {
        await countTeam(child.id);
      }
    }
    await countTeam(user.id);

    setUserStats({ cex, referralEarned, teamSize });
  };

  const loadLeaderboard = async () => {
    const res = await fetch("/api/leaderboard");
    const data = await res.json();
    if (data.success) {
      setLeaders(data.leaders);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading leaderboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Top performers ranked by CEX balance</p>
      </div>

      {/* User Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-zinc-500 text-xs mb-1">Airdrop</p>
          <p className="text-xl font-bold text-amber-400">{userStats.cex.toLocaleString()}</p>
          <p className="text-zinc-600 text-[10px] mt-1">CEX balance</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-zinc-500 text-xs mb-1">Referral earned</p>
          <p className="text-xl font-bold text-green-400">{userStats.referralEarned.toLocaleString()}</p>
          <p className="text-zinc-600 text-[10px] mt-1">Total bonus</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-zinc-500 text-xs mb-1">Team</p>
          <p className="text-xl font-bold text-blue-400">{userStats.teamSize.toLocaleString()}</p>
          <p className="text-zinc-600 text-[10px] mt-1">Total members</p>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-zinc-800 text-xs font-medium text-zinc-500 uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Username</div>
          <div className="col-span-3 text-right">CEX</div>
          <div className="col-span-3 text-right">Team</div>
        </div>

        {leaders.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="trophy" size={40} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">No data yet</p>
          </div>
        ) : (
          <div>
            {leaders.map((leader, index) => {
                  const isTop3 = index < 3;

              return (
                <div
                  key={leader.id}
                  className={`grid grid-cols-12 gap-2 px-4 py-3.5 items-center transition-colors hover:bg-zinc-800/50 ${
                    index < leaders.length - 1 ? "border-b border-zinc-800/50" : ""
                  } ${isTop3 ? "bg-zinc-800/30" : ""}`}
                >
                  {/* Rank */}
                  <div className="col-span-1">
                    {index === 0 ? (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="11" stroke="#facc15" strokeWidth="2" fill="#facc15" fillOpacity="0.15" />
                        <text x="12" y="16" textAnchor="middle" fill="#facc15" fontSize="12" fontWeight="bold">1</text>
                      </svg>
                    ) : index === 1 ? (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="11" stroke="#d4d4d8" strokeWidth="2" fill="#d4d4d8" fillOpacity="0.15" />
                        <text x="12" y="16" textAnchor="middle" fill="#d4d4d8" fontSize="12" fontWeight="bold">2</text>
                      </svg>
                    ) : index === 2 ? (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="11" stroke="#fb923c" strokeWidth="2" fill="#fb923c" fillOpacity="0.15" />
                        <text x="12" y="16" textAnchor="middle" fill="#fb923c" fontSize="12" fontWeight="bold">3</text>
                      </svg>
                    ) : (
                      <span className="text-sm font-medium text-zinc-500">{index + 1}</span>
                    )}
                  </div>

                  {/* Username */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      index === 0 ? "bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500/30" :
                      index === 1 ? "bg-zinc-300/10 text-zinc-300 ring-2 ring-zinc-300/20" :
                      index === 2 ? "bg-orange-500/20 text-orange-400 ring-2 ring-orange-500/30" :
                      "bg-zinc-800 text-zinc-400"
                    }`}>
                      {(leader.name || leader.email?.split("@")[0] || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isTop3 ? "text-white" : "text-zinc-300"}`}>
                        {leader.name || leader.email?.split("@")[0]}
                      </p>
                      {isTop3 && (
                        <p className="text-[10px] text-zinc-500 truncate">{leader.email}</p>
                      )}
                    </div>
                  </div>

                  {/* CEX */}
                  <div className="col-span-3 text-right">
                    <span className={`font-bold ${isTop3 ? "text-amber-400" : "text-zinc-300"}`}>
                      {leader.cexBalance.toLocaleString()}
                    </span>
                    <span className="text-zinc-600 text-xs ml-1">$X365</span>
                  </div>

                  {/* Team */}
                  <div className="col-span-3 text-right">
                    <span className={`font-medium ${isTop3 ? "text-blue-400" : "text-zinc-400"}`}>
                      {leader.totalTeam.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
