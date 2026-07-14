import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, handleApiError } from "@/lib/api/auth";
import { PACKAGES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const { userId, packageType, amount, roiEnabled, deductBalance } = await req.json();

    if (!userId || !packageType || !amount) {
      return NextResponse.json({ error: "Missing fields: userId, packageType, amount" }, { status: 400 });
    }

    const pkg = PACKAGES.find((p) => p.type === packageType);
    if (!pkg) {
      return NextResponse.json({ error: "Invalid package type" }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
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

      balanceBefore = parseFloat(wallet?.balance || 0);

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

    const { error: invError } = await supabaseAdmin.from("investments").insert({
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
      roi_enabled: roiEnabled !== false,
    });

    if (invError) {
      return NextResponse.json({ error: "Failed to create investment" }, { status: 500 });
    }

    const action = deductBalance ? `deducted ${numAmount} POL` : "no deduction (promotional)";
    await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "investment",
      amount: deductBalance ? -numAmount : 0,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: `Admin activated ${pkg.name} package (${numAmount} POL) - ${action} - ROI ${roiEnabled !== false ? "ON" : "OFF"}`,
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      roiEnabled: roiEnabled !== false,
      deducted: deductBalance,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
