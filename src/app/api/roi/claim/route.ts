import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  requireAuth,
  handleApiError,
  checkRateLimit,
  RoiClaimSchema,
} from "@/lib/api/auth";

export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit("roi-claim", 30, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { user } = await requireAuth();

    const body = await req.json();
    const parsed = RoiClaimSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { investmentId } = parsed.data;

    // Verify investment belongs to this user
    const { data: investment, error: invError } = await supabaseAdmin
      .from("investments")
      .select("*")
      .eq("id", investmentId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (invError || !investment) {
      return NextResponse.json(
        { error: "Investment not found or not active" },
        { status: 404 }
      );
    }

    const endDate = new Date(investment.end_date);
    const now = new Date();

    if (now >= endDate) {
      await supabaseAdmin
        .from("investments")
        .update({ status: "completed" })
        .eq("id", investmentId);
      return NextResponse.json(
        { error: "Investment completed" },
        { status: 400 }
      );
    }

    const dailyROI = investment.amount * (investment.daily_roi / 100);

    // Atomic wallet update
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      "credit_wallet",
      {
        p_user_id: user.id,
        p_amount: dailyROI,
      }
    );

    if (rpcError || !rpcResult?.success) {
      return NextResponse.json(
        { error: rpcResult?.error || "Failed to credit ROI" },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("investments")
      .update({ total_earned: investment.total_earned + dailyROI })
      .eq("id", investmentId);

    await supabaseAdmin.from("transactions").insert({
      user_id: user.id,
      type: "roi_payout",
      amount: dailyROI,
      balance_before: rpcResult.previous_balance,
      balance_after: rpcResult.new_balance,
      description: `Daily ROI - ${investment.package_type} package`,
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      earned: dailyROI,
      newBalance: rpcResult.new_balance,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
