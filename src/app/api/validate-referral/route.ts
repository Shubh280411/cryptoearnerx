import { NextResponse } from "next/server";
import { supabaseAdminAdmin } from "@/lib/supabaseAdmin/server";

export async function POST(req: Request) {
  try {
    const { code, full } = await req.json();
    if (!code || !code.trim()) {
      return NextResponse.json({ error: "Referral code required" }, { status: 400 });
    }

    if (full) {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("id, left_child_id, right_child_id")
        .eq("referral_code", code.trim())
        .single();

      if (error || !data) {
        return NextResponse.json({ valid: false });
      }

      return NextResponse.json({ valid: true, sponsor: data });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, name")
      .eq("referral_code", code.trim())
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true, name: data.name || "User" });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
