const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

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
        console.log(`[PUBLIC-SIGN] Attempting to sign quote ${id}`);
        const { data, error } = await supabase
            .from('sp_quotes')
            .update({
                status: 'accepted',
                signature: signature,
                accepted_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) {
            console.error('❌ [PUBLIC-SIGN-QUOTE] Supabase Error:', error);
            return res.status(500).json({
                message: "Erreur lors de l'enregistrement de la signature.",
                details: error.message,
                code: error.code
            });
        }

        console.log(`✅ [PUBLIC-SIGN] Quote ${id} signed successfully`);

        // --- ENVOI DE L'EMAIL DE NOTIFICATION AU PRESTATAIRE ---
        try {
            // Créer un client admin pour outrepasser les RLS et lire l'email de l'user
            const { createClient } = require('@supabase/supabase-js');
            const supabaseAdmin = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            // 1. Trouver à qui appartient le devis et récupérer quelques infos
            const { data: quoteData } = await supabaseAdmin
                .from('sp_quotes')
                .select('user_id, number, total, clientId')
                .eq('id', id)
                .single();

            if (quoteData) {
                // 2. Récupérer l'email du prestataire
                const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(quoteData.user_id);

                // 3. Récupérer le nom du client (optionnel)
                const { data: clientData } = await supabaseAdmin
                    .from('sp_clients')
                    .select('name')
                    .eq('id', quoteData.clientId)
                    .single();

                if (userData && userData.user && userData.user.email) {
                    const providerEmail = userData.user.email;
                    const clientName = clientData ? clientData.name : 'Un client';

                    const smtpHost = process.env.SMTP_HOST;
                    if (smtpHost) {
                        const transporter = nodemailer.createTransport({
                            host: smtpHost,
                            port: process.env.SMTP_PORT || 587,
                            secure: process.env.SMTP_PORT == 465,
                            auth: {
                                user: process.env.SMTP_USER,
                                pass: process.env.SMTP_PASS,
                            },
                        });

                        const mailOptions = {
                            from: `"SoloPrice Pro" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                            to: providerEmail,
                            subject: `🎉 Devis signé : ${quoteData.number}`,
                            html: `
                                <h2>Bonne nouvelle !</h2>
                                <p>Le devis <strong>N° ${quoteData.number}</strong> d'un montant de <strong>${quoteData.total.toLocaleString()} €</strong> vient d'être signé numériquement par votre client <strong>${clientName}</strong>.</p>
                                <p>Connectez-vous à <a href="${process.env.APP_URL || 'https://solopricepro.vercel.app'}">SoloPrice Pro</a> pour consulter la signature PDF et vérifier la réception du paiement.</p>
                            `
                        };

                        await transporter.sendMail(mailOptions);
                        console.log(`[PUBLIC-SIGN] 📧 Email notification sent to ${providerEmail}`);
                    }
                }
            }
        } catch (mailErr) {
            console.error('[PUBLIC-SIGN] ⚠️ Failed to send notification email:', mailErr);
            // On ne bloque pas la réponse client même si l'email échoue.
        }

        res.json({
            success: true,
            message: "Devis signé avec succès !",
            data: data[0]
        });

    } catch (err) {
        console.error('❌ [PUBLIC-SIGN-QUOTE] Critical Error:', err);
        res.status(500).json({
            message: "Une erreur inattendue est survenue.",
            debug: err.message
        });
    }
});

module.exports = router;
