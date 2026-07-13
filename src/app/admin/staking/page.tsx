"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";

export default function AdminStakingPage() {
  const [stakes, setStakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStaked, setTotalStaked] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0);
  const [totalCexIssued, setTotalCexIssued] = useState(0);

  useEffect(() => {
    loadStakes();
  }, []);

  const loadStakes = async () => {
    const { data } = await supabase.from("staking").select("*, users!inner(email, name)").order("created_at", { ascending: false });
    const allStakes = data || [];
    setStakes(allStakes);
    setTotalStaked(allStakes.reduce((s: number, st: any) => s + (st.amount || 0), 0));
    setTotalRewards(allStakes.reduce((s: number, st: any) => s + (st.rewards_earned || 0), 0));
    setTotalCexIssued(allStakes.reduce((s: number, st: any) => s + (st.cex_amount || 0), 0));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading staking...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">CEX Staking Management</h1>
        <p className="text-zinc-400 text-sm mt-1">{stakes.length} total stakes</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-zinc-500">Total POL Staked</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{formatPOL(totalStaked)} POL</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Total POL Rewards Paid</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatPOL(totalRewards)} POL</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Total CEX Issued</p>
          <p className="text-2xl font-bold text-purple-300 mt-1">{totalCexIssued.toLocaleString()} CEX</p>
        </Card>
      </div>

      <Card>
        {stakes.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="lock" size={32} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">No stakes yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-3 text-zinc-400 font-medium">User</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">POL Staked</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">CEX Received</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Daily ROI</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">POL Rewards</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Duration</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Status</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">End Date</th>
                </tr>
              </thead>
              <tbody>
                {stakes.map((stake) => (
                  <tr key={stake.id} className="border-b border-zinc-800/50">
                    <td className="p-3">
                      <p className="text-white">{stake.users?.name || "N/A"}</p>
                      <p className="text-xs text-zinc-500">{stake.users?.email}</p>
                    </td>
                    <td className="p-3 text-white font-medium">{formatPOL(stake.amount)} POL</td>
                    <td className="p-3 text-purple-400">{(stake.cex_amount || 0).toLocaleString()} CEX</td>
                    <td className="p-3 text-green-400">{stake.daily_roi}%/day</td>
                    <td className="p-3 text-green-400">+{formatPOL(stake.rewards_earned)} POL</td>
                    <td className="p-3 text-zinc-300">{stake.duration_days} days</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        stake.status === "active" ? "bg-green-500/10 text-green-400" : "bg-zinc-700 text-zinc-400"
                      }`}>{stake.status}</span>
                    </td>
                    <td className="p-3 text-zinc-500 text-xs">{new Date(stake.end_date).toLocaleDateString()}</td>
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
