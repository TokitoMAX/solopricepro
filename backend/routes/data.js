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
    let { table } = req.params;
    // Prepend sp_ prefix if not present (except for public missions which might be different, but let's be consistent)
    const actualTable = table.startsWith('sp_') ? table : `sp_${table}`;
    const supabase = req.app.get('supabase');

    try {
        let query = supabase.from(actualTable).select('*');

        // Marketplace missions: anyone authenticated can see all
        // Other tables: strictly filter by user_id
        if (table !== 'marketplace_missions' && table !== 'sp_marketplace_missions') {
            query = query.eq('user_id', req.user.id);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: `Error fetching ${table}`, error: err.message });
    }
});

// Generic POST (Insert)
router.post('/:table', async (req, res) => {
    let { table } = req.params;
    const actualTable = table.startsWith('sp_') ? table : `sp_${table}`;
    const supabase = req.app.get('supabase');
    let payload = req.body;

    // Ensure user_id is set
    if (Array.isArray(payload)) {
        payload = payload.map(item => ({ ...item, user_id: req.user.id }));
    } else {
        payload.user_id = req.user.id;
    }

    console.log(`[DATA-POST] 📤 Upserting to ${actualTable}:`, JSON.stringify(payload, null, 2));

    // Singular tables use 'user_id' as PK, others use 'id'
    const isSingularTable = ['settings', 'calculator_data', 'sp_settings', 'sp_calculator_data'].includes(table);
    const onConflict = isSingularTable ? 'user_id' : 'id';

    try {
        const { data, error } = await supabase
            .from(actualTable)
            .upsert(payload, { onConflict })
            .select();

        if (error) {
            console.error(`[DATA-POST] ❌ Supabase Error in ${table}:`, error);
            return res.status(400).json({
                success: false,
                v: '1.3-DIAGNOSTIC',
                DEBUG_MARKER: '!!-FAST-SYNC-ACTIVE-RESTART-SERVER-!!',
                message: `Supabase Error: ${error.message}`,
                error: error,
                hint: error.hint,
                details: error.details
            });
        }

        console.log(`[DATA-POST] ✅ ${table} updated.`, data ? data.length : 0);
        res.status(201).json({ success: true, v: '1.3-DIAGNOSTIC', timestamp: new Date().toISOString(), data });
    } catch (err) {
        console.error(`[DATA-POST] 💥 Critical Error for ${table}:`, err);
        res.status(500).json({
            success: false,
            v: '1.2-elite',
            message: `FATAL_SERVER_ERROR: ${err.message}`,
            details: err.stack
        });
    }
});

// Generic DELETE
router.delete('/:table/:id', async (req, res) => {
    let { table, id } = req.params;
    const actualTable = table.startsWith('sp_') ? table : `sp_${table}`;
    const supabase = req.app.get('supabase');

    try {
        const { error } = await supabase
            .from(actualTable)
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
