"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";
import { PACKAGES } from "@/lib/constants";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [wallets, setWallets] = useState<Record<string, any>>({});
  const [investments, setInvestments] = useState<Record<string, any[]>>({});
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"users" | "appeals">("users");
  const [banModal, setBanModal] = useState<{ userId: string; userName: string } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [appealNote, setAppealNote] = useState("");
  const [detailUser, setDetailUser] = useState<any>(null);
  const [activateModal, setActivateModal] = useState<{ userId: string; userName: string } | null>(null);
  const [activatePkg, setActivatePkg] = useState("starter");
  const [activateAmount, setActivateAmount] = useState("");
  const [activating, setActivating] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [usersRes, appealsRes, investRes] = await Promise.all([
      supabase.from("users").select("*").order("created_at", { ascending: false }),
      supabase.from("ban_appeals").select("*, users!ban_appeals_user_id_fkey(name, email)").order("created_at", { ascending: false }),
      supabase.from("investments").select("*").eq("status", "active"),
    ]);

    const userList = usersRes.data || [];
    setUsers(userList);
    setAppeals(appealsRes.data || []);

    const walletMap: Record<string, any> = {};
    const investMap: Record<string, any[]> = {};

    if (userList.length > 0) {
      const walletRes = await supabase.from("wallet").select("*").in("user_id", userList.map((u) => u.id));
      (walletRes.data || []).forEach((w) => { walletMap[w.user_id] = w; });
    }

    (investRes.data || []).forEach((inv) => {
      if (!investMap[inv.user_id]) investMap[inv.user_id] = [];
      investMap[inv.user_id].push(inv);
    });

    setWallets(walletMap);
    setInvestments(investMap);
    setLoading(false);
  };

  const banUser = async () => {
    if (!banModal || !banReason.trim()) return;
    await supabase.from("users").update({
      is_banned: true, ban_reason: banReason.trim(), banned_at: new Date().toISOString(),
    }).eq("id", banModal.userId);
    setBanModal(null); setBanReason(""); loadData();
  };

  const unbanUser = async (userId: string) => {
    await supabase.from("users").update({ is_banned: false, ban_reason: "", banned_at: null }).eq("id", userId);
    loadData();
  };

  const toggleAdmin = async (userId: string, currentAdmin: boolean) => {
    await supabase.from("users").update({ is_admin: !currentAdmin }).eq("id", userId);
    loadData();
  };

  const reviewAppeal = async (appealId: string, status: "approved" | "rejected") => {
    const appeal = appeals.find((a) => a.id === appealId);
    if (!appeal) return;
    await supabase.from("ban_appeals").update({ status, admin_note: appealNote.trim(), reviewed_at: new Date().toISOString() }).eq("id", appealId);
    if (status === "approved") {
      await supabase.from("users").update({ is_banned: false, ban_reason: "", banned_at: null }).eq("id", appeal.user_id);
    }
    setAppealNote(""); loadData();
  };

  const activatePackage = async () => {
    if (!activateModal || !activateAmount) return;
    setActivating(true);
    const amount = parseFloat(activateAmount);
    const pkg = PACKAGES.find((p) => p.type === activatePkg);
    if (!pkg || amount < pkg.minInvest || amount > pkg.maxInvest) {
      setActivating(false);
      return;
    }

    const res = await fetch("/api/wallet/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: activateModal.userId, amount, packageType: activatePkg }),
    });
    const data = await res.json();

    if (data.success) {
      await fetch("/api/mlm/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investorId: activateModal.userId, amount }),
      });
    }

    setActivateModal(null); setActivateAmount(""); setActivating(false); loadData();
  };

  const filtered = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingAppeals = appeals.filter((a) => a.status === "pending");

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-zinc-400 text-sm mt-1">{users.length} users &middot; {pendingAppeals.length} pending appeals</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("users")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "users" ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>
          Users ({users.length})
        </button>
        <button onClick={() => setTab("appeals")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${tab === "appeals" ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>
          Appeals ({pendingAppeals.length})
          {pendingAppeals.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">{pendingAppeals.length}</span>}
        </button>
      </div>

      {tab === "users" && (
        <>
          <div className="relative">
            <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left p-3 text-zinc-400 font-medium">User</th>
                    <th className="text-left p-3 text-zinc-400 font-medium">Balance</th>
                    <th className="text-left p-3 text-zinc-400 font-medium">CEX</th>
                    <th className="text-left p-3 text-zinc-400 font-medium">Package</th>
                    <th className="text-left p-3 text-zinc-400 font-medium">Joined</th>
                    <th className="text-left p-3 text-zinc-400 font-medium">Status</th>
                    <th className="text-right p-3 text-zinc-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => {
                    const w = wallets[user.id];
                    const pkg = investments[user.id]?.[0];
                    return (
                      <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="p-3">
                          <div>
                            <p className="text-white">{user.name || "N/A"}</p>
                            <p className="text-xs text-zinc-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="p-3 text-zinc-300">{formatPOL(w?.balance || 0)} POL</td>
                        <td className="p-3 text-purple-400">{(w?.bonus_balance || 0).toLocaleString()}</td>
                        <td className="p-3">
                          {pkg ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-400 capitalize">{pkg.package_type}</span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-zinc-700 text-zinc-400">None</span>
                          )}
                        </td>
                        <td className="p-3 text-xs text-zinc-500">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          {user.is_banned ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-400">Banned</span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-400">Active</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setDetailUser(user)} className="px-2 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs transition-colors">View</button>
                            <button onClick={() => setActivateModal({ userId: user.id, userName: user.name || user.email })} className="px-2 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-xs transition-colors">Activate</button>
                            {user.is_banned ? (
                              <button onClick={() => unbanUser(user.id)} className="px-2 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-xs transition-colors">Unban</button>
                            ) : (
                              <button onClick={() => setBanModal({ userId: user.id, userName: user.name || user.email })} className="px-2 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs transition-colors">Ban</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === "appeals" && (
        <div className="space-y-4">
          {appeals.length === 0 ? (
            <Card><div className="text-center py-8"><Icon name="check" size={32} className="text-zinc-600 mx-auto mb-2" /><p className="text-zinc-400 text-sm">No appeals yet</p></div></Card>
          ) : appeals.map((appeal) => (
            <Card key={appeal.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-medium">{appeal.users?.name || appeal.users?.email || "Unknown"}</p>
                  <p className="text-xs text-zinc-500">{appeal.users?.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${appeal.status === "approved" ? "bg-green-500/10 text-green-400" : appeal.status === "rejected" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"}`}>{appeal.status}</span>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 mb-3"><p className="text-sm text-zinc-300">{appeal.reason}</p></div>
              {appeal.admin_note && <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-3"><p className="text-xs text-zinc-500 mb-1">Admin Response:</p><p className="text-sm text-zinc-300">{appeal.admin_note}</p></div>}
              {appeal.status === "pending" && (
                <div className="flex gap-2">
                  <input type="text" placeholder="Admin note (optional)..." value={appealNote} onChange={(e) => setAppealNote(e.target.value)} className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <button onClick={() => reviewAppeal(appeal.id, "approved")} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg">Approve</button>
                  <button onClick={() => reviewAppeal(appeal.id, "rejected")} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg">Reject</button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* User Detail Modal */}
      {detailUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDetailUser(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">User Details</h3>
              <button onClick={() => setDetailUser(null)} className="text-zinc-400 hover:text-white"><Icon name="x" size={20} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Name</p>
                  <p className="text-sm text-white font-medium">{detailUser.name || "N/A"}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Email</p>
                  <p className="text-sm text-white font-medium">{detailUser.email}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Referral Code</p>
                  <p className="text-sm text-blue-400 font-medium">{detailUser.referral_code}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Rank</p>
                  <p className="text-sm text-white font-medium capitalize">{detailUser.rank}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">POL Balance</p>
                  <p className="text-sm text-green-400 font-medium">{formatPOL(wallets[detailUser.id]?.balance || 0)} POL</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Bonus Balance</p>
                  <p className="text-sm text-purple-400 font-medium">{(wallets[detailUser.id]?.bonus_balance || 0).toLocaleString()} CEX</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Locked CEX</p>
                  <p className="text-sm text-amber-400 font-medium">{(wallets[detailUser.id]?.locked_bonus_balance || 0).toLocaleString()} CEX</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Total Deposited</p>
                  <p className="text-sm text-white font-medium">{formatPOL(wallets[detailUser.id]?.total_deposited || 0)} POL</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Total Invested</p>
                  <p className="text-sm text-white font-medium">{formatPOL(wallets[detailUser.id]?.total_invested || 0)} POL</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Total Withdrawn</p>
                  <p className="text-sm text-white font-medium">{formatPOL(wallets[detailUser.id]?.total_withdrawn || 0)} POL</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Left Volume</p>
                  <p className="text-sm text-blue-400 font-medium">{formatPOL(detailUser.left_volume || 0)}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Right Volume</p>
                  <p className="text-sm text-purple-400 font-medium">{formatPOL(detailUser.right_volume || 0)}</p>
                </div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-2">Joined</p>
                <p className="text-sm text-white">{new Date(detailUser.created_at).toLocaleString()}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-2">Active Package</p>
                {investments[detailUser.id]?.length > 0 ? (
                  <div className="space-y-2">
                    {investments[detailUser.id].map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between">
                        <span className="text-sm text-white capitalize">{inv.package_type}</span>
                        <span className="text-sm text-green-400">{formatPOL(inv.amount)} POL</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No active package</p>
                )}
              </div>
              {detailUser.is_banned && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-xs text-red-400 mb-1">Ban Reason</p>
                  <p className="text-sm text-red-300">{detailUser.ban_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activate Package Modal */}
      {activateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { setActivateModal(null); setActivateAmount(""); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-1">Activate Package</h3>
            <p className="text-sm text-zinc-400 mb-4">For <span className="text-white">{activateModal.userName}</span></p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Package</label>
                <select value={activatePkg} onChange={(e) => setActivatePkg(e.target.value)} className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                  {PACKAGES.map((p) => (
                    <option key={p.type} value={p.type}>{p.name} ({p.minInvest}-{p.maxInvest.toLocaleString()} POL, {p.dailyROI}% daily)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Amount (POL)</label>
                <input type="number" value={activateAmount} onChange={(e) => setActivateAmount(e.target.value)} placeholder={`Min ${PACKAGES.find((p) => p.type === activatePkg)?.minInvest}`} className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => { setActivateModal(null); setActivateAmount(""); }} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm">Cancel</button>
              <button onClick={activatePackage} disabled={activating || !activateAmount} className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium">
                {activating ? "Activating..." : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-1">Ban User</h3>
            <p className="text-sm text-zinc-400 mb-4">Ban <span className="text-white">{banModal.userName}</span>?</p>
            <textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Reason for ban..." rows={3} className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setBanModal(null); setBanReason(""); }} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm">Cancel</button>
              <button onClick={banUser} disabled={!banReason.trim()} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium">Ban User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
