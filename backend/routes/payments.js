const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Route pour créer une session d'abonnement ou de paiement SaaS
// Route pour créer une session de paiement pour un DEVIS (Signature & Commission)
router.post('/create-quote-session', async (req, res) => {
    try {
        const { quoteId } = req.body;
        const supabase = req.app.get('supabase');

        // 1. Récupérer le devis
        const { data: quote, error: quoteError } = await supabase
            .from('sp_quotes')
            .select('*')
            .eq('id', quoteId)
            .single();

        if (quoteError || !quote) {
            return res.status(404).json({ message: "Devis introuvable." });
        }

        // 2. Créer la session Stripe
        const amount = Math.round(quote.total * 100);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Règlement Devis #${quote.number}`,
                            description: 'Paiement sécurisé via SoloPrice Pro',
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.APP_URL}/#view-quote=${quoteId}?payment=success`,
            cancel_url: `${process.env.APP_URL}/#view-quote=${quoteId}?payment=cancel`,
            metadata: {
                quoteId: quoteId,
                userId: quote.user_id,
                type: 'quote_payment'
            }
        });

        // 3. Enregistrer la tentative de paiement pour fiabilité
        try {
            await supabase.from('sp_payments').insert({
                user_id: quote.user_id,
                quote_id: quoteId,
                amount: quote.total,
                currency: 'eur',
                method: 'stripe',
                status: 'pending',
                provider_id: session.id,
                metadata: { type: 'quote_payment' }
            });
            console.log(`📡 [STRIPE] Session enregistrée dans sp_payments pour le devis ${quoteId}`);
        } catch (payErr) {
            console.error('❌ [STRIPE] Erreur enregistrement sp_payments:', payErr.message);
            // On continue quand même pour ne pas bloquer le paiement
        }

        res.json({ id: session.id, url: session.url });
    } catch (err) {
        console.error('Quote Stripe Session Error:', err);
        res.status(500).json({ message: 'Erreur Stripe Devis', error: err.message });
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

// Route pour capturer un paiement PayPal (v2) et promouvoir l'utilisateur
router.post('/paypal-capture', async (req, res) => {
    try {
        const { orderID, tier, userId } = req.body;
        const supabase = req.app.get('supabase');

        if (!orderID || !tier || !userId) {
            return res.status(400).json({ message: "Données de transaction incomplètes." });
        }

        console.log(`📡 [PAYPAL] Tentative de capture pour Commande: ${orderID}, Tier: ${tier}, User: ${userId}`);

        // 1. Détecter l'environnement et valider les clés
        const isProd = process.env.NODE_ENV === 'production';
        const clientId = process.env.PAYPAL_CLIENT_ID;
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        const baseUrl = isProd ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

        if (!clientId || !clientSecret) {
            console.error('❌ [PAYPAL] Erreur: PAYPAL_CLIENT_ID ou PAYPAL_CLIENT_SECRET manquant dans .env');
            return res.status(500).json({
                status: 'failed',
                message: 'Configuration PayPal manquante sur le serveur (API Keys).'
            });
        }

        console.log(`📡 [PAYPAL] Tentative de capture (${isProd ? 'LIVE' : 'SANDBOX'}) pour Commande: ${orderID}, Tier: ${tier}, User: ${userId}`);

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
