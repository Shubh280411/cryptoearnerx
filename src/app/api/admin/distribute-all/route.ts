import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/api/auth";
import { BINARY_REFERRAL_RATE, BINARY_MATCHING_RATE, LEVEL_COMMISSION_RATES } from "@/lib/constants";

async function creditWallet(userId: string, amount: number) {
  const { data, error } = await supabaseAdmin.rpc("credit_wallet", {
    p_user_id: userId,
    p_amount: amount,
  });
  if (!error && data?.success) {
    await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "referral_bonus",
      amount,
      balance_before: data.previous_balance,
      balance_after: data.new_balance,
      description: `Bulk commission distribution`,
      status: "completed",
    });
    return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: investments } = await supabaseAdmin
      .from("investments")
      .select("id, user_id, amount, status")
      .eq("status", "active");

    if (!investments || investments.length === 0) {
      return NextResponse.json({ success: true, message: "No active investments", processed: 0 });
    }

    const { data: existingTx } = await supabaseAdmin
      .from("transactions")
      .select("description")
      .eq("type", "referral_bonus")
      .like("description", "Bulk commission%");

    const alreadyDone = new Set<string>();
    (existingTx || []).forEach((tx) => {
      const match = tx.description?.match(/Bulk commission for user ([a-f0-9-]+)/);
      if (match) alreadyDone.add(match[1]);
    });

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const inv of investments) {
      if (alreadyDone.has(inv.user_id)) {
        skipped++;
        continue;
      }

      const { data: investor } = await supabaseAdmin
        .from("users")
        .select("id, sponsor_id")
        .eq("id", inv.user_id)
        .single();

      if (!investor?.sponsor_id) {
        skipped++;
        continue;
      }

      try {
        const referralBonus = inv.amount * (BINARY_REFERRAL_RATE / 100);
        const { data: refResult } = await supabaseAdmin.rpc("credit_wallet", {
          p_user_id: investor.sponsor_id,
          p_amount: referralBonus,
        });
        if (refResult?.success) {
          await supabaseAdmin.from("transactions").insert({
            user_id: investor.sponsor_id,
            type: "referral_bonus",
            amount: referralBonus,
            balance_before: refResult.previous_balance,
            balance_after: refResult.new_balance,
            description: `Bulk commission for user ${inv.user_id}`,
            status: "completed",
          });
        }

        await supabaseAdmin.rpc("increment_binary_volume", {
          p_user_id: inv.user_id,
          p_left_add: inv.amount / 2,
          p_right_add: inv.amount / 2,
        });

        let currentSponsorId = investor.sponsor_id;
        for (const tier of LEVEL_COMMISSION_RATES) {
          if (!currentSponsorId) break;
          const commissionAmount = inv.amount * (tier.rate / 100);
          if (commissionAmount < 0.01) break;

          const { data: lvlResult } = await supabaseAdmin.rpc("credit_wallet", {
            p_user_id: currentSponsorId,
            p_amount: commissionAmount,
          });
          if (lvlResult?.success) {
            await supabaseAdmin.from("transactions").insert({
              user_id: currentSponsorId,
              type: "level_commission",
              amount: commissionAmount,
              balance_before: lvlResult.previous_balance,
              balance_after: lvlResult.new_balance,
              description: `Bulk Level ${tier.level} commission from user ${inv.user_id}`,
              status: "completed",
            });
          }

          const { data: nextSponsor } = await supabaseAdmin
            .from("users")
            .select("sponsor_id")
            .eq("id", currentSponsorId)
            .single();
          currentSponsorId = nextSponsor?.sponsor_id || null;
        }

        processed++;
      } catch {
        errors++;
      }
    }

    return NextResponse.json({ success: true, processed, skipped, errors, total: investments.length });
  } catch (error) {
    return handleApiError(error);
  }
}
