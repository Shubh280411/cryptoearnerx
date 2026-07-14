import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAuth, handleApiError } from "@/lib/api/auth";
import { MIN_WITHDRAWAL, WITHDRAWAL_FEE } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();

    const { amount, walletAddress } = await req.json();

    if (!amount || !walletAddress) {
      return NextResponse.json({ error: "Amount and wallet address required" }, { status: 400 });
    }

    const numAmount = parseFloat(String(amount));

    if (isNaN(numAmount) || numAmount < MIN_WITHDRAWAL) {
      return NextResponse.json({ error: `Minimum withdrawal is ${MIN_WITHDRAWAL} POL` }, { status: 400 });
    }

    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const { data: existingPending } = await supabaseAdmin
      .from("withdrawals")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .limit(1);

    if (existingPending && existingPending.length > 0) {
      return NextResponse.json({ error: "You already have a pending withdrawal" }, { status: 400 });
    }

    const { data: wallet } = await supabaseAdmin
      .from("wallet")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    const currentBalance = parseFloat(wallet?.balance || "0");

    if (currentBalance < numAmount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const { error: wdError } = await supabaseAdmin.from("withdrawals").insert({
      user_id: user.id,
      amount: numAmount,
      wallet_address: walletAddress,
      status: "pending",
    });

    if (wdError) {
      return NextResponse.json({ error: "Failed to create withdrawal" }, { status: 500 });
    }

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("credit_wallet", {
      p_user_id: user.id,
      p_amount: -(numAmount + WITHDRAWAL_FEE),
    });

    if (rpcError || !rpcResult?.success) {
      await supabaseAdmin.from("withdrawals").update({ status: "failed" }).eq("user_id", user.id).eq("status", "pending");
      return NextResponse.json({ error: rpcResult?.error || "Failed to deduct balance" }, { status: 500 });
    }

    await supabaseAdmin.from("transactions").insert({
      user_id: user.id,
      type: "withdrawal",
      amount: -(numAmount + WITHDRAWAL_FEE),
      balance_before: rpcResult.previous_balance,
      balance_after: rpcResult.new_balance,
      description: `Withdrawal of ${numAmount} POL (fee: ${WITHDRAWAL_FEE} POL)`,
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      newBalance: rpcResult.new_balance,
      message: "Withdrawal request submitted! It will be processed within 24 hours.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
