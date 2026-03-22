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
                    partner: partner || 'domtomconnect',
                    is_partner_sso: true
                }
            });

            if (createError) throw createError;
            user = newUser.user;
            isNewUser = true;
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
        const origin = process.env.APP_URL || (req.headers.host ? `https://${req.headers.host}` : '');
        const redirectTo = `${origin}/index.html`;

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: { redirectTo }
        });

        if (linkError) throw linkError;

        console.log(`[SSO] Succès pour ${email}. Redirection via magic link.`);

        // 8. Redirection finale
        // Le lien généré par Supabase s'occupe de créer la session côté client
        return res.redirect(linkData.properties.action_link);

    } catch (err) {
        console.error("[SSO] Erreur critique:", err);
        return res.status(500).json({ error: "Erreur lors de la création/connexion de l'utilisateur" });
    }
}
