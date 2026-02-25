const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/public/quote/:id
 * @desc    Get quote data for public display (signature view)
 * @access  Public
 */
router.get('/quote/:id', async (req, res) => {
    const { id } = req.params;
    const supabase = req.app.get('supabase');

    try {
        // 1. Fetch Quote
        const { data: quote, error: quoteError } = await supabase
            .from('sp_quotes')
            .select('*')
            .eq('id', id)
            .single();

        if (quoteError || !quote) {
            return res.status(404).json({ message: "Devis introuvable." });
        }

        // 2. Fetch User Profile (Provider Info)
        const { data: profile, error: profileError } = await supabase
            .from('sp_user_profile')
            .select('*')
            .eq('user_id', quote.user_id)
            .single();

        // 3. Fetch Client Info
        const { data: client, error: clientError } = await supabase
            .from('sp_clients')
            .select('*')
            .eq('id', quote.clientId)
            .eq('user_id', quote.user_id)
            .single();

        res.json({
            quote,
            provider: profile || { company_name: "Prestataire" },
            client: client || { name: "Client" }
        });

    } catch (err) {
        console.error('[PUBLIC-GET-QUOTE] Error:', err);
        res.status(500).json({ message: "Erreur serveur lors de la récupération du devis." });
    }
});

/**
 * @route   POST /api/public/quote/:id/sign
 * @desc    Record client signature and accept quote
 * @access  Public
 */
router.post('/quote/:id/sign', async (req, res) => {
    const { id } = req.params;
    const { signature } = req.body; // Base64 signature
    const supabase = req.app.get('supabase');

    if (!signature) {
        return res.status(400).json({ message: "La signature est requise." });
    }

    try {
        const { data, error } = await supabase
            .from('sp_quotes')
            .update({
                status: 'accepted',
                client_signature: signature,
                accepted_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) throw error;

        res.json({
            success: true,
            message: "Devis signé avec succès !",
            data: data[0]
        });

    } catch (err) {
        console.error('❌ [PUBLIC-SIGN-QUOTE] Critical Error:', err);
        res.status(500).json({
            message: "Erreur lors de l'enregistrement de la signature.",
            debug: err.message
        });
    }
});

module.exports = router;
