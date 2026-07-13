import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"CryptoEarnerX" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your CryptoEarnerX Verification Code",
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;background:#18181b;border-radius:12px;padding:32px;color:#fff;">
          <div style="text-align:center;margin-bottom:24px;">
            <h1 style="font-size:24px;margin:0;">CryptoEarnerX</h1>
          </div>
          <h2 style="font-size:20px;text-align:center;margin-bottom:8px;">Verify Your Email</h2>
          <p style="color:#a1a1aa;text-align:center;margin-bottom:24px;">Use the code below to verify your email address. This code expires in 10 minutes.</p>
          <div style="background:#27272a;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#3b82f6;">${otp}</span>
          </div>
          <p style="color:#71717a;font-size:12px;text-align:center;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("OTP email error:", error);
    return false;
  }
}
