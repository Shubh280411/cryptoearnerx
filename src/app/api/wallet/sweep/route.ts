import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  requireAuth,
  handleApiError,
  checkRateLimit,
} from "@/lib/api/auth";
import { sweepChildToMaster, getChildBalance, getMasterWallet } from "@/lib/wallet";

export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit("sweep", 5, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { user } = await requireAuth();
    const body = await req.json();
    const { walletAddress } = body;

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json({ error: "walletAddress required" }, { status: 400 });
    }

    const { data: cryptoWallet } = await supabaseAdmin
      .from("crypto_wallets")
      .select("address, private_key")
      .eq("address", walletAddress)
      .eq("user_id", user.id)
      .single();

    if (!cryptoWallet) {
      return NextResponse.json({ error: "Wallet not found or not owned by you" }, { status: 404 });
    }

    let balance = 0;
    try {
      balance = await getChildBalance(walletAddress);
    } catch (e) {
      return NextResponse.json({ error: "Failed to check wallet balance" }, { status: 500 });
    }

    if (balance < 0.02) {
      return NextResponse.json({ error: "Insufficient balance to sweep (min 0.02 POL)" }, { status: 400 });
    }

    const { txHash, amount, gasUsed } = await sweepChildToMaster(cryptoWallet.private_key);

    const masterWallet = getMasterWallet();

    let rpcResult: any = null;
    let rpcError: any = null;

    try {
      const result = await supabaseAdmin.rpc("credit_wallet", {
        p_user_id: user.id,
        p_amount: amount,
      });
      rpcResult = result.data;
      rpcError = result.error;
    } catch (e) {
      rpcError = e;
    }

    if (rpcError || !rpcResult?.success) {
      const fallbackDesc = `Sweep from ${walletAddress} to ${masterWallet.address}. Tx: ${txHash}. Amount: ${amount} POL (credit failed - manual credit needed)`;
      await supabaseAdmin.from("transactions").insert({
        user_id: user.id,
        type: "sweep",
        amount: amount,
        balance_before: 0,
        balance_after: 0,
        description: fallbackDesc,
        tx_hash: txHash,
        status: "completed",
      });

      return NextResponse.json({
        success: true,
        swept: amount,
        gas: gasUsed,
        txHash,
        newBalance: 0,
        warning: "Sweep successful but auto-credit failed. Admin manual credit needed.",
      });
    }

    await supabaseAdmin.from("transactions").insert({
      user_id: user.id,
      type: "deposit",
      amount,
      balance_before: rpcResult.previous_balance,
      balance_after: rpcResult.new_balance,
      description: `Auto-sweep deposit. Tx: ${txHash}`,
      tx_hash: txHash,
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      swept: amount,
      gas: gasUsed,
      txHash,
      newBalance: rpcResult.new_balance,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
