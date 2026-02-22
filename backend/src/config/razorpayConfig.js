/**
 * razorpayConfig.js — Razorpay client instance
 *
 * Required env vars (set in Render → Environment):
 *   RAZORPAY_KEY_ID     → from Razorpay Dashboard → Settings → API Keys
 *   RAZORPAY_KEY_SECRET → from Razorpay Dashboard → Settings → API Keys
 */

const Razorpay = require('razorpay');

let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('✅ Razorpay initialized');
} else {
    console.warn('⚠️  Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET env vars.');
}

module.exports = razorpay;
