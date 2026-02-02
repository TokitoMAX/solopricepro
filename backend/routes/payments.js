const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

module.exports = router;
