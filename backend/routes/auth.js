const express = require('express');
const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
    console.log(`[Auth Router] ${req.method} ${req.path}`);
    next();
});

// @route   POST /api/auth/register
// @desc    Register a new user via Supabase
// @access  Public
router.post('/register', async (req, res) => {
    const { email, password, company } = req.body;
    const supabase = req.app.get('supabase');

    try {
        console.log(`📝 Inscription demandée pour: ${email}`);

        // Check if supabase client exists
        if (!supabase) {
            console.error('❌ Supabase client is NULL in register route');
            return res.status(503).json({
                message: "Service d'authentification non configuré.",
                debug: "Supabase client is null"
            });
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    company_name: company?.name || '',
                    is_pro: false
                }
            }
        });

        if (error) {
            console.error('❌ Supabase Auth Error:', {
                message: error.message,
                status: error.status,
                name: error.name
            });

            // Return user-friendly error
            return res.status(400).json({
                message: error.message || "Erreur lors de l'inscription",
                code: error.status
            });
        }

        // Si la confirmation d'email est activée, data.user peut exister mais data.session sera null.
        // Ou data.user peut être null si le compte n'est pas créé immédiatement.
        console.log('✅ Supabase signup successful:', {
            hasUser: !!data.user,
            hasSession: !!data.session
        });

        if (!data.user) {
            return res.status(200).json({
                message: "Inscription réussie ! Veuillez vérifier vos emails pour confirmer votre compte.",
                requiresConfirmation: true
            });
        }

        res.status(201).json({
            user: {
                id: data.user.id,
                email: data.user.email,
                user_metadata: data.user.user_metadata
            },
            session: data.session ? {
                access_token: data.session.access_token
            } : null,
            message: !data.session ? "Veuillez confirmer votre email." : undefined
        });
    } catch (error) {
        console.error('💥 Catch Error /register:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({
            message: 'Erreur serveur lors de l\'inscription',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   POST /api/auth/login
// @desc    Auth user & get token via Supabase
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const supabase = req.app.get('supabase');

    try {
        console.log(`🔑 Tentative de connexion pour: ${email}`);

        if (!supabase) {
            console.error('❌ Supabase client is NULL in login route');
            return res.status(503).json({
                message: "Service d'authentification non configuré."
            });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('❌ Login error:', {
                message: error.message,
                status: error.status
            });
            return res.status(401).json({
                message: error.message || 'Email ou mot de passe incorrect'
            });
        }

        console.log('✅ Login successful for:', email);
        res.json({
            user: {
                id: data.user.id,
                email: data.user.email,
                user_metadata: data.user.user_metadata
            },
            session: {
                access_token: data.session.access_token
            }
        });
    } catch (error) {
        console.error('💥 Catch Error /login:', {
            message: error.message,
            name: error.name
        });
        res.status(500).json({
            message: 'Erreur serveur lors de la connexion',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get user profile (simplified for Supabase)
// @access  Private (Needs token check)
router.get('/me', async (req, res) => {
    const supabase = req.app.get('supabase');
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Non autorisé' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) throw error;

        res.json({
            user: {
                id: user.id,
                email: user.email,
                user_metadata: {
                    company_name: user.user_metadata.company_name,
                    is_pro: user.user_metadata.is_pro
                }
            }
        });
    } catch (error) {
        res.status(401).json({ message: 'Session invalide' });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const supabase = req.app.get('supabase');

    try {
        console.log(`📧 Demande de réinitialisation pour: ${email}`);

        // Obtenir l'URL de base pour la redirection
        let origin = process.env.APP_URL;

        // Si APP_URL n'est pas défini, utiliser les headers de la requête
        // IMPORTANT: On ne vérifie plus si c'est localhost - on fait confiance à APP_URL
        if (!origin) {
            const host = req.get('host'); // ex: my-app.vercel.app ou 192.168.1.50:5050
            const protocol = req.protocol;
            if (host) {
                origin = `${protocol}://${host}`;
            } else {
                // Fallback ultime si vraiment rien n'est disponible
                origin = 'http://localhost:5050';
            }
        }

        // Retirer le slash final si présent
        if (origin.endsWith('/')) origin = origin.slice(0, -1);

        const redirectTo = `${origin}/index.html`;

        console.log(`🔗 Redirect URL computed: ${redirectTo} (APP_URL was: ${process.env.APP_URL})`);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectTo,
        });

        if (error) throw error;

        res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    } catch (error) {
        console.error('❌ Forgot Password Error:', error);
        // On renvoie un succès même en cas d'erreur pour ne pas leaker l'existence des emails
        // SAUF si c'est une erreur de configuration
        if (error.message && error.message.includes('configuration')) {
            return res.status(500).json({ message: "Erreur de configuration du serveur." });
        }
        res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    }
});

// @route   POST /api/auth/update-password
// @desc    Update password using recovery token
// @access  Private (via access_token in body)
router.post('/update-password', async (req, res) => {
    const { accessToken, password } = req.body;
    const { createClient } = require('@supabase/supabase-js');

    try {
        if (!accessToken) throw new Error('Token manquant');
        if (!password) throw new Error('Mot de passe manquant');

        console.log(`🔐 Tentative de mise à jour du mot de passe...`);

        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const anonKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || (!serviceKey && !anonKey)) {
            throw new Error('Configuration Supabase manquante sur le serveur');
        }

        // 1. D'abord, on vérifie si le token est valide et on récupère l'utilisateur
        const client = createClient(supabaseUrl, anonKey);
        const { data: userData, error: userError } = await client.auth.getUser(accessToken);

        if (userError) {
            console.error('❌ Token validation error:', userError.message);
            // Message plus explicite pour l'utilisateur
            if (userError.message.includes('expired')) {
                throw new Error('Votre lien de récupération a expiré. Veuillez refaire une demande.');
            }
            throw userError;
        }

        const userId = userData.user.id;
        console.log(`✅ Token valide pour l'utilisateur: ${userId}`);

        // 2. On utilise le Service Role Key (Admin) pour forcer le changement de mot de passe
        // C'est beaucoup plus fiable côté serveur
        if (serviceKey) {
            console.log('🔑 Utilisation du Service Role Key pour la mise à jour...');
            const adminClient = createClient(supabaseUrl, serviceKey);
            const { data, error: updateError } = await adminClient.auth.admin.updateUserById(
                userId,
                { password: password }
            );

            if (updateError) throw updateError;
            console.log('✨ Mot de passe mis à jour avec succès (Admin)');
        } else {
            console.log('⚠️ Service Role Key manquant, tentative via client utilisateur...');
            // Fallback si pas de service key (moins fiable)
            const userSupabase = createClient(supabaseUrl, anonKey, {
                global: { headers: { Authorization: `Bearer ${accessToken}` } }
            });
            const { error: updateError } = await userSupabase.auth.updateUser({ password });
            if (updateError) throw updateError;
        }

        res.json({ message: 'Mot de passe mis à jour avec succès ! Vous pouvez maintenant vous connecter.' });

    } catch (error) {
        console.error('❌ Update Password Error:', error.message);
        res.status(400).json({
            message: error.message || 'Impossible de mettre à jour le mot de passe',
            error: error.message
        });
    }
});

module.exports = router;
