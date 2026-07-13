import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  requireAuth,
  handleApiError,
  checkRateLimit,
  SweepSchema,
} from "@/lib/api/auth";
import { sweepChildToMaster, getChildBalance, getMasterWallet } from "@/lib/wallet";

export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit("sweep", 5, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { user } = await requireAuth();

    const body = await req.json();
    const parsed = SweepSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { walletAddress } = parsed.data;

    const { data: cryptoWallet } = await supabaseAdmin
      .from("crypto_wallets")
      .select("*")
      .eq("address", walletAddress)
      .eq("user_id", user.id)
      .single();

    if (!cryptoWallet) {
      return NextResponse.json(
        { error: "Wallet not found or not owned by you" },
        { status: 404 }
      );
    }

    const balance = await getChildBalance(walletAddress);
    if (balance < 0.02) {
      return NextResponse.json(
        { error: "Insufficient balance to sweep (min 0.02 POL)" },
        { status: 400 }
      );
    }

    const { txHash, amount, gasUsed } = await sweepChildToMaster(
      cryptoWallet.private_key
    );

    const masterWallet = getMasterWallet();

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      "credit_wallet",
      {
        p_user_id: user.id,
        p_amount: amount,
      }
    );

    if (rpcError || !rpcResult?.success) {
      return NextResponse.json(
        { error: rpcResult?.error || "Failed to credit wallet" },
        { status: 500 }
      );
    }

    await supabaseAdmin.from("transactions").insert([
      {
        user_id: user.id,
        type: "deposit",
        amount,
        balance_before: rpcResult.previous_balance,
        balance_after: rpcResult.new_balance,
        description: `Sweep from ${walletAddress} to ${masterWallet.address}. Tx: ${txHash}`,
        tx_hash: txHash,
        status: "completed",
      },
      {
        user_id: user.id,
        type: "sweep",
        amount: -gasUsed,
        balance_before: rpcResult.new_balance,
        balance_after: rpcResult.new_balance,
        description: `Gas fee for sweep tx ${txHash}`,
        tx_hash: txHash,
        status: "completed",
      },
    ]);

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
