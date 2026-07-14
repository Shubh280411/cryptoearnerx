"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { formatPOL, truncateAddress } from "@/lib/utils";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [lockedCEX, setLockedCEX] = useState(0);
  const [totalDeposited, setTotalDeposited] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [walletRes, txRes] = await Promise.all([
      supabase.from("wallet").select("*").eq("user_id", user.id).single(),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    if (walletRes.data) {
      setBalance(walletRes.data.balance);
      setBonusBalance(walletRes.data.bonus_balance || 0);
      setLockedCEX(walletRes.data.locked_bonus_balance || 0);
      setTotalDeposited(walletRes.data.total_deposited);
      setTotalWithdrawn(walletRes.data.total_withdrawn);
      setTotalInvested(walletRes.data.total_invested);
    }

    setTransactions(txRes.data || []);
    setLoading(false);
  };

  const isCECTx = (type: string) => {
    return ["registration_bonus", "invest_locked_cec", "cex_unlock"].includes(type);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading wallet...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Wallet</h1>
        <p className="text-zinc-400 text-sm mt-1">Manage your POL balance</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-600/20 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">POL Balance</p>
          <p className="text-4xl font-bold text-white mt-2">{formatPOL(balance)} POL</p>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-zinc-500">Deposited</p>
              <p className="text-zinc-300 font-medium">{formatPOL(totalDeposited)}</p>
            </div>
            <div>
              <p className="text-zinc-500">Withdrawn</p>
              <p className="text-zinc-300 font-medium">{formatPOL(totalWithdrawn)}</p>
            </div>
            <div>
              <p className="text-zinc-500">Invested</p>
              <p className="text-zinc-300 font-medium">{formatPOL(totalInvested)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-600/20 rounded-xl p-6">
          <p className="text-zinc-400 text-sm flex items-center gap-1.5">
            CEX Coins Balance
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </p>
          <p className="text-4xl font-bold text-purple-400 mt-2">{(bonusBalance + lockedCEX).toLocaleString()} CEX</p>
          <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            All locked — unlocks on listing
          </p>
          <p className="text-xs text-zinc-500 mt-1">Free coins credited on signup & investing.</p>
        </div>
      </div>

      {/* Transaction History */}
      <Card title="Transaction History">
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="clock" size={32} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.amount > 0 ? "bg-green-600/10" : "bg-red-600/10"
                  }`}>
                    <Icon
                      name={tx.amount > 0 ? "download" : "upload"}
                      size={14}
                      className={tx.amount > 0 ? "text-green-400" : "text-red-400"}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-white capitalize">{tx.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-zinc-500">{tx.description || "-"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                    {tx.amount > 0 ? "+" : ""}{formatPOL(tx.amount)} {isCECTx(tx.type) ? "CEX" : "POL"}
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
