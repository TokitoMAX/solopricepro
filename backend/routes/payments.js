const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Route pour créer une session d'abonnement ou de paiement SaaS
// Helper pour obtenir le token PayPal
async function getPayPalAccessToken() {
    const rawMode = process.env.PAYPAL_MODE || '';
    const mode = rawMode.trim().toLowerCase();

    // Si mode est 'live' OU si on est sur Vercel sans être en mode 'sandbox'
    // On rajoute une sécurité : si les clés LIVE sont détectées, on passe en LIVE par défaut.
    const isLive = mode === 'live' ||
        (process.env.NODE_ENV === 'production' && mode !== 'sandbox') ||
        (!!process.env.PAYPAL_LIVE_CLIENT_ID && mode !== 'sandbox');

    const paypalKeys = Object.keys(process.env).filter(k => k.startsWith('PAYPAL_'));
    console.log(`[PAYPAL-ENV-DEBUG] Present Keys: ${paypalKeys.join(', ')}`);
    console.log(`[PAYPAL-DEBUG] Mode Config: "${mode}", isLive: ${isLive}, NodeEnv: ${process.env.NODE_ENV}`);

    const clientId = isLive ? process.env.PAYPAL_LIVE_CLIENT_ID : process.env.PAYPAL_CLIENT_ID;
    const clientSecret = isLive ? process.env.PAYPAL_LIVE_CLIENT_SECRET : process.env.PAYPAL_CLIENT_SECRET;
    const baseUrl = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    console.log(`[PAYPAL-DEBUG] Using Keys: ${clientId ? clientId.substring(0, 8) + '...' : 'MISSING'} / ${clientSecret ? 'PRESENT' : 'MISSING'}`);

    if (!clientId || !clientSecret) {
        console.error(`[PAYPAL] Configuration missing for ${isLive ? 'LIVE' : 'SANDBOX'} mode. (Raw Mode: "${rawMode}")`);
        throw new Error(`PayPal configuration missing (${isLive ? 'LIVE' : 'SANDBOX'}). Vérifiez vos clés ${isLive ? 'LIVE_' : ''}CLIENT_ID dans le .env.`);
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error(`[PAYPAL] Auth Failed (${isLive ? 'LIVE' : 'SANDBOX'}):`, errData);
        throw new Error('Failed to get PayPal Access Token');
    }
    const { access_token } = await res.json();
    return { token: access_token, baseUrl };
}

