const express = require('express');
const router = express.Router();

// Middleware to extract user from Supabase token
async function authenticateUser(req, res, next) {
    const supabase = req.app.get('supabase');
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw error || new Error('User not found');
        req.user = user;
        next();
    } catch (err) {
        console.error('Auth error:', err.message);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}

router.use(authenticateUser);

// Generic GET for any table
router.get('/:table', async (req, res) => {
    const { table } = req.params;
    const supabase = req.app.get('supabase');

    try {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: `Error fetching ${table}`, error: err.message });
    }
});

// Generic POST (Insert)
router.post('/:table', async (req, res) => {
    const { table } = req.params;
    const supabase = req.app.get('supabase');
    let payload = req.body;

    // Ensure user_id is set
    if (Array.isArray(payload)) {
        payload = payload.map(item => ({ ...item, user_id: req.user.id }));
    } else {
        payload.user_id = req.user.id;
    }

    try {
        const { data, error } = await supabase
            .from(table)
            .upsert(payload, { onConflict: 'id' }); // Use upsert for sync logic (local IDs might already exist)

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: `Error saving to ${table}`, error: err.message });
    }
});

// Generic DELETE
router.delete('/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    const supabase = req.app.get('supabase');

    try {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: `Error deleting from ${table}`, error: err.message });
    }
});

module.exports = router;
