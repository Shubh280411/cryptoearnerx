import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/api/auth";

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id, name, email, rank, created_at, sponsor_id")
      .order("created_at", { ascending: true })
      .limit(200);

    if (!data) {
      return NextResponse.json({ success: true, leaders: [] });
    }

    const walletPromises = data.map((u) =>
      supabaseAdmin.from("wallet").select("bonus_balance, locked_bonus_balance").eq("user_id", u.id).single()
    );
    const walletResults = await Promise.all(walletPromises);

    const sponsorMap = new Map<string, string[]>();
    for (const u of data) {
      if (u.sponsor_id) {
        const existing = sponsorMap.get(u.sponsor_id) || [];
        existing.push(u.id);
        sponsorMap.set(u.sponsor_id, existing);
      }
    }

    function countTeam(userId: string): number {
      let total = 0;
      let currentIds = [userId];
      for (let level = 0; level < 5; level++) {
        const nextIds: string[] = [];
        for (const cid of currentIds) {
          const children = sponsorMap.get(cid) || [];
          total += children.length;
          nextIds.push(...children);
        }
        currentIds = nextIds;
        if (currentIds.length === 0) break;
      }
      return total;
    }

    const enriched = data.map((u, i) => ({
      ...u,
      cexBalance: (walletResults[i].data?.bonus_balance || 0) + (walletResults[i].data?.locked_bonus_balance || 0),
    }));

    const sorted = enriched
      .sort((a, b) => b.cexBalance - a.cexBalance)
      .slice(0, 100);

    const final = sorted.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      cexBalance: u.cexBalance,
      totalTeam: countTeam(u.id),
    }));

    return NextResponse.json({ success: true, leaders: final });
  } catch (error) {
    return handleApiError(error);
  }
}
