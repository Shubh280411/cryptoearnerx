"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icons";

interface OTPRecord {
  id: string;
  email: string;
  purpose: string;
  verified: boolean;
  attempts: number;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
  is_used: boolean;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function OTPHistoryPage() {
  const [records, setRecords] = useState<OTPRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [purpose, setPurpose] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadRecords();
  }, [search, purpose, page]);

  const loadRecords = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (purpose) params.set("purpose", purpose);
    params.set("page", page.toString());

    const res = await fetch(`/api/admin/otp-history?${params}`);
    const data = await res.json();

    if (data.success) {
      setRecords(data.records);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            OTP History
          </h1>
          <p className="text-zinc-400 text-sm mt-1">All OTPs sent to users — {total} total</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={purpose}
          onChange={(e) => { setPurpose(e.target.value); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
        >
          <option value="">All Purposes</option>
          <option value="register">Registration</option>
          <option value="password_reset">Password Reset</option>
          <option value="withdrawal">Withdrawal</option>
        </select>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="loader" size={24} className="animate-spin text-zinc-400" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <Icon name="mail" size={32} className="mx-auto mb-3 text-zinc-600" />
            <p>No OTP records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="p-3 text-left text-zinc-400 font-medium">#</th>
                  <th className="p-3 text-left text-zinc-400 font-medium">Email</th>
                  <th className="p-3 text-left text-zinc-400 font-medium">Purpose</th>
                  <th className="p-3 text-left text-zinc-400 font-medium">Status</th>
                  <th className="p-3 text-left text-zinc-400 font-medium">Attempts</th>
                  <th className="p-3 text-left text-zinc-400 font-medium">Sent</th>
                  <th className="p-3 text-left text-zinc-400 font-medium">Expires</th>
                </tr>
              </thead>
              <tbody>
                {records.map((otp, i) => (
                  <tr key={otp.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="p-3 text-zinc-500">{(page - 1) * 50 + i + 1}</td>
                    <td className="p-3 text-white font-medium">{otp.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 capitalize">
                        {otp.purpose === "register" ? "Registration" : otp.purpose?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3">
                      {otp.is_used ? (
                        <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-400 flex items-center gap-1 w-fit">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Verified
                        </span>
                      ) : otp.is_expired ? (
                        <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 flex items-center gap-1 w-fit">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                          Expired
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400 flex items-center gap-1 w-fit">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-zinc-300">
                      {otp.attempts > 0 ? (
                        <span className={otp.attempts >= 5 ? "text-red-400" : "text-zinc-300"}>
                          {otp.attempts}/5
                        </span>
                      ) : (
                        <span className="text-zinc-600">0</span>
                      )}
                    </td>
                    <td className="p-3 text-zinc-400 text-xs">{timeAgo(otp.created_at)}</td>
                    <td className="p-3 text-zinc-400 text-xs">
                      {otp.is_expired ? (
                        <span className="text-red-400">{timeAgo(otp.expires_at)}</span>
                      ) : (
                        <span className="text-zinc-400">{timeAgo(otp.expires_at)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </Button>
          <span className="text-zinc-400 text-sm px-3">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
