"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";

export default function EarningsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, roi: 0, referral: 0, binary: 0, staking: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const txs = data || [];
    const earnings = txs.filter((t) => t.amount > 0);

    setStats({
      total: earnings.reduce((s, t) => s + t.amount, 0),
      roi: earnings.filter((t) => t.type === "roi_payout").reduce((s, t) => s + t.amount, 0),
      referral: earnings.filter((t) => t.type === "referral_bonus").reduce((s, t) => s + t.amount, 0),
      binary: earnings.filter((t) => t.type === "binary_bonus").reduce((s, t) => s + t.amount, 0),
      staking: earnings.filter((t) => t.type === "staking_reward").reduce((s, t) => s + t.amount, 0),
    });

    setTransactions(txs);
    setLoading(false);
  };

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading earnings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Earnings</h1>
        <p className="text-zinc-400 text-sm mt-1">Track all your income sources</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Earned", value: stats.total, color: "text-white" },
          { label: "ROI Income", value: stats.roi, color: "text-green-400" },
          { label: "Referral", value: stats.referral, color: "text-blue-400" },
          { label: "Binary", value: stats.binary, color: "text-purple-400" },
          { label: "Staking", value: stats.staking, color: "text-amber-400" },
        ].map((s) => (
          <Card key={s.label}>
            <p className="text-xs text-zinc-500">{s.label}</p>
            <p className={`text-lg font-bold mt-1 ${s.color}`}>{formatPOL(s.value)} POL</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "roi_payout", "referral_bonus", "binary_bonus", "staking_reward", "leadership_bonus"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {f === "all" ? "All" : f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <Card title="All Earnings">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="chart" size={32} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">No earnings yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.amount > 0 ? "bg-green-600/10" : "bg-red-600/10"
                  }`}>
                    <Icon name="dollarSign" size={14} className={tx.amount > 0 ? "text-green-400" : "text-red-400"} />
                  </div>
                  <div>
                    <p className="text-sm text-white capitalize">{tx.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-zinc-500">{tx.description || "-"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                    {tx.amount > 0 ? "+" : ""}{formatPOL(tx.amount)} POL
                  </p>
                  <p className="text-xs text-zinc-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
