"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeposits();
  }, []);

  const loadDeposits = async () => {
    const { data } = await supabase.from("crypto_wallets").select("id, address, network, status, derivation_index, created_at, user_id, users!inner(email, name)").order("created_at", { ascending: false });
    setDeposits(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading deposits...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Deposit Addresses</h1>
        <p className="text-zinc-400 text-sm mt-1">All user deposit addresses</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-3 text-zinc-400 font-medium">User</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Address</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Network</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Status</th>
                <th className="text-left p-3 text-zinc-400 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((dep) => (
                <tr key={dep.id} className="border-b border-zinc-800/50">
                  <td className="p-3">
                    <p className="text-white">{dep.users?.name || "N/A"}</p>
                    <p className="text-xs text-zinc-500">{dep.users?.email}</p>
                  </td>
                  <td className="p-3 font-mono text-xs text-zinc-300">{dep.address?.slice(0, 20)}...</td>
                  <td className="p-3 text-zinc-300 capitalize">{dep.network}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${dep.status === "active" ? "bg-green-500/10 text-green-400" : "bg-zinc-700 text-zinc-400"}`}>
                      {dep.status}
                    </span>
                  </td>
                  <td className="p-3 text-zinc-500 text-xs">{new Date(dep.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
