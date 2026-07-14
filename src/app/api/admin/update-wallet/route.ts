import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, handleApiError } from "@/lib/api/auth";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const { userId, type, action, amount } = await req.json();

    if (!userId || !type || !action || !amount) {
      return NextResponse.json({ error: "Missing fields: userId, type, action, amount" }, { status: 400 });
    }

    if (!["pol", "cex"].includes(type)) {
      return NextResponse.json({ error: "type must be 'pol' or 'cex'" }, { status: 400 });
    }

    if (!["add", "deduct"].includes(action)) {
      return NextResponse.json({ error: "action must be 'add' or 'deduct'" }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallet")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (type === "pol") {
      const currentBalance = parseFloat(wallet.balance);
      if (action === "deduct" && currentBalance < numAmount) {
        return NextResponse.json({ error: "Insufficient POL balance" }, { status: 400 });
      }

      const delta = action === "add" ? numAmount : -numAmount;
      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("credit_wallet", {
        p_user_id: userId,
        p_amount: delta,
      });

      if (rpcError || !rpcResult?.success) {
        return NextResponse.json({ error: rpcResult?.error || "Failed to update wallet" }, { status: 500 });
      }

      await supabaseAdmin.from("transactions").insert({
        user_id: userId,
        type: "deposit",
        amount: delta,
        balance_before: rpcResult.previous_balance,
        balance_after: rpcResult.new_balance,
        description: `Admin ${action}: ${numAmount} POL`,
        status: "completed",
      });

      return NextResponse.json({ success: true, newBalance: rpcResult.new_balance });
    }

    if (type === "cex") {
      const currentBonus = parseFloat(wallet.bonus_balance);
      if (action === "deduct" && currentBonus < numAmount) {
        return NextResponse.json({ error: "Insufficient CEX balance" }, { status: 400 });
      }

      const delta = action === "add" ? numAmount : -numAmount;
      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("credit_bonus", {
        p_user_id: userId,
        p_amount: delta,
      });

      if (rpcError || !rpcResult?.success) {
        return NextResponse.json({ error: rpcResult?.error || "Failed to update CEX" }, { status: 500 });
      }

      await supabaseAdmin.from("transactions").insert({
        user_id: userId,
        type: "referral_bonus",
        amount: delta,
        balance_before: currentBonus,
        balance_after: rpcResult.new_bonus_balance,
        description: `Admin ${action}: ${numAmount} CEX`,
        status: "completed",
      });

      return NextResponse.json({ success: true, newBonusBalance: rpcResult.new_bonus_balance });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
