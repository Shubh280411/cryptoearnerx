import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// In-memory rate limiter
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(email);
  if (!entry || now > entry.resetAt) {
    rateMap.set(email, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    const { email, purpose = "register" } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    if (email.includes("+")) {
      return NextResponse.json({ error: "Email aliases are not allowed" }, { status: 400 });
    }

    if (!checkRateLimit(email.toLowerCase())) {
      return NextResponse.json({ error: "Too many attempts. Wait 1 minute." }, { status: 429 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Delete old OTPs for this email
    await supabaseAdmin.from("otp_store").delete().eq("email", email.toLowerCase()).eq("purpose", purpose);

    // Insert new OTP
    const { error: insertError } = await supabaseAdmin.from("otp_store").insert({
      email: email.toLowerCase(),
      otp,
      purpose,
      verified: false,
      attempts: 0,
      expires_at: expiresAt,
    });

    if (insertError) {
      return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
    }

    // Send OTP email
    const { sendOTPEmail } = await import("@/lib/otpMailer");
    const sent = await sendOTPEmail(email.toLowerCase(), otp);

    if (!sent) {
      return NextResponse.json({ error: "Failed to send email. Try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