// Route pour créer une commande PayPal pour un DEVIS (Expert ou Plateforme)
router.post('/create-quote-paypal-order', async (req, res) => {
    let step = 'init';
    try {
        const { quoteId, type } = req.body; // type: 'expert' ou 'platform'
        const supabase = req.app.get('supabase');

        if (!quoteId || !type) return res.status(400).json({ message: "Paramètres manquants." });

        // 1. Récupérer le devis
        step = 'fetch_quote';
        const { data: quote, error: quoteError } = await supabase
            .from('sp_quotes')
            .select('*')
            .eq('id', quoteId)
            .single();

        if (quoteError || !quote) {
            console.error(`[PAYPAL-ORDER] Quote not found: ${quoteId}`, quoteError);
            return res.status(404).json({ message: "Devis introuvable.", details: quoteError });
        }

        // 2. Déterminer le montant et le Payee (le destinataire)
        step = 'prepare_amount';
        let amount, description, payeeEmail;

        if (type === 'expert') {
            amount = quote.itemsSubtotal || quote.subtotal || 0;
            description = `Acompte Devis #${quote.number} - Prestation`;

            // Récupérer l'email PayPal de l'expert
            const { data: profile } = await supabase
                .from('sp_user_profile')
                .select('paypal_email')
                .eq('user_id', quote.user_id)
                .single();

            payeeEmail = profile?.paypal_email;
            if (!payeeEmail) return res.status(400).json({ message: "Le prestataire n'a pas configuré son email PayPal de réception." });
        } else {
            amount = quote.margin || 0;
            description = `Protection & Service SoloPrice - Devis #${quote.number}`;
        }

        if (amount <= 0 && type === 'platform') {
            return res.status(400).json({ message: "Aucun frais de protection pour ce devis." });
        }

        // 3. Créer la commande PayPal
        step = 'get_access_token';
        const { token, baseUrl } = await getPayPalAccessToken();

        step = 'create_order_request';
        const orderData = {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'EUR',
                    value: Number(amount).toFixed(2)
                },
                description: description,
                custom_id: JSON.stringify({ quoteId, type, userId: quote.user_id })
            }],
            application_context: {
                return_url: `${process.env.APP_URL || ''}/#view-quote=${quoteId}?paypal_order_id={PAYPAL_ORDER_ID}&type=${type}`,
                cancel_url: `${process.env.APP_URL || ''}/#view-quote=${quoteId}?payment=cancel`,
                user_action: 'PAY_NOW',
                shipping_preference: 'NO_SHIPPING'
            }
        };

        // Si c'est pour l'expert, on spécifie le destinataire
        if (type === 'expert' && payeeEmail) {
            orderData.purchase_units[0].payee = { email_address: payeeEmail };
        }

        const paypalRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const paypalOrder = await paypalRes.json();

        if (!paypalRes.ok) {
            console.error('PayPal Order API Error:', paypalOrder);
            return res.status(500).json({
                message: "PayPal a refusé la création de la commande.",
                details: paypalOrder.message || JSON.stringify(paypalOrder),
                step: step
            });
        }

        const approvalUrl = paypalOrder.links.find(l => l.rel === 'approve')?.href;
        res.json({ orderId: paypalOrder.id, approval_url: approvalUrl });

    } catch (err) {
        console.error(`💥 [PAYPAL-ORDER] Failure at step: ${step}`, err);
        res.status(500).json({
            message: "Erreur lors de l'initialisation du paiement PayPal.",
            details: err.message,
            step: step
        });
    }
});

