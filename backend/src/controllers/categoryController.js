const supabase = require('../config/supabase');

/**
 * @desc Get all master data categories for repairs
 * @route GET /api/categories
 * @access Public (or authenticated client)
 */
exports.getCategories = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('[Category Error]', error);
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }

        res.status(200).json({ categories: data });
    } catch (err) {
        console.error('[Category Server Error]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
