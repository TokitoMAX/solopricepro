const express = require('express');
const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
    console.log(`[Auth Router] ${req.method} ${req.path}`);
    next();
});

const { injectWelcomeData } = require('../services/onboarding');

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password, company_name, first_name, last_name, country } = req.body || {};
    const supabase = req.app.get('supabase');
    try {
        if (!supabase) return res.status(503).json({ message: "Service d'authentification non configuré." });
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { company_name: company_name || '', first_name: first_name || '', last_name: last_name || '', country: country || 'FR', full_name: `${first_name || ''} ${last_name || ''}`.trim() } }
        });
        const user = data?.user || data;
        if (error) return res.status(400).json({ message: error.message });
        if (user && user.id) {
            const serviceReplica = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
            injectWelcomeData(serviceReplica, user.id).catch(err => console.error('[ONBOARDING] Background injection failed:', err));
        }
        res.status(201).json({ user, session: data.session || null, message: data.session ? "Inscription réussie !" : "Veuillez vérifier votre email." });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' });
    }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    const supabase = req.app.get('supabase');
    try {
        if (!email || !password) return res.status(400).json({ message: "L'email et le mot de passe sont obligatoires." });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return res.status(401).json({ message: error.message });
        res.json({ user: data.user, session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token } });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
    }
});

// @route   GET /api/auth/me
router.get('/me', async (req, res) => {
    const supabase = req.app.get('supabase');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Non autorisé' });
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) throw userError;
        const serviceReplica = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data: adminData } = await serviceReplica.auth.admin.getUserById(user.id);
        res.json({ user: adminData?.user || user });
    } catch (error) {
        res.status(401).json({ message: 'Session invalide' });
    }
});

// @route   POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    const { refresh_token } = req.body || {};
    const supabase = req.app.get('supabase');
    try {
        if (!refresh_token) return res.status(400).json({ message: "Token de rafraîchissement manquant" });
        const { data, error } = await supabase.auth.refreshSession({ refresh_token });
        if (error) throw error;
        res.json({ session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token }, user: data.user });
    } catch (error) {
        res.status(401).json({ message: 'Session invalide ou expirée' });
    }
});

// @route   PUT /api/auth/profile
router.put('/profile', async (req, res) => {
    const supabase = req.app.get('supabase');
    const token = req.headers.authorization?.split(' ')[1];
    const { first_name, last_name, company } = req.body || {};
    if (!token) return res.status(401).json({ message: 'Non autorisé' });
    try {
        const { data: { user } } = await supabase.auth.getUser(token);
        const metadataUpdate = { company };
        if (first_name !== undefined) metadataUpdate.first_name = first_name;
        if (last_name !== undefined) metadataUpdate.last_name = last_name;
        if (first_name || last_name) metadataUpdate.full_name = `${first_name || ''} ${last_name || ''}`.trim();
        const serviceReplica = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data: finalData, error: finalError } = await serviceReplica.auth.admin.updateUserById(user.id, { user_metadata: metadataUpdate });
        if (finalError) throw finalError;
        res.json({ success: true, user: finalData.user });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
    }
});

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body || {};
    const supabase = req.app.get('supabase');
    try {
        let origin = process.env.APP_URL || 'http://localhost:5050';
        const redirectTo = `${origin.replace(/\/$/, '')}/index.html`;
        await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    } catch (error) {
        res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    }
});

