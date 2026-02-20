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

module.exports = router;
