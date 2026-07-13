import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { code, full } = await req.json();
    if (!code || !code.trim()) {
      return NextResponse.json({ error: "Referral code required" }, { status: 400 });
    }

    if (full) {
      const { data, error } = await supabase
        .from("users")
        .select("id, left_child_id, right_child_id")
        .eq("referral_code", code.trim())
        .single();

      if (error || !data) {
        return NextResponse.json({ valid: false });
      }

      return NextResponse.json({ valid: true, sponsor: data });
    }

    const { data, error } = await supabase
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
