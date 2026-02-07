const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Middleware to extract user from Supabase token (Shared with data.js)
async function authenticateUser(req, res, next) {
    const supabase = req.app.get('supabase');
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw error || new Error('User not found');
        req.user = user;
        next();
    } catch (err) {
        console.error('Auth error:', err.message);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}

router.use(authenticateUser);

/**
 * @route   POST /api/marketplace/apply
 * @desc    Send a pitch application via SMTP
 * @access  Private
 */
router.post('/apply', async (req, res) => {
    const { to, subject, body, cc } = req.body;

    if (!to || !subject || !body) {
        return res.status(400).json({ success: false, message: "Missing recipients, subject, or body." });
    }

    // Check SMTP configuration
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn('⚠️ SMTP Configuration is missing in .env');
        return res.status(503).json({
            success: false,
            message: "Le service d'envoi automatique n'est pas configuré. Veuillez contacter l'administrateur.",
            hint: "Check SMTP_HOST, SMTP_USER, and SMTP_PASS in environment variables."
        });
    }

    try {
        console.log(`[MAILER] 📧 Attempting to send application to ${to}`);

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort == 465, // Use true for 465, false for other ports
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        const mailOptions = {
            from: `"SoloPrice Pro Applications" <${smtpFrom}>`,
            to: to,
            cc: cc || undefined,
            subject: subject,
            text: body, // Plain text
            // replyTo: req.user.email // Optional: let the poster reply directly to the expert
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('[MAILER] ✅ Message sent: %s', info.messageId);

        res.json({
            success: true,
            message: "Votre proposition a été envoyée avec succès !",
            messageId: info.messageId
        });

    } catch (error) {
        console.error('[MAILER] ❌ Error sending email:', error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de l'envoi de l'email.",
            error: error.message
        });
    }
});

module.exports = router;
