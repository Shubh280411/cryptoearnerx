"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";

const PAGE_SIZE = 10;

async function getTeamAtLevel(userId: string, level: number): Promise<any[]> {
  let currentIds = [userId];
  for (let l = 1; l <= level; l++) {
    const { data } = await supabase
      .from("users")
      .select("id")
      .in("sponsor_id", currentIds);
    if (!data || data.length === 0) return [];
    if (l === level) return data;
    currentIds = data.map((u) => u.id);
  }
  return [];
}

async function getTeamCounts(userId: string) {
  const counts: Record<number, { members: any[]; count: number }> = {};
  let currentIds = [userId];

  for (let level = 1; level <= 5; level++) {
    const { data } = await supabase
      .from("users")
      .select("id, name, email, rank, is_active, created_at")
      .in("sponsor_id", currentIds);

    const members = data || [];
    counts[level] = { members, count: members.length };
    currentIds = members.map((u) => u.id);
    if (currentIds.length === 0) {
      for (let remaining = level + 1; remaining <= 5; remaining++) {
        counts[remaining] = { members: [], count: 0 };
      }
      break;
    }
  }

  return counts;
}

export default function ReferralPage() {
  const [userId, setUserId] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [stats, setStats] = useState({ totalReferrals: 0, activeReferrals: 0, totalEarned: 0 });
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [filteredReferrals, setFilteredReferrals] = useState<any[]>([]);
  const [teamCounts, setTeamCounts] = useState<Record<number, { members: any[]; count: number }>>({});
  const [totalTeam, setTotalTeam] = useState(0);
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (userId) loadLevel(selectedLevel);
  }, [selectedLevel, userId]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: userData } = await supabase.from("users").select("referral_code").eq("id", user.id).single();
    if (userData) {
      setReferralCode(userData.referral_code || "");
      setReferralLink(`${window.location.origin}/register?ref=${userData.referral_code}`);
    }

    const [earnRes] = await Promise.all([
      supabase.from("transactions").select("amount").eq("user_id", user.id).eq("type", "referral_bonus"),
    ]);

    setStats({
      totalReferrals: 0,
      activeReferrals: 0,
      totalEarned: (earnRes.data || []).reduce((s, t) => s + t.amount, 0),
    });

    const counts = await getTeamCounts(user.id);
    setTeamCounts(counts);

    let total = 0;
    Object.values(counts).forEach((c) => { total += c.count; });
    setTotalTeam(total);

    const l1Members = counts[1]?.members || [];
    setStats({
      totalReferrals: l1Members.length,
      activeReferrals: l1Members.filter((r: any) => r.is_active).length,
      totalEarned: (earnRes.data || []).reduce((s, t) => s + t.amount, 0),
    });

    setFilteredReferrals(l1Members.slice(0, PAGE_SIZE));
    setLoading(false);
    setTeamLoading(false);
  };

  const loadLevel = async (level: number) => {
    setTeamLoading(true);
    if (teamCounts[level]) {
      const members = teamCounts[level].members || [];
      setFilteredReferrals(members.slice(0, PAGE_SIZE));
      setPage(1);
    } else {
      setFilteredReferrals([]);
      setPage(1);
    }
    setTeamLoading(false);
  };

  const currentMembers = teamCounts[selectedLevel]?.members || [];
  const totalPages = Math.ceil(currentMembers.length / PAGE_SIZE);
  const paginatedReferrals = currentMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <h1 className="text-2xl font-bold text-white">Referral Program</h1>
        <p className="text-zinc-400 text-sm mt-1">Invite friends and earn 10% bonus</p>
      </div>

      {/* Referral Link */}
      <Card title="Your Referral Link">
        <div className="space-y-4">
          <div className="bg-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500 mb-1">Referral Code</p>
            <p className="text-xl font-bold text-blue-400">{referralCode}</p>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500 mb-1">Referral Link</p>
            <p className="text-sm text-zinc-300 font-mono break-all">{referralLink}</p>
          </div>

          <div className="flex gap-3">
            <Button variant="primary" className="flex-1" onClick={copyLink}>
              <Icon name={copied ? "check" : "copy"} size={16} />
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => window.open(`https://wa.me/?text=Join CryptoEarnerX and earn crypto! ${referralLink}`, "_blank")}>
              <Icon name="send" size={16} />
              Share
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-xs text-zinc-500">Total Team</p>
          <p className="text-2xl font-bold text-white mt-1">{totalTeam}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Active (L1)</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.activeReferrals}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Earned</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{formatPOL(stats.totalEarned)} POL</p>
        </Card>
      </div>

      {/* Team Summary */}
      <Card title="Team Summary">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((level) => (
            <div key={level} className="bg-zinc-800/50 rounded-lg p-3 text-center">
              <p className="text-xs text-zinc-500">Level {level}</p>
              <p className="text-xl font-bold text-blue-400 mt-1">{teamCounts[level]?.count || 0}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">
                {level === 1 ? "Direct" : `L${level} deep`}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Referral List with Dropdown */}
      <Card title="Your Referrals">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-zinc-400 shrink-0">Select Level:</span>
          <div className="relative flex-1">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(Number(e.target.value))}
              className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value={1}>Level 1 - Direct Referrals ({teamCounts[1]?.count || 0})</option>
              <option value={2}>Level 2 - Referrals of Referrals ({teamCounts[2]?.count || 0})</option>
              <option value={3}>Level 3 - 3 Levels Deep ({teamCounts[3]?.count || 0})</option>
              <option value={4}>Level 4 - 4 Levels Deep ({teamCounts[4]?.count || 0})</option>
              <option value={5}>Level 5 - 5 Levels Deep ({teamCounts[5]?.count || 0})</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon name="chevronDown" size={16} className="text-zinc-400" />
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-500 mb-3">
          Showing {currentMembers.length} members at Level {selectedLevel}
        </p>

        {teamLoading ? (
          <div className="text-center py-8">
            <Icon name="refresh" size={20} className="text-zinc-600 mx-auto mb-2 animate-spin" />
            <p className="text-zinc-400 text-sm">Loading...</p>
          </div>
        ) : currentMembers.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="users" size={32} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">No members at this level yet. Share your link!</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paginatedReferrals.map((ref: any) => (
                <div key={ref.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${ref.is_active ? "bg-green-400" : "bg-zinc-500"}`} />
                    <div>
                      <p className="text-sm text-white">{ref.name || ref.email}</p>
                      <p className="text-xs text-zinc-500">Joined {new Date(ref.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400 capitalize">{ref.rank}</span>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, currentMembers.length)} of {currentMembers.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-zinc-800 rounded text-xs text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1 text-xs text-zinc-400">{page}/{totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-zinc-800 rounded text-xs text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
