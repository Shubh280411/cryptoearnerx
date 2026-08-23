import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAuth, handleApiError } from "@/lib/api/auth";
import { sparkTransfer } from "@/lib/wallet";
import { MIN_SPARK_WITHDRAWAL } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();

    const { amount, walletAddress } = await req.json();

    if (!amount || !walletAddress) {
      return NextResponse.json({ error: "Amount and wallet address required" }, { status: 400 });
    }

    const numAmount = parseFloat(String(amount));

    if (isNaN(numAmount) || numAmount < MIN_SPARK_WITHDRAWAL) {
      return NextResponse.json({ error: `Minimum withdrawal is ${MIN_SPARK_WITHDRAWAL} SPARK` }, { status: 400 });
    }

    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const { data: existingPending } = await supabaseAdmin
      .from("withdrawals")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .eq("token_type", "spark")
      .limit(1);

    if (existingPending && existingPending.length > 0) {
      return NextResponse.json({ error: "You already have a pending SPARK withdrawal" }, { status: 400 });
    }

    const { data: wallet } = await supabaseAdmin
      .from("wallet")
      .select("airdrop_balance")
      .eq("user_id", user.id)
      .single();

    const currentBalance = parseFloat(wallet?.airdrop_balance || "0");

    if (currentBalance < numAmount) {
      return NextResponse.json({ error: `Insufficient SPARK balance. You have ${currentBalance.toFixed(2)} SPARK` }, { status: 400 });
    }

    const { error: wdError } = await supabaseAdmin.from("withdrawals").insert({
      user_id: user.id,
      amount: numAmount,
      wallet_address: walletAddress,
      status: "pending",
      token_type: "spark",
    });

    if (wdError) {
      return NextResponse.json({ error: "Failed to create withdrawal" }, { status: 500 });
    }

    const { data: airdropResultRaw, error: airdropError } = await supabaseAdmin.rpc("credit_airdrop", {
      p_user_id: user.id,
      p_amount: -numAmount,
    });

    const airdropResult = Array.isArray(airdropResultRaw) ? airdropResultRaw[0] : airdropResultRaw;

    if (airdropError || !airdropResult?.success) {
      await supabaseAdmin
        .from("withdrawals")
        .update({ status: "rejected" })
        .eq("user_id", user.id)
        .eq("status", "pending")
        .eq("token_type", "spark");
      return NextResponse.json({ error: airdropResult?.error || "Failed to deduct SPARK balance" }, { status: 500 });
    }

    let txHash = null;
    try {
      const result = await sparkTransfer(walletAddress, numAmount);
      txHash = result.txHash;

      await supabaseAdmin
        .from("withdrawals")
        .update({ status: "completed", tx_hash: txHash })
        .eq("user_id", user.id)
        .eq("status", "pending")
        .eq("token_type", "spark");
    } catch (e: any) {
      console.error("SPARK transfer failed:", e);

      await supabaseAdmin.rpc("credit_airdrop", {
        p_user_id: user.id,
        p_amount: numAmount,
      });

      await supabaseAdmin
        .from("withdrawals")
        .update({ status: "rejected" })
        .eq("user_id", user.id)
        .eq("status", "pending")
        .eq("token_type", "spark");

      return NextResponse.json({ error: "Blockchain transfer failed. Balance refunded. Please try again." }, { status: 500 });
    }

    await supabaseAdmin.from("transactions").insert({
      user_id: user.id,
      type: "spark_withdrawal",
      amount: -numAmount,
      balance_before: airdropResult.previous_balance,
      balance_after: airdropResult.new_balance,
      description: `SPARK withdrawal of ${numAmount} SPARK to ${walletAddress}`,
      tx_hash: txHash,
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      newBalance: airdropResult.new_balance,
      txHash,
      message: `Withdrawal of ${numAmount} SPARK submitted! Processing on-chain.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
