"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    activeInvestments: 0,
    pendingWithdrawals: 0,
    pendingDeposits: 0,
    totalBalance: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    const [usersRes, investRes, wdRes, txRes, walletRes, depositsRes] = await Promise.all([
      supabase.from("users").select("id", { count: "exact" }),
      supabase.from("investments").select("id", { count: "exact" }).eq("status", "active"),
      supabase.from("withdrawals").select("id", { count: "exact" }).eq("status", "pending"),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("wallet").select("balance"),
      supabase.from("crypto_wallets").select("id", { count: "exact" }),
    ]);

    const allWallets = walletRes.data || [];
    const totalBalance = allWallets.reduce((s: number, w: any) => s + (w.balance || 0), 0);

    setStats({
      totalUsers: usersRes.count || 0,
      totalDeposits: depositsRes.count || 0,
      totalWithdrawals: wdRes.count || 0,
      activeInvestments: investRes.count || 0,
      pendingWithdrawals: wdRes.count || 0,
      pendingDeposits: 0,
      totalBalance,
    });

    setRecentActivity(txRes.data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Platform overview and statistics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center">
              <Icon name="users" size={24} className="text-blue-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm">Active Investments</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{stats.activeInvestments}</p>
            </div>
            <div className="w-12 h-12 bg-green-600/10 rounded-xl flex items-center justify-center">
              <Icon name="package" size={24} className="text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm">Pending Withdrawals</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{stats.pendingWithdrawals}</p>
            </div>
            <div className="w-12 h-12 bg-amber-600/10 rounded-xl flex items-center justify-center">
              <Icon name="upload" size={24} className="text-amber-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm">Total Wallet Balance</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{formatPOL(stats.totalBalance)} POL</p>
            </div>
            <div className="w-12 h-12 bg-purple-600/10 rounded-xl flex items-center justify-center">
              <Icon name="wallet" size={24} className="text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      <Card title="Recent Activity">
        {recentActivity.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-4">No activity yet</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.amount > 0 ? "bg-green-600/10" : "bg-red-600/10"}`}>
                    <Icon name={tx.amount > 0 ? "download" : "upload"} size={14} className={tx.amount > 0 ? "text-green-400" : "text-red-400"} />
                  </div>
                  <div>
                    <p className="text-sm text-white capitalize">{tx.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-zinc-500">{tx.description || "-"}</p>
                  </div>
                </div>
                <p className={`text-sm font-medium ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                  {tx.amount > 0 ? "+" : ""}{formatPOL(tx.amount)} POL
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
