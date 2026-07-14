import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sweepChildToMaster, getChildBalance, getMasterWallet, decryptPrivateKey } from "@/lib/wallet";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: wallets, error } = await supabaseAdmin
      .from("crypto_wallets")
      .select("address, private_key, user_id, status")
      .eq("network", "polygon")
      .eq("status", "active");

    if (error || !wallets) {
      return NextResponse.json({ error: "Failed to fetch wallets" }, { status: 500 });
    }

    const results: { address: string; userId: string; swept: number; txHash: string }[] = [];
    const errors: { address: string; error: string }[] = [];

    for (const wallet of wallets) {
      try {
        const balance = await getChildBalance(wallet.address);

        if (balance < 0.02) continue;

        const { txHash, amount, gasUsed } = await sweepChildToMaster(decryptPrivateKey(wallet.private_key));

        const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
          "credit_wallet",
          {
            p_user_id: wallet.user_id,
            p_amount: amount,
          }
        );

        if (!rpcError && rpcResult?.success) {
          await supabaseAdmin.from("transactions").insert([
            {
              user_id: wallet.user_id,
              type: "deposit",
              amount,
              balance_before: rpcResult.previous_balance,
              balance_after: rpcResult.new_balance,
              description: "Deposit",
              tx_hash: txHash,
              status: "completed",
            },
            {
              user_id: wallet.user_id,
              type: "sweep",
              amount: -gasUsed,
              balance_before: rpcResult.new_balance,
              balance_after: rpcResult.new_balance,
              description: "Sweep Fee",
              tx_hash: txHash,
              status: "completed",
            },
          ]);

          results.push({
            address: wallet.address,
            userId: wallet.user_id,
            swept: amount,
            txHash,
          });
        }
      } catch (err: any) {
        if (err.message !== "Insufficient balance to cover gas fees" &&
            !err.message?.includes("Insufficient")) {
          errors.push({
            address: wallet.address,
            error: err.message || "Unknown error",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      walletsChecked: wallets.length,
      swept: results.length,
      results,
      errors,
    });
  } catch (error) {
    console.error("Auto-sweep error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
