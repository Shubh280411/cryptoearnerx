import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, handleApiError } from "@/lib/api/auth";
import { PACKAGES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const userId = body.userId;
    const packageType = body.packageType;
    const amount = body.amount;
    const roiEnabled = body.roiEnabled;
    const deductBalance = body.deductBalance;

    if (!userId || !packageType || amount === undefined || amount === null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const pkg = PACKAGES.find((p) => p.type === packageType);
    if (!pkg) {
      return NextResponse.json({ error: "Invalid package type: " + packageType }, { status: 400 });
    }

    const numAmount = parseFloat(String(amount));
    if (isNaN(numAmount) || numAmount < pkg.minInvest || numAmount > pkg.maxInvest) {
      return NextResponse.json({ error: `Amount must be between ${pkg.minInvest} and ${pkg.maxInvest.toLocaleString()} POL` }, { status: 400 });
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + pkg.durationDays);

    let balanceBefore = 0;
    let balanceAfter = 0;

    if (deductBalance) {
      const { data: wallet } = await supabaseAdmin
        .from("wallet")
        .select("balance")
        .eq("user_id", userId)
        .single();

      balanceBefore = parseFloat(wallet?.balance || "0");

      if (balanceBefore < numAmount) {
        return NextResponse.json({ error: "Insufficient POL balance" }, { status: 400 });
      }

      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("invest_from_balance", {
        p_user_id: userId,
        p_amount: numAmount,
      });

      if (rpcError || !rpcResult?.success) {
        return NextResponse.json({ error: rpcResult?.error || "Failed to deduct balance" }, { status: 500 });
      }

      balanceAfter = rpcResult.remaining_balance;
    }

    const insertData: any = {
      user_id: userId,
      package_type: packageType,
      amount: numAmount,
      investment_source: "pol",
      daily_roi: pkg.dailyROI,
      duration_days: pkg.durationDays,
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString(),
      total_earned: 0,
      status: "active",
    };

    const { error: invError } = await supabaseAdmin.from("investments").insert(insertData);

    if (invError) {
      console.error("Investment insert error:", invError);
      return NextResponse.json({ error: "Failed to create investment: " + (invError.message || invError.details || "unknown") }, { status: 500 });
    }

    // Increment binary volume for the investor
    await supabaseAdmin.rpc("increment_binary_volume", {
      p_user_id: userId,
      p_left_add: numAmount / 2,
      p_right_add: numAmount / 2,
    });

    // Call MLM distribute for commissions + binary matching
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://cryptoearnerx.online"}/api/mlm/distribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investorId: userId, amount: numAmount }),
      });
    } catch (e) {
      console.error("MLM distribute failed:", e);
    }

    // Credit locked CEX for investment
    const lockedCEX = numAmount * 20;
    const { data: currentWallet } = await supabaseAdmin
      .from("wallet")
      .select("locked_bonus_balance")
      .eq("user_id", userId)
      .single();

    const currentLocked = parseFloat(currentWallet?.locked_bonus_balance || "0");

    await supabaseAdmin
      .from("wallet")
      .update({ locked_bonus_balance: currentLocked + lockedCEX })
      .eq("user_id", userId);

    await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "invest_locked_cec",
      amount: lockedCEX,
      balance_before: currentLocked,
      balance_after: currentLocked + lockedCEX,
      description: `Investment CEX bonus - ${pkg.name} (${numAmount} POL = ${lockedCEX} CEX locked) - Admin activation`,
      status: "completed",
    });

    if (deductBalance) {
      await supabaseAdmin.from("transactions").insert({
        user_id: userId,
        type: "investment",
        amount: numAmount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: `Admin activated ${pkg.name} package (${numAmount} POL) - ROI ${roiEnabled !== false ? "ON" : "OFF"}`,
        status: "completed",
      });
    }

    return NextResponse.json({
      success: true,
      roiEnabled: roiEnabled !== false,
      deducted: !!deductBalance,
      lockedCEX,
    });
  } catch (error) {
    console.error("activate-package error:", error);
    return handleApiError(error);
  }
}
