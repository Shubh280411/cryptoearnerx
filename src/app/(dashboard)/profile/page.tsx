"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const authUser = session.user;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userError) {
        console.error("User fetch error:", userError);
      }

      if (userData) {
        setUser(userData);
        setName(userData.name || "");
        setEmail(userData.email || authUser.email || "");
        setReferralCode(userData.referral_code || "");
      } else {
        setEmail(authUser.email || "");
      }

      const { data: walletData } = await supabase
        .from("wallet")
        .select("balance, total_invested")
        .eq("user_id", authUser.id)
        .single();

      if (walletData) {
        setWalletBalance(walletData.balance || 0);
        setTotalInvested(walletData.total_invested || 0);
      }
    } catch (err) {
      console.error("Profile load error:", err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error: updateError } = await supabase
        .from("users")
        .update({ name })
        .eq("id", session.user.id);

      if (updateError) {
        setError("Failed to update profile: " + updateError.message);
      } else {
        setSuccess("Profile updated successfully!");
        setUser((prev: any) => ({ ...prev, name }));
      }
    } catch (err) {
      setError("Something went wrong");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-zinc-400 text-sm mt-1">Manage your account information</p>
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

      {/* Profile Card */}
      <Card title="Personal Information">
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {name ? name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <p className="text-white font-bold text-lg">{name || "User"}</p>
              <p className="text-zinc-400 text-sm">{email}</p>
            </div>
          </div>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" value={email} disabled />
          <Input label="Referral Code" value={referralCode} disabled />
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>

      {/* Account Stats */}
      <Card title="Account Stats">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-xs text-zinc-500">Rank</p>
            <p className="text-lg font-bold text-white capitalize mt-1">{user?.rank || "Member"}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-xs text-zinc-500">Member Since</p>
            <p className="text-lg font-bold text-white mt-1">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-xs text-zinc-500">Wallet Balance</p>
            <p className="text-lg font-bold text-green-400 mt-1">{formatPOL(walletBalance)} POL</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-xs text-zinc-500">Total Invested</p>
            <p className="text-lg font-bold text-blue-400 mt-1">{formatPOL(totalInvested)} POL</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-xs text-zinc-500">Left Volume</p>
            <p className="text-lg font-bold text-blue-400 mt-1">{formatPOL(user?.left_volume || 0)} POL</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-xs text-zinc-500">Right Volume</p>
            <p className="text-lg font-bold text-purple-400 mt-1">{formatPOL(user?.right_volume || 0)} POL</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
