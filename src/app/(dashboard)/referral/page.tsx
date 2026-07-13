"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function ReferralPage() {
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [stats, setStats] = useState({ totalReferrals: 0, activeReferrals: 0, totalEarned: 0 });
  const [allReferrals, setAllReferrals] = useState<any[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, []);

  useEffect(() => {
    filterReferrals();
  }, [selectedLevel, allReferrals]);

  const loadReferralData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase.from("users").select("referral_code").eq("id", user.id).single();
    if (userData) {
      setReferralCode(userData.referral_code || "");
      setReferralLink(`${window.location.origin}/register?ref=${userData.referral_code}`);
    }

    const [refRes, earnRes] = await Promise.all([
      supabase.from("users").select("id, name, email, rank, is_active, created_at, sponsor_id").eq("sponsor_id", user.id),
      supabase.from("transactions").select("amount").eq("user_id", user.id).eq("type", "referral_bonus"),
    ]);

    const refData = refRes.data || [];
    setAllReferrals(refData);
    setStats({
      totalReferrals: refData.length,
      activeReferrals: refData.filter((r) => r.is_active).length,
      totalEarned: (earnRes.data || []).reduce((s, t) => s + t.amount, 0),
    });
    setLoading(false);
  };

  const filterReferrals = async () => {
    if (selectedLevel === 0) {
      setFilteredReferrals(allReferrals);
      setPage(1);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let currentIds = [user.id];
    const levelReferrals: any[] = [];

    for (let level = 1; level <= selectedLevel; level++) {
      const { data: nextLevelUsers } = await supabase
        .from("users")
        .select("id, name, email, rank, is_active, created_at, sponsor_id")
        .in("sponsor_id", currentIds);

      if (!nextLevelUsers || nextLevelUsers.length === 0) break;

      if (level === selectedLevel) {
        levelReferrals.push(...nextLevelUsers);
      }
      currentIds = nextLevelUsers.map((u) => u.id);
    }

    setFilteredReferrals(levelReferrals);
    setPage(1);
  };

  const totalPages = Math.ceil(filteredReferrals.length / PAGE_SIZE);
  const paginatedReferrals = filteredReferrals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          <p className="text-xs text-zinc-500">Total Referrals</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.totalReferrals}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Active</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.activeReferrals}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Earned</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{formatPOL(stats.totalEarned)} POL</p>
        </Card>
      </div>

      {/* Level Filter */}
      <Card title="Your Referrals">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-zinc-400">Filter by level:</span>
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedLevel === level
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {level === 0 ? "All" : `L${level}`}
            </button>
          ))}
        </div>

        {filteredReferrals.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="users" size={32} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">No referrals at this level. Share your link!</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paginatedReferrals.map((ref) => (
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
                  Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredReferrals.length)} of {filteredReferrals.length}
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
