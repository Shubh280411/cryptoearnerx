import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, handleApiError } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const purpose = url.searchParams.get("purpose") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("otp_store")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("email", `%${search}%`);
    }

    if (purpose) {
      query = query.eq("purpose", purpose);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    const now = new Date();
    const enriched = (data || []).map((otp) => ({
      id: otp.id,
      email: otp.email,
      purpose: otp.purpose,
      verified: otp.verified,
      attempts: otp.attempts,
      created_at: otp.created_at,
      expires_at: otp.expires_at,
      is_expired: new Date(otp.expires_at) < now,
      is_used: otp.verified,
    }));

    return NextResponse.json({
      success: true,
      records: enriched,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
