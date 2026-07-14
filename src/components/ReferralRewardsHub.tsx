"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icons";

interface TierData {
  level: number;
  name: string;
  sublabel: string;
  color: string;
  cexEarned: number;
  teamMembers: number;
}

const TIERS: Omit<TierData, "cexEarned" | "teamMembers">[] = [
  { level: 1, name: "L1 Referrals", sublabel: "Direct Referrals", color: "#a78bfa" },
  { level: 2, name: "L2 Network", sublabel: "Indirect Referrals", color: "#60a5fa" },
  { level: 3, name: "L3 Network", sublabel: "Level 3 Team", color: "#fbbf24" },
  { level: 4, name: "L4 Network", sublabel: "Level 4 Team", color: "#22c55e" },
  { level: 5, name: "L5 Network", sublabel: "Level 5 Team", color: "#f472b6" },
];

export function ReferralRewardsHub() {
  const [tiers, setTiers] = useState<TierData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTierData();
  }, []);

  const loadTierData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const tierResults: TierData[] = [];

    let currentIds = [user.id];

    for (let level = 1; level <= 5; level++) {
      const { data: nextUsers } = await supabase
        .from("users")
        .select("id")
        .in("sponsor_id", currentIds);

      const nextIds = (nextUsers || []).map((u) => u.id);
      const teamCount = nextIds.length;

      let cexEarned = 0;
      if (nextIds.length > 0) {
        const { data: txs } = await supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", user.id)
          .eq("type", "registration_bonus")
          .eq("status", "completed");

        if (txs) {
          const levelBonus: Record<number, number> = { 1: 50, 2: 40, 3: 30, 4: 20, 5: 10 };
          const bonusPerMember = levelBonus[level] || 0;
          const l1Count = tierResults[0]?.teamMembers || (level === 1 ? teamCount : 0);
          cexEarned = level === 1 ? l1Count * bonusPerMember : 0;
        }

        if (level === 1) {
          const { data: l1Txs } = await supabase
            .from("transactions")
            .select("amount")
            .eq("user_id", user.id)
            .eq("type", "registration_bonus")
            .eq("status", "completed");
          cexEarned = (l1Txs || []).reduce((sum, tx) => sum + (tx.amount || 0), 0);
        }
      }

      tierResults.push({
        ...TIERS[level - 1],
        cexEarned,
        teamMembers: teamCount,
      });

      currentIds = nextIds;
    }

    setTiers(tierResults);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <Icon name="refresh" size={16} className="animate-spin" />
          Loading rewards...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-purple-500/20 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
          <Icon name="users" size={16} className="text-purple-400" />
        </div>
        <h3
          style={{
            fontSize: "9px",
            fontWeight: 800,
            letterSpacing: "1.5px",
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
          }}
        >
          Referral Rewards Hub
        </h3>
      </div>

      <div className="space-y-2.5">
        {tiers.map((tier) => (
          <div
            key={tier.level}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              padding: "14px 18px",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: `${tier.color}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  color: tier.color,
                  fontSize: "14px",
                  fontWeight: 900,
                  fontFamily: "Space Grotesk, sans-serif",
                }}
              >
                {tier.level}
              </span>
            </div>

            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 800,
                  fontFamily: "Space Grotesk, sans-serif",
                  color: tier.color,
                  lineHeight: 1.2,
                }}
              >
                {tier.name}
              </p>
              <p
                style={{
                  fontSize: "8px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  color: "rgba(255,255,255,0.2)",
                  marginTop: "2px",
                }}
              >
                {tier.sublabel}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "18px",
                marginLeft: "auto",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 900,
                    fontFamily: "Space Grotesk, sans-serif",
                    color: "#22c55e",
                    lineHeight: 1.2,
                  }}
                >
                  {tier.cexEarned.toLocaleString()}
                </p>
                <p
                  style={{
                    fontSize: "7px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "rgba(255,255,255,0.2)",
                    marginTop: "2px",
                  }}
                >
                  CEX Earned
                </p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 900,
                    fontFamily: "Space Grotesk, sans-serif",
                    color: "#60a5fa",
                    lineHeight: 1.2,
                  }}
                >
                  {tier.teamMembers}
                </p>
                <p
                  style={{
                    fontSize: "7px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "rgba(255,255,255,0.2)",
                    marginTop: "2px",
                  }}
                >
                  Team Members
                </p>
              </div>
            </div>

            <Link
              href="/referral"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(167,139,250,0.08)",
                border: "1px solid rgba(167,139,250,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#a78bfa",
              }}
            >
              <Icon name="chevronRight" size={14} />
            </Link>
          </div>
        ))}
      </div>

      <Link
        href="/referral"
        className="block text-center text-xs text-purple-400 hover:text-purple-300 mt-3 transition-colors"
      >
        View Full Referral Dashboard
      </Link>
    </div>
  );
}
