"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";

export default function WithdrawPage() {
  const [balance, setBalance] = useState(0);
  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    loadWithdrawInfo();
  }, []);

  const loadWithdrawInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [walletRes, wdRes] = await Promise.all([
      supabase.from("wallet").select("balance").eq("user_id", user.id).single(),
      supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);

    setBalance(walletRes.data?.balance || 0);
    setWithdrawals(wdRes.data || []);
    setLoading(false);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const withdrawAmount = Number(amount);
    if (withdrawAmount < 25) {
      setError("Minimum withdrawal is 25 POL");
      setSubmitting(false);
      return;
    }

    if (withdrawAmount > balance) {
      setError("Insufficient balance");
      setSubmitting(false);
      return;
    }

    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      setError("Invalid wallet address");
      setSubmitting(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: wdError } = await supabase.from("withdrawals").insert({
      user_id: user.id,
      amount: withdrawAmount,
      wallet_address: walletAddress,
      status: "pending",
    });

    if (wdError) {
      setError("Failed to submit withdrawal request");
    } else {
      setSuccess("Withdrawal request submitted! It will be processed within 24 hours.");
      setAmount("");
      setWalletAddress("");
      loadWithdrawInfo();
    }

    setSubmitting(false);
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
        <h1 className="text-2xl font-bold text-white">Withdraw POL</h1>
        <p className="text-zinc-400 text-sm mt-1">Withdraw your POL to external wallet</p>
      </div>

      {/* Balance */}
      <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-600/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm">Available for Withdrawal</p>
            <p className="text-3xl font-bold text-white mt-1">{formatPOL(balance)} POL</p>
            <p className="text-xs text-zinc-500 mt-1">Min: 25 POL | Fee: 1 POL</p>
          </div>
          <div className="w-16 h-16 bg-amber-600/10 rounded-xl flex items-center justify-center">
            <Icon name="upload" size={32} className="text-amber-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdraw Form */}
        <Card title="Withdraw">
          <form onSubmit={handleWithdraw} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
                <Icon name="alertTriangle" size={16} />
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2">
                <Icon name="check" size={16} />
                {success}
              </div>
            )}

            <Input
              label="Wallet Address (Polygon)"
              placeholder="0x..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              required
            />

            <Input
              label="Amount (POL)"
              type="number"
              placeholder="Min 25 POL"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="25"
              required
            />

            {amount && Number(amount) >= 25 && (
              <div className="bg-zinc-800 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Amount</span>
                  <span>{formatPOL(Number(amount))} POL</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Fee</span>
                  <span>1.00 POL</span>
                </div>
                <div className="border-t border-zinc-700 pt-1 flex justify-between text-white font-medium">
                  <span>You Receive</span>
                  <span>{formatPOL(Number(amount) - 1)} POL</span>
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
              {submitting ? "Processing..." : "Withdraw"}
            </Button>
          </form>
        </Card>

        {/* Withdrawal History */}
        <Card title="Withdrawal History">
          {withdrawals.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="clock" size={32} className="text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm">No withdrawals yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((wd) => (
                <div key={wd.id} className="p-3 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        wd.status === "completed" ? "bg-green-400" :
                        wd.status === "pending" ? "bg-amber-400" :
                        wd.status === "processing" ? "bg-blue-400" : "bg-red-400"
                      }`} />
                      <span className="text-sm text-zinc-300 capitalize">{wd.status}</span>
                    </div>
                    <span className="text-sm font-medium text-white">{formatPOL(wd.amount)} POL</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 font-mono">{truncateAddr(wd.wallet_address)}</p>
                  <p className="text-xs text-zinc-600 mt-1">{new Date(wd.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function truncateAddr(addr: string) {
  return addr ? `${addr.slice(0, 10)}...${addr.slice(-8)}` : "";
}
