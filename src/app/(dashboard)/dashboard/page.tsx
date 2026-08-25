"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";
import { PACKAGES } from "@/lib/constants";
import { ReferralRewardsHub } from "@/components/ReferralRewardsHub";

interface DashboardData {
  name: string;
  referralCode: string;
  leftVolume: number;
  rightVolume: number;
  balance: number;
  earnedBalance: number;
  bonusBalance: number;
  lockedCEX: number;
  sparkBalance: number;
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
    earnedBalance: 0,
    bonusBalance: 0,
    lockedCEX: 0,
    sparkBalance: 0,
    totalEarned: 0,
    totalInvested: 0,
    activePackages: 0,
    teamSize: 0,
    directReferrals: 0,
    todayEarning: 0,
  });
  const [activeInvestments, setActiveInvestments] = useState<any[]>([]);
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
      settingsRes,
      recentJoinRes,
    ] = await Promise.all([
      supabase.from("users").select("name, referral_code, left_volume, right_volume").eq("id", user.id).single(),
      supabase.from("wallet").select("*").eq("user_id", user.id).single(),
      supabase.from("investments").select("*").eq("user_id", user.id).eq("status", "active"),
      supabase.from("users").select("id").eq("sponsor_id", user.id),
      supabase.from("transactions").select("amount").eq("user_id", user.id).eq("status", "completed"),
      supabase.from("settings").select("value").eq("key", "announcement").maybeSingle(),
      supabase.from("users").select("id, name, created_at").order("created_at", { ascending: false }).limit(5),
    ]);

    const u = userRes.data;
    const wallet = walletRes.data;
    const investments = investRes.data || [];
    const team = teamRes.data || [];
    const allEarned = allEarnedRes.data || [];

    const totalEarned = allEarned.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);

    const today = new Date().toISOString().split("T")[0];
    const todayEarning = investments.reduce((sum: number, inv: any) => {
      const investDate = inv.start_date?.split("T")[0];
      if (investDate === today) return sum + (inv.amount * inv.daily_roi / 100);
      return sum + (inv.amount * inv.daily_roi / 100);
    }, 0);

    // Team size: count all users recursively
    let teamSize = 0;
    async function countTeam(sponsorId: string) {
      const { data: children } = await supabase.from("users").select("id").eq("sponsor_id", sponsorId);
      if (!children || children.length === 0) return;
      teamSize += children.length;
      for (const child of children) {
        await countTeam(child.id);
      }
    }
    await countTeam(user.id);

    setData({
      name: u?.name || "User",
      referralCode: u?.referral_code || "",
      leftVolume: u?.left_volume || 0,
      rightVolume: u?.right_volume || 0,
      balance: wallet?.total_deposited || 0,
      earnedBalance: wallet?.balance || 0,
      bonusBalance: wallet?.bonus_balance || 0,
      lockedCEX: wallet?.locked_bonus_balance || 0,
      sparkBalance: wallet?.airdrop_balance || 0,
      totalEarned,
      totalInvested: wallet?.total_invested || 0,
      activePackages: investments.length,
      teamSize,
      directReferrals: team.length,
      todayEarning: investments.reduce((sum: number, inv: any) => sum + (inv.amount * inv.daily_roi / 100), 0),
    });

    setActiveInvestments(investments.slice(0, 4));
    setRecentJoinees((recentJoinRes.data || []) as any);
    setAnnouncement(settingsRes.data?.value || "");
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const feedInterval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("users")
        .select("id, name, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setRecentJoinees(data as any);
    }, 10000);
    return () => clearInterval(feedInterval);
  }, []);

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
    let dateStrFixed = dateStr;
    if (!dateStr.endsWith("Z") && !dateStr.includes("+") && !dateStr.includes("T")) {
      dateStrFixed = dateStr.replace(" ", "T") + "Z";
    } else if (!dateStr.endsWith("Z") && !dateStr.includes("+")) {
      dateStrFixed = dateStr + "Z";
    }
    const seconds = Math.floor((Date.now() - new Date(dateStrFixed).getTime()) / 1000);
    if (seconds < 0) return "just now";
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <div>
            <p className="text-zinc-400 text-xs">Deposit Balance</p>
            <p className="text-lg font-bold text-white mt-1">{formatPOL(data.balance)} POL</p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-zinc-400 text-xs">Earned Balance</p>
            <p className="text-lg font-bold text-green-400 mt-1">{formatPOL(data.earnedBalance)} POL</p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-zinc-400 text-xs">Today&apos;s Earning</p>
            <p className="text-lg font-bold text-green-400 mt-1">+{formatPOL(data.todayEarning)} POL</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2.5">
            <img src="/spark-logo-sm.png" alt="SPARK" className="w-16 h-16 rounded-full shrink-0" />
            <div>
              <p className="text-zinc-400 text-xs">SPARK Balance</p>
              <p className="text-lg font-bold text-purple-400 mt-1">{data.sparkBalance.toLocaleString()} SPARK</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2.5">
            <img src="/cex-logo-sm.png" alt="CEX" className="w-16 h-16 rounded-full shrink-0" />
            <div>
              <p className="text-zinc-400 text-xs">CEX Coins</p>
              <p className="text-lg font-bold text-amber-400 mt-1">{(data.bonusBalance + data.lockedCEX).toLocaleString()} CEX</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Locked</p>
            </div>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-zinc-400 text-xs">Active Packages</p>
            <p className="text-lg font-bold text-white mt-1">{data.activePackages}</p>
          </div>
        </Card>
      </div>

      {/* ROI Info Banner */}
      {activeInvestments.length > 0 && (
        <div className="bg-emerald-600/10 border border-emerald-600/20 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600/20 rounded-full flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <p className="text-sm text-white font-medium">ROI credited daily at 12:00 AM UTC</p>
            <p className="text-xs text-zinc-400 mt-0.5">Your returns are automatically deposited into your wallet every midnight.</p>
          </div>
        </div>
      )}

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
        <Link href="/earnings">
          <Card className="hover:border-purple-600/50 transition-colors cursor-pointer text-center py-4">
            <Icon name="trending" size={24} className="text-purple-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">Earnings</p>
          </Card>
        </Link>
      </div>

      {/* Active Investments — Detailed Progress Cards */}
      {activeInvestments.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {activeInvestments.map((inv) => {
              const progress = getInvestmentProgress(inv);
              const daysLeft = getDaysLeft(inv);
              const pkgColor = getPackageColor(inv.package_type);
              const pkg = PACKAGES.find((p) => p.type === inv.package_type);
              const pkgName = pkg?.name || inv.package_type;
              const dailyEarning = inv.amount * inv.daily_roi / 100;
              const start = new Date(inv.start_date).getTime();
              const now = Date.now();
              const dayNum = Math.min(Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1, inv.duration_days || pkg?.durationDays || 30);
              const totalDays = inv.duration_days || pkg?.durationDays || 30;
              const totalEarned = dayNum * dailyEarning;

              return (
                <Card key={inv.id}>
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${pkgColor}20`, color: pkgColor }}>
                        {pkgName}
                      </span>
                      <span className="text-xs text-zinc-400">{daysLeft}d left</span>
                    </div>

                    {/* Amount */}
                    <div>
                      <p className="text-2xl font-extrabold text-white">{formatPOL(inv.amount)} <span className="text-sm font-bold text-zinc-400">POL</span></p>
                    </div>

                    {/* Day Counter */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Day {dayNum} / {totalDays}</span>
                      <span className="text-green-400 font-bold">+{formatPOL(dailyEarning)} POL/day</span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                        <span>Progress</span>
                        <span className="text-zinc-300 font-medium">{progress}%</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${pkgColor}80, ${pkgColor})` }} />
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Today&apos;s ROI</p>
                        <p className="text-sm font-bold text-green-400">{formatPOL(dailyEarning)} POL</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Total Earned</p>
                        <p className="text-sm font-bold text-white">{formatPOL(totalEarned)} POL</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {data.activePackages > 3 && (
            <Link href="/invest" className="block text-center text-sm text-blue-400 hover:text-blue-300">
              View all {data.activePackages} packages
            </Link>
          )}
        </div>
      )}

      {/* Next ROI Countdown Card */}
      {activeInvestments.length > 0 && (
        <NextROICard investments={activeInvestments} />
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

      {/* Referral Rewards Hub */}
      <ReferralRewardsHub />

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

function NextROICard({ investments }: { investments: any[] }) {
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [nextROI, setNextROI] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const calcNextROI = () => {
      const current = new Date();
      setNow(current);
      const tomorrow = new Date(current);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - current.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ h, m, s });

      const totalDaily = investments.reduce((sum, inv) => sum + (inv.amount * inv.daily_roi / 100), 0);
      setNextROI(totalDaily);
    };

    calcNextROI();
    const timer = setInterval(calcNextROI, 1000);
    return () => clearInterval(timer);
  }, [investments]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Card>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Animated Analog Clock */}
        <div className="relative shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-lg">
            {/* Clock face */}
            <circle cx="50" cy="50" r="46" fill="#111111" stroke="#27272a" strokeWidth="2" />

            {/* Hour markers */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const x1 = 50 + 38 * Math.cos(angle);
              const y1 = 50 + 38 * Math.sin(angle);
              const x2 = 50 + 42 * Math.cos(angle);
              const y2 = 50 + 42 * Math.sin(angle);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#52525b" strokeWidth="2" strokeLinecap="round" />;
            })}

            {/* Minute tick marks */}
            {Array.from({ length: 60 }).map((_, i) => {
              if (i % 5 === 0) return null;
              const angle = (i * 6 - 90) * (Math.PI / 180);
              const x1 = 50 + 40 * Math.cos(angle);
              const y1 = 50 + 40 * Math.sin(angle);
              const x2 = 50 + 42 * Math.cos(angle);
              const y2 = 50 + 42 * Math.sin(angle);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3f3f46" strokeWidth="0.8" strokeLinecap="round" />;
            })}

            {/* Hour hand */}
            <line
              x1="50" y1="50"
              x2={50 + 22 * Math.cos(((now.getHours() % 12) * 30 + now.getMinutes() * 0.5 - 90) * Math.PI / 180)}
              y2={50 + 22 * Math.sin(((now.getHours() % 12) * 30 + now.getMinutes() * 0.5 - 90) * Math.PI / 180)}
              stroke="#e4e4e7"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Minute hand */}
            <line
              x1="50" y1="50"
              x2={50 + 30 * Math.cos((now.getMinutes() * 6 + now.getSeconds() * 0.1 - 90) * Math.PI / 180)}
              y2={50 + 30 * Math.sin((now.getMinutes() * 6 + now.getSeconds() * 0.1 - 90) * Math.PI / 180)}
              stroke="#a1a1aa"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Second hand */}
            <line
              x1="50" y1="50"
              x2={50 + 32 * Math.cos((now.getSeconds() * 6 - 90) * Math.PI / 180)}
              y2={50 + 32 * Math.sin((now.getSeconds() * 6 - 90) * Math.PI / 180)}
              stroke="#22c55e"
              strokeWidth="1"
              strokeLinecap="round"
            />

            {/* Center dot */}
            <circle cx="50" cy="50" r="3" fill="#22c55e" />
          </svg>
        </div>

        {/* ROI Info */}
        <div className="flex-1 text-center sm:text-left">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-2">Next ROI Credit</p>
          <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            {formatPOL(nextROI)} <span className="text-lg font-bold">POL</span>
          </p>
          <p className="text-xs text-zinc-500 mt-1">Credited daily at 12:00 AM UTC</p>

          {/* Countdown Timer */}
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
            {[
              { label: "HRS", value: countdown.h },
              { label: "MIN", value: countdown.m },
              { label: "SEC", value: countdown.s },
            ].map((unit, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-center min-w-[52px]">
                  <p className="text-xl font-bold text-white font-mono">{pad(unit.value)}</p>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-wider">{unit.label}</p>
                </div>
                {i < 2 && <span className="text-zinc-600 text-lg font-bold animate-pulse">:</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