// Route Webhook Stripe pour confirmer le paiement
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET ? process.env.STRIPE_WEBHOOK_SECRET.trim() : null;

    console.log(`📡 [WEBHOOK] --- DEBUG START ---`);
    console.log(`📡 [WEBHOOK] Path: ${req.originalUrl}, Signature: ${sig ? sig.substring(0, 15) + '...' : 'MISSING'}`);
    console.log(`📡 [WEBHOOK] Secret L: ${endpointSecret?.length || 0} (${endpointSecret ? endpointSecret.substring(0, 7) + '...' + endpointSecret.substring(endpointSecret.length - 4) : 'MISSING'})`);

    let event;

    try {
        const bodyToVerify = req.rawBody || req.body;
        const bodyType = bodyToVerify instanceof Buffer ? 'Buffer' : typeof bodyToVerify;

        console.log(`📦 [WEBHOOK] Verifying with type: ${bodyType} (${bodyToVerify?.length || 0} bytes)`);

        event = stripe.webhooks.constructEvent(bodyToVerify, sig, endpointSecret);
        console.log(`✅ [WEBHOOK] Verified: ${event.type}`);
    } catch (err) {
        const debugPath = req.originalUrl || req.path || 'unknown';
        const bodyToVerify = req.rawBody || req.body;
        const bodyType = bodyToVerify instanceof Buffer ? 'Buffer' : typeof bodyToVerify;
        const secretHash = endpointSecret ? `L${endpointSecret.length}_${endpointSecret.substring(0, 5)}...` : 'NoSecret';

        console.error(`⚠️ Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message} (Path: ${debugPath}, Body: ${bodyType}, Secret: ${secretHash})`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const type = session.metadata?.type;
        const userId = session.metadata?.userId || session.client_reference_id;
        const amountTotal = session.amount_total;

        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        const adminClient = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        if (type === 'quote_payment') {
            const quoteId = session.metadata.quoteId;
            console.log(`💰 Paiement Devis reçu pour: ${quoteId}`);

            try {
                // 1. Mettre à jour le devis
                const { error: quoteError } = await adminClient
                    .from('sp_quotes')
                    .update({
                        platform_paid_at: new Date().toISOString(),
                        status: 'paid',
                        last_payment_method: 'stripe',
                        last_transaction_id: session.id
                    })
                    .eq('id', quoteId);

                if (quoteError) throw quoteError;
                console.log(`✅ Devis ${quoteId} marqué comme PAYÉ.`);

                // 2. Mettre à jour l'enregistrement de paiement
                const { error: payError } = await adminClient
                    .from('sp_payments')
                    .update({ status: 'completed', completed_at: new Date().toISOString() })
                    .eq('provider_id', session.id);

                if (payError) console.error(`⚠️ Erreur mise à jour sp_payments pour ${session.id}:`, payError.message);

                // 3. Enregistrer le revenu pour le dashboard (Part Expert)
                try {
                    await adminClient.from('sp_revenues').insert({
                        user_id: session.metadata.userId,
                        amount: session.amount_total / 100,
                        date: new Date().toISOString().split('T')[0],
                        description: `Paiement Devis #${quoteId}`,
                        category: 'Vente de services',
                        metadata: { quoteId: quoteId, stripeSessionId: session.id }
                    });
                    console.log(`📈 Revenu enregistré pour le devis ${quoteId}`);
                } catch (revErr) {
                    console.error(`⚠️ Erreur enregistrement revenu pour ${quoteId}:`, revErr.message);
                }

            } catch (err) {
                console.error(`❌ Erreur post-paiement devis ${quoteId}:`, err.message);
            }
        } else {
            // Logique SaaS originale
            if (userId) {
                console.log(`💰 [DEBUG] Paiement SaaS réussi pour: ${userId}`);
                console.log(`💰 [DEBUG] Session ID: ${session.id}, Amount: ${amountTotal}`);
                try {
                    let planId = 'pro';
                    if (amountTotal >= 2500) planId = 'expert';
                    if (session.metadata?.planId) planId = session.metadata.planId;

                    // 1. Enregistrer la transaction pour fiabilité
                    const { error: payError } = await adminClient.from('sp_payments').insert({
                        user_id: userId,
                        amount: amountTotal / 100,
                        currency: 'eur',
                        method: 'stripe',
                        status: 'completed',
                        provider_id: session.id,
                        metadata: { type: 'saas_upgrade', planId: planId },
                        completed_at: new Date().toISOString()
                    });
                    if (payError) {
                        console.error(`❌ [DEBUG] Erreur enregistrement sp_payments pour ${session.id}:`, payError);
                    } else {
                        console.log(`✅ [DEBUG] Enregistrement sp_payments OK pour ${session.id}`);
                    }

                    // 2. Promouvoir l'utilisateur
                    console.log(`🔄 [DEBUG] Tentative de promotion pour le user ${userId} vers ${planId}...`);
                    const { error } = await adminClient.auth.admin.updateUserById(userId, {
                        user_metadata: { is_pro: true, tier: planId }
                    });
                    if (error) {
                        console.error(`❌ [DEBUG] Erreur promotion Admin API:`, error);
                        throw error;
                    }
                    console.log(`✅ Utilisateur ${userId} promu au rang ${planId.toUpperCase()}.`);
                } catch (err) {
                    console.error(`❌ Erreur activation tier pour ${userId}:`, err.message);
                }
            }
        }
    }

    res.json({ received: true });
});

