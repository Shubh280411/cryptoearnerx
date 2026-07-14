"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";

const TARGET_MEMBERS = 10000;
const CEX_RATE = 20;

export default function ConvertPage() {
  const [cexBalance, setCexBalance] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [walletRes, countRes] = await Promise.all([
      supabase.from("wallet").select("bonus_balance, locked_bonus_balance").eq("user_id", user.id).single(),
      supabase.from("users").select("id", { count: "exact", head: true }),
    ]);

    if (walletRes.data) setCexBalance((walletRes.data.bonus_balance || 0) + (walletRes.data.locked_bonus_balance || 0));
    setMemberCount(countRes.count || 0);
    setLoading(false);
  };

  const progress = Math.min((memberCount / TARGET_MEMBERS) * 100, 100);
  const isUnlocked = memberCount >= TARGET_MEMBERS;

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
        <h1 className="text-2xl font-bold text-white">CEX to POL</h1>
        <p className="text-zinc-400 text-sm mt-1">Convert your CEX coins to POL tokens</p>
      </div>

      {/* Progress Card */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-zinc-400 text-sm">Feature Unlock Progress</p>
            <p className="text-white text-sm font-medium">{memberCount.toLocaleString()} / {TARGET_MEMBERS.toLocaleString()} members</p>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{progress.toFixed(1)}% complete</span>
            <span>{(TARGET_MEMBERS - memberCount).toLocaleString()} members remaining</span>
          </div>
          {!isUnlocked && (
            <div className="bg-zinc-800/50 rounded-lg p-4 flex items-center gap-3">
              <Icon name="lock" size={20} className="text-amber-400" />
              <p className="text-zinc-400 text-sm">This feature will be unlocked once we reach {TARGET_MEMBERS.toLocaleString()} members. Keep referring to unlock faster!</p>
            </div>
          )}
        </div>
      </Card>

      {/* Balance Card */}
      <Card>
        <div className="text-center py-4">
          <p className="text-zinc-400 text-sm">Your CEX Balance</p>
          <p className="text-4xl font-bold text-purple-400 mt-2">{cexBalance.toLocaleString()} CEX</p>
          <p className="text-xs text-zinc-500 mt-2">Rate: {CEX_RATE} CEX = 1 POL</p>
          <p className="text-xs text-zinc-500">Potential: {(cexBalance / CEX_RATE).toFixed(2)} POL</p>
        </div>
      </Card>

      {/* How it works */}
      <Card title="How it Works">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0">
              <span className="text-blue-400 text-sm font-bold">1</span>
            </div>
            <div>
              <p className="text-sm text-white font-medium">Earn CEX Coins</p>
              <p className="text-xs text-zinc-500">Get CEX coins through registration bonuses and level commissions</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-purple-600/10 flex items-center justify-center shrink-0">
              <span className="text-purple-400 text-sm font-bold">2</span>
            </div>
            <div>
              <p className="text-sm text-white font-medium">Wait for Listing</p>
              <p className="text-xs text-zinc-500">Feature unlocks at {TARGET_MEMBERS.toLocaleString()} members</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-green-600/10 flex items-center justify-center shrink-0">
              <span className="text-green-400 text-sm font-bold">3</span>
            </div>
            <div>
              <p className="text-sm text-white font-medium">Convert to POL</p>
              <p className="text-xs text-zinc-500">Swap your CEX coins for POL tokens at the {CEX_RATE}:1 rate</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
