const { randomUUID } = require('crypto');

/**
 * Injects a realistic dummy client and quote into the database for a new user.
 * This ensures the user doesn't face an "empty screen" and instantly grasps the SaaS value.
 */
async function injectWelcomeData(supabaseAdmin, userId) {
    if (!supabaseAdmin || !userId) {
        console.error('[ONBOARDING] Missing supabase client or userId for data injection');
        return;
    }

    try {
        console.log(`[ONBOARDING] 🚀 Starting dummy data injection for user: ${userId}`);

        // 1. Create a Premium Dummy Client
        const clientId = randomUUID();
        const dummyClient = {
            id: clientId,
            user_id: userId,
            type: 'professional',
            name: 'Société Horizon (Exemple)',
            contact_name: 'M. Martin Dubois',
            email: 'contact@horizon-exemple.fr',
            phone: '06 12 34 56 78',
            address: '15 Avenue des Champs, 75000 Paris',
            siret: '12345678900012',
            notes: 'Client d\'exemple généré automatiquement pour vous montrer le fonctionnement.',
            created_at: new Date().toISOString()
        };

        const { error: clientError } = await supabaseAdmin
            .from('sp_clients')
            .insert([dummyClient]);

        if (clientError) {
            console.error('[ONBOARDING] Failed to insert dummy client:', clientError.message);
            return; // Stop here if client fails, since quote depends on it via FK
        }

        console.log(`[ONBOARDING] ✅ Dummy Client inserted: ${clientId}`);

        // 2. Create a Rich Dummy Quote
        // This quote is designed to show off features: sections, taxes, margins, dynamic totals.
        const quoteId = `DEV-${new Date().getFullYear()}-0001`; // Standard readable ID

        const dummyItems = [
            // Section 1: Démolition
            {
                id: randomUUID(),
                type: 'section',
                name: '1. Phase de Démolition & Préparation'
            },
            {
                id: randomUUID(),
                type: 'item',
                category: 'Démolition',
                name: 'Démolition cloison placo',
                quantity: 15,
                unit: 'm2',
                unitCost: 18,
                margin: 30, // 30% margin
                unitPrice: 23.40,
                taxRate: 10,
                totalPrice: 351,
                description: 'Dépose soignée et évacuation des gravats.'
            },
            // Section 2: Finitions
            {
                id: randomUUID(),
                type: 'section',
                name: '2. Revêtements & Finitions'
            },
            {
                id: randomUUID(),
                type: 'item',
                category: 'Peinture',
                name: 'Peinture murale 2 couches (Blanc Mat)',
                quantity: 45,
                unit: 'm2',
                unitCost: 12,
                margin: 40, // 40% margin
                unitPrice: 16.80,
                taxRate: 10,
                totalPrice: 756,
                description: 'Préparation des fonds, enduit partiel et peinture pro.'
            },
            {
                id: randomUUID(),
                type: 'item',
                category: 'Fourniture',
                name: 'Parquet contrecollé Chêne Clair',
                quantity: 25,
                unit: 'm2',
                unitCost: 45,
                margin: 25,
                unitPrice: 56.25,
                taxRate: 20,
                totalPrice: 1406.25,
                description: 'Fourniture et pose type flottante avec sous-couche phonique.'
            }
        ];

        const dummyQuote = {
            id: randomUUID(),
            user_id: userId,
            client_id: clientId,
            quote_number: quoteId,
            title: 'Rénovation Exemple (Démo SoloPrice)',
            status: 'draft',
            items: dummyItems,
            subtotal: 2513.25,  // Sum of totalPrices
            tax_total: 391.95,  // (351*0.1) + (756*0.1) + (1406.25*0.2)
            total: 2905.20,     // subtotal + tax
            total_cost: 1935,   // (15*18) + (45*12) + (25*45) = 270 + 540 + 1125
            margin_amount: 578.25, // subtotal - total_cost
            validity_days: 30,
            notes: '🎉 Bienvenue sur SoloPrice Pro !\nCeci est un devis d\'exemple pour vous montrer la puissance du logiciel.\n\nRegardez les sections, notez comment les marges sont calculées, et cliquez sur "Voir le PDF" en haut à droite pour admirer le résultat pro prêt à être envoyé à votre client.',
            conditions: 'Acompte de 30% à la signature du devis. Le solde à la réception des travaux.',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { error: quoteError } = await supabaseAdmin
            .from('sp_quotes')
            .insert([dummyQuote]);

        if (quoteError) {
            console.error('[ONBOARDING] Failed to insert dummy quote:', quoteError.message);
        } else {
            console.log(`[ONBOARDING] 🎉 Dummy Quote inserted successfully for user ${userId}`);
        }

    } catch (err) {
        console.error('[ONBOARDING] Exception during data injection:', err);
    }
}

module.exports = {
    injectWelcomeData
};
