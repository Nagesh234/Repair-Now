const supabase = require('../config/supabase');

exports.register = async (req, res) => {
    const { email, password, full_name, role } = req.body;

    // Validate input
    if (!email || !password || !full_name || !role) {
        return res.status(400).json({ error: 'All fields are required: email, password, full_name, role' });
    }

    // Validate role
    if (!['client', 'partner'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "client" or "partner".' });
    }

    try {
        // 1. Sign up user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (authError) {
            throw authError;
        }

        const user = authData.user;

        if (user) {
            // 2. Insert profile into public.profiles table
            // Note: This matches the schema we defined earlier
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: user.id,
                        email: email,
                        full_name: full_name,
                        role: role,
                    }
                ]);

            if (profileError) {
                // If profile creation fails, we might want to alert or retry. 
                // For now, return the error.
                return res.status(500).json({ error: 'User created but profile creation failed', details: profileError.message });
            }

            return res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: full_name,
                    role: role
                }
            });
        }

        // Fallback if no user returned (e.g. if email confirmation is required and weird state)
        return res.status(200).json({ message: 'Registration initiated. Please check your email.' });

    } catch (error) {
        console.error('Registration Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Fetch user profile to get role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            console.warn('Profile fetch failed:', profileError);
        }

        res.json({
            message: 'Login successful',
            session: data.session,
            user: {
                ...data.user,
                profile: profile || null
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(401).json({ error: error.message });
    }
};
