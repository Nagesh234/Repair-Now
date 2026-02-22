/**
 * emailService.js — Sends emails via Gmail using Nodemailer
 *
 * Required env vars (set in Render → Environment):
 *   GMAIL_USER  → your Gmail address (e.g. repairnow@gmail.com)
 *   GMAIL_PASS  → Gmail App Password (NOT your login password)
 *                 Generate at: myaccount.google.com/apppasswords
 */

const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,   // Gmail App Password
        },
    });
    console.log('✅ Gmail email service initialized');
} else {
    console.warn('⚠️  Gmail not configured. Set GMAIL_USER and GMAIL_PASS env vars. Emails will be logged only.');
}

/**
 * Send a plain OTP email
 * @param {string} to - recipient email
 * @param {string} otp - 6-digit OTP code
 */
exports.sendOTPEmail = async (to, otp) => {
    const subject = 'Your Repair Now OTP Code';
    const html = `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px;">
            <h2 style="color:#E53935;">Repair Now</h2>
            <p>Your One-Time Password (OTP) is:</p>
            <h1 style="letter-spacing:8px;color:#333;">${otp}</h1>
            <p style="color:#888;font-size:13px;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
            <p style="color:#bbb;font-size:12px;">If you didn't request this, please ignore this email.</p>
        </div>
    `;

    if (!transporter) {
        // Fallback: log OTP to console (useful for development)
        console.log(`📧 [EMAIL FALLBACK] OTP for ${to}: ${otp}`);
        return;
    }

    await transporter.sendMail({
        from: `"Repair Now" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
    });

    console.log(`📧 OTP email sent to ${to}`);
};

/**
 * Send a general notification email
 * @param {string} to - recipient email
 * @param {string} subject
 * @param {string} bodyHtml - HTML body
 */
exports.sendEmail = async (to, subject, bodyHtml) => {
    if (!transporter) {
        console.log(`📧 [EMAIL FALLBACK] To: ${to} | Subject: ${subject}`);
        return;
    }

    await transporter.sendMail({
        from: `"Repair Now" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html: bodyHtml,
    });
};
