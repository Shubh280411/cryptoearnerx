"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function ReferralPage() {
  const [userId, setUserId] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [stats, setStats] = useState({ totalReferrals: 0, activeReferrals: 0, totalEarned: 0 });
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [teamCounts, setTeamCounts] = useState<Record<number, { members: any[]; count: number }>>({});
  const [totalTeam, setTotalTeam] = useState(0);
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: userData } = await supabase.from("users").select("referral_code").eq("id", user.id).single();
    if (userData) {
      setReferralCode(userData.referral_code || "");
      setReferralLink(`${window.location.origin}/register?ref=${userData.referral_code}`);
    }

    const res = await fetch("/api/team-referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    const data = await res.json();

    if (data.success) {
      setTeamCounts(data.teamCounts);
      setTotalTeam(data.totalTeam);
      setStats({
        totalReferrals: data.totalReferrals,
        activeReferrals: data.activeReferrals,
        totalEarned: data.totalEarned,
      });
    }
    setLoading(false);
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

      {/* Referral List with Dropdown */}
      <Card title="Your Referrals">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-zinc-400 shrink-0">Select Level:</span>
          <div className="relative flex-1">
            <select
              value={selectedLevel}
              onChange={(e) => { setSelectedLevel(Number(e.target.value)); setPage(1); }}
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

        {currentMembers.length === 0 ? (
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
