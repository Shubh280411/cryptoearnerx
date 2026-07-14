import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAuth, handleApiError, checkRateLimit } from "@/lib/api/auth";
import { PACKAGES } from "@/lib/constants";

const CEX_RATE = 20;

export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit("invest", 10, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { user } = await requireAuth();

    const body = await req.json();
    const { amount, packageType } = body;

    if (!amount || !packageType) {
      return NextResponse.json({ error: "Amount and package type required" }, { status: 400 });
    }

    const pkg = PACKAGES.find((p) => p.type === packageType);
    if (!pkg) {
      return NextResponse.json({ error: "Invalid package type" }, { status: 400 });
    }

    const numAmount = parseFloat(String(amount));
    if (isNaN(numAmount) || numAmount < pkg.minInvest || numAmount > pkg.maxInvest) {
      return NextResponse.json({ error: `Amount must be between ${pkg.minInvest} and ${pkg.maxInvest.toLocaleString()} POL` }, { status: 400 });
    }

    const { data: wallet } = await supabaseAdmin
      .from("wallet")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    const currentBalance = parseFloat(wallet?.balance || "0");
    if (currentBalance < numAmount) {
      return NextResponse.json({ error: "Insufficient POL balance" }, { status: 400 });
    }

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("invest_from_balance", {
      p_user_id: user.id,
      p_amount: numAmount,
    });

    if (rpcError || !rpcResult?.success) {
      return NextResponse.json({ error: rpcResult?.error || "Failed to deduct balance" }, { status: 500 });
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + pkg.durationDays);

    const { error: invError } = await supabaseAdmin.from("investments").insert({
      user_id: user.id,
      package_type: packageType,
      amount: numAmount,
      investment_source: "pol",
      daily_roi: pkg.dailyROI,
      duration_days: pkg.durationDays,
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString(),
      total_earned: 0,
      status: "active",
      roi_enabled: true,
    });

    if (invError) {
      console.error("Investment insert error:", invError);
      await supabaseAdmin.rpc("credit_wallet", {
        p_user_id: user.id,
        p_amount: numAmount,
      });
      return NextResponse.json({ error: "Failed to create investment" }, { status: 500 });
    }

    const lockedCEX = numAmount * CEX_RATE;

    const { data: currentWallet } = await supabaseAdmin
      .from("wallet")
      .select("locked_bonus_balance")
      .eq("user_id", user.id)
      .single();

    const currentLocked = parseFloat(currentWallet?.locked_bonus_balance || "0");

    await supabaseAdmin
      .from("wallet")
      .update({ locked_bonus_balance: currentLocked + lockedCEX })
      .eq("user_id", user.id);

    await supabaseAdmin.from("transactions").insert({
      user_id: user.id,
      type: "invest_locked_cec",
      amount: lockedCEX,
      balance_before: currentLocked,
      balance_after: currentLocked + lockedCEX,
      description: `Investment CEX bonus - ${pkg.name} (${numAmount} POL = ${lockedCEX} CEX locked)`,
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      newBalance: rpcResult.remaining_balance,
      lockedCEX,
      message: `Invested ${numAmount} POL in ${pkg.name}. You received ${lockedCEX} CEX coins (locked).`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
