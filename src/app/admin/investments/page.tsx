"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";

export default function AdminInvestmentsPage() {
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    const { data } = await supabase.from("investments").select("*, users!inner(email, name)").order("created_at", { ascending: false });
    setInvestments(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading investments...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">All Investments</h1>
        <p className="text-zinc-400 text-sm mt-1">{investments.length} total investments</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-3 text-zinc-400 font-medium">User</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Package</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Amount</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Source</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Daily ROI</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Earned</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Status</th>
                <th className="text-left p-3 text-zinc-400 font-medium">End Date</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => (
                <tr key={inv.id} className="border-b border-zinc-800/50">
                  <td className="p-3">
                    <p className="text-white">{inv.users?.name || "N/A"}</p>
                    <p className="text-xs text-zinc-500">{inv.users?.email}</p>
                  </td>
                  <td className="p-3 capitalize text-zinc-300">{inv.package_type}</td>
                  <td className="p-3 text-white font-medium">{formatPOL(inv.amount)} {inv.investment_source === "cex" ? "CEX" : "POL"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      inv.investment_source === "cex" ? "bg-purple-500/10 text-purple-400" : "bg-green-500/10 text-green-400"
                    }`}>{inv.investment_source === "cex" ? "CEX" : "POL"}</span>
                  </td>
                  <td className="p-3 text-green-400">{inv.daily_roi}%</td>
                  <td className="p-3 text-green-400">+{formatPOL(inv.total_earned)} POL</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      inv.status === "active" ? "bg-green-500/10 text-green-400" : "bg-zinc-700 text-zinc-400"
                    }`}>{inv.status}</span>
                  </td>
                  <td className="p-3 text-zinc-500 text-xs">{new Date(inv.end_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
