import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { handleApiError, checkRateLimit } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  return handleROI(req);
}

export async function POST(req: NextRequest) {
  return handleROI(req);
}

async function handleROI(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkRateLimit("daily-roi", 2, 3600000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const today = new Date().toISOString().split("T")[0];

    let investmentProcessed = 0;
    let investmentSkipped = 0;
    let investmentErrors = 0;
    let stakingProcessed = 0;
    let stakingSkipped = 0;
    let stakingErrors = 0;

    // === 1. Process Investment ROI ===
    const { data: activeInvestments } = await supabaseAdmin
      .from("investments")
      .select("*")
      .eq("status", "active");

    for (const inv of activeInvestments || []) {
      if (new Date() >= new Date(inv.end_date)) {
        await supabaseAdmin
          .from("investments")
          .update({ status: "completed" })
          .eq("id", inv.id);
        continue;
      }

      if (inv.roi_enabled === false) {
        investmentSkipped++;
        continue;
      }

      if (inv.last_roi_date === today) {
        investmentSkipped++;
        continue;
      }

      const dailyROI = Number(inv.amount) * (Number(inv.daily_roi) / 100);
      const isCex = inv.investment_source === "cex";
      const rpcFn = isCex ? "credit_bonus" : "credit_wallet";

      const { data: rpcRaw, error: rpcError } = await supabaseAdmin.rpc(
        rpcFn,
        { p_user_id: inv.user_id, p_amount: dailyROI }
      );

      const rpcResult = Array.isArray(rpcRaw) ? rpcRaw[0] : rpcRaw;

      if (rpcError || !rpcResult?.success) {
        investmentErrors++;
        continue;
      }

      await supabaseAdmin
        .from("investments")
        .update({
          total_earned: Number(inv.total_earned) + dailyROI,
          last_roi_date: today,
        })
        .eq("id", inv.id);

      const balanceAfter = rpcResult.new_balance || rpcResult.new_bonus_balance;
      const balanceBefore = rpcResult.previous_balance ?? (balanceAfter - dailyROI);

      await supabaseAdmin.from("transactions").insert({
        user_id: inv.user_id,
        type: "roi_payout",
        amount: dailyROI,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: `Daily ROI - ${inv.package_type} (${isCex ? "CEX" : "POL"}) - ${dailyROI.toFixed(4)} ${isCex ? "CEX" : "POL"}`,
        status: "completed",
      });

      investmentProcessed++;
    }

    // === 2. Process Staking ROI (pays in POL) ===
    const { data: activeStakes } = await supabaseAdmin
      .from("staking")
      .select("*")
      .eq("status", "active");

    for (const stake of activeStakes || []) {
      if (new Date() >= new Date(stake.end_date)) {
        await supabaseAdmin
          .from("staking")
          .update({ status: "completed" })
          .eq("id", stake.id);
        continue;
      }

      if (stake.last_roi_date === today) {
        stakingSkipped++;
        continue;
      }

      // daily_roi column = fixed POL amount per day
      const dailyReward = Number(stake.daily_roi) || 0;
      if (dailyReward <= 0) {
        stakingErrors++;
        continue;
      }

      const { data: stakeRaw, error: rpcError } = await supabaseAdmin.rpc(
        "credit_wallet",
        { p_user_id: stake.user_id, p_amount: dailyReward }
      );

      const rpcResult = Array.isArray(stakeRaw) ? stakeRaw[0] : stakeRaw;

      if (rpcError || !rpcResult?.success) {
        stakingErrors++;
        continue;
      }

      await supabaseAdmin
        .from("staking")
        .update({
          rewards_earned: Number(stake.rewards_earned || 0) + dailyReward,
          last_roi_date: today,
        })
        .eq("id", stake.id);

      await supabaseAdmin.from("transactions").insert({
        user_id: stake.user_id,
        type: "roi_payout",
        amount: dailyReward,
        balance_before: rpcResult.previous_balance,
        balance_after: rpcResult.new_balance,
        description: `Staking ROI - ${Number(stake.amount).toFixed(4)} POL staked`,
        status: "completed",
      });

      stakingProcessed++;
    }

    return NextResponse.json({
      success: true,
      date: today,
      investments: {
        processed: investmentProcessed,
        skipped: investmentSkipped,
        errors: investmentErrors,
        total: activeInvestments?.length || 0,
      },
      staking: {
        processed: stakingProcessed,
        skipped: stakingSkipped,
        errors: stakingErrors,
        total: activeStakes?.length || 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
