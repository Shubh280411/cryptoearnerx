"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";

export default function BannedPage() {
  const router = useRouter();
  const [banReason, setBanReason] = useState("");
  const [appealText, setAppealText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingAppeal, setExistingAppeal] = useState<any>(null);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    loadBanInfo();
  }, []);

  const loadBanInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    setUserEmail(user.email || "");

    const { data } = await supabase
      .from("users")
      .select("ban_reason")
      .eq("id", user.id)
      .single();

    if (data?.ban_reason) setBanReason(data.ban_reason);

    const { data: appeal } = await supabase
      .from("ban_appeals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (appeal) setExistingAppeal(appeal);
    setLoading(false);
  };

  const handleAppeal = async () => {
    if (!appealText.trim()) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("ban_appeals").insert({
      user_id: user.id,
      reason: appealText.trim(),
      status: "pending",
    });

    if (!error) {
      setSubmitted(true);
      setAppealText("");
      loadBanInfo();
    }
    setSubmitting(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Image src="/logo.png" alt="CryptoEarnerX" width={64} height={64} className="rounded-2xl mx-auto mb-6" />

        <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Account Suspended</h1>
        <p className="text-zinc-400 mb-2">Your account has been suspended.</p>
        <p className="text-zinc-500 text-sm mb-6">{userEmail}</p>

        {banReason && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-red-400 mb-1">Reason:</p>
            <p className="text-sm text-zinc-300">{banReason}</p>
          </div>
        )}

        {/* Appeal Section */}
        {existingAppeal ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6 text-left">
            <p className="text-sm font-medium text-zinc-300 mb-2">Your Appeal Status</p>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${
                existingAppeal.status === "approved" ? "bg-green-400" :
                existingAppeal.status === "rejected" ? "bg-red-400" : "bg-yellow-400"
              }`} />
              <span className="text-sm text-white capitalize font-medium">{existingAppeal.status}</span>
              <span className="text-xs text-zinc-500 ml-auto">
                {new Date(existingAppeal.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-zinc-400 mb-2">{existingAppeal.reason}</p>
            {existingAppeal.admin_note && (
              <div className="bg-zinc-800 rounded-lg p-3 mt-2">
                <p className="text-xs text-zinc-500 mb-1">Admin Response:</p>
                <p className="text-sm text-zinc-300">{existingAppeal.admin_note}</p>
              </div>
            )}
            {existingAppeal.status === "rejected" && (
              <button
                onClick={() => setExistingAppeal(null)}
                className="mt-3 text-sm text-blue-400 hover:text-blue-300"
              >
                Submit New Appeal
              </button>
            )}
          </div>
        ) : submitted ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
            <p className="text-green-400 text-sm">Appeal submitted! We will review it shortly.</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6 text-left">
            <p className="text-sm font-medium text-zinc-300 mb-2">Submit Appeal</p>
            <p className="text-xs text-zinc-500 mb-3">Explain why you believe your account should be reinstated.</p>
            <textarea
              value={appealText}
              onChange={(e) => setAppealText(e.target.value)}
              placeholder="Write your appeal here..."
              rows={4}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
            <button
              onClick={handleAppeal}
              disabled={submitting || !appealText.trim()}
              className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Appeal"}
            </button>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
