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