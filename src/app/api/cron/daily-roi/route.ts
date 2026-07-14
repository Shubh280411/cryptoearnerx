import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { handleApiError, checkRateLimit } from "@/lib/api/auth";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkRateLimit("daily-roi", 2, 3600000)) {
      return NextResponse.json({ error: "Too many requests. Cron runs once per hour max." }, { status: 429 });
    }

    let investmentProcessed = 0;
    let investmentErrors = 0;
    let stakingProcessed = 0;
    let stakingErrors = 0;

    // === 1. Process Investment ROI ===
    const { data: activeInvestments } = await supabaseAdmin
      .from("investments")
      .select("*")
      .eq("status", "active");

    for (const investment of activeInvestments || []) {
      const endDate = new Date(investment.end_date);
      const now = new Date();

      if (now >= endDate) {
        await supabaseAdmin
          .from("investments")
          .update({ status: "completed" })
          .eq("id", investment.id);
        continue;
      }

      if (investment.roi_enabled === false) {
        continue;
      }

      const dailyROI = investment.amount * (investment.daily_roi / 100);
      const isCex = investment.investment_source === "cex";
      const rpcFn = isCex ? "credit_bonus" : "credit_wallet";

      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
        rpcFn,
        { p_user_id: investment.user_id, p_amount: dailyROI }
      );

      if (rpcError || !rpcResult?.success) {
        investmentErrors++;
        continue;
      }

      await supabaseAdmin
        .from("investments")
        .update({ total_earned: investment.total_earned + dailyROI })
        .eq("id", investment.id);

      const currency = isCex ? "CEX" : "POL";
      await supabaseAdmin.from("transactions").insert({
        user_id: investment.user_id,
        type: "roi_payout",
        amount: dailyROI,
        balance_before: rpcResult.previous_balance || rpcResult.new_bonus_balance,
        balance_after: rpcResult.new_balance || rpcResult.new_bonus_balance,
        description: `Daily ROI - ${investment.package_type} package (${currency})`,
        status: "completed",
      });

      investmentProcessed++;
    }

    // === 2. Process CEX Staking ROI (pays in POL) ===
    const { data: activeStakes } = await supabaseAdmin
      .from("staking")
      .select("*")
      .eq("status", "active");

    for (const stake of activeStakes || []) {
      const endDate = new Date(stake.end_date);
      const now = new Date();

      if (now >= endDate) {
        await supabaseAdmin
          .from("staking")
          .update({ status: "completed" })
          .eq("id", stake.id);
        continue;
      }

      // daily_roi here is the POL % earned per day on staked amount
      const dailyReward = stake.amount * (stake.daily_roi / 100);

      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
        "credit_wallet",
        { p_user_id: stake.user_id, p_amount: dailyReward }
      );

      if (rpcError || !rpcResult?.success) {
        stakingErrors++;
        continue;
      }

      await supabaseAdmin
        .from("staking")
        .update({ rewards_earned: (stake.rewards_earned || 0) + dailyReward })
        .eq("id", stake.id);

      await supabaseAdmin.from("transactions").insert({
        user_id: stake.user_id,
        type: "roi_payout",
        amount: dailyReward,
        balance_before: rpcResult.previous_balance,
        balance_after: rpcResult.new_balance,
        description: `CEX Staking ROI - ${formatPOL(stake.amount)} POL staked`,
        status: "completed",
      });

      stakingProcessed++;
    }

    function formatPOL(n: number) {
      return Number(n).toFixed(4);
    }

    return NextResponse.json({
      success: true,
      investments: { processed: investmentProcessed, errors: investmentErrors, total: activeInvestments?.length || 0 },
      staking: { processed: stakingProcessed, errors: stakingErrors, total: activeStakes?.length || 0 },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
