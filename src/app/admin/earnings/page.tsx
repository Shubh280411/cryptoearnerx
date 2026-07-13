"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";

export default function AdminEarningsPage() {
  const [stats, setStats] = useState({ totalDeposited: 0, totalWithdrawn: 0, totalInvested: 0, platformBalance: 0, totalCexCoins: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: wallets } = await supabase.from("wallet").select("balance, total_deposited, total_withdrawn, total_invested, bonus_balance");
    const allWallets = wallets || [];

    setStats({
      totalDeposited: allWallets.reduce((s: number, w: any) => s + (w.total_deposited || 0), 0),
      totalWithdrawn: allWallets.reduce((s: number, w: any) => s + (w.total_withdrawn || 0), 0),
      totalInvested: allWallets.reduce((s: number, w: any) => s + (w.total_invested || 0), 0),
      platformBalance: allWallets.reduce((s: number, w: any) => s + (w.balance || 0), 0),
      totalCexCoins: allWallets.reduce((s: number, w: any) => s + (w.bonus_balance || 0), 0),
    });
    setLoading(false);
  };

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
        <h1 className="text-2xl font-bold text-white">Platform Earnings</h1>
        <p className="text-zinc-400 text-sm mt-1">Overview of all platform funds</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <p className="text-xs text-zinc-500">Total Deposited</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{formatPOL(stats.totalDeposited)} POL</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Total Withdrawn</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{formatPOL(stats.totalWithdrawn)} POL</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Total Invested</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{formatPOL(stats.totalInvested)} POL</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">User Wallet Balance</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatPOL(stats.platformBalance)} POL</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">CEX Coins in Circulation</p>
          <p className="text-2xl font-bold text-purple-300 mt-1">{stats.totalCexCoins.toLocaleString()} CEX</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Revenue Estimate">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Platform Fee (2% of deposits)</span>
              <span className="text-green-400">{formatPOL(stats.totalDeposited * 0.02)} POL</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Withdrawal Fee (1% of withdrawals)</span>
              <span className="text-green-400">{formatPOL(stats.totalWithdrawn * 0.01)} POL</span>
            </div>
            <div className="border-t border-zinc-700 pt-2 flex justify-between text-white font-medium">
              <span>Estimated Revenue</span>
              <span className="text-green-400">{formatPOL(stats.totalDeposited * 0.02 + stats.totalWithdrawn * 0.01)} POL</span>
            </div>
          </div>
        </Card>

        <Card title="Platform Health">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Deposit to Withdrawal Ratio</span>
              <span className="text-white">{stats.totalWithdrawn > 0 ? ((stats.totalDeposited / stats.totalWithdrawn) * 100).toFixed(0) : "N/A"}%</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Investment Utilization</span>
              <span className="text-white">{stats.totalDeposited > 0 ? ((stats.totalInvested / stats.totalDeposited) * 100).toFixed(0) : 0}%</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Available Liquidity</span>
              <span className="text-green-400">{formatPOL(stats.platformBalance)} POL</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
