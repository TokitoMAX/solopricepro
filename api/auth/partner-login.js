const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Importer le service d'onboarding pour injecter les données fictives
// Le chemin dépend du déploiement. En Vercel, on peut avoir besoin d'un chemin relatif stable.
// On suppose que le fichier est exécuté depuis le dossier racine ou api/auth/
const { injectWelcomeData } = require('../../backend/services/onboarding');

export default async function handler(req, res) {
    // 1. Récupération des paramètres
    const { partner, email, name, timestamp, signature } = req.query;
    const secret = process.env.PARTNER_SSO_SECRET || 'dtc_sso_default_secret_2026';

    if (!email || !signature || !timestamp) {
        return res.status(400).json({ error: "Paramètres SSO manquants (email, signature, timestamp)." });
    }

    // 2. Vérification de la signature pour l'identité
    const payload = `${email}${name || ''}${timestamp}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (signature !== expectedSignature) {
        console.error(`[SSO] Signature invalide pour ${email}. Reçu: ${signature}, Attendu: ${expectedSignature}`);
        return res.status(401).json({ error: "Signature invalide" });
    }

    // 3. Vérification de l'expiration (optionnel mais recommandé : 5 minutes)
    if (Math.abs(Date.now() - parseInt(timestamp)) > 5 * 60 * 1000) {
        return res.status(401).json({ error: "Lien SSO expiré" });
    }

    try {
        // Initialisation de Supabase Admin
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Configuration Supabase manquante (URL ou Service Role Key).");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // 4. Recherche ou Création de l'utilisateur
        console.log(`[SSO] Tentative de connexion pour ${email}...`);
        
        // On cherche par email
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        let isNewUser = false;

        if (!user) {
            console.log(`[SSO] Création d'un nouvel utilisateur : ${email}`);
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
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
            console.log(`[SSO] Utilisateur existant : ${email}. Mise à jour des métadonnées.`);
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
                user_metadata: { 
                    ...user.user_metadata,
                    full_name: name || user.user_metadata?.full_name || '',
                    company_name: name || user.user_metadata?.company_name || user.user_metadata?.full_name || '',
                    partner: partner || 'domtomconnect',
                    is_partner_sso: true 
                }
            });
            if (updateError) console.warn("[SSO] Erreur mise à jour métadonnées:", updateError.message);
        }

        // 5. Mise à jour du profil (sp_user_profile)
        // Conformément à AGENTS.md, on utilise les tables préfixées sp_
        const { error: profileError } = await supabaseAdmin
            .from('sp_user_profile')
            .upsert({
                user_id: user.id,
                email: user.email,
                full_name: name || user.user_metadata?.full_name || '',
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (profileError) {
            console.error("[SSO] Erreur lors de l'upsert du profil:", profileError.message);
        }

        // 6. Injection de données de bienvenue pour les nouveaux
        if (isNewUser) {
            console.log(`[SSO] Injection de données de démo pour ${user.id}`);
            await injectWelcomeData(supabaseAdmin, user.id).catch(err => {
                console.error("[SSO] Échec injection données bienvenue:", err);
            });
        }

        // 7. Génération d'un lien de connexion magique pour connecter l'utilisateur
        // On redirige vers l'URL de base de l'app, qui détectera la session
        // 7. Génération d'un lien de connexion magique (Détection d'origine robuste)
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const origin = process.env.APP_URL || `${protocol}://${host}`;
        const redirectTo = `${origin}/index.html`;

        console.log(`[SSO] Origin: ${origin} (Proto: ${req.headers['x-forwarded-proto']}, Host: ${host})`);

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: { redirectTo }
        });

        if (linkError) throw linkError;

        const actionLink = linkData?.properties?.action_link;
        if (!actionLink) {
            console.error("[SSO] action_link manquant dans linkData.properties:", linkData?.properties);
            throw new Error("Lien de connexion non généré par Supabase");
        }

        console.log(`[SSO] Succès pour ${email}. Envoi de la page de transition.`);
        res.setHeader('Content-Type', 'text/html');
        return res.send(`
            <html>
                <head>
                    <title>Connexion SoloPrice Pro...</title>
                    <style>
                        body { background: #0f172a; color: white; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                        .card { text-align: center; padding: 2.5rem; background: rgba(255,255,255,0.03); border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(12px); max-width: 420px; width: 90%; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
                        .loader { width: 48px; height: 48px; border: 3px solid rgba(16, 185, 129, 0.1); border-top-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem; }
                        @keyframes spin { to { transform: rotate(360deg); } }
                        h2 { margin: 0 0 0.75rem 0; font-weight: 700; color: #f8fafc; font-size: 1.5rem; }
                        p { color: #94a3b8; font-size: 0.95rem; margin-bottom: 2rem; line-height: 1.5; }
                        .link { color: #10b981; text-decoration: none; font-size: 0.85rem; opacity: 0.6; transition: all 0.2s; border-bottom: 1px solid transparent; }
                        .link:hover { opacity: 1; border-bottom-color: #10b981; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="loader"></div>
                        <h2>Presque prêt...</h2>
                        <p>Nous vous connectons en toute sécurité à votre tableau de bord SoloPrice Pro.</p>
                        <a id="sso-link" class="link" href="${actionLink}">Cliquez ici si la redirection ne démarre pas</a>
                    </div>
                    <script>
                        setTimeout(() => {
                            window.location.href = "${actionLink}";
                        }, 800);
                    </script>
                </body>
            </html>
        `);

    } catch (err) {
        console.error("[SSO] Erreur critique:", err);
        return res.status(500).json({ error: "Erreur lors de la création/connexion de l'utilisateur" });
    }
}
