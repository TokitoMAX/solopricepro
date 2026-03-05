const express = require('express');
const router = express.Router();

// Middleware to extract user from Supabase token (same as data.js)
async function authenticateUser(req, res, next) {
    const supabase = req.app.get('supabase');
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Authorization header missing' });
    const token = authHeader.split(' ')[1];
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw error || new Error('User not found');
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}

router.use(authenticateUser);

// POST /api/ratings
router.post('/', async (req, res) => {
    const supabase = req.app.get('supabase');
    const { rated_user_id, score, comment } = req.body;
    const rater_user_id = req.user.id;

    if (!rated_user_id || !score) {
        return res.status(400).json({ message: 'Target user ID and score (1-5) are required' });
    }

    if (rated_user_id === rater_user_id) {
        return res.status(400).json({ message: 'You cannot rate yourself' });
    }

    try {
        const { data, error } = await supabase
            .from('sp_ratings')
            .upsert({
                rated_user_id,
                rater_user_id,
                score,
                comment,
                created_at: new Date().toISOString()
            }, { onConflict: 'rated_user_id, rater_user_id' })
            .select();

        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (err) {
        console.error('[RATINGS-POST] Error:', err);
        res.status(500).json({ message: 'Error saving rating', error: err.message });
    }
});

// GET /api/ratings/:userId
router.get('/:userId', async (req, res) => {
    const supabase = req.app.get('supabase');
    const { userId } = req.params;

    try {
        const { data, error } = await supabase
            .from('sp_ratings')
            .select('*')
            .eq('rated_user_id', userId);

        if (error) throw error;

        if (data.length === 0) {
            return res.json({ average: 0, count: 0, ratings: [] });
        }

        const sum = data.reduce((acc, r) => acc + r.score, 0);
        const average = parseFloat((sum / data.length).toFixed(1));

        res.json({
            average,
            count: data.length,
            ratings: data
        });
    } catch (err) {
        console.error('[RATINGS-GET] Error:', err);
        res.status(500).json({ message: 'Error fetching ratings', error: err.message });
    }
});

module.exports = router;