// Route pour capturer un paiement PayPal pour un DEVIS
router.post('/paypal-capture-quote', async (req, res) => {
    try {
        const { orderID } = req.body;
        const supabase = req.app.get('supabase');

        if (!orderID) return res.status(400).json({ message: "ID de commande manquant." });

        const { token, baseUrl } = await getPayPalAccessToken();

        // 1. Capturer la commande
        const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const captureData = await captureRes.json();

        if (captureData.status === 'COMPLETED') {
            const purchaseUnit = captureData.purchase_units[0];
            const customData = JSON.parse(purchaseUnit.payments.captures[0].custom_id || purchaseUnit.custom_id);
            const { quoteId, type, userId } = customData;

            console.log(`✅ [PAYPAL-QUOTE] Capture réussie (${type}) pour le devis ${quoteId}`);

            const supabaseUrl = process.env.SUPABASE_URL;
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const adminClient = createClient(supabaseUrl, serviceKey, {
                auth: { autoRefreshToken: false, persistSession: false }
            });

            // 1. Mettre à jour le devis (Champ spécifique selon le type)
            const updateFields = {};
            if (type === 'expert') {
                updateFields.expert_paid_at = new Date().toISOString();
            } else {
                updateFields.platform_paid_at = new Date().toISOString();
            }

            const { data: updatedQuote, error: updateError } = await adminClient
                .from('sp_quotes')
                .update(updateFields)
                .eq('id', quoteId)
                .select()
                .single();

            if (updateError) throw updateError;

            // 2. Vérifier si les DEUX sont payés pour passer le devis en "paid"
            if (updatedQuote.expert_paid_at && updatedQuote.platform_paid_at) {
                await adminClient
                    .from('sp_quotes')
                    .update({ status: 'paid' })
                    .eq('id', quoteId);
                console.log(`🚀 [PAYPAL-QUOTE] Devis ${quoteId} entièrement PAYÉ.`);
            }

            // 3. Enregistrer la transaction pour historique
            await adminClient.from('sp_payments').insert({
                user_id: userId,
                quote_id: quoteId,
                amount: parseFloat(purchaseUnit.payments.captures[0].amount.value),
                currency: 'EUR',
                method: 'paypal',
                status: 'completed',
                provider_id: orderID,
                metadata: { type: `quote_${type}_payment`, quoteId },
                completed_at: new Date().toISOString()
            });

            return res.json({ status: 'success', message: 'Paiement enregistré.' });
        } else {
            console.error(`❌ [PAYPAL-QUOTE] Échec capture:`, captureData);
            return res.status(400).json({ status: 'failed', message: 'Échec de la capture.', details: captureData });
        }

    } catch (err) {
        console.error('PayPal Quote Capture Error:', err);
        res.status(500).json({ message: 'Erreur lors de la capture.', error: err.message });
    }
});

// Route pour capturer un paiement PayPal (v2) et promouvoir l'utilisateur (SaaS)
router.post('/paypal-capture', async (req, res) => {
    try {
        const { orderID, tier, userId } = req.body;
        const supabase = req.app.get('supabase');

        if (!orderID || !tier || !userId) {
            return res.status(400).json({ message: "Données de transaction incomplètes." });
        }

        console.log(`📡 [PAYPAL] Tentative de capture pour Commande: ${orderID}, Tier: ${tier}, User: ${userId}`);

        // 1. Détecter l'environnement et valider les clés
        const isLive = process.env.PAYPAL_MODE === 'live' || (process.env.NODE_ENV === 'production' && process.env.PAYPAL_MODE !== 'sandbox');
        const clientId = isLive ? process.env.PAYPAL_LIVE_CLIENT_ID : process.env.PAYPAL_CLIENT_ID;
        const clientSecret = isLive ? process.env.PAYPAL_LIVE_CLIENT_SECRET : process.env.PAYPAL_CLIENT_SECRET;
        const baseUrl = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

        if (!clientId || !clientSecret) {
            console.error(`❌ [PAYPAL] Erreur: Identifiants ${isLive ? 'LIVE' : 'SANDBOX'} manquants dans .env`);
            return res.status(500).json({
                status: 'failed',
                message: `Configuration PayPal manquante (Mode: ${isLive ? 'LIVE' : 'SANDBOX'}).`
            });
        }

        console.log(`📡 [PAYPAL] Tentative de capture (${isLive ? 'LIVE' : 'SANDBOX'}) pour Commande: ${orderID}, Tier: ${tier}, User: ${userId}`);

        // 2. Obtenir un Access Token PayPal
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        if (!tokenRes.ok) {
            const tokenErr = await tokenRes.json();
            console.error('❌ [PAYPAL] Échec authentification API:', tokenErr);
            return res.status(500).json({ status: 'failed', message: 'Erreur authentification PayPal.', details: tokenErr });
        }

        const { access_token } = await tokenRes.json();

        // 3. Capturer la commande
        const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const captureData = await captureRes.json();

        if (captureData.status === 'COMPLETED') {
            console.log(`✅ [PAYPAL] Capture réussie pour ${orderID}. Mise à jour des données...`);

            const supabaseUrl = process.env.SUPABASE_URL;
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
            const adminClient = createClient(supabaseUrl, serviceKey, {
                auth: { autoRefreshToken: false, persistSession: false }
            });

            // 1. Enregistrer la transaction pour fiabilité
            try {
                await adminClient.from('sp_payments').insert({
                    user_id: userId,
                    amount: tier === 'pro' ? 15 : 29, // Simplifié pour SaaS
                    currency: 'eur',
                    method: 'paypal',
                    status: 'completed',
                    provider_id: orderID,
                    metadata: { type: 'saas_upgrade', tier: tier },
                    completed_at: new Date().toISOString()
                });
            } catch (payErr) {
                console.error('❌ [PAYPAL] Erreur enregistrement sp_payments:', payErr.message);
            }

            // 2. Promouvoir l'utilisateur
            const { error } = await adminClient.auth.admin.updateUserById(userId, {
                user_metadata: { is_pro: true, tier: tier }
            });

            if (error) throw error;

            console.log(`🚀 [PAYPAL] Utilisateur ${userId} promu au rang ${tier.toUpperCase()}.`);
            return res.json({ status: 'success', message: 'Paiement capturé et compte activé.' });
        } else {
            console.error(`❌ [PAYPAL] Échec de la capture:`, captureData);
            return res.status(400).json({ status: 'failed', message: 'Échec de la capture du paiement.', details: captureData });
        }

    } catch (err) {
        console.error('💥 PayPal Capture Error:', err);
        res.status(500).json({ message: 'Erreur lors de la capture PayPal', error: err.message });
    }
});

