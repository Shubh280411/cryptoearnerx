"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    const { data } = await supabase.from("withdrawals").select("*, users!inner(email, name)").order("created_at", { ascending: false });
    setWithdrawals(data || []);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const res = await fetch("/api/admin/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId: id, action: "approve" }),
    });
    const data = await res.json();
    if (data.success) {
      alert(`Approved! Send ${data.amount} POL to:\n${data.walletAddress}`);
    }
    loadWithdrawals();
  };

  const handleReject = async (id: string) => {
    const res = await fetch("/api/admin/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId: id, action: "reject" }),
    });
    const data = await res.json();
    if (data.success) {
      alert("Rejected! Funds returned to user.");
    }
    loadWithdrawals();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-400";
      case "pending": return "bg-amber-500/10 text-amber-400";
      case "processing": return "bg-blue-500/10 text-blue-400";
      case "rejected": return "bg-red-500/10 text-red-400";
      default: return "bg-zinc-700 text-zinc-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading withdrawals...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Withdrawal Requests</h1>
        <p className="text-zinc-400 text-sm mt-1">{withdrawals.filter((w) => w.status === "pending").length} pending requests</p>
      </div>

      <Card>
        {withdrawals.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="upload" size={32} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">No withdrawal requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-3 text-zinc-400 font-medium">User</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Amount</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Wallet</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Status</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Date</th>
                  <th className="text-right p-3 text-zinc-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((wd) => (
                  <tr key={wd.id} className="border-b border-zinc-800/50">
                    <td className="p-3">
                      <p className="text-white">{wd.users?.name || "N/A"}</p>
                      <p className="text-xs text-zinc-500">{wd.users?.email}</p>
                    </td>
                    <td className="p-3 text-white font-medium">{formatPOL(wd.amount)} POL</td>
                    <td className="p-3 font-mono text-xs text-zinc-300">{wd.wallet_address?.slice(0, 16)}...</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(wd.status)}`}>{wd.status}</span>
                    </td>
                    <td className="p-3 text-zinc-500 text-xs">{new Date(wd.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      {wd.status === "pending" && (
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="success" size="sm" onClick={() => handleApprove(wd.id)}>Approve</Button>
                          <Button variant="danger" size="sm" onClick={() => handleReject(wd.id)}>Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
