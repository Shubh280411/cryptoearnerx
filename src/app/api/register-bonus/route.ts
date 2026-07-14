import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CEX_LEVEL_BONUS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const { data: newUser } = await supabaseAdmin
      .from("users")
      .select("sponsor_id")
      .eq("id", userId)
      .single();

    if (!newUser?.sponsor_id) {
      return NextResponse.json({ success: true, message: "No sponsor" });
    }

    // Update sponsor's binary tree (left_child_id / right_child_id)
    const { data: sponsorData } = await supabaseAdmin
      .from("users")
      .select("left_child_id, right_child_id")
      .eq("id", newUser.sponsor_id)
      .single();

    if (sponsorData) {
      const updateData: Record<string, string> = {};
      if (!sponsorData.left_child_id) {
        updateData.left_child_id = userId;
      } else if (!sponsorData.right_child_id) {
        updateData.right_child_id = userId;
      }
      if (Object.keys(updateData).length > 0) {
        await supabaseAdmin.from("users").update(updateData).eq("id", newUser.sponsor_id);
      }
    }

    // 5-level CEX bonus
    const credited: { level: number; userId: string; amount: number }[] = [];
    let currentId = newUser.sponsor_id;

    for (let level = 1; level <= 5; level++) {
      if (!currentId) break;

      const bonus = CEX_LEVEL_BONUS[level];
      if (!bonus) break;

      const { data: wallet } = await supabaseAdmin
        .from("wallet")
        .select("locked_bonus_balance")
        .eq("user_id", currentId)
        .single();

      if (wallet) {
        const newLocked = (wallet.locked_bonus_balance || 0) + bonus;

        await supabaseAdmin
          .from("wallet")
          .update({ locked_bonus_balance: newLocked })
          .eq("user_id", currentId);

        await supabaseAdmin.from("transactions").insert({
          user_id: currentId,
          type: "registration_bonus",
          amount: bonus,
          balance_before: wallet.locked_bonus_balance || 0,
          balance_after: newLocked,
          description: `Level ${level} registration bonus for new team member (locked)`,
          status: "completed",
        });

        credited.push({ level, userId: currentId, amount: bonus });
      }

      const { data: nextUser } = await supabaseAdmin
        .from("users")
        .select("sponsor_id")
        .eq("id", currentId)
        .single();

      currentId = nextUser?.sponsor_id || null;
    }

    return NextResponse.json({ success: true, credited });
  } catch (error) {
    console.error("Register bonus error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