// @route   POST /api/auth/update-password
router.post('/update-password', async (req, res) => {
    const { accessToken, password } = req.body || {};
    const { createClient } = require('@supabase/supabase-js');
    try {
        if (!accessToken || !password) throw new Error('Token ou mot de passe manquant');
        const adminClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data: userData, error: userError } = await adminClient.auth.getUser(accessToken);
        if (userError) throw userError;
        const { error: updateError } = await adminClient.auth.admin.updateUserById(userData.user.id, { password });
        if (updateError) throw updateError;
        res.json({ message: 'Mot de passe mis à jour avec succès !' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @route   PUT /api/auth/update-metadata
router.put('/update-metadata', async (req, res) => {
    const { first_name, last_name, country } = req.body || {};
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    try {
        const { createClient } = require('@supabase/supabase-js');
        const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data: { user } } = await admin.auth.getUser(token);
        const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
            user_metadata: {
                ...user.user_metadata,
                first_name: first_name !== undefined ? first_name : (user.user_metadata?.first_name || ''),
                last_name: last_name !== undefined ? last_name : (user.user_metadata?.last_name || ''),
                full_name: `${first_name || user.user_metadata?.first_name || ''} ${last_name || user.user_metadata?.last_name || ''}`.trim(),
                country: country !== undefined ? country : (user.user_metadata?.country || '')
            }
        });
        if (updateErr) throw updateErr;
        res.json({ message: 'Profil mis à jour' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/auth/delete-account
router.delete('/delete-account', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const supabase = req.app.get('supabase');
    try {
        const { data: { user } } = await supabase.auth.getUser(token);
        const { createClient } = require('@supabase/supabase-js');
        const adminClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const tables = ['sp_clients', 'sp_quotes', 'sp_invoices', 'sp_leads', 'sp_expenses', 'sp_revenues', 'sp_journal', 'sp_settings', 'sp_calculator_data', 'sp_network_providers', 'sp_user_profile', 'sp_marketplace_applications'];
        await Promise.allSettled(tables.map(t => adminClient.from(t).delete().eq('user_id', user.id)));
        await adminClient.auth.admin.deleteUser(user.id);
        res.json({ success: true, message: 'Compte supprimé définitivement.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/auth/restore-subscription
router.post('/restore-subscription', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const supabase = req.app.get('supabase');
    try {
        const { data: { user } } = await supabase.auth.getUser(token);
        const meta = user.user_metadata || {};
        const tier = meta.tier || (meta.is_pro ? 'pro' : 'free');
        if (tier === 'free' || tier === 'standard') return res.status(400).json({ message: 'Aucun abonnement actif trouvé.' });
        const { createClient } = require('@supabase/supabase-js');
        const adminClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const { error: updateErr } = await adminClient.auth.admin.updateUserById(user.id, {
            user_metadata: { ...meta, is_pro: true, subscriptionCanceled: false, subscriptionExpiry: newExpiry }
        });
        if (updateErr) throw updateErr;
        res.json({ success: true, message: `Abonnement ${tier.toUpperCase()} restauré.`, tier, expiry: newExpiry });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Logic partagée pour le SSO (GET & POST)
async function handleSSOLogin(req, res, params) {
    const { email, name, timestamp, signature, partner } = params;
    console.log(`[SSO-DEBUG] Processing SSO for ${email}. Partner: ${partner}`);

    if (!email || !signature || !timestamp) {
        console.warn("[SSO-DEBUG] Missing parameters:", { email: !!email, signature: !!signature, timestamp: !!timestamp });
        return res.status(400).json({ message: 'Paramètres SSO manquants.' });
    }

    try {
        const secret = process.env.PARTNER_SSO_SECRET || 'dtc_sso_default_secret_2026';
        const crypto = require('crypto');
        const payload = `${email}${name || ''}${timestamp}`;
        const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        
        console.log(`[SSO-DEBUG] Sig Check -> Provided: ${signature.substring(0, 8)}..., Expected: ${expectedSignature.substring(0, 8)}...`);
        
        if (signature !== expectedSignature) {
            console.error("[SSO-DEBUG] Signature mismatch");
            return res.status(401).json({ message: 'Signature invalide.' });
        }

        if (Math.abs(Date.now() - parseInt(timestamp)) > 15 * 60 * 1000) {
            console.warn("[SSO-DEBUG] Link expired. Timestamp:", timestamp, "Now:", Date.now());
            return res.status(401).json({ message: 'Lien expiré.' });
        }

        const { createClient } = require('@supabase/supabase-js');
        const adminClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        console.log("[SSO-DEBUG] Verifying user existence...");
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
        if (listError) throw listError;

        let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        let isNewUser = false;

        if (!user) {
            console.log(`[SSO-DEBUG] Creating new user: ${email}`);
            const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                email, 
                email_confirm: true, 
                user_metadata: { 
                    full_name: name || '', 
                    company_name: name || '', // Utilisé par app.js pour l'affichage sidebar
                    partner: partner || 'domtomconnect', 
                    is_partner_sso: true 
                }
            });
            if (createError) throw createError;
            user = newUser.user;
            isNewUser = true;
        } else {
            // S'il existe déjà, on s'assure qu'il a le flag partner_sso
            console.log(`[SSO-DEBUG] Existing user: ${email}. Setting partner metadata.`);
            const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
                user_metadata: { 
                    ...user.user_metadata,
                    full_name: name || user.user_metadata?.full_name || '',
                    company_name: name || user.user_metadata?.company_name || user.user_metadata?.full_name || '',
                    partner: partner || 'domtomconnect',
                    is_partner_sso: true 
                }
            });
            if (updateError) console.warn("[SSO-DEBUG] Meta update error:", updateError.message);
        }

        // MISE À JOUR DU PROFIL
        const { error: profileError } = await adminClient
            .from('sp_user_profile')
            .upsert({
                user_id: user.id,
                email: user.email,
                full_name: name || user.user_metadata?.full_name || '',
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        
        if (profileError) console.error("[SSO-DEBUG] Profile error:", profileError.message);

        if (isNewUser) {
            await injectWelcomeData(adminClient, user.id).catch(err => console.error("[SSO-DEBUG] Onboarding error:", err));
        }

        // 7. Génération de l'URL de redirection (Détection d'origine robuste pour Vercel)
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const origin = process.env.APP_URL || `${protocol}://${host}`;
        const redirectTo = `${origin}/index.html`;

        console.log(`[SSO-DEBUG] Origin detection -> Proto: ${req.headers['x-forwarded-proto']}, Host: ${host}. Result Origin: ${origin}`);

        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({ 
            type: 'magiclink', 
            email,
            options: { redirectTo }
        });
        if (linkError) throw linkError;

        const actionLink = linkData?.properties?.action_link;
        if (!actionLink) {
            console.error("[SSO-DEBUG] action_link is missing in linkData.properties:", linkData?.properties);
            throw new Error("Lien de connexion non généré par Supabase");
        }
        
        // Si c'est un GET (redirection directe), on utilise le "Pont de Session"
        if (req.method === 'GET') {
            console.log("[SSO-DEBUG] GET Request: Sending Session Bridge page.");
            res.setHeader('Content-Type', 'text/html');
            return res.send(`
                <html>
                    <head>
                        <title>Connexion SoloPrice Pro...</title>
                        <style>
                            body { background: #0f172a; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                            .card { text-align: center; padding: 2rem; background: rgba(255,255,255,0.05); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); }
                            h2 { margin-bottom: 0.5rem; }
                            p { color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem; }
                            .link { color: #10b981; text-decoration: none; font-size: 0.8rem; }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <h2>Connexion à SoloPrice Pro...</h2>
                            <p>Préparation de votre session sécurisée.</p>
                            <a id="sso-link" class="link" href="${actionLink}">Cliquez ici si vous n'êtes pas redirigé</a>
                        </div>
                        <script>
                            setTimeout(() => { window.location.href = "${actionLink}"; }, 500);
                        </script>
                    </body>
                </html>
            `);
        }

        // Si c'est un POST (appel API), on renvoie les données pour le frontend
        console.log("[SSO-DEBUG] POST Request: Returning JSON response.");
        res.json({
            user: { id: user.id, email: user.email, user_metadata: user.user_metadata || {} },
            session: { access_token: actionLink?.split('token=')[1]?.split('&')[0] || 'sso_verified' },
            redirect_to: actionLink
        });

    } catch (err) {
        console.error("[SSO-DEBUG] Critical Error:", err);
        res.status(500).json({ message: 'Erreur lors de la connexion partenaire.', debug: err.message });
    }
}

// @route   GET /api/auth/partner-login
router.get('/partner-login', (req, res) => handleSSOLogin(req, res, req.query));

// @route   POST /api/auth/partner-login
router.post('/partner-login', (req, res) => handleSSOLogin(req, res, req.body));

// @route   POST /api/auth/google-callback
router.post('/google-callback', async (req, res) => {
    const { supabase_token, refresh_token, email, full_name, avatar_url } = req.body || {};
    const supabase = req.app.get('supabase');
    try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser(supabase_token);
        if (authErr || !user) throw authErr;
        const { createClient } = require('@supabase/supabase-js');
        const adminClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        await adminClient.from('sp_user_profile').upsert({
            user_id: user.id, email: user.email, full_name: full_name || user.user_metadata?.full_name || '', avatar_url: avatar_url || user.user_metadata?.avatar_url || ''
        }, { onConflict: 'user_id', ignoreDuplicates: true });
        res.json({ user: { id: user.id, email: user.email, user_metadata: user.user_metadata || {} }, session: { access_token: supabase_token, refresh_token: refresh_token } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
