const nodemailer = require("nodemailer");

let sgMail = null;

try {
  sgMail = require("@sendgrid/mail");
} catch (error) {
  console.warn("⚠️ @sendgrid/mail not installed. SendGrid disabled.");
}

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

if (sgMail && SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const gmailTransporter =
  process.env.EMAIL_USER && process.env.EMAIL_PASS
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      })
    : null;

async function sendEmail({ to, subject, html, text }) {
  if (sgMail && SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
    return sgMail.send({
      to,
      from: SENDGRID_FROM_EMAIL,
      subject,
      html,
      text,
    });
  }

  if (gmailTransporter) {
    return gmailTransporter.sendMail({
      to,
      from: process.env.EMAIL_USER,
      subject,
      html,
      text,
    });
  }

  throw new Error("No email provider configured.");
}

async function sendResetPasswordEmail(email, rawToken) {
  const appBase =
    process.env.APP_RESET_LINK_BASE || "myapp://reset-password";

  const webBase =
    process.env.WEB_RESET_LINK_BASE ||
    "http://localhost:3000/reset-password";

  const appResetLink = `${appBase}?token=${encodeURIComponent(rawToken)}`;
  const webResetLink = `${webBase}?token=${encodeURIComponent(rawToken)}`;

  return sendEmail({
    to: email,
    subject: "RAMHIS Password Reset",
    html: `
      <h2>RAMHIS Password Reset</h2>
      <p>You requested to reset your password.</p>
      <p><b>Mobile App:</b></p>
      <p><a href="${appResetLink}">${appResetLink}</a></p>
      <p><b>Web App:</b></p>
      <p><a href="${webResetLink}">${webResetLink}</a></p>
      <p>This link will expire soon.</p>
    `,
    text: `Reset your password:\nMobile: ${appResetLink}\nWeb: ${webResetLink}`,
  });
}

module.exports = {
  sgMail,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  gmailTransporter,
  sendEmail,
  sendResetPasswordEmail,
};