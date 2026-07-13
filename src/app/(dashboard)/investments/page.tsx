"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";
import { PACKAGES } from "@/lib/constants";

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("investments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setInvestments(data || []);
    setLoading(false);
  };

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getProgress = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const progress = ((now - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, progress));
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
        <h1 className="text-2xl font-bold text-white">My Packages</h1>
        <p className="text-zinc-400 text-sm mt-1">Track your active investments</p>
      </div>

      {investments.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Icon name="package" size={48} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 mb-4">No active packages</p>
            <Button variant="primary" onClick={() => window.location.href = "/invest"}>
              Browse Packages
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {investments.map((inv) => {
            const pkg = PACKAGES.find((p) => p.type === inv.package_type);
            const daysLeft = getDaysLeft(inv.end_date);
            const progress = getProgress(inv.start_date, inv.end_date);
            const dailyEarning = inv.amount * inv.daily_roi / 100;
            const isCompleted = daysLeft === 0;

            return (
              <Card key={inv.id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: (pkg?.color || "#3b82f6") + "20" }}
                    >
                      <Icon name="package" size={20} style={{ color: pkg?.color || "#3b82f6" }} />
                    </div>
                    <div>
                      <h3 className="text-white font-medium capitalize">{inv.package_type}</h3>
                      <p className="text-xs text-zinc-500">{inv.daily_roi}% daily ROI</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      inv.investment_source === "cex" ? "bg-purple-500/10 text-purple-400" : "bg-green-500/10 text-green-400"
                    }`}>
                      {inv.investment_source === "cex" ? "CEX" : "POL"}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isCompleted ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"
                    }`}>
                      {isCompleted ? "Completed" : "Active"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Invested</span>
                    <span className="text-white font-medium">{formatPOL(inv.amount)} {inv.investment_source === "cex" ? "CEX" : "POL"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Daily Earning</span>
                    <span className="text-green-400">+{formatPOL(dailyEarning)} {inv.investment_source === "cex" ? "CEX" : "POL"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Total Earned</span>
                    <span className="text-green-400 font-medium">+{formatPOL(inv.total_earned)} {inv.investment_source === "cex" ? "CEX" : "POL"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Days Left</span>
                    <span className="text-white">{isCompleted ? "Done" : `${daysLeft} days`}</span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{progress.toFixed(0)}% complete</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
