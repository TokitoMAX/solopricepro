const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Route pour créer une session d'abonnement ou de paiement SaaS
router.post('/create-checkout', async (req, res) => {
    try {
        const { planId, userId, userEmail } = req.body;

        const isExpert = planId === 'expert';
        const amount = isExpert ? 2900 : 1500; // 29€ ou 15€
        const planName = isExpert ? 'SoloPrice EXPERT - Croissance IA' : 'SoloPrice PRO - Illimité';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: userEmail,
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: planName,
                            description: isExpert ? 'IA Stratégique, Visibilité Marketplace & Badge Expert' : 'Documents illimités, Logos & Pipeline Kanban',
                        },
                        unit_amount: amount,
                        recurring: { interval: 'month' },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.APP_URL}/?payment_success=true&plan=${planId}`,
            cancel_url: `${process.env.APP_URL}/?payment_cancel=true`,
            metadata: {
                userId: userId,
                planId: planId
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

    // Gestion de l'événement de succès de paiement (Checkout & Payment Links)
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Récupération de l'userId soit via metadata (Stripe Checkout dynamique) 
        // soit via client_reference_id (Stripe Payment Links statiques)
        const userId = session.metadata?.userId || session.client_reference_id;
        const amountTotal = session.amount_total;

        if (!userId) {
            console.error(`⚠️ Aucun userId trouvé dans la session Stripe ${session.id}`);
            return res.status(200).json({ received: true });
        }

        console.log(`💰 Paiement réussi (${amountTotal / 100}€) pour l'utilisateur: ${userId}`);

        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

            const adminClient = createClient(supabaseUrl, serviceKey, {
                auth: { autoRefreshToken: false, persistSession: false }
            });

            // Déduction du tier en fonction du montant (15€ => pro, 29€ => expert)
            let planId = 'pro';
            if (amountTotal >= 2500) planId = 'expert'; // Marge de sécurité pour les centimes
            if (session.metadata?.planId) planId = session.metadata.planId;

            // Mise à jour du statut dans les metadata Supabase Auth
            const { error } = await adminClient.auth.admin.updateUserById(userId, {
                user_metadata: {
                    is_pro: true,
                    tier: planId
                }
            });

            if (error) throw error;
            console.log(`✅ Utilisateur ${userId} promu au rang ${planId.toUpperCase()}.`);

        } catch (err) {
            console.error(`❌ Erreur lors de l'activation du tier pour ${userId}:`, err.message);
        }
    }

    res.json({ received: true });
});

module.exports = router;
