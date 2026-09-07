import nodemailer from 'nodemailer';

let transporter = null;

const buildTransporter = () => {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.SMTP_SECURE) === 'true' || port === 465,
    auth: { user, pass },
  });
  return transporter;
};

export const isEmailConfigured = () => !!buildTransporter();

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// Email an OTP code to a user. Returns false if mail is not configured or
// sending fails (caller falls back to showing the code inline). `purpose` is a
// short description used for generic subjects like the 2FA login flow.
export const sendOtpMail = async ({ to, name, otp, purpose = 'verify your KIKY profile' }) => {
  const tr = buildTransporter();
  if (!tr) return false;
  const subject = `KIKY verification code: ${otp}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f7f7f5; padding: 24px; border-radius: 12px;">
      <div style="background: #111827; color: #fff; padding: 18px 24px; border-radius: 10px; font-size: 18px; margin-bottom: 20px;">
        🔐 Your KIKY code
      </div>
      <div style="background: #fff; border-radius: 10px; padding: 24px; color: #374151;">
        <p>Hi ${esc(name)},</p>
        <p>Use the code below to ${esc(purpose)}. It expires in 10 minutes.</p>
        <p style="font-size: 32px; font-weight: 800; letter-spacing: 8px; text-align: center; color: #111827; margin: 24px 0;">${esc(otp)}</p>
        <p style="font-size: 13px; color: #9ca3af;">If you didn't request this, you can safely ignore this email.</p>
      </div>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">Sent by the KIKY app.</p>
    </div>
  `;
  try {
    await tr.sendMail({ from: `KIKY App <${process.env.SMTP_USER}>`, to, subject, html });
    return true;
  } catch (error) {
    console.error('OTP email failed:', error.message);
    return false;
  }
};

// Email an email-verification OTP to a user. Returns false if mail is not
// configured or sending fails (caller falls back to showing the code inline).
export const sendVerificationOtp = async (args) => sendOtpMail({ ...args, purpose: 'verify your profile in 10 minutes' });

// Email a password reset link + code to a user. Returns false if mail is not
// configured or sending fails (caller falls back to showing the code inline).
export const sendResetMail = async ({ to, name, code, link }) => {
  const tr = buildTransporter();
  if (!tr) return false;
  const subject = 'KIKY password reset';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f7f7f5; padding: 24px; border-radius: 12px;">
      <div style="background: #111827; color: #fff; padding: 18px 24px; border-radius: 10px; font-size: 18px; margin-bottom: 20px;">
        🔑 Reset your KIKY password
      </div>
      <div style="background: #fff; border-radius: 10px; padding: 24px; color: #374151;">
        <p>Hi ${esc(name)},</p>
        <p>Click the button below to set a new password. The link expires in 15 minutes.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${esc(link)}" style="display: inline-block; background: #84cc16; color: #111827; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 10px;">Reset password</a>
        </p>
        <p>Or enter this code on the reset page:</p>
        <p style="font-size: 32px; font-weight: 800; letter-spacing: 8px; text-align: center; color: #111827; margin: 24px 0;">${esc(code)}</p>
        <p style="font-size: 13px; color: #9ca3af;">If you didn't request this, you can safely ignore this email.</p>
      </div>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">Sent by the KIKY app.</p>
    </div>
  `;
  try {
    await tr.sendMail({ from: `KIKY App <${process.env.SMTP_USER}>`, to, subject, html });
    return true;
  } catch (error) {
    console.error('Reset email failed:', error.message);
    return false;
  }
};

// Email a newly submitted idea to the admin inbox (defined by ADMIN_EMAIL).
// Never throws: a failed email must not block saving the idea.
export const sendIdeaMail = async ({ fromName, fromEmail, category, idea }) => {
  const tr = buildTransporter();
  const inbox = process.env.ADMIN_EMAIL;
  if (!tr || !inbox) return false;
  const subject = `💡 New idea: ${category} — from ${fromName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f7f7f5; padding: 24px; border-radius: 12px;">
      <div style="background: #111827; color: #fff; padding: 18px 24px; border-radius: 10px; font-size: 18px; margin-bottom: 20px;">
        💡 New idea received
      </div>
      <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden;">
        <tr><td style="padding: 14px 20px; color: #6b7280; font-size: 13px; width: 120px;">From</td>
            <td style="padding: 14px 20px; font-size: 14px;">${esc(fromName)} &lt;${esc(fromEmail)}&gt;</td></tr>
        <tr><td style="padding: 14px 20px; color: #6b7280; font-size: 13px; width: 120px;">Category</td>
            <td style="padding: 14px 20px; font-size: 14px;">${esc(category)}</td></tr>
        <tr><td style="padding: 14px 20px; color: #6b7280; font-size: 13px; width: 120px;">Idea</td>
            <td style="padding: 14px 20px; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${esc(idea)}</td></tr>
      </table>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">Sent from the KIKY app. Reply to the user's email to follow up.</p>
    </div>
  `;
  try {
    await tr.sendMail({ from: `KIKY App <${process.env.SMTP_USER}>`, replyTo: fromEmail, to: inbox, subject, html });
    return true;
  } catch (error) {
    console.error('Idea email failed:', error.message);
    return false;
  }
};