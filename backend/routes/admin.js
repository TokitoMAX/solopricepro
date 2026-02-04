const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Middleware d'authentification Admin
// Vérifie le token ET l'email hardcodé pour une sécurité maximale
async function authenticateAdmin(req, res, next) {
    const supabase = req.app.get('supabase');
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 1. Vérifier le token
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ message: 'Session invalide ou expirée' });
        }

        // 2. Vérifier l'email (Hardcheck de sécurité)
        const ADMIN_EMAIL = 'domtomconnect@gmail.com';

        if (user.email !== ADMIN_EMAIL) {
            console.warn(`⚠️ Tentative d'accès Admin refusée pour : ${user.email}`);
            return res.status(403).json({ message: 'Accès non autorisé. Réservé à l\'administrateur.' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Admin Auth Error:', err.message);
        res.status(500).json({ message: 'Erreur serveur lors de l\'authentification' });
    }
}

// Appliquer le middleware à toutes les routes admin
router.use(authenticateAdmin);

// @route   GET /api/admin/users
// @desc    Lister tous les utilisateurs (via Service Role)
router.get('/users', async (req, res) => {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceKey) {
            throw new Error('Clé Admin (Service Role) manquante sur le serveur');
        }

        const adminClient = createClient(supabaseUrl, serviceKey);

        const { data: { users }, error } = await adminClient.auth.admin.listUsers();

        if (error) throw error;

        // On nettoie les données avant de les renvoyer (pas de hash de mdp etc)
        const cleanUsers = users.map(u => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            provider: u.app_metadata.provider || 'email',
            confirmed: !!u.email_confirmed_at
        }));

        res.json(cleanUsers);

    } catch (error) {
        console.error('Admin List Users Error:', error.message);
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs', error: error.message });
    }
});

// @route   GET /api/admin/system
// @desc    État du système
router.get('/system', (req, res) => {
    res.json({
        status: 'online',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        node_env: process.env.NODE_ENV,
        admin_user: req.user.email
    });
});

module.exports = router;
