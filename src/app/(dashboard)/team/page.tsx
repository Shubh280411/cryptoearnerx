"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";

export default function MlmPage() {
  const [user, setUser] = useState<any>(null);
  const [leftTeam, setLeftTeam] = useState<any[]>([]);
  const [rightTeam, setRightTeam] = useState<any[]>([]);
  const [stats, setStats] = useState({ leftCount: 0, rightCount: 0, leftVolume: 0, rightVolume: 0, totalEarnings: 0, matches: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMlm();
  }, []);

  const loadMlm = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: userData } = await supabase.from("users").select("*").eq("id", authUser.id).single();
    setUser(userData);

    const res = await fetch("/api/team-tree", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: authUser.id }),
    });
    const data = await res.json();

    if (data.success) {
      setLeftTeam(data.leftTeam);
      setRightTeam(data.rightTeam);
      setStats({
        leftCount: data.leftTeam.length,
        rightCount: data.rightTeam.length,
        leftVolume: data.leftVolume,
        rightVolume: data.rightVolume,
        totalEarnings: data.totalEarnings,
        matches: data.matches,
      });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading team tree...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Binary Team Tree</h1>
        <p className="text-zinc-400 text-sm mt-1">View your team structure and earnings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <p className="text-xs text-zinc-500">Left Leg</p>
          <p className="text-xl font-bold text-blue-400 mt-1">{stats.leftCount}</p>
          <p className="text-xs text-zinc-500">members</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Right Leg</p>
          <p className="text-xl font-bold text-purple-400 mt-1">{stats.rightCount}</p>
          <p className="text-xs text-zinc-500">members</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Total Volume</p>
          <p className="text-xl font-bold text-white mt-1">
            {formatPOL(stats.leftVolume)} / {formatPOL(stats.rightVolume)}
          </p>
          <p className="text-xs text-zinc-500">L / R POL</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Team Earnings</p>
          <p className="text-xl font-bold text-green-400 mt-1">{formatPOL(stats.totalEarnings)} POL</p>
        </Card>
      </div>

      {/* Tree Visualization */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6 text-center">Your Binary Tree</h3>

        {/* Root node (You) */}
        <div className="flex justify-center mb-8">
          <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg px-6 py-3 text-center">
            <p className="text-white font-medium">YOU</p>
            <p className="text-xs text-zinc-400">{user?.email}</p>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <div className="w-px h-8 bg-zinc-700" />
        </div>

        <div className="flex justify-center mb-4">
          <div className="h-px bg-zinc-700" style={{ width: "60%" }} />
        </div>

        {/* Left and Right legs */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left Leg */}
          <div>
            <h4 className="text-center text-blue-400 font-medium mb-4 text-sm">Left Leg ({stats.leftCount})</h4>
            <div className="space-y-2">
              {leftTeam.length === 0 ? (
                <div className="text-center py-6 bg-zinc-800/50 rounded-lg border border-dashed border-zinc-700">
                  <p className="text-zinc-500 text-sm">No members yet</p>
                </div>
              ) : (
                leftTeam.slice(0, 10).map((member) => (
                  <div key={member.id} className="bg-zinc-800/50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${member.is_active ? "bg-green-400" : "bg-zinc-500"}`} />
                      <div>
                        <p className="text-sm text-white">{member.name || member.email}</p>
                        <p className="text-xs text-zinc-500 capitalize">{member.rank}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {leftTeam.length > 10 && (
                <p className="text-xs text-zinc-500 text-center">+ {leftTeam.length - 10} more</p>
              )}
            </div>
          </div>

          {/* Right Leg */}
          <div>
            <h4 className="text-center text-purple-400 font-medium mb-4 text-sm">Right Leg ({stats.rightCount})</h4>
            <div className="space-y-2">
              {rightTeam.length === 0 ? (
                <div className="text-center py-6 bg-zinc-800/50 rounded-lg border border-dashed border-zinc-700">
                  <p className="text-zinc-500 text-sm">No members yet</p>
                </div>
              ) : (
                rightTeam.slice(0, 10).map((member) => (
                  <div key={member.id} className="bg-zinc-800/50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${member.is_active ? "bg-green-400" : "bg-zinc-500"}`} />
                      <div>
                        <p className="text-sm text-white">{member.name || member.email}</p>
                        <p className="text-xs text-zinc-500 capitalize">{member.rank}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {rightTeam.length > 10 && (
                <p className="text-xs text-zinc-500 text-center">+ {rightTeam.length - 10} more</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Income Rules */}
      <Card title="Binary Income Rules">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-blue-400 font-medium">Direct Referral</p>
            <p className="text-2xl font-bold text-white mt-1">10%</p>
            <p className="text-xs text-zinc-500 mt-1">Of referred member&apos;s investment</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-purple-400 font-medium">Binary Matching</p>
            <p className="text-2xl font-bold text-white mt-1">10%</p>
            <p className="text-xs text-zinc-500 mt-1">Per matched pair (weak leg)</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-amber-400 font-medium">Leadership</p>
            <p className="text-2xl font-bold text-white mt-1">2-5%</p>
            <p className="text-xs text-zinc-500 mt-1">Bonus based on rank</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
