"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"users" | "appeals">("users");
  const [banModal, setBanModal] = useState<{ userId: string; userName: string } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [appealNote, setAppealNote] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [usersRes, appealsRes] = await Promise.all([
      supabase.from("users").select("*").order("created_at", { ascending: false }),
      supabase.from("ban_appeals").select("*, users!ban_appeals_user_id_fkey(name, email)").order("created_at", { ascending: false }),
    ]);
    setUsers(usersRes.data || []);
    setAppeals(appealsRes.data || []);
    setLoading(false);
  };

  const banUser = async () => {
    if (!banModal || !banReason.trim()) return;
    await supabase.from("users").update({
      is_banned: true,
      ban_reason: banReason.trim(),
      banned_at: new Date().toISOString(),
    }).eq("id", banModal.userId);
    setBanModal(null);
    setBanReason("");
    loadData();
  };

  const unbanUser = async (userId: string) => {
    await supabase.from("users").update({
      is_banned: false,
      ban_reason: "",
      banned_at: null,
    }).eq("id", userId);
    loadData();
  };

  const toggleAdmin = async (userId: string, currentAdmin: boolean) => {
    await supabase.from("users").update({ is_admin: !currentAdmin }).eq("id", userId);
    loadData();
  };

  const reviewAppeal = async (appealId: string, status: "approved" | "rejected") => {
    const appeal = appeals.find((a) => a.id === appealId);
    if (!appeal) return;

    await supabase.from("ban_appeals").update({
      status,
      admin_note: appealNote.trim(),
      reviewed_at: new Date().toISOString(),
    }).eq("id", appealId);

    if (status === "approved") {
      await supabase.from("users").update({
        is_banned: false,
        ban_reason: "",
        banned_at: null,
      }).eq("id", appeal.user_id);
    }

    setAppealNote("");
    loadData();
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

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "users" ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setTab("appeals")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
            tab === "appeals" ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          Appeals ({pendingAppeals.length})
          {pendingAppeals.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              {pendingAppeals.length}
            </span>
          )}
        </button>
      </div>

      {/* Users Tab */}
      {tab === "users" && (
        <>
          <div className="relative">
            <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left p-3 text-zinc-400 font-medium">User</th>
                    <th className="text-left p-3 text-zinc-400 font-medium">Rank</th>
                    <th className="text-left p-3 text-zinc-400 font-medium">Volume</th>
                    <th className="text-left p-3 text-zinc-400 font-medium">Status</th>
                    <th className="text-left p-3 text-zinc-400 font-medium">Role</th>
                    <th className="text-right p-3 text-zinc-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="p-3">
                        <div>
                          <p className="text-white">{user.name || "N/A"}</p>
                          <p className="text-xs text-zinc-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-3 capitalize text-zinc-300">{user.rank}</td>
                      <td className="p-3 text-zinc-300">
                        {formatPOL(user.left_volume || 0)} / {formatPOL(user.right_volume || 0)}
                      </td>
                      <td className="p-3">
                        {user.is_banned ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-400">
                            Banned
                          </span>
                        ) : user.is_active ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-400">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-zinc-700 text-zinc-400">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${user.is_admin ? "bg-red-500/10 text-red-400" : "bg-zinc-700 text-zinc-400"}`}>
                          {user.is_admin ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.is_banned ? (
                            <button
                              onClick={() => unbanUser(user.id)}
                              className="px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-xs font-medium transition-colors"
                            >
                              Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => setBanModal({ userId: user.id, userName: user.name || user.email })}
                              className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-colors"
                            >
                              Ban
                            </button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => toggleAdmin(user.id, user.is_admin)}>
                            {user.is_admin ? "Remove Admin" : "Make Admin"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Appeals Tab */}
      {tab === "appeals" && (
        <div className="space-y-4">
          {appeals.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <Icon name="check" size={32} className="text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">No appeals yet</p>
              </div>
            </Card>
          ) : (
            appeals.map((appeal) => (
              <Card key={appeal.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-medium">{appeal.users?.name || appeal.users?.email || "Unknown"}</p>
                    <p className="text-xs text-zinc-500">{appeal.users?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      appeal.status === "approved" ? "bg-green-500/10 text-green-400" :
                      appeal.status === "rejected" ? "bg-red-500/10 text-red-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      {appeal.status}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(appeal.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-3 mb-3">
                  <p className="text-sm text-zinc-300">{appeal.reason}</p>
                </div>

                {appeal.admin_note && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-3">
                    <p className="text-xs text-zinc-500 mb-1">Admin Response:</p>
                    <p className="text-sm text-zinc-300">{appeal.admin_note}</p>
                  </div>
                )}

                {appeal.status === "pending" && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Admin note (optional)..."
                      value={appealNote}
                      onChange={(e) => setAppealNote(e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => reviewAppeal(appeal.id, "approved")}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => reviewAppeal(appeal.id, "rejected")}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-1">Ban User</h3>
            <p className="text-sm text-zinc-400 mb-4">Ban <span className="text-white">{banModal.userName}</span>? They will be redirected to the suspended page.</p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Reason for ban..."
              rows={3}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setBanModal(null); setBanReason(""); }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={banUser}
                disabled={!banReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
