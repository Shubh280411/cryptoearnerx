"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";
import { PACKAGES } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardData {
  name: string;
  referralCode: string;
  leftVolume: number;
  rightVolume: number;
  balance: number;
  bonusBalance: number;
  lockedCEX: number;
  totalEarned: number;
  totalInvested: number;
  activePackages: number;
  teamSize: number;
  directReferrals: number;
  todayEarning: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    name: "User",
    referralCode: "",
    leftVolume: 0,
    rightVolume: 0,
    balance: 0,
    bonusBalance: 0,
    lockedCEX: 0,
    totalEarned: 0,
    totalInvested: 0,
    activePackages: 0,
    teamSize: 0,
    directReferrals: 0,
    todayEarning: 0,
  });
  const [activeInvestments, setActiveInvestments] = useState<any[]>([]);
  const [earningChart, setEarningChart] = useState<{ day: string; amount: number }[]>([]);
  const [announcement, setAnnouncement] = useState<string>("");
  const [recentJoinees, setRecentJoinees] = useState<{ id: string; name: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadDashboard = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [
      userRes,
      walletRes,
      investRes,
      teamRes,
      allEarnedRes,
      roiTxs,
      settingsRes,
      recentJoinRes,
    ] = await Promise.all([
      supabase.from("users").select("name, referral_code, left_volume, right_volume").eq("id", user.id).single(),
      supabase.from("wallet").select("*").eq("user_id", user.id).single(),
      supabase.from("investments").select("*").eq("user_id", user.id).eq("status", "active"),
      supabase.from("users").select("id").eq("sponsor_id", user.id),
      supabase.from("transactions").select("amount").eq("user_id", user.id).eq("status", "completed"),
      supabase.from("transactions").select("amount, created_at").eq("user_id", user.id).eq("type", "roi_payout").order("created_at", { ascending: false }).limit(50),
      supabase.from("settings").select("value").eq("key", "announcement").maybeSingle(),
      supabase.from("users").select("id, name, created_at").order("created_at", { ascending: false }).limit(5),
    ]);

    const u = userRes.data;
    const wallet = walletRes.data;
    const investments = investRes.data || [];
    const team = teamRes.data || [];
    const allEarned = allEarnedRes.data || [];
    const roiTx = roiTxs.data || [];

    const totalEarned = allEarned.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);

    const today = new Date().toISOString().split("T")[0];
    const todayEarning = investments.reduce((sum: number, inv: any) => {
      const investDate = inv.start_date?.split("T")[0];
      if (investDate === today) return sum + (inv.amount * inv.daily_roi / 100);
      return sum + (inv.amount * inv.daily_roi / 100);
    }, 0);

    // Team size: count all users recursively (simplified: just direct for now)
    let teamSize = team.length;
    if (team.length > 0) {
      const { count } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("sponsor_id", user.id);
      teamSize = count || team.length;
    }

    // Earning chart: last 7 days
    const chartMap: Record<string, number> = {};
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      chartMap[key] = 0;
    }
    roiTx.forEach((tx: any) => {
      const key = tx.created_at?.split("T")[0];
      if (key && chartMap[key] !== undefined) {
        chartMap[key] += tx.amount;
      }
    });
    const chartData = Object.entries(chartMap).map(([date, amount]) => ({
      day: dayNames[new Date(date).getDay()],
      amount: Number(amount.toFixed(2)),
    }));

    setData({
      name: u?.name || "User",
      referralCode: u?.referral_code || "",
      leftVolume: u?.left_volume || 0,
      rightVolume: u?.right_volume || 0,
      balance: wallet?.balance || 0,
      bonusBalance: wallet?.bonus_balance || 0,
      lockedCEX: wallet?.locked_bonus_balance || 0,
      totalEarned,
      totalInvested: wallet?.total_invested || 0,
      activePackages: investments.length,
      teamSize,
      directReferrals: team.length,
      todayEarning: investments.reduce((sum: number, inv: any) => sum + (inv.amount * inv.daily_roi / 100), 0),
    });

    setActiveInvestments(investments.slice(0, 4));
    setEarningChart(chartData);
    setRecentJoinees((recentJoinRes.data || []) as any);
    setAnnouncement(settingsRes.data?.value || "");
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const copyReferral = () => {
    const link = `${window.location.origin}/register?ref=${data.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInvestmentProgress = (inv: any) => {
    const start = new Date(inv.start_date).getTime();
    const end = new Date(inv.end_date).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  const getDaysLeft = (inv: any) => {
    const end = new Date(inv.end_date).getTime();
    const now = Date.now();
    if (now >= end) return 0;
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  };

  const getPackageColor = (type: string) => {
    return PACKAGES.find((p) => p.type === type)?.color || "#22c55e";
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-green-600/20 border border-zinc-800 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-white">Welcome back, {data.name}!</h1>
        <p className="text-zinc-400 text-sm mt-1">Your earning journey continues. Keep building your empire.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm">Wallet Balance</p>
              <p className="text-2xl font-bold text-white mt-1">{formatPOL(data.balance)} POL</p>
            </div>
            <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center">
              <Icon name="wallet" size={24} className="text-blue-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm flex items-center gap-1.5">
                CEX Coins
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{(data.bonusBalance + data.lockedCEX).toLocaleString()} CEX</p>
              <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                All locked
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-600/10 rounded-xl flex items-center justify-center">
              <Icon name="coins" size={24} className="text-purple-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm">Today&apos;s Earning</p>
              <p className="text-2xl font-bold text-green-400 mt-1">+{formatPOL(data.todayEarning)} POL</p>
            </div>
            <div className="w-12 h-12 bg-green-600/10 rounded-xl flex items-center justify-center">
              <Icon name="trending" size={24} className="text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm">Active Packages</p>
              <p className="text-2xl font-bold text-white mt-1">{data.activePackages}</p>
            </div>
            <div className="w-12 h-12 bg-amber-600/10 rounded-xl flex items-center justify-center">
              <Icon name="package" size={24} className="text-amber-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/deposit">
          <Card className="hover:border-blue-600/50 transition-colors cursor-pointer text-center py-4">
            <Icon name="download" size={24} className="text-blue-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">Deposit</p>
          </Card>
        </Link>
        <Link href="/invest">
          <Card className="hover:border-green-600/50 transition-colors cursor-pointer text-center py-4">
            <Icon name="package" size={24} className="text-green-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">Invest</p>
          </Card>
        </Link>
        <Link href="/withdraw">
          <Card className="hover:border-amber-600/50 transition-colors cursor-pointer text-center py-4">
            <Icon name="upload" size={24} className="text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">Withdraw</p>
          </Card>
        </Link>
        <Link href="/referral">
          <Card className="hover:border-purple-600/50 transition-colors cursor-pointer text-center py-4">
            <Icon name="link" size={24} className="text-purple-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">Refer</p>
          </Card>
        </Link>
      </div>

      {/* Active Investments */}
      {activeInvestments.length > 0 && (
        <Card title="Active Investments">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activeInvestments.map((inv) => {
              const progress = getInvestmentProgress(inv);
              const daysLeft = getDaysLeft(inv);
              const pkgColor = getPackageColor(inv.package_type);
              const pkgName = PACKAGES.find((p) => p.type === inv.package_type)?.name || inv.package_type;
              const dailyEarning = inv.amount * inv.daily_roi / 100;

              return (
                <div key={inv.id} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${pkgColor}20`, color: pkgColor }}
                    >
                      {pkgName}
                    </span>
                    <span className="text-xs text-zinc-400">{daysLeft}d left</span>
                  </div>
                  <p className="text-white font-bold">{formatPOL(inv.amount)} POL</p>
                  <p className="text-green-400 text-xs mt-1">+{formatPOL(dailyEarning)} POL/day</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, backgroundColor: pkgColor }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {data.activePackages > 4 && (
            <Link href="/invest" className="block text-center text-sm text-blue-400 hover:text-blue-300 mt-3">
              View all {data.activePackages} packages
            </Link>
          )}
        </Card>
      )}

      {/* Team Summary + Referral Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Team Summary */}
        <Card title="Team Summary">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-zinc-400 text-xs">Left Volume</p>
              <p className="text-lg font-bold text-white mt-1">{formatPOL(data.leftVolume)} POL</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-zinc-400 text-xs">Right Volume</p>
              <p className="text-lg font-bold text-white mt-1">{formatPOL(data.rightVolume)} POL</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-zinc-400 text-xs">Direct Referrals</p>
              <p className="text-lg font-bold text-green-400 mt-1">{data.directReferrals}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-zinc-400 text-xs">Team Size</p>
              <p className="text-lg font-bold text-blue-400 mt-1">{data.teamSize}</p>
            </div>
          </div>
          <Link href="/team" className="block text-center text-sm text-blue-400 hover:text-blue-300 mt-4">
            View Team Tree
          </Link>
        </Card>

        {/* Referral Box */}
        <Card title="Referral Link">
          <div className="space-y-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-zinc-400 text-xs mb-2">Your Referral Code</p>
              <p className="text-white font-mono font-bold text-lg">{data.referralCode || "N/A"}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyReferral}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                <Icon name={copied ? "check" : "copy"} size={16} />
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <Link
                href="/referral"
                className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                <Icon name="users" size={16} />
                {data.directReferrals} referred
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Live Feed + Earning Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live Feed - Recent Joinings */}
        <Card title="Live Feed">
          <div className="space-y-3">
            {recentJoinees.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="users" size={32} className="text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">No recent joinings yet</p>
              </div>
            ) : (
              recentJoinees.map((j) => (
                <div key={j.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600/10 rounded-full flex items-center justify-center">
                      <Icon name="user" size={14} className="text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white">{j.name || "New User"}</p>
                      <p className="text-xs text-zinc-500">{timeAgo(j.created_at)}</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-400 font-medium">Joined</span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Earning Chart */}
        <Card title="Earnings (Last 7 Days)">
          {earningChart.some((d) => d.amount > 0) ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningChart}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#71717a", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#a1a1aa" }}
                    formatter={(value: any) => [`${value} POL`, "Earned"]}
                  />
                  <Bar dataKey="amount" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
              No earnings data yet
            </div>
          )}
        </Card>
      </div>

      {/* Announcements */}
      {announcement && (
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name="info" size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white font-medium">Platform Announcement</p>
              <p className="text-zinc-400 text-sm mt-1">{announcement}</p>
            </div>
          </div>
        </Card>
      )}

    </div>
  );
}
