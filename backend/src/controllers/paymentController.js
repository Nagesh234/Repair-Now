/**
 * paymentController.js — Razorpay payment flow
 *
 * Routes:
 *   POST /api/payments/create-order  → Create a Razorpay order
 *   POST /api/payments/verify        → Verify payment signature after success
 */

const crypto = require('crypto');
const razorpay = require('../config/razorpayConfig');
const supabase = require('../config/supabase');

// POST /api/payments/create-order
// Body: { amount (in paise), repairId, currency? }
exports.createOrder = async (req, res) => {
    if (!razorpay) {
        return res.status(503).json({ error: 'Payment service not configured. Contact support.' });
    }

    const { amount, repairId, currency = 'INR' } = req.body;

    if (!amount || !repairId) {
        return res.status(400).json({ error: 'amount (in paise) and repairId are required' });
    }

    try {
        const options = {
            amount: Math.round(amount),   // paise (e.g. ₹100 = 10000 paise)
            currency,
            receipt: `repair_${repairId}_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        return res.status(201).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            // Return key_id so the mobile app can initialize Razorpay checkout
            keyId: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

// POST /api/payments/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, repairId }
exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, repairId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !repairId) {
        return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    // Validate HMAC signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Invalid payment signature. Payment verification failed.' });
    }

    // Mark repair as paid in Supabase
    try {
        const { error } = await supabase
            .from('repairs')
            .update({
                payment_status: 'paid',
                payment_id: razorpay_payment_id,
                payment_order_id: razorpay_order_id,
            })
            .eq('id', repairId);

        if (error) throw error;

        return res.status(200).json({ message: 'Payment verified and recorded successfully' });
    } catch (error) {
        console.error('Payment DB Update Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
