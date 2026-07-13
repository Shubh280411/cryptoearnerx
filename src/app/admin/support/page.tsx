"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    const { data } = await supabase.from("support_tickets").select("*, users!inner(email, name)").order("created_at", { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("support_tickets").update({ status }).eq("id", id);
    loadTickets();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-500/10 text-green-400";
      case "pending": return "bg-amber-500/10 text-amber-400";
      case "resolved": return "bg-blue-500/10 text-blue-400";
      case "closed": return "bg-zinc-700 text-zinc-400";
      default: return "bg-zinc-700 text-zinc-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading tickets...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
        <p className="text-zinc-400 text-sm mt-1">{tickets.filter((t) => t.status === "open").length} open tickets</p>
      </div>

      <Card>
        {tickets.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="headphones" size={32} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">No support tickets</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-4 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-white font-medium">{ticket.subject}</h3>
                    <p className="text-xs text-zinc-500">{ticket.users?.name || ticket.users?.email} - {ticket.category}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                </div>
                <p className="text-xs text-zinc-500 mb-3">{new Date(ticket.created_at).toLocaleString()}</p>
                <div className="flex gap-2">
                  {ticket.status !== "pending" && (
                    <Button variant="ghost" size="sm" onClick={() => updateStatus(ticket.id, "pending")}>Mark Pending</Button>
                  )}
                  {ticket.status !== "resolved" && (
                    <Button variant="ghost" size="sm" onClick={() => updateStatus(ticket.id, "resolved")}>Resolve</Button>
                  )}
                  {ticket.status !== "closed" && (
                    <Button variant="ghost" size="sm" onClick={() => updateStatus(ticket.id, "closed")}>Close</Button>
                  )}
                  <a href={`/admin/support/${ticket.id}`}>
                    <Button variant="ghost" size="sm">View Chat</Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
