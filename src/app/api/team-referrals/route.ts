import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAuth, handleApiError } from "@/lib/api/auth";

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const teamCounts: Record<number, { members: any[]; count: number }> = {};
    let currentIds = [userId];

    for (let level = 1; level <= 5; level++) {
      const { data: members } = await supabaseAdmin
        .from("users")
        .select("id, name, email, rank, is_active, created_at")
        .in("sponsor_id", currentIds);

      const memberList = members || [];
      teamCounts[level] = { members: memberList, count: memberList.length };
      currentIds = memberList.map((u) => u.id);

      if (currentIds.length === 0) {
        for (let remaining = level + 1; remaining <= 5; remaining++) {
          teamCounts[remaining] = { members: [], count: 0 };
        }
        break;
      }
    }

    const { data: earnData } = await supabaseAdmin
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "referral_bonus");

    const totalEarned = (earnData || []).reduce((s, t) => s + t.amount, 0);
    const l1Members = teamCounts[1]?.members || [];

    return NextResponse.json({
      success: true,
      teamCounts,
      totalTeam: Object.values(teamCounts).reduce((s, c) => s + c.count, 0),
      totalReferrals: l1Members.length,
      activeReferrals: l1Members.filter((r: any) => r.is_active).length,
      totalEarned,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
