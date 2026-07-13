"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { PACKAGES } from "@/lib/constants";
import { formatPOL } from "@/lib/utils";

const CEX_RATE = 20;

export default function InvestPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("wallet").select("balance").eq("user_id", user.id).single();
    setWallet(data);
    setLoading(false);
  };

  const handleInvest = async () => {
    if (!selectedPkg || !investAmount) return;
    setInvesting(true);
    setMessage({ type: "", text: "" });

    const amount = parseFloat(investAmount);
    const pkg = PACKAGES.find((p) => p.type === selectedPkg);

    if (!pkg || amount < pkg.minInvest || amount > pkg.maxInvest) {
      setMessage({ type: "error", text: `Amount must be between ${pkg?.minInvest} - ${pkg?.maxInvest} POL` });
      setInvesting(false);
      return;
    }

    if ((wallet?.balance || 0) < amount) {
      setMessage({ type: "error", text: "Insufficient POL balance. Deposit first." });
      setInvesting(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch("/api/wallet/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        amount,
        packageType: selectedPkg,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setMessage({ type: "success", text: `Successfully invested ${amount} POL in ${pkg.name}!` });
      setInvestAmount("");
      setSelectedPkg(null);
      loadWallet();
    } else {
      setMessage({ type: "error", text: data.error || "Investment failed" });
    }
    setInvesting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading packages...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Investment Packages</h1>
        <p className="text-zinc-400 text-sm mt-1">Invest POL and earn daily ROI + CEX coins</p>
      </div>

      {/* Balance */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Available POL Balance</p>
            <p className="text-2xl font-bold text-white mt-1">{formatPOL(wallet?.balance || 0)} POL</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">CEX Rate</p>
            <p className="text-lg font-bold text-purple-400 mt-1">{CEX_RATE} CEX / POL</p>
          </div>
        </div>
      </Card>

      {message.text && (
        <div className={`rounded-lg p-3 text-sm flex items-center gap-2 ${
          message.type === "error" ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-green-500/10 border border-green-500/20 text-green-400"
        }`}>
          <Icon name={message.type === "error" ? "alertTriangle" : "check"} size={16} />
          {message.text}
        </div>
      )}

      {/* Package Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.type}
            onClick={() => setSelectedPkg(pkg.type)}
            className={`bg-zinc-900 border rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.02] ${
              selectedPkg === pkg.type
                ? "border-blue-500 ring-1 ring-blue-500/30"
                : "border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: pkg.color + "20" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={pkg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
              <p className="text-2xl font-bold mt-1" style={{ color: pkg.color }}>
                {pkg.dailyROI}%
              </p>
              <p className="text-xs text-zinc-500">daily ROI</p>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Investment</span>
                  <span className="text-white">{pkg.minInvest} - {pkg.maxInvest.toLocaleString()} POL</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Duration</span>
                  <span className="text-white">{pkg.durationDays} Days</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Total ROI</span>
                  <span className="text-green-400 font-bold">{pkg.totalROI}%</span>
                </div>
                <div className="flex justify-between text-zinc-400 border-t border-zinc-700 pt-2">
                  <span>CEX Bonus</span>
                  <span className="text-purple-400 font-bold">+{(pkg.minInvest * CEX_RATE).toLocaleString()} CEX</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Invest Input */}
      {selectedPkg && (
        <Card title={`Invest in ${PACKAGES.find((p) => p.type === selectedPkg)?.name}`}>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Amount (POL)</label>
              <input
                type="number"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                placeholder={`Min ${PACKAGES.find((p) => p.type === selectedPkg)?.minInvest} POL`}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
              <p className="text-xs text-zinc-500 mt-1">
                You&apos;ll receive: {investAmount ? (parseFloat(investAmount) * CEX_RATE).toLocaleString() : "0"} CEX coins (locked)
              </p>
            </div>
            <Button
              variant="primary"
              className="w-full"
              size="lg"
              onClick={handleInvest}
              disabled={investing || !investAmount}
            >
              {investing ? "Investing..." : `Invest ${investAmount || "0"} POL`}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
