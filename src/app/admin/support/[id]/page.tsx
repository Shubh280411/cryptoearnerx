"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";

export default function AdminTicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    const [ticketRes, msgRes] = await Promise.all([
      supabase.from("support_tickets").select("*, users!inner(email, name)").eq("id", ticketId).single(),
      supabase.from("support_messages").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true }),
    ]);
    setTicket(ticketRes.data);
    setMessages(msgRes.data || []);
    setLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("support_messages").insert({
      ticket_id: ticketId,
      sender_id: user.id,
      message: newMessage,
      is_admin: true,
    });

    setNewMessage("");
    loadTicket();
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading ticket...
        </div>
      </div>
    );
  }

  if (!ticket) return <div className="text-center py-12 text-zinc-400">Ticket not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href="/admin/support" className="text-zinc-400 hover:text-white">
          <Icon name="arrowLeft" size={20} />
        </a>
        <div>
          <h1 className="text-xl font-bold text-white">{ticket.subject}</h1>
          <p className="text-xs text-zinc-500">From: {ticket.users?.name || ticket.users?.email} - {ticket.category}</p>
        </div>
      </div>

      <Card>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className={`p-3 rounded-lg ${msg.is_admin ? "bg-blue-600/10 border border-blue-600/20 ml-8" : "bg-zinc-800/50 mr-8"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium ${msg.is_admin ? "text-blue-400" : "text-zinc-400"}`}>
                  {msg.is_admin ? "Admin" : "User"}
                </span>
                <span className="text-xs text-zinc-600">{new Date(msg.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-zinc-300">{msg.message}</p>
            </div>
          ))}
        </div>
      </Card>

      {ticket.status !== "closed" && (
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your reply..."
            className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit" variant="primary" disabled={sending || !newMessage.trim()}>
            <Icon name="send" size={16} />
            Reply
          </Button>
        </form>
      )}
    </div>
  );
}
