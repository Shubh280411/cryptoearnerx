import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  requireAuth,
  handleApiError,
  checkRateLimit,
} from "@/lib/api/auth";
import { getChildBalance, deriveChildWallet } from "@/lib/wallet";
import { ethers } from "ethers";

export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit("deposit", 10, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { user } = await requireAuth();

    const body = await req.json();
    const { txHash } = body;

    if (!txHash || typeof txHash !== "string") {
      return NextResponse.json({ error: "Transaction hash required" }, { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(
      process.env.POLYGON_RPC_URL || "https://polygon-bor-rpc.publicnode.com"
    );

    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      return NextResponse.json({ error: "Transaction not found on-chain" }, { status: 400 });
    }

    if (!tx.blockNumber) {
      return NextResponse.json({ error: "Transaction not yet confirmed" }, { status: 400 });
    }

    const { data: cryptoWallet } = await supabaseAdmin
      .from("crypto_wallets")
      .select("address")
      .eq("user_id", user.id)
      .eq("network", "polygon")
      .single();

    if (!cryptoWallet) {
      return NextResponse.json({ error: "No deposit wallet found" }, { status: 400 });
    }

    const toAddress = tx.to?.toLowerCase();
    if (toAddress !== cryptoWallet.address.toLowerCase()) {
      return NextResponse.json({ error: "Transaction not sent to your deposit address" }, { status: 400 });
    }

    const amount = parseFloat(ethers.formatEther(tx.value));

    if (amount < 0.01) {
      return NextResponse.json({ error: "Amount too small (min 0.01 POL)" }, { status: 400 });
    }

    const { data: existingTx } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("tx_hash", txHash)
      .eq("type", "deposit")
      .single();

    if (existingTx) {
      return NextResponse.json({ error: "Transaction already processed" }, { status: 409 });
    }

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      "credit_wallet",
      {
        p_user_id: user.id,
        p_amount: amount,
      }
    );

    if (rpcError || !rpcResult?.success) {
      return NextResponse.json(
        { error: rpcResult?.error || "Failed to update wallet" },
        { status: 500 }
      );
    }

    await supabaseAdmin.from("transactions").insert({
      user_id: user.id,
      type: "deposit",
      amount,
      balance_before: rpcResult.previous_balance,
      balance_after: rpcResult.new_balance,
      description: `Deposit of ${amount} POL verified on-chain`,
      tx_hash: txHash,
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      amount,
      newBalance: rpcResult.new_balance,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuth();

    const { data: existing } = await supabaseAdmin
      .from("crypto_wallets")
      .select("address, derivation_index")
      .eq("user_id", user.id)
      .eq("network", "polygon")
      .single();

    if (existing) {
      let balance = 0;
      try {
        balance = await getChildBalance(existing.address);
      } catch (e) {
        // RPC might fail
      }
      return NextResponse.json({
        address: existing.address,
        balance,
        derivation_index: existing.derivation_index,
      });
    }

    const { data: existingWallets } = await supabaseAdmin
      .from("crypto_wallets")
      .select("derivation_index")
      .order("derivation_index", { ascending: false })
      .limit(1);

    const derivationIndex = (existingWallets?.[0]?.derivation_index ?? -1) + 1;
    const childWallet = deriveChildWallet(derivationIndex);

    await supabaseAdmin.from("crypto_wallets").insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      address: childWallet.address,
      private_key: childWallet.privateKey,
      derivation_index: derivationIndex,
      network: "polygon",
      status: "active",
    });

    return NextResponse.json({
      address: childWallet.address,
      balance: 0,
      derivation_index: derivationIndex,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
