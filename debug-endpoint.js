// Ajoutez cette route TEMPORAIREMENT pour déboguer
// À ajouter dans backend/routes/auth.js

router.get('/debug-env', (req, res) => {
    res.json({
        APP_URL: process.env.APP_URL || 'NOT_SET',
        NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
        VERCEL: process.env.VERCEL || 'NOT_SET',
        host: req.get('host'),
        protocol: req.protocol,
        computed_origin: process.env.APP_URL || `${req.protocol}://${req.get('host')}`
    });
});

// ⚠️ IMPORTANT: Supprimez cette route après avoir vérifié !
