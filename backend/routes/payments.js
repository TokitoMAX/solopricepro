const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Route pour créer une session d'abonnement ou de paiement SaaS
router.post('/create-checkout', async (req, res) => {
    try {
        const { planId, userId, userEmail } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: userEmail,
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'SoloPrice Pro - Pack Illimité',
                            description: 'Accès complet à toutes les fonctionnalités de SoloPrice Pro',
                        },
                        unit_amount: 900, // 9.00€
                        recurring: { interval: 'month' },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.APP_URL}/?session={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.APP_URL}/profile`,
            metadata: {
                userId: userId,
                planId: 'pro'
            }
        });

        res.json({ id: session.id, url: session.url });
    } catch (err) {
        console.error('Stripe Session Error:', err);
        res.status(500).json({ message: 'Erreur Stripe', error: err.message });
    }
});

// Route Webhook Stripe pour confirmer le paiement
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // req.body est un buffer ici car on a configuré express.raw() dans server.js
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error(`⚠️ Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gestion de l'événement de succès de paiement
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata.userId;

        console.log(`💰 Paiement réussi pour l'utilisateur: ${userId}`);

        try {
            // Pour mettre à jour les métadonnées auth, il faut idéalement le SERVICE_ROLE_KEY
            // Si absent, on tente avec le client par défaut (qui risque d'échouer sans privilèges admin)
            const supabaseUrl = process.env.SUPABASE_URL;
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

            const adminClient = createClient(supabaseUrl, serviceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });

            // Mise à jour du statut PRO dans les metadata Supabase Auth
            const { error } = await adminClient.auth.admin.updateUserById(userId, {
                user_metadata: { is_pro: true }
            });

            if (error) throw error;
            console.log(`✅ Utilisateur ${userId} promu au rang PRO.`);

        } catch (err) {
            console.error(`❌ Erreur lors de l'activation PRO de l'utilisateur ${userId}:`, err.message);
        }
    }

    res.json({ received: true });
});

module.exports = router;
