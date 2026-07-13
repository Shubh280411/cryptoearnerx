"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const { data, error } = await supabase
      .from("users")
      .select(`
        id, name, email, rank, left_volume, right_volume, created_at,
        wallet!inner(bonus_balance)
      `)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) {
      const sorted = data
        .map((u: any) => ({
          ...u,
          cexBalance: u.wallet?.bonus_balance || 0,
        }))
        .sort((a: any, b: any) => b.cexBalance - a.cexBalance)
        .slice(0, 100);
      setLeaders(sorted);
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
              <div key={leader.id} className={`flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg ${getMedal(index)}`}>
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
                  <p className="text-xs text-zinc-500">Team: {leader.left_volume && leader.right_volume ? "L" + Math.floor(Math.log2((leader.left_volume + leader.right_volume) / 100 + 1)) : "N/A"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
