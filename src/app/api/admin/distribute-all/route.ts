import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/api/auth";
import { BINARY_REFERRAL_RATE, BINARY_MATCHING_RATE, LEVEL_COMMISSION_RATES } from "@/lib/constants";

const CEX_RATE = 20;

async function handleCreditLockedCex() {
  const { data: investments } = await supabaseAdmin
    .from("investments")
    .select("id, user_id, amount, status")
    .eq("status", "active");

  if (!investments || investments.length === 0) {
    return { success: true, message: "No active investments", processed: 0, skipped: 0, errors: 0, total: 0 };
  }

  const { data: existingTx } = await supabaseAdmin
    .from("transactions")
    .select("user_id, description")
    .eq("type", "invest_locked_cec")
    .like("description", "%Investment CEX bonus%");

  const alreadyCredited = new Set<string>();
  (existingTx || []).forEach((tx) => {
    alreadyCredited.add(tx.user_id);
  });

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const inv of investments) {
    if (alreadyCredited.has(inv.user_id)) {
      skipped++;
      continue;
    }

    try {
      const lockedCEX = inv.amount * CEX_RATE;

      const { data: walletData } = await supabaseAdmin
        .from("wallet")
        .select("locked_bonus_balance")
        .eq("user_id", inv.user_id)
        .single();

      const currentLocked = parseFloat(walletData?.locked_bonus_balance || "0");

      await supabaseAdmin
        .from("wallet")
        .update({ locked_bonus_balance: currentLocked + lockedCEX })
        .eq("user_id", inv.user_id);

      await supabaseAdmin.from("transactions").insert({
        user_id: inv.user_id,
        type: "invest_locked_cec",
        amount: lockedCEX,
        balance_before: currentLocked,
        balance_after: currentLocked + lockedCEX,
        description: `Investment CEX bonus (bulk) - ${inv.amount} POL = ${lockedCEX} CEX locked`,
        status: "completed",
      });

      processed++;
    } catch {
      errors++;
    }
  }

  return { success: true, action: "credit-locked-cex", processed, skipped, errors, total: investments.length };
}

async function handleCommissionDistribute() {
  const { data: investments } = await supabaseAdmin
    .from("investments")
    .select("id, user_id, amount, status")
    .eq("status", "active");

  if (!investments || investments.length === 0) {
    return { success: true, message: "No active investments", processed: 0, skipped: 0, errors: 0, total: 0 };
  }

  const { data: existingTx } = await supabaseAdmin
    .from("transactions")
    .select("description")
    .eq("type", "referral_bonus")
    .like("description", "Bulk commission for user %");

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

  return { success: true, action: "commission", processed, skipped, errors, total: investments.length };
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "commission";

    if (action === "credit-locked-cex") {
      const result = await handleCreditLockedCex();
      return NextResponse.json(result);
    }

    const result = await handleCommissionDistribute();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