router.post('/paypal-subscription', async (req, res) => {
    try {
        const { subscriptionID, tier, userId } = req.body;
        const isProd = process.env.NODE_ENV === 'production';

        console.log(`📡 [PAYPAL-SUB] Reçu notification pour: ${subscriptionID}, User: ${userId}`);

        // Dans un environnement de prod, on devrait vérifier le statut de l'abonnement via l'API PayPal ici.
        // Pour l'instant on fait confiance au client pour valider l'UX Sandbox.

        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            throw new Error('Supabase configuration missing');
        }

        const adminClient = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const { error } = await adminClient.auth.admin.updateUserById(userId, {
            user_metadata: {
                is_pro: true,
                tier: tier,
                subscription_id: subscriptionID,
                payment_method: 'paypal_subscription'
            }
        });

        if (error) throw error;

        console.log(`🚀 [PAYPAL-SUB] Utilisateur ${userId} promu (permanent) via abonnement ${subscriptionID}.`);
        res.json({ status: 'success', message: 'Abonnement enregistré et compte activé.' });

    } catch (err) {
        console.error('💥 PayPal Subscription Error:', err);
        res.status(500).json({ status: 'failed', message: 'Erreur lors de l\'enregistrement de l\'abonnement', error: err.message });
    }
});

router.post('/paypal-cancel', async (req, res) => {
    try {
        const { userId } = req.body;

        console.log(`📡 [PAYPAL-CANCEL] Demande de résiliation pour User: ${userId}`);

        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            throw new Error('Supabase configuration missing');
        }

        const adminClient = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // On marque l'abonnement comme résilié (mais l'accès reste PRO jusqu'à la fin du mois)
        const { error } = await adminClient.auth.admin.updateUserById(userId, {
            user_metadata: {
                subscription_canceled: true,
                canceled_at: new Date().toISOString()
            }
        });

        if (error) throw error;

        console.log(`🚀 [PAYPAL-CANCEL] Abonnement de l'utilisateur ${userId} marqué comme résilié.`);
        res.json({ status: 'success', message: 'Abonnement résilié avec succès.' });

    } catch (err) {
        console.error('💥 PayPal Cancel Error:', err);
        res.status(500).json({ status: 'failed', message: 'Erreur lors de la résiliation', error: err.message });
    }
});

module.exports = router;
