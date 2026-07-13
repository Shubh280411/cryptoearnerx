"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";

export default function AdminMlmPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMlmData();
  }, []);

  const loadMlmData = async () => {
    const { data } = await supabase.from("users").select("id, name, email, rank, left_volume, right_volume, sponsor_id, is_active, left_child_id, right_child_id").order("created_at", { ascending: false });
    setUsers(data || []);
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

  const rankStats = users.reduce((acc: Record<string, number>, u: any) => {
    acc[u.rank] = (acc[u.rank] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Team Tree Overview</h1>
        <p className="text-zinc-400 text-sm mt-1">{users.length} total users in tree</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(rankStats).map(([rank, count]) => (
          <Card key={rank}>
            <p className="text-xs text-zinc-500 capitalize">{rank}</p>
            <p className="text-xl font-bold text-white mt-1">{count as number}</p>
          </Card>
        ))}
      </div>

      <Card title="All Users in Team Tree">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-3 text-zinc-400 font-medium">User</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Rank</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Left Volume</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Right Volume</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Left Child</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Right Child</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-zinc-800/50">
                  <td className="p-3">
                    <p className="text-white">{user.name || "N/A"}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </td>
                  <td className="p-3 capitalize text-zinc-300">{user.rank}</td>
                  <td className="p-3 text-blue-400">{formatPOL(user.left_volume || 0)} POL</td>
                  <td className="p-3 text-purple-400">{formatPOL(user.right_volume || 0)} POL</td>
                  <td className="p-3 text-zinc-400 text-xs">{user.left_child_id ? "Filled" : "Empty"}</td>
                  <td className="p-3 text-zinc-400 text-xs">{user.right_child_id ? "Filled" : "Empty"}</td>
                  <td className="p-3">
                    <span className={`w-2 h-2 rounded-full inline-block ${user.is_active ? "bg-green-400" : "bg-red-400"}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
