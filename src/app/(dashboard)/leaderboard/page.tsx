"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const res = await fetch("/api/leaderboard");
    const data = await res.json();
    if (data.success) {
      setLeaders(data.leaders);
    }
    setLoading(false);
  };

  const getMedal = (index: number) => {
    if (index === 0) return "text-yellow-400";
    if (index === 1) return "text-zinc-300";
    if (index === 2) return "text-orange-400";
    return "text-zinc-500";
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
                  <p className="text-purple-400 font-bold mt-2">{leader.cexBalance.toLocaleString()} CEX</p>
                  <p className="text-xs text-zinc-500 mt-1">Team: {leader.totalTeam}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table */}
      <Card>
        {leaders.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="trophy" size={32} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">No data yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-3 text-zinc-500 font-medium">#</th>
                  <th className="text-left py-3 px-3 text-zinc-500 font-medium">USERNAME</th>
                  <th className="text-right py-3 px-3 text-zinc-500 font-medium">CEX</th>
                  <th className="text-right py-3 px-3 text-zinc-500 font-medium">Team</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((leader, index) => (
                  <tr key={leader.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className={`py-3 px-3 font-medium ${getMedal(index)}`}>
                      {index + 1}
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-white font-medium">{leader.name || leader.email?.split("@")[0]}</p>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-purple-400 font-bold">{leader.cexBalance.toLocaleString()}</span>
                      <span className="text-zinc-500 ml-1">CEX</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-white font-medium">{leader.totalTeam.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
