import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/api/auth";

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id, name, email, rank, created_at")
      .order("created_at", { ascending: true })
      .limit(100);

    if (!data) {
      return NextResponse.json({ success: true, leaders: [] });
    }

    const walletPromises = data.map((u) =>
      supabaseAdmin.from("wallet").select("bonus_balance, locked_bonus_balance").eq("user_id", u.id).single()
    );
    const walletResults = await Promise.all(walletPromises);

    const enriched = data.map((u, i) => ({
      ...u,
      cexBalance: (walletResults[i].data?.bonus_balance || 0) + (walletResults[i].data?.locked_bonus_balance || 0),
    }));

    const sorted = enriched
      .sort((a, b) => b.cexBalance - a.cexBalance)
      .slice(0, 100);

    const teamPromises = sorted.map(async (u) => {
      let total = 0;
      let currentIds = [u.id];
      for (let level = 1; level <= 5; level++) {
        const { data: members } = await supabaseAdmin
          .from("users")
          .select("id")
          .in("sponsor_id", currentIds);
        const list = members || [];
        total += list.length;
        currentIds = list.map((m) => m.id);
        if (currentIds.length === 0) break;
      }
      return total;
    });
    const teamResults = await Promise.all(teamPromises);

    const final = sorted.map((u, i) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      cexBalance: u.cexBalance,
      totalTeam: teamResults[i],
    }));

    return NextResponse.json({ success: true, leaders: final });
  } catch (error) {
    return handleApiError(error);
  }
}
