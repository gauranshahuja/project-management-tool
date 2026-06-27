const nodemailer = require('nodemailer');

let transporter = null;
let configured = false;

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char];
  });

const buildAppUrl = (path = '/') => {
  try {
    return new URL(path, process.env.APP_URL || 'http://localhost:5173').toString();
  } catch (err) {
    return new URL(path, 'http://localhost:5173').toString();
  }
};

const initTransporter = () => {
  if (transporter !== null) return;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    configured = true;
  } else {
    transporter = false;
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    initTransporter();
    const safeSubject = String(subject || 'ProjectHub notification')
      .replace(/[\r\n]+/g, ' ')
      .trim();

    if (!configured) {
      console.log(`[email skipped - SMTP not configured] to=${to} | ${safeSubject}`);
      return { skipped: true };
    }

    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
    await transporter.sendMail({ from, to, subject: safeSubject, html, text: text || '' });
    return { sent: true };
  } catch (err) {
    console.error('Email send failed:', err.message);
    return { error: err.message };
  }
};

const wrap = (title, bodyHtml) => `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f2937">
    <h2 style="color:#4f46e5;margin:0 0 16px">ProjectHub</h2>
    <h3 style="margin:0 0 12px">${escapeHtml(title)}</h3>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
    <p style="font-size:12px;color:#9ca3af">You received this from your ProjectHub workspace.</p>
  </div>`;

module.exports = { buildAppUrl, escapeHtml, sendEmail, wrap };
