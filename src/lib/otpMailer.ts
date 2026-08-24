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
    const purposeText = purpose === "withdrawal" ? "Withdrawal Verification" : "Email Verification";

    await transporter.sendMail({
      from: `"CryptoEarnerX" <${process.env.SMTP_USER}>`,
      replyTo: `"CryptoEarnerX Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `[CryptoEarnerX] Your ${purposeText} Code: ${otp}`,
      headers: {
        "X-Mailer": "CryptoEarnerX",
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        "Precedence": "bulk",
        "List-Unsubscribe": `<${SITE_URL}/settings>`,
      },
      text: `CryptoEarnerX - ${content.title}\n\nYour verification code: ${otp}\n\nThis code expires in 10 minutes.\n\n${content.warning}\n\nIf you did not request this, please ignore this email.\n\nCryptoEarnerX Team\n${SITE_URL}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table width="460" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:12px;border:1px solid #1e1e1e;overflow:hidden;">
        
        <tr><td style="background:${content.headerBg};padding:28px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">CryptoEarnerX</h1>
          <p style="margin:4px 0 0;color:#fde68a;font-size:12px;">Account Security</p>
        </td></tr>
        
        <tr><td style="padding:32px 32px 20px;">
          <p style="margin:0 0 6px;color:#ffffff;font-size:18px;font-weight:600;">${content.title}</p>
          <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;line-height:1.6;">
            ${content.subtitle}
          </p>
          
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background-color:#0a0a0a;border:1px solid #27272a;border-radius:10px;padding:20px 16px;text-align:center;">
              <p style="margin:0 0 6px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Your Verification Code</p>
              <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:12px;color:${content.accent};font-family:'Courier New',Courier,monospace;">${otp}</p>
            </td></tr>
          </table>
          
          <p style="margin:16px 0 0;color:#71717a;font-size:13px;text-align:center;">
            Code expires in <strong style="color:#a1a1aa;">10 minutes</strong>. Do not share this code with anyone.
          </p>
        </td></tr>
        
        <tr><td style="padding:0 32px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background-color:#1a1a1a;border:1px solid #27272a;border-radius:8px;padding:14px;">
              <p style="margin:0;color:#a1a1aa;font-size:13px;line-height:1.5;">
                ${content.warning}
              </p>
            </td></tr>
          </table>
        </td></tr>
        
        <tr><td style="padding:0 32px;"><div style="border-top:1px solid #1e1e1e;"></div></td></tr>
        
        <tr><td style="padding:20px 32px 28px;text-align:center;">
          <p style="margin:0 0 8px;color:#52525b;font-size:11px;">
            This is an automated security email from CryptoEarnerX. Do not reply.
          </p>
          <p style="margin:0;color:#3f3f46;font-size:11px;">&copy; 2026 CryptoEarnerX &mdash; ${SITE_URL}</p>
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
