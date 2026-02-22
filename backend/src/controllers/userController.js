const supabase = require('../config/supabase');
const multer = require('multer');

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
