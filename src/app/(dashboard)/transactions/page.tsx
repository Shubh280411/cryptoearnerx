"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";

type Tab = "pol" | "cex" | "spark";

const TYPE_CONFIG: Record<string, { label: string; color: string; tab: Tab; icon: string }> = {
  deposit: { label: "Deposit", color: "text-blue-400", tab: "pol", icon: "download" },
  withdrawal: { label: "Withdrawal", color: "text-amber-400", tab: "pol", icon: "upload" },
  sweep: { label: "Sweep", color: "text-zinc-400", tab: "pol", icon: "refresh" },
  investment: { label: "Investment", color: "text-green-400", tab: "pol", icon: "package" },
  roi_payout: { label: "ROI Payout", color: "text-green-400", tab: "pol", icon: "trending" },
  referral_bonus: { label: "Referral Bonus", color: "text-blue-400", tab: "pol", icon: "users" },
  binary_bonus: { label: "Binary Bonus", color: "text-purple-400", tab: "pol", icon: "layers" },
  level_commission: { label: "Level Commission", color: "text-cyan-400", tab: "pol", icon: "barChart" },
  leadership_bonus: { label: "Leadership Bonus", color: "text-amber-400", tab: "pol", icon: "award" },
  staking_reward: { label: "Staking Reward", color: "text-green-400", tab: "pol", icon: "lock" },
  withdrawal_fee: { label: "Withdrawal Fee", color: "text-red-400", tab: "pol", icon: "alertTriangle" },
  registration_bonus: { label: "Registration Bonus", color: "text-purple-400", tab: "cex", icon: "gift" },
  invest_locked_cex: { label: "CEX Locked", color: "text-amber-400", tab: "cex", icon: "lock" },
  cex_unlock: { label: "CEX Unlock", color: "text-green-400", tab: "cex", icon: "unlock" },
  spark_airdrop: { label: "SPARK Airdrop", color: "text-purple-400", tab: "spark", icon: "zap" },
  spark_withdrawal: { label: "SPARK Withdrawal", color: "text-amber-400", tab: "spark", icon: "upload" },
};

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pol");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    setTransactions(data || []);
    setLoading(false);
  };

  const filtered = transactions.filter((tx) => {
    const config = TYPE_CONFIG[tx.type];
    return config?.tab === activeTab;
  });

  const tabs: { key: Tab; label: string; color: string }[] = [
    { key: "pol", label: "POL Transactions", color: "text-blue-400" },
    { key: "cex", label: "CEX Transactions", color: "text-purple-400" },
    { key: "spark", label: "SPARK Transactions", color: "text-amber-400" },
  ];

  const tabCounts = {
    pol: transactions.filter((tx) => TYPE_CONFIG[tx.type]?.tab === "pol").length,
    cex: transactions.filter((tx) => TYPE_CONFIG[tx.type]?.tab === "cex").length,
    spark: transactions.filter((tx) => TYPE_CONFIG[tx.type]?.tab === "spark").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-66">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading transactions...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <p className="text-zinc-400 text-sm mt-1">View all your POL, CEX, and SPARK transactions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? "bg-zinc-800 border border-zinc-700 text-white"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-500"
            }`}>
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Icon name="clock" size={40} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">No {activeTab.toUpperCase()} transactions yet</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => {
            const config = TYPE_CONFIG[tx.type] || { label: tx.type, color: "text-zinc-400", icon: "info" };
            const isCredit = tx.amount > 0;

            return (
              <div key={tx.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isCredit ? "bg-green-500/10" : "bg-red-500/10"
                    }`}>
                      <Icon name={config.icon as any} size={18} className={isCredit ? "text-green-400" : "text-red-400"} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium">{config.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{tx.description}</p>
                      {tx.tx_hash && (
                        <a
                          href={`https://polygonscan.com/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-1 text-xs text-blue-400 hover:text-blue-300 font-mono"
                        >
                          {tx.tx_hash.slice(0, 8)}...{tx.tx_hash.slice(-6)}
                          <Icon name="externalLink" size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${isCredit ? "text-green-400" : "text-red-400"}`}>
                      {isCredit ? "+" : ""}{tx.type === "withdrawal_fee" ? "" : ""}{formatPOL(Math.abs(tx.amount))} {activeTab === "pol" ? "POL" : activeTab === "cex" ? "CEX" : "SPARK"}
                    </p>
                    {tx.balance_before !== undefined && tx.balance_before !== null && (
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {formatPOL(tx.balance_before)} → {formatPOL(tx.balance_after)}
                      </p>
                    )}
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                      tx.status === "completed" ? "bg-green-500/10 text-green-400" :
                      tx.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                      "bg-red-500/10 text-red-400"
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
