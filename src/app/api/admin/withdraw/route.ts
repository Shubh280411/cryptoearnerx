import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, handleApiError } from "@/lib/api/auth";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const { withdrawalId, action } = await req.json();

    if (!withdrawalId || !action) {
      return NextResponse.json({ error: "Missing fields: withdrawalId, action" }, { status: 400 });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const { data: withdrawal, error: wdError } = await supabaseAdmin
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .eq("status", "pending")
      .single();

    if (wdError || !withdrawal) {
      return NextResponse.json({ error: "Withdrawal not found or already processed" }, { status: 404 });
    }

    if (action === "approve") {
      const { error: updateError } = await supabaseAdmin
        .from("withdrawals")
        .update({ status: "completed", processed_at: new Date().toISOString() })
        .eq("id", withdrawalId);

      if (updateError) {
        return NextResponse.json({ error: "Failed to update withdrawal" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Withdrawal approved. Send POL manually to " + withdrawal.wallet_address,
        walletAddress: withdrawal.wallet_address,
        amount: withdrawal.amount,
      });
    }

    if (action === "reject") {
      const { error: updateError } = await supabaseAdmin
        .from("withdrawals")
        .update({ status: "rejected", processed_at: new Date().toISOString() })
        .eq("id", withdrawalId);

      if (updateError) {
        return NextResponse.json({ error: "Failed to update withdrawal" }, { status: 500 });
      }

      const refundAmount = withdrawal.amount + 1;
      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("credit_wallet", {
        p_user_id: withdrawal.user_id,
        p_amount: refundAmount,
      });

      if (!rpcError && rpcResult?.success) {
        await supabaseAdmin.from("transactions").insert({
          user_id: withdrawal.user_id,
          type: "deposit",
          amount: refundAmount,
          balance_before: rpcResult.previous_balance,
          balance_after: rpcResult.new_balance,
          description: `Withdrawal rejected - ${withdrawal.amount} POL refunded (including fee)`,
          status: "completed",
        });
      }

      return NextResponse.json({ success: true, message: "Withdrawal rejected, funds returned" });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
