"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icons";

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Tickets fetch error:", error);
      }

      setTickets(data || []);
    } catch (err) {
      console.error("Load tickets error:", err);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("Not authenticated");
        setSubmitting(false);
        return;
      }

      if (!subject.trim()) {
        setError("Subject is required");
        setSubmitting(false);
        return;
      }

      if (!message.trim()) {
        setError("Message is required");
        setSubmitting(false);
        return;
      }

      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          user_id: session.user.id,
          subject: subject.trim(),
          category,
          status: "open",
        })
        .select()
        .single();

      if (ticketError) {
        console.error("Ticket create error:", ticketError);
        setError("Failed to create ticket: " + ticketError.message);
        setSubmitting(false);
        return;
      }

      if (ticket) {
        const { error: msgError } = await supabase.from("support_messages").insert({
          ticket_id: ticket.id,
          sender_id: session.user.id,
          message: message.trim(),
          is_admin: false,
        });

        if (msgError) {
          console.error("Message insert error:", msgError);
        }
      }

      setSuccess("Ticket created successfully!");
      setSubject("");
      setMessage("");
      setShowForm(false);
      loadTickets();
    } catch (err) {
      console.error("Create ticket error:", err);
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
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
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Support</h1>
          <p className="text-zinc-400 text-sm mt-1">Get help with your account</p>
        </div>
        <Button variant="primary" onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}>
          {showForm ? "Cancel" : "New Ticket"}
        </Button>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400 flex items-center gap-2">
          <Icon name="check" size={18} />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 flex items-center gap-2">
          <Icon name="alertTriangle" size={18} />
          {error}
        </div>
      )}

      {/* Create Ticket Form */}
      {showForm && (
        <Card title="Create Support Ticket">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Subject"
              placeholder="Brief description of your issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="investment">Investment</option>
                <option value="account">Account</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue in detail..."
                rows={4}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Creating..." : "Create Ticket"}
            </Button>
          </form>
        </Card>
      )}

      {/* Ticket List */}
      <Card title="Your Tickets">
        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="headphones" size={48} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 mb-4">No support tickets</p>
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Create First Ticket
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <a
                key={ticket.id}
                href={`/support/${ticket.id}`}
                className="block p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name="headphones" size={18} className="text-zinc-400" />
                    <div>
                      <p className="text-sm text-white font-medium">{ticket.subject}</p>
                      <p className="text-xs text-zinc-500 capitalize">{ticket.category} - {new Date(ticket.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
