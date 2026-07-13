"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";

async function getTeamCountsForUser(userId: string) {
  let currentIds = [userId];
  const counts: number[] = [];

  for (let level = 1; level <= 5; level++) {
    const { data } = await supabase
      .from("users")
      .select("id")
      .in("sponsor_id", currentIds);

    const members = data || [];
    counts.push(members.length);
    currentIds = members.map((u) => u.id);
    if (currentIds.length === 0) {
      while (counts.length < 5) counts.push(0);
      break;
    }
  }

  return counts;
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const { data } = await supabase
      .from("users")
      .select("id, name, email, rank, left_volume, right_volume, created_at")
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) {
      const walletPromises = data.map((u) =>
        supabase.from("wallet").select("bonus_balance").eq("user_id", u.id).single()
      );
      const walletResults = await Promise.all(walletPromises);

      const enriched = data.map((u, i) => ({
        ...u,
        cexBalance: walletResults[i].data?.bonus_balance || 0,
      }));

      const sorted = enriched
        .sort((a, b) => b.cexBalance - a.cexBalance)
        .slice(0, 100);

      const teamPromises = sorted.map((u) => getTeamCountsForUser(u.id));
      const teamResults = await Promise.all(teamPromises);

      const final = sorted.map((u, i) => ({
        ...u,
        teamCounts: teamResults[i],
        totalTeam: teamResults[i].reduce((s, c) => s + c, 0),
      }));

      setLeaders(final);
    }
    setLoading(false);
  };

  const getMedal = (index: number) => {
    if (index === 0) return "bg-yellow-500/10 text-yellow-400";
    if (index === 1) return "bg-zinc-400/10 text-zinc-300";
    if (index === 2) return "bg-orange-600/10 text-orange-400";
    return "";
  };

  const getRankName = (rank: string) => {
    const rankColors: Record<string, string> = {
      member: "text-zinc-400",
      bronze: "text-orange-400",
      silver: "text-zinc-300",
      gold: "text-yellow-400",
      platinum: "text-purple-400",
      diamond: "text-blue-400",
      crown: "text-red-400",
    };
    return rankColors[rank] || "text-zinc-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Top 100 CEX coin holders</p>
      </div>

      {/* Top 3 Podium */}
      {leaders.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[1, 0, 2].map((idx) => {
            const leader = leaders[idx];
            if (!leader) return null;
            return (
              <Card key={leader.id}>
                <div className="text-center py-4">
                  <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl font-bold ${getMedal(idx)}`}>
                    {idx === 0 ? "1st" : idx === 1 ? "2nd" : "3rd"}
                  </div>
                  <p className="text-white font-medium mt-3">{leader.name || leader.email?.split("@")[0]}</p>
                  <p className={`text-sm capitalize ${getRankName(leader.rank)}`}>{leader.rank}</p>
                  <p className="text-purple-400 font-bold mt-2">{leader.cexBalance.toLocaleString()} CEX</p>
                  <p className="text-xs text-zinc-500 mt-1">Team: {leader.totalTeam}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard */}
      <Card title="Full Leaderboard">
        {leaders.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="trophy" size={32} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">No data yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaders.map((leader, index) => (
              <div key={leader.id} className={`p-3 bg-zinc-800/50 rounded-lg ${getMedal(index)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm text-white">{leader.name || leader.email?.split("@")[0]}</p>
                      <p className={`text-xs capitalize ${getRankName(leader.rank)}`}>{leader.rank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-purple-400">{leader.cexBalance.toLocaleString()} CEX</p>
                  </div>
                </div>
                {leader.teamCounts && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-zinc-700/50">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex-1 text-center">
                        <p className="text-[10px] text-zinc-500">L{i + 1}</p>
                        <p className="text-xs font-medium text-blue-400">{leader.teamCounts[i]}</p>
                      </div>
                    ))}
                    <div className="flex-1 text-center border-l border-zinc-700/50">
                      <p className="text-[10px] text-zinc-500">Total</p>
                      <p className="text-xs font-bold text-white">{leader.totalTeam}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
