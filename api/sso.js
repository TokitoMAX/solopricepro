const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

export default async function handler(req, res) {
    // 1. Autoriser CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { email, name, timestamp, signature, partner } = req.method === 'POST' ? req.body : req.query;
    const secret = process.env.PARTNER_SSO_SECRET || 'dtc_sso_default_secret_2026';

    console.log(`[SSO-API] Request for ${email} from ${partner}`);

    if (!email || !signature || !timestamp) {
        return res.status(400).json({ error: "Paramètres SSO manquants" });
    }

    // 2. Vérification de la signature
    const payload = `${email}${name || ''}${timestamp}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (signature !== expectedSignature) {
        return res.status(401).json({ error: "Signature invalide" });
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        // 3. Récupérer ou Créer l'utilisateur (Recherche par email plus efficace)
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({
            filter: { email: email.toLowerCase() }
        });
        if (listError) throw listError;

        let user = users && users.length > 0 ? users[0] : null;
        const metadata = { 
            full_name: name || '', 
            company_name: name || '', 
            partner: partner || 'domtomconnect', 
            is_partner_sso: true 
        };

        if (!user) {
            console.log(`[SSO-API] Creating new user: ${email}`);
            const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: metadata
            });
            if (createError) throw createError;
            user = newUser.user;
        } else {
            console.log(`[SSO-API] Updating existing user: ${email}`);
            await adminClient.auth.admin.updateUserById(user.id, {
                user_metadata: { ...user.user_metadata, ...metadata }
            });
        }

        // 4. Sync Profile
        await adminClient.from('sp_user_profile').upsert({
            user_id: user.id,
            email: user.email,
            full_name: name || user.user_metadata?.full_name || '',
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        // 5. Générer le lien magique
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const origin = process.env.APP_URL || `${protocol}://${host}`;
        
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: { redirectTo: `${origin}/index.html` }
        });

        if (linkError) throw linkError;
        const actionLink = linkData.properties.action_link;

        // 6. Réponse selon le mode (Redirection pour GET, JSON pour POST)
        if (req.method === 'GET') {
            return res.redirect(actionLink);
        }

        return res.status(200).json({
            success: true,
            user: { id: user.id, email: user.email },
            redirect_to: actionLink
        });

    } catch (err) {
        console.error("[SSO-API] Critical Error:", err);
        return res.status(500).json({ error: "Erreur interne SSO", message: err.message });
    }
}
