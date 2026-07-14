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

    // Get current user's left/right child
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("left_child_id, right_child_id, left_volume, right_volume")
      .eq("id", userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get full subtree for a side
    async function getSubtree(rootChildId: string | null): Promise<any[]> {
      if (!rootChildId) return [];
      const result: any[] = [];
      const queue = [rootChildId];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const { data: member } = await supabaseAdmin
          .from("users")
          .select("id, name, email, rank, is_active, left_child_id, right_child_id, left_volume, right_volume, created_at")
          .eq("id", currentId)
          .single();

        if (member) {
          const { left_child_id, right_child_id, ...rest } = member;
          result.push(rest);
          if (left_child_id) queue.push(left_child_id);
          if (right_child_id) queue.push(right_child_id);
        }
      }

      return result;
    }

    const [leftTeam, rightTeam] = await Promise.all([
      getSubtree(userData.left_child_id),
      getSubtree(userData.right_child_id),
    ]);

    // Get earnings
    const { data: earnData } = await supabaseAdmin
      .from("transactions")
      .select("amount, type")
      .eq("user_id", userId)
      .in("type", ["referral_bonus", "binary_bonus", "leadership_bonus"]);

    const earnings = earnData || [];

    return NextResponse.json({
      success: true,
      leftTeam,
      rightTeam,
      leftVolume: userData.left_volume || 0,
      rightVolume: userData.right_volume || 0,
      totalEarnings: earnings.reduce((s, t) => s + (t.amount > 0 ? t.amount : 0), 0),
      matches: earnings.filter((t) => t.type === "binary_bonus").length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
