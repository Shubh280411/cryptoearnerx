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

    const credited: { level: number; userId: string; amount: number }[] = [];
    let currentId = newUser.sponsor_id;

    for (let level = 1; level <= 5; level++) {
      if (!currentId) break;

      const bonus = CEX_LEVEL_BONUS[level];
      if (!bonus) break;

      const { data: wallet } = await supabaseAdmin
        .from("wallet")
        .select("bonus_balance")
        .eq("user_id", currentId)
        .single();

      if (wallet) {
        const newBalance = (wallet.bonus_balance || 0) + bonus;

        await supabaseAdmin
          .from("wallet")
          .update({ bonus_balance: newBalance })
          .eq("user_id", currentId);

        await supabaseAdmin.from("transactions").insert({
          user_id: currentId,
          type: "registration_bonus",
          amount: bonus,
          balance_before: wallet.bonus_balance || 0,
          balance_after: newBalance,
          description: `Level ${level} registration bonus for new team member`,
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
