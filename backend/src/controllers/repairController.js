const supabase = require('../config/supabase');
const notificationService = require('../services/notificationService');

exports.createRepair = async (req, res) => {
    const { client_id, title, category_id, description, address } = req.body;

    // Validate input
    if (!client_id || !title || !category_id || !description || !address) {
        return res.status(400).json({ error: 'All fields are required: client_id, title, category_id, description, address' });
    }

    try {
        const { data, error } = await supabase
            .from('repairs')
            .insert([
                {
                    client_id,
                    title,
                    category_id,
                    description,
                    address,
                    status: 'pending' // Default status
                }
            ])
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            message: 'Repair request created successfully',
            repair: data
        });

        // Notify all partners about the new job
        // 1. Fetch all partners with FCM tokens
        const { data: partners } = await supabase
            .from('profiles')
            .select('fcm_token')
            .eq('role', 'partner')
            .not('fcm_token', 'is', null);

        if (partners && partners.length > 0) {
            const tokens = partners.map(p => p.fcm_token);
            notificationService.sendMulticastNotification(
                tokens,
                'New Repair Request',
                `New job available: ${title}`
            );
        }

    } catch (error) {
        console.error('Create Repair Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

exports.getClientRepairs = async (req, res) => {
    const { client_id } = req.query;

    if (!client_id) {
        return res.status(400).json({ error: 'client_id query parameter is required' });
    }

    try {
        const { data, error } = await supabase
            .from('repairs')
            .select(`
                *,
                partner:profiles!partner_id(full_name)
            `)
            .eq('client_id', client_id)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // Flatten the response structure
        const repairsWithPartner = data.map(repair => ({
            ...repair,
            partner_name: repair.partner ? repair.partner.full_name : null,
            partner: undefined // remove the object
        }));

        res.status(200).json({
            message: 'Repairs fetched successfully',
            repairs: repairsWithPartner
        });

    } catch (error) {
        console.error('Get Client Repairs Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

exports.getPendingRepairs = async (req, res) => {
    const { partner_id } = req.query;

    if (!partner_id) {
        return res.status(400).json({ error: 'partner_id is required for dispatch logic' });
    }

    try {
        // 1. Get Partner Profile
        const { data: partner, error: partnerError } = await supabase
            .from('profiles')
            .select('kyc_status, rating')
            .eq('id', partner_id)
            .single();

        if (partnerError || !partner) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        // 2. Check KYC Gate
        if (partner.kyc_status !== 'approved') {
            // Return empty array instead of error, so app handles it gracefully
            return res.status(200).json({
                message: 'Pending KYC approval',
                repairs: [],
                kyc_pending: true
            });
        }

        // 3. Priority Dispatch Logic
        let query = supabase
            .from('repairs')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        // If rating is < 4.5, delay visibility by 5 minutes
        if (partner.rating < 4.5) {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            query = query.lte('created_at', fiveMinutesAgo);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.status(200).json({
            message: 'Pending repairs fetched successfully',
            repairs: data
        });

    } catch (error) {
        console.error('Get Pending Repairs Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

exports.acceptRepair = async (req, res) => {
    const { id } = req.params;
    const { partner_id } = req.body;

    if (!partner_id) {
        return res.status(400).json({ error: 'partner_id is required' });
    }

    try {
        const { data, error } = await supabase
            .from('repairs')
            .update({ status: 'accepted', partner_id: partner_id })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(200).json({
            message: 'Repair accepted successfully',
            repair: data
        });

        // Notify Client
        const { data: client } = await supabase
            .from('profiles')
            .select('fcm_token')
            .eq('id', data.client_id)
            .single();

        if (client && client.fcm_token) {
            notificationService.sendNotification(
                client.fcm_token,
                'Repair Accepted',
                `Your repair "${data.title}" has been accepted by a partner.`
            );
        }

    } catch (error) {
        console.error('Accept Repair Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

exports.getPartnerJobs = async (req, res) => {
    // ... existing implementation ...
    const { partner_id } = req.query;

    if (!partner_id) {
        return res.status(400).json({ error: 'partner_id is required' });
    }

    try {
        const { data, error } = await supabase
            .from('repairs')
            .select('*')
            .eq('partner_id', partner_id)
            .in('status', ['accepted', 'en_route', 'diagnosing', 'estimate_provided', 'repairing', 'completed'])
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        res.status(200).json({
            message: 'Partner jobs fetched successfully',
            repairs: data
        });

    } catch (error) {
        console.error('Get Partner Jobs Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

exports.completeRepair = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('repairs')
            .update({ status: 'completed' })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(200).json({
            message: 'Repair completed successfully',
            repair: data
        });

        // Notify Client
        const { data: client } = await supabase
            .from('profiles')
            .select('fcm_token')
            .eq('id', data.client_id)
            .single();

        if (client && client.fcm_token) {
            notificationService.sendNotification(
                client.fcm_token,
                'Repair Completed',
                `Your repair "${data.title}" has been marked as completed.`
            );
        }

    } catch (error) {
        console.error('Complete Repair Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: 'status is required' });

    try {
        const { data, error } = await supabase
            .from('repairs')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Notify Client
        const { data: client } = await supabase.from('profiles').select('fcm_token').eq('id', data.client_id).single();
        if (client && client.fcm_token) {
            notificationService.sendNotification(client.fcm_token, 'Repair Update', `Order "${data.title}" status changed to ${status}`);
        }

        res.status(200).json({ message: 'Status updated', repair: data });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.provideEstimate = async (req, res) => {
    const { id } = req.params;
    const { estimated_cost } = req.body;

    if (!estimated_cost) return res.status(400).json({ error: 'estimated_cost is required' });

    try {
        const { data, error } = await supabase
            .from('repairs')
            .update({ status: 'estimate_provided', estimated_cost })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Notify client
        const { data: client } = await supabase.from('profiles').select('fcm_token').eq('id', data.client_id).single();
        if (client && client.fcm_token) {
            notificationService.sendNotification(client.fcm_token, 'Estimate Provided', `An estimate of ₹${estimated_cost} has been provided for "${data.title}". Please review.`);
        }

        res.status(200).json({ message: 'Estimate provided', repair: data });
    } catch (error) {
        console.error('Provide Estimate Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.approveEstimate = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('repairs')
            .update({ status: 'repairing' })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Notify Partner
        if (data.partner_id) {
            const { data: partner } = await supabase.from('profiles').select('fcm_token').eq('id', data.partner_id).single();
            if (partner && partner.fcm_token) {
                notificationService.sendNotification(partner.fcm_token, 'Estimate Approved', `The client approved the estimate for "${data.title}". You can begin repairs.`);
            }
        }

        res.status(200).json({ message: 'Estimate approved', repair: data });
    } catch (error) {
        console.error('Approve Estimate Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.rateRepair = async (req, res) => {
    const { id } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'rating must be a number between 1 and 5' });
    }

    try {
        // 1. Fetch the repair
        const { data: repair, error: repairError } = await supabase
            .from('repairs')
            .select('partner_id, status, rated')
            .eq('id', id)
            .single();

        if (repairError || !repair) return res.status(404).json({ error: 'Repair not found' });
        if (repair.status !== 'completed') return res.status(400).json({ error: 'Only completed repairs can be rated' });
        if (repair.rated) return res.status(400).json({ error: 'This repair has already been rated' });
        if (!repair.partner_id) return res.status(400).json({ error: 'No partner assigned to this repair' });

        // 2. Fetch current partner rating stats
        const { data: partner, error: partnerError } = await supabase
            .from('profiles')
            .select('rating, total_jobs')
            .eq('id', repair.partner_id)
            .single();

        if (partnerError || !partner) return res.status(404).json({ error: 'Partner not found' });

        // 3. Calculate new running average rating
        const currentRating = partner.rating ?? 0;
        const totalJobs = partner.total_jobs ?? 0;
        const newRating = totalJobs > 0
            ? ((currentRating * totalJobs) + rating) / (totalJobs + 1)
            : rating;

        // 4. Update partner's rating and increment job count
        await supabase
            .from('profiles')
            .update({
                rating: parseFloat(newRating.toFixed(2)),
                total_jobs: totalJobs + 1,
            })
            .eq('id', repair.partner_id);

        // 5. Mark repair as rated so it cannot be rated twice
        await supabase.from('repairs').update({ rated: true }).eq('id', id);

        res.status(200).json({ message: `Rated ${rating}/5. Partner rating updated to ${newRating.toFixed(2)}.` });

    } catch (error) {
        console.error('Rate Repair Error:', error);
        res.status(500).json({ error: error.message });
    }
};

