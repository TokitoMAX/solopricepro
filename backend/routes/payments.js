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
        // Le montant est déjà stocké en centimes ou à multiplier par 100
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

        res.json({ id: session.id, url: session.url });
    } catch (err) {
        console.error('Quote Stripe Session Error:', err);
        res.status(500).json({ message: 'Erreur Stripe Devis', error: err.message });
    }
});

// Route Webhook Stripe pour confirmer le paiement
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error(`⚠️ Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const type = session.metadata?.type;

        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        const adminClient = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        if (type === 'quote_payment') {
            const quoteId = session.metadata.quoteId;
            console.log(`💰 Paiement Devis reçu pour: ${quoteId}`);

            try {
                const { error } = await adminClient
                    .from('sp_quotes')
                    .update({
                        platform_paid_at: new Date().toISOString(),
                        status: 'paid'
                    })
                    .eq('id', quoteId);

                if (error) throw error;
                console.log(`✅ Devis ${quoteId} marqué comme PAYÉ (Plateforme).`);
            } catch (err) {
                console.error(`❌ Erreur mise à jour devis ${quoteId}:`, err.message);
            }
        } else {
            // Logique SaaS originale
            const userId = session.metadata?.userId || session.client_reference_id;
            const amountTotal = session.amount_total;

            if (userId) {
                console.log(`💰 Paiement SaaS réussi pour: ${userId}`);
                try {
                    let planId = 'pro';
                    if (amountTotal >= 2500) planId = 'expert';
                    if (session.metadata?.planId) planId = session.metadata.planId;

                    const { error } = await adminClient.auth.admin.updateUserById(userId, {
                        user_metadata: { is_pro: true, tier: planId }
                    });
                    if (error) throw error;
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
            console.log(`✅ [PAYPAL] Capture réussie pour ${orderID}. Promotion de l'utilisateur...`);

            // 3. Promouvoir l'utilisateur dans Supabase
            const supabaseUrl = process.env.SUPABASE_URL;
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
            const adminClient = createClient(supabaseUrl, serviceKey, {
                auth: { autoRefreshToken: false, persistSession: false }
            });

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

module.exports = router;
