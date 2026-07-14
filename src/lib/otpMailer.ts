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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cryptoearnerx.online";

function getOTPContent(purpose: string) {
  switch (purpose) {
    case "withdrawal":
      return {
        title: "Withdrawal Verification",
        subtitle: "Enter the code below to confirm your POL withdrawal request.",
        warning: "If you did not request this withdrawal, ignore this email and secure your account immediately.",
        accent: "#f59e0b",
        headerBg: "linear-gradient(135deg,#78350f 0%,#b45309 50%,#f59e0b 100%)",
      };
    default:
      return {
        title: "Verify Your Email",
        subtitle: "Use the code below to verify your email address and complete your registration.",
        warning: "Didn't request this? You can safely ignore this email. Your account will not be created unless you verify with this code.",
        accent: "#3b82f6",
        headerBg: "linear-gradient(135deg,#1e3a5f 0%,#1e40af 50%,#3b82f6 100%)",
      };
  }
}

export async function sendOTPEmail(email: string, otp: string, purpose: string = "register"): Promise<boolean> {
  const content = getOTPContent(purpose);

  try {
    await transporter.sendMail({
      from: `"CryptoEarnerX" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `${content.title} — CryptoEarnerX`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;">
        
        <!-- Header with Logo -->
        <tr><td style="background:${content.headerBg};padding:32px 40px;text-align:center;">
          <img src="${SITE_URL}/logo.png" width="56" height="56" alt="CryptoEarnerX" style="border-radius:12px;margin-bottom:12px;" />
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">CryptoEarnerX</h1>
          <p style="margin:6px 0 0;color:#fde68a;font-size:13px;">Earn Crypto. Build Teams. Grow Wealth.</p>
        </td></tr>
        
        <!-- OTP Section -->
        <tr><td style="padding:40px 40px 24px;">
          <h2 style="margin:0 0 8px;color:#ffffff;font-size:20px;font-weight:600;">${content.title}</h2>
          <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;line-height:1.5;">
            ${content.subtitle}
          </p>
          
          <!-- OTP Box -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background-color:#09090b;border:1px solid #27272a;border-radius:12px;padding:24px;text-align:center;">
              <p style="margin:0 0 8px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Your Verification Code</p>
              <p style="margin:0;font-size:40px;font-weight:800;letter-spacing:10px;color:${content.accent};font-family:'Courier New',monospace;">${otp}</p>
            </td></tr>
          </table>
          
          <p style="margin:20px 0 0;color:#71717a;font-size:13px;text-align:center;">
            This code expires in <strong style="color:#a1a1aa;">10 minutes</strong>
          </p>
        </td></tr>
        
        <!-- Info Box -->
        <tr><td style="padding:0 40px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background-color:#1e293b;border:1px solid #334155;border-radius:8px;padding:16px;">
              <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">
                <strong style="color:#cbd5e1;">Warning:</strong> ${content.warning}
              </p>
            </td></tr>
          </table>
        </td></tr>
        
        <!-- Divider -->
        <tr><td style="padding:0 40px;">
          <div style="border-top:1px solid #27272a;"></div>
        </td></tr>
        
        <!-- Footer -->
        <tr><td style="padding:24px 40px 32px;text-align:center;">
          <p style="margin:0 0 12px;color:#52525b;font-size:12px;">
            This is an automated email from CryptoEarnerX. Do not reply.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="padding:0 8px;"><a href="${SITE_URL}" style="color:#3b82f6;font-size:12px;text-decoration:none;">Website</a></td>
              <td style="color:#334155;font-size:12px;">|</td>
              <td style="padding:0 8px;"><a href="${SITE_URL}/terms" style="color:#3b82f6;font-size:12px;text-decoration:none;">Terms</a></td>
              <td style="color:#334155;font-size:12px;">|</td>
              <td style="padding:0 8px;"><a href="${SITE_URL}/privacy" style="color:#3b82f6;font-size:12px;text-decoration:none;">Privacy</a></td>
            </tr>
          </table>
          <p style="margin:16px 0 0;color:#3f3f46;font-size:11px;">&copy; 2026 CryptoEarnerX. All rights reserved.</p>
        </td></tr>
        
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    return true;
  } catch (error) {
    console.error("OTP email error:", error);
    return false;
  }
}
