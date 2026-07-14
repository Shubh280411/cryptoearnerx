import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  requireAuth,
  handleApiError,
  checkRateLimit,
  MlmDistributeSchema,
} from "@/lib/api/auth";
import { BINARY_REFERRAL_RATE, BINARY_MATCHING_RATE, LEVEL_COMMISSION_RATES } from "@/lib/constants";

async function creditWithTransaction(
  userId: string,
  amount: number,
  type: string,
  description: string
) {
  const { data: result, error } = await supabaseAdmin.rpc("credit_wallet", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (!error && result?.success) {
    await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type,
      amount,
      balance_before: result.previous_balance,
      balance_after: result.new_balance,
      description,
      status: "completed",
    });
  }

  return { success: !error && result?.success };
}

export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit("distribute", 10, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { user } = await requireAuth();

    const body = await req.json();
    const parsed = MlmDistributeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { investorId, amount } = parsed.data;

    const { data: investor } = await supabaseAdmin
      .from("users")
      .select("id, sponsor_id")
      .eq("id", investorId)
      .single();

    if (!investor) {
      return NextResponse.json({ error: "Investor not found" }, { status: 404 });
    }

    if (!investor.sponsor_id) {
      return NextResponse.json({ success: true, message: "No sponsor, skipping" });
    }

    const referralBonus = amount * (BINARY_REFERRAL_RATE / 100);
    await creditWithTransaction(
      investor.sponsor_id,
      referralBonus,
      "referral_bonus",
      `Referral bonus from ${investorId}`
    );

    await supabaseAdmin.rpc("increment_binary_volume", {
      p_user_id: investorId,
      p_left_add: amount / 2,
      p_right_add: amount / 2,
    });

    // Propagate volume UP the sponsor tree
    let propagateId: string | null = investor.sponsor_id;
    let currentInvestorId: string = investorId;

    while (propagateId) {
      const { data: parent } = await supabaseAdmin
        .from("users")
        .select("left_child_id, right_child_id, sponsor_id")
        .eq("id", propagateId)
        .single();

      if (!parent) break;

      if (parent.left_child_id === currentInvestorId) {
        await supabaseAdmin.rpc("increment_binary_volume", {
          p_user_id: propagateId,
          p_left_add: amount,
          p_right_add: 0,
        });
      } else if (parent.right_child_id === currentInvestorId) {
        await supabaseAdmin.rpc("increment_binary_volume", {
          p_user_id: propagateId,
          p_left_add: 0,
          p_right_add: amount,
        });
      }

      currentInvestorId = propagateId;
      propagateId = parent.sponsor_id;
    }

    const { data: sponsor } = await supabaseAdmin
      .from("users")
      .select("left_volume, right_volume, sponsor_id")
      .eq("id", investor.sponsor_id)
      .single();

    if (sponsor) {
      const matchedVolume = Math.min(
        sponsor.left_volume || 0,
        sponsor.right_volume || 0
      );

      if (matchedVolume > 0) {
        const binaryBonus = Math.min(matchedVolume * (BINARY_MATCHING_RATE / 100), 10000);
        await creditWithTransaction(
          investor.sponsor_id,
          binaryBonus,
          "binary_bonus",
          `Binary matching bonus`
        );
      }
    }

    // Multi-level commissions: walk up the sponsor chain (max 5 levels)
    const levelCommissions: { level: number; userId: string; amount: number }[] = [];
    let currentSponsorId = investor.sponsor_id;

    for (const tier of LEVEL_COMMISSION_RATES) {
      if (!currentSponsorId) break;

      const commissionAmount = amount * (tier.rate / 100);
      if (commissionAmount < 0.01) break;

      const credited = await creditWithTransaction(
        currentSponsorId,
        commissionAmount,
        "level_commission",
        `Level ${tier.level} commission from downline investment`
      );

      if (credited.success) {
        levelCommissions.push({
          level: tier.level,
          userId: currentSponsorId,
          amount: commissionAmount,
        });
      }

      const { data: nextSponsor } = await supabaseAdmin
        .from("users")
        .select("sponsor_id")
        .eq("id", currentSponsorId)
        .single();

      currentSponsorId = nextSponsor?.sponsor_id || null;
    }

    return NextResponse.json({
      success: true,
      referralBonus,
      levelCommissions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
