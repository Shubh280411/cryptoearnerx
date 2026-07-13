import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  requireAuth,
  handleApiError,
  checkRateLimit,
  DepositSchema,
} from "@/lib/api/auth";
import { getChildBalance, deriveChildWallet } from "@/lib/wallet";

export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit("deposit", 10, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { user } = await requireAuth();

    const body = await req.json();
    const parsed = DepositSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { amount, txHash } = parsed.data;

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
      amount: amount,
      balance_before: rpcResult.previous_balance,
      balance_after: rpcResult.new_balance,
      description: `Deposit of ${amount} POL`,
      tx_hash: txHash,
      status: "completed",
    });

    return NextResponse.json({
      success: true,
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
      .select("*")
      .eq("user_id", user.id)
      .eq("network", "polygon")
      .single();

    if (existing) {
      let balance = 0;
      try {
        balance = await getChildBalance(existing.address);
      } catch (e) {
        // RPC might fail, that's ok
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
