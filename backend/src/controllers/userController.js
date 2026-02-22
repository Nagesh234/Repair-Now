const supabase = require('../config/supabase');
const multer = require('multer');
const emailService = require('../services/emailService');

// Configure Multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.uploadAvatarMiddleware = upload.single('avatar');

exports.updateProfile = async (req, res) => {
    const { id } = req.params;
    const { full_name, phone_number } = req.body;
    const file = req.file;

    try {
        let avatar_url = null;

        // 1. Upload Avatar if present
        if (file) {
            const fileName = `${id}-${Date.now()}.jpg`;
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('avatars')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (uploadError) {
                throw new Error(`Avatar Upload Failed: ${uploadError.message}`);
            }

            // Get Public URL
            const { data: urlData } = supabase
                .storage
                .from('avatars')
                .getPublicUrl(fileName);

            avatar_url = urlData.publicUrl;
        }

        // 2. Update Profile Data
        const updates = {};
        if (full_name) updates.full_name = full_name;
        if (phone_number) updates.phone_number = phone_number;
        if (avatar_url) updates.avatar_url = avatar_url;

        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.status(200).json({
                message: 'Profile updated successfully',
                user: data
            });
        } else {
            res.status(200).json({ message: 'No changes provided' });
        }

    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateFcmToken = async (req, res) => {
    const { id } = req.params;
    const { fcm_token } = req.body;

    if (!fcm_token) {
        // Technically not an error if we want to clear it, but let's assume we are saving one
        return res.status(400).json({ error: 'fcm_token is required' });
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ fcm_token: fcm_token })
            .eq('id', id)
            .select();

        if (error) {
            throw error;
        }

        res.status(200).json({ message: 'FCM Token updated successfully' });

    } catch (error) {
        console.error('Update FCM Token Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

exports.approveKyc = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid KYC status' });
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ kyc_status: status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({ message: `KYC status updated to ${status}`, user: data });
    } catch (error) {
        console.error('Approve KYC Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// In-memory OTP store (keyed by email or phone): { otp, expiresAt }
const otpStore = {};

// POST /api/auth/check-unique
// Body: { email?, phone_number? }
exports.checkUniqueness = async (req, res) => {
    const { email, phone_number } = req.body;

    if (!email && !phone_number) {
        return res.status(400).json({ error: 'Provide email or phone_number to check' });
    }

    try {
        const results = {};

        if (email) {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .maybeSingle();
            if (error) throw error;
            results.email = { available: !data };
        }

        if (phone_number) {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('phone_number', phone_number)
                .maybeSingle();
            if (error) throw error;
            results.phone_number = { available: !data };
        }

        return res.status(200).json(results);
    } catch (error) {
        console.error('Check Uniqueness Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

// POST /api/auth/send-otp
// Body: { email }
exports.sendOTP = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'email is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore[email] = { otp, expiresAt };

    try {
        await emailService.sendOTPEmail(email, otp);
    } catch (err) {
        console.error('Failed to send OTP email:', err.message);
        // Don't block — OTP is stored; user can retry
    }

    return res.status(200).json({ message: 'OTP sent successfully' });
};

// POST /api/auth/verify-otp
// Body: { email, otp }
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'email and otp are required' });
    }

    const record = otpStore[email];

    if (!record) {
        return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' });
    }

    if (Date.now() > record.expiresAt) {
        delete otpStore[email];
        return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp.toString()) {
        return res.status(400).json({ error: 'Invalid OTP' });
    }

    delete otpStore[email];
    return res.status(200).json({ message: 'OTP verified successfully' });
};
