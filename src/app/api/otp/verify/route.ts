import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, otp, purpose = "register" } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP required" }, { status: 400 });
    }

    const { data: record, error: findError } = await supabaseAdmin
      .from("otp_store")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("purpose", purpose)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (findError || !record) {
      return NextResponse.json({ error: "No OTP found. Request a new one." }, { status: 400 });
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 400 });
    }

    if (record.attempts >= 5) {
      return NextResponse.json({ error: "Too many attempts. Request a new OTP." }, { status: 429 });
    }

    if (record.otp !== otp.toString()) {
      await supabaseAdmin
        .from("otp_store")
        .update({ attempts: record.attempts + 1 })
        .eq("id", record.id);
      return NextResponse.json({ error: "Invalid OTP. Try again." }, { status: 400 });
    }

    // Mark as verified
    await supabaseAdmin
      .from("otp_store")
      .update({ verified: true })
      .eq("id", record.id);

    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
