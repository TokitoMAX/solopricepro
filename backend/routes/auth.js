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
        // En prod, on utilise APP_URL si défini. Sinon on fallback sur le header origin (dev/preview)
        const origin = process.env.APP_URL || req.headers.origin || req.protocol + '://' + req.get('host');
        const redirectTo = `${origin}/index.html`;

        console.log(`🔗 Redirect URL set to: ${redirectTo}`);

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
    const supabase = req.app.get('supabase');

    try {
        if (!accessToken) throw new Error('Token manquant');

        console.log(`🔐 Mise à jour du mot de passe...`);

        // Pour mettre à jour le mot de passe, on doit avoir une session valide.
        // Le flow Supabase : User clique sur le lien -> Redirigé vers le site avec un hash contenant access_token & type=recovery.
        // Le frontend récupère ce token.
        // MAIS pour updateUser, on doit être authentifié.
        // Avec supabase-js côté serveur, on ne peut pas utiliser 'getUser(accessToken)' puis 'updateUser' directement sur l'instance admin
        // car updateUser s'applique à l'utilisateur *connecté*.

        // Solution : On renvoie juste le fait que c'est au frontend de faire l'update via le client supabase s'il en a un ?
        // NON, on a pas de client supabase frontend configuré avec URL/KEY dans le code frontend actuel (c'est caché dans le backend proxy).

        // Donc on doit créer un client supabase temporaire authentifié avec ce token.
        const { createClient } = require('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        // On crée un client juste pour cet utilisateur
        const userSupabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        });

        const { data, error } = await userSupabase.auth.updateUser({
            password: password
        });

        if (error) throw error;

        res.json({ message: 'Mot de passe mis à jour avec succès !', user: data.user });

    } catch (error) {
        console.error('❌ Update Password Error:', error.message);
        res.status(400).json({ message: error.message || 'Impossible de mettre à jour le mot de passe' });
    }
});

module.exports = router;
