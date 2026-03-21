const express = require('express');
const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
    console.log(`[Auth Router] ${req.method} ${req.path}`);
    next();
});

const { injectWelcomeData } = require('../services/onboarding');

// @route   POST /api/auth/register
// @desc    Register a new user via Supabase
// @access  Public
router.post('/register', async (req, res) => {
    const { email, password, company_name, first_name, last_name, country } = req.body || {};
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

        // Use the STANDARD signUp method.
        // IMPORTANT: In your Supabase Dashboard -> Authentication -> Providers -> Email,
        // you MUST disable "Confirm email" for this to work frictionlessly without an email roundtrip.
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    company_name: company_name || '', // optional
                    first_name: first_name || '',
                    last_name: last_name || '',
                    country: country || 'FR', // Default to France if missing
                    full_name: `${first_name || ''} ${last_name || ''}`.trim()
                }
            }
        });

        const user = data?.user || data;

        if (error) {
            console.error('❌ Supabase Auth SignUp Error:', {
                message: error.message,
                status: error.status,
                name: error.name
            });

            // Return user-friendly error
            let errorMsg = error.message || "Erreur lors de l'inscription";
            if (errorMsg.includes('already registered')) {
                errorMsg = "Cet email est déjà utilisé. Veuillez vous connecter.";
            }

            return res.status(400).json({
                message: errorMsg,
                code: error.status
            });
        }

        console.log('✅ Supabase signup (Standard) successful:', {
            userId: user?.id,
            email: user?.email
        });

        // ==========================================
        // ONBOARDING: Inject Welcome Data (Aha Moment)
        // ==========================================
        if (user && user.id) {
            // We use the admin replica because the new user doesn't have an active 
            // session token yet in the backend to pass RLS natively via headers.
            const serviceReplica = require('@supabase/supabase-js').createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            // Call asynchronously to avoid slowing down the API response to the user
            injectWelcomeData(serviceReplica, user.id).catch(err => {
                console.error('[ONBOARDING] Background injection failed:', err);
            });
        }
        // ==========================================

        if (!user) {
            return res.status(200).json({
                message: "Inscription en attente. Veuillez vérifier vos emails si la confirmation est requise.",
                requiresConfirmation: true
            });
        }

        // Standard signup returns a session if "Confirm Email" is disabled
        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                user_metadata: user.user_metadata
            },
            session: data.session || null,
            requiresConfirmation: !data.session, // If no session, email confirmation is likely enabled
            message: data.session ? "Inscription réussie !" : "Veuillez vérifier votre email."
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
    if (!req.body) {
        return res.status(400).json({ message: "Requête malformée : body manquant." });
    }
    const { email, password } = req.body;
    const supabase = req.app.get('supabase');

    try {
        console.log(`🔑 Tentative de connexion pour: ${email || 'EMAIL MANQUANT'}`);

        // Validation basique
        if (!req.body || Object.keys(req.body).length === 0) {
            console.error('❌ [AUTH] Body manquant ou vide');
            return res.status(400).json({ message: "Requête malformée : body manquant." });
        }

        if (!email || !password) {
            console.error('❌ [AUTH] Email ou mot de passe manquant dans le body');
            return res.status(400).json({ message: "L'email et le mot de passe sont obligatoires." });
        }

        if (!supabase) {
            console.error('❌ Supabase client is NULL in login route');
            return res.status(503).json({
                message: "Service d'authentification non configuré."
            });
        }

        console.log('📡 Envoi de la requête à Supabase...');
        const result = await supabase.auth.signInWithPassword({
            email,
            password
        });

        const data = result.data || {};
        const error = result.error;

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

        if (!data.user || !data.session) {
            console.error('❌ Login error: User or Session missing', {
                hasUser: !!data.user,
                hasSession: !!data.session
            });
            return res.status(401).json({
                message: "Session non créée. Veuillez vérifier si votre email a été confirmé."
            });
        }

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
            name: error.name,
            stack: error.stack
        });
        res.status(500).json({
            message: 'Erreur serveur lors de la connexion',
            error: process.env.NODE_ENV === 'development' ? error.stack : error.message
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
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) throw userError;

        // Use Admin SDK to get the very latest metadata (Supabase Auth metadata can be stale)
        const serviceReplica = require('@supabase/supabase-js').createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        const { data: adminData, error: adminError } = await serviceReplica.auth.admin.getUserById(user.id);

        const finalUser = adminData?.user || user;

        res.json({
            user: {
                id: finalUser.id,
                email: finalUser.email,
                user_metadata: finalUser.user_metadata
            }
        });
    } catch (error) {
        res.status(401).json({ message: 'Session invalide' });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile metadata
// @access  Private
router.put('/profile', async (req, res) => {
    const supabase = req.app.get('supabase');
    const token = req.headers.authorization?.split(' ')[1];
    const { first_name, last_name, company } = req.body;

    if (!token) return res.status(401).json({ message: 'Non autorisé' });

    try {
        console.log('🔄 Updating user profile meta...');

        const metadataUpdate = { company: company };
        if (first_name !== undefined) metadataUpdate.first_name = first_name;
        if (last_name !== undefined) metadataUpdate.last_name = last_name;
        if (first_name !== undefined || last_name !== undefined) {
            metadataUpdate.full_name = `${first_name || ''} ${last_name || ''}`.trim();
        }

        const { data, error } = await supabase.auth.updateUser({
            data: metadataUpdate
        }, {
            headers: { Authorization: `Bearer ${token}` } // Pass token explicitly just in case using server client
        });

        // NOTE: supabase.auth.updateUser usually requires the user's access token if using client SDK,
        // or Service Role if admin. Here we assume we might need to rely on the token validity or use getUser first.
        // Actually, with @supabase/supabase-js server-side, we should use the client created with the context.
        // But `auth.updateUser` updates the *current* session user if authenticated, or we can use admin.

        // Use Admin API for safe server-side update by ID if needed, but let's try standard updateUser first if we can auth the client.
        // Since `req.app.get('supabase')` is likely the ANON client, we can't just call updateUser without a session.
        // Better approach:
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) throw new Error('User not found');

        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
            data: metadataUpdate
        }); // This might fail if the server client isn't scoped to the user.

        // RETRY with Admin Client if the above fails or determines best practice:
        // Using Service Role is safer for backend updates.
        const serviceReplica = require('@supabase/supabase-js').createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: finalData, error: finalError } = await serviceReplica.auth.admin.updateUserById(
            user.id,
            { user_metadata: metadataUpdate }
        );

        if (finalError) throw finalError;

        console.log('✅ User profile updated (metadata)');
        res.json({ success: true, user: finalData.user });

    } catch (error) {
        console.error('❌ Profile update error:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
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
            console.log('⚠️ Service Role Key manquant. Utilisation de l\'API REST directe (Bypass Library Check)...');

            // On utilise fetch direct pour contourner le check de session de la librairie supabase-js
            const updateUserUrl = `${supabaseUrl}/auth/v1/user`;

            const response = await fetch(updateUserUrl, {
                method: 'PUT', // L'API GoTrue utilise PUT pour update user
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'apikey': anonKey
                },
                body: JSON.stringify({ password: password })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('❌ Direct API Error:', data);
                throw new Error(data.msg || data.message || 'Erreur lors de la mise à jour directe');
            }

            console.log('✨ Mot de passe mis à jour via API directe !');
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

// @route   PUT /api/auth/update-metadata
// @desc    Update user_metadata (first_name, last_name, full_name, country) in Supabase Auth
// @access  Private
router.put('/update-metadata', async (req, res) => {
    const { first_name, last_name, country } = req.body || {};
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Non autorisé' });

    try {
        const { createClient } = require('@supabase/supabase-js');
        const admin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Get user ID from token
        const { data: { user }, error: userErr } = await admin.auth.getUser(token);
        if (userErr || !user) throw new Error('Utilisateur introuvable');

        // Update user_metadata via admin API
        const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
            user_metadata: {
                ...user.user_metadata,
                first_name: first_name !== undefined ? first_name : (user.user_metadata?.first_name || ''),
                last_name: last_name !== undefined ? last_name : (user.user_metadata?.last_name || ''),
                full_name: `${first_name || user.user_metadata?.first_name || ''} ${last_name || user.user_metadata?.last_name || ''}`.trim(),
                country: country !== undefined ? country : (user.user_metadata?.country || '')
            }
        });

        if (updateErr) throw new Error(updateErr.message);

        console.log(`✅ Metadata updated for user ${user.id}: ${first_name} ${last_name} [${country}]`);
        res.json({ message: 'Profil mis à jour', first_name, last_name, country });
    } catch (err) {
        console.error('❌ update-metadata error:', err.message);
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/auth/delete-account
// @desc    Permanently delete the authenticated user account + all data
// @access  Private
router.delete('/delete-account', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Non authentifié.' });

    const token = authHeader.split(' ')[1];
    const supabase = req.app.get('supabase');

    try {
        // Verify the token to get the user
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !user) return res.status(401).json({ message: 'Session invalide.' });

        const userId = user.id;
        console.log(`🗑️ Delete account requested for user: ${userId}`);

        // Use Service Role to delete all user data from tables
        const { createClient } = require('@supabase/supabase-js');
        const adminClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const tables = [
            'sp_clients', 'sp_quotes', 'sp_invoices', 'sp_leads',
            'sp_expenses', 'sp_revenues', 'sp_journal', 'sp_settings',
            'sp_calculator_data', 'sp_network_providers', 'sp_user_profile',
            'sp_marketplace_applications'
        ];

        // Delete all user data
        await Promise.allSettled(
            tables.map(t => adminClient.from(t).delete().eq('user_id', userId))
        );

        // Delete the auth account itself
        const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);
        if (deleteErr) throw new Error(deleteErr.message);

        console.log(`✅ Account ${userId} deleted successfully.`);
        res.json({ success: true, message: 'Compte supprimé définitivement.' });
    } catch (err) {
        console.error('❌ delete-account error:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/auth/restore-subscription
// @desc    Force-sync subscription status from PayPal / manually restore tier
// @access  Private
router.post('/restore-subscription', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Non authentifié.' });

    const token = authHeader.split(' ')[1];
    const supabase = req.app.get('supabase');

    try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !user) return res.status(401).json({ message: 'Session invalide.' });

        const { createClient } = require('@supabase/supabase-js');
        const adminClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Read the current metadata
        const meta = user.user_metadata || {};
        const tier = meta.tier || (meta.is_pro ? 'pro' : 'free');

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
            console.log('⚠️ Service Role Key manquant. Utilisation de l\'API REST directe (Bypass Library Check)...');

            // On utilise fetch direct pour contourner le check de session de la librairie supabase-js
            const updateUserUrl = `${supabaseUrl}/auth/v1/user`;

            const response = await fetch(updateUserUrl, {
                method: 'PUT', // L'API GoTrue utilise PUT pour update user
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'apikey': anonKey
                },
                body: JSON.stringify({ password: password })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('❌ Direct API Error:', data);
                throw new Error(data.msg || data.message || 'Erreur lors de la mise à jour directe');
            }

            console.log('✨ Mot de passe mis à jour via API directe !');
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

// @route   PUT /api/auth/update-metadata
// @desc    Update user_metadata (first_name, last_name, full_name, country) in Supabase Auth
// @access  Private
router.put('/update-metadata', async (req, res) => {
    const { first_name, last_name, country } = req.body || {};
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Non autorisé' });

    try {
        const { createClient } = require('@supabase/supabase-js');
        const admin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Get user ID from token
        const { data: { user }, error: userErr } = await admin.auth.getUser(token);
        if (userErr || !user) throw new Error('Utilisateur introuvable');

        // Update user_metadata via admin API
        const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
            user_metadata: {
                ...user.user_metadata,
                first_name: first_name !== undefined ? first_name : (user.user_metadata?.first_name || ''),
                last_name: last_name !== undefined ? last_name : (user.user_metadata?.last_name || ''),
                full_name: `${first_name || user.user_metadata?.first_name || ''} ${last_name || user.user_metadata?.last_name || ''}`.trim(),
                country: country !== undefined ? country : (user.user_metadata?.country || '')
            }
        });

        if (updateErr) throw new Error(updateErr.message);

        console.log(`✅ Metadata updated for user ${user.id}: ${first_name} ${last_name} [${country}]`);
        res.json({ message: 'Profil mis à jour', first_name, last_name, country });
    } catch (err) {
        console.error('❌ update-metadata error:', err.message);
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/auth/delete-account
// @desc    Permanently delete the authenticated user account + all data
// @access  Private
router.delete('/delete-account', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Non authentifié.' });

    const token = authHeader.split(' ')[1];
    const supabase = req.app.get('supabase');

    try {
        // Verify the token to get the user
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !user) return res.status(401).json({ message: 'Session invalide.' });

        const userId = user.id;
        console.log(`🗑️ Delete account requested for user: ${userId}`);

        // Use Service Role to delete all user data from tables
        const { createClient } = require('@supabase/supabase-js');
        const adminClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const tables = [
            'sp_clients', 'sp_quotes', 'sp_invoices', 'sp_leads',
            'sp_expenses', 'sp_revenues', 'sp_journal', 'sp_settings',
            'sp_calculator_data', 'sp_network_providers', 'sp_user_profile',
            'sp_marketplace_applications'
        ];

        // Delete all user data
        await Promise.allSettled(
            tables.map(t => adminClient.from(t).delete().eq('user_id', userId))
        );

        // Delete the auth account itself
        const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);
        if (deleteErr) throw new Error(deleteErr.message);

        console.log(`✅ Account ${userId} deleted successfully.`);
        res.json({ success: true, message: 'Compte supprimé définitivement.' });
    } catch (err) {
        console.error('❌ delete-account error:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/auth/restore-subscription
// @desc    Force-sync subscription status from PayPal / manually restore tier
// @access  Private
router.post('/restore-subscription', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Non authentifié.' });

    const token = authHeader.split(' ')[1];
    const supabase = req.app.get('supabase');

    try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !user) return res.status(401).json({ message: 'Session invalide.' });

        const { createClient } = require('@supabase/supabase-js');
        const adminClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Read the current metadata
        const meta = user.user_metadata || {};
        const tier = meta.tier || (meta.is_pro ? 'pro' : 'free');

        if (tier === 'free' || tier === 'standard') {
            return res.status(400).json({ message: 'Aucun abonnement actif trouvé pour ce compte.' });
        }

        // Re-apply the subscription (remove canceled flag, reset expiry to +30 days)
        const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const { error: updateErr } = await adminClient.auth.admin.updateUserById(user.id, {
            user_metadata: {
                ...meta,
                is_pro: true,
                subscriptionCanceled: false,
                subscriptionExpiry: newExpiry
            }
        });
        if (updateErr) throw new Error(updateErr.message);

        console.log(`✅ Subscription restored for user ${user.id} (tier: ${tier})`);
        res.json({ success: true, message: `Abonnement ${tier.toUpperCase()} restauré.`, tier, expiry: newExpiry });
    } catch (err) {
        console.error('❌ restore-subscription error:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/auth/partner-login
// @desc    SSO Partner Login (DomTom Connect)
// @access  Public (Verification via HMAC signature)
router.post('/partner-login', async (req, res) => {
    const { email, name, timestamp, signature, partner } = req.body || {};
    
    if (!email || !signature || !timestamp) {
        return res.status(400).json({ message: 'Paramètres SSO manquants.' });
    }

    try {
        console.log(`[PARTNER-AUTH] Tentative SSO pour: ${email} via ${partner || 'inconnu'}`);

        // 1. Vérification de la signature
        const secret = process.env.PARTNER_SSO_SECRET || 'dtc_sso_default_secret_2026';
        const message = `${email}${name || ''}${timestamp}`;
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(message)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('[PARTNER-AUTH] Signature invalide');
            return res.status(401).json({ message: 'Signature de sécurité invalide.' });
        }

        // 2. Vérification de l'expiration (5 min)
        const requestTime = parseInt(timestamp);
        const now = Date.now();
        if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
            console.error('[PARTNER-AUTH] Token expiré');
            return res.status(401).json({ message: 'Le lien de connexion a expiré.' });
        }

        // 3. Récupérer ou Créer l'utilisateur dans Supabase
        const { createClient } = require('@supabase/supabase-js');
        const adminClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // On cherche si l'utilisateur existe déjà
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
        if (listError) throw listError;

        let existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        let userId;
        let isNewUser = false;

        if (!existingUser) {
            console.log(`[PARTNER-AUTH] Création auto d'un compte pour: ${email}`);
            const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                email: email,
                email_confirm: true,
                user_metadata: {
                    full_name: name || '',
                    partner: partner || 'domtomconnect',
                    is_partner_sso: true
                }
            });
            if (createError) throw createError;
            existingUser = newUser.user;
            userId = existingUser.id;
            isNewUser = true;
        } else {
            userId = existingUser.id;
            console.log(`[PARTNER-AUTH] Utilisateur existant trouvé: ${userId}`);
        }

        // 4. Injecter les données d'accueil si nouvel utilisateur
        if (isNewUser) {
            try {
                const { injectWelcomeData } = require('../services/onboarding');
                await injectWelcomeData(adminClient, userId);
            } catch (onboardingErr) {
                console.error('[PARTNER-AUTH] Erreur injection onboarding:', onboardingErr);
            }
        }

        // 5. Générer un lien de session
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: 'login',
            email: email
        });

        if (linkError) throw linkError;

        res.json({
            user: {
                id: existingUser.id,
                email: existingUser.email,
                user_metadata: existingUser.user_metadata || {}
            },
            session: {
                access_token: linkData.properties?.action_link?.split('token=')[1]?.split('&')[0] || 'sso_verified'
            },
            redirect_to: linkData.properties?.action_link
        });

        console.log(`[PARTNER-AUTH] SSO réussi pour: ${email}`);
    } catch (err) {
        console.error('[PARTNER-AUTH] Erreur interne:', err.message);
        res.status(500).json({ message: 'Erreur lors de la connexion partenaire.' });
    }
});

// @route   POST /api/auth/google-callback
// @desc    Valide un token Supabase issu du flux Google OAuth et retourne une session app
// @access  Public (token Supabase fourni par le client)
router.post('/google-callback', async (req, res) => {
    const { supabase_token, user_id, email, full_name, avatar_url } = req.body || {};
    const supabase = req.app.get('supabase');

    if (!supabase_token || !email) {
        return res.status(400).json({ message: 'Token ou email manquant.' });
    }

    try {
        console.log(`[GOOGLE-AUTH] Callback pour: ${email}`);

        // 1. Vérifier que le token est valide auprès de Supabase
        const { data: { user }, error: authErr } = await supabase.auth.getUser(supabase_token);
        if (authErr || !user) {
            console.error('[GOOGLE-AUTH] Token invalide:', authErr?.message);
            return res.status(401).json({ message: 'Token Google invalide ou expiré.' });
        }

        console.log(`[GOOGLE-AUTH] Token valide pour: ${user.email}`);

        // 2. S'assurer que le profil utilisateur existe dans sp_user_profile
        const { createClient } = require('@supabase/supabase-js');
        const adminClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Upsert du profil (pour la 1ère connexion Google)
        await adminClient.from('sp_user_profile').upsert({
            user_id: user.id,
            email: user.email,
            full_name: full_name || user.user_metadata?.full_name || '',
            avatar_url: avatar_url || user.user_metadata?.avatar_url || ''
        }, { onConflict: 'user_id', ignoreDuplicates: true });

        // 3. Retourner le format attendu par Auth.handleAuthSuccess()
        res.json({
            user: {
                id: user.id,
                email: user.email,
                user_metadata: user.user_metadata || {}
            },
            session: {
                access_token: supabase_token // On réutilise le token Supabase comme jeton app
            }
        });

        console.log(`[GOOGLE-AUTH] Callback réussi pour: ${user.email}`);
    } catch (err) {
        console.error('[GOOGLE-AUTH] Erreur callback:', err.message);
        res.status(500).json({ message: 'Erreur lors de la vérification Google.' });
    }
});

module.exports = router;
