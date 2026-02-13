const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const fs = require('fs');

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

/**
 * @route   GET /api/marketplace/debug-env
 * @desc    Check environment variable visibility for SMTP (Public Diagnostic)
 */
router.get('/debug-env', (req, res) => {
    res.json({
        v: '1.4-ANTIGRAVITY-DIAG',
        timestamp: new Date().toISOString(),
        smtp_keys: Object.keys(process.env).filter(k => k.startsWith('SMTP_')),
        trace: {
            host: process.env.SMTP_HOST ? 'PRESENT' : 'MISSING',
            user: process.env.SMTP_USER ? 'PRESENT' : 'MISSING',
            pass: process.env.SMTP_PASS ? 'PRESENT' : 'MISSING',
            from: process.env.SMTP_FROM ? 'PRESENT' : 'MISSING'
        },
        process_cwd: process.cwd(),
        env_files: fs.existsSync('.env') ? '.env exists' : '.env MISSING'
    });
});

router.use(authenticateUser);

/**
 * @route   GET /api/marketplace/inbox
 * @desc    Get applications received for my missions
 * @access  Private
 */
router.get('/inbox', async (req, res) => {
    const supabase = req.app.get('supabase');
    const userId = req.user.id;

    try {
        // 1. Get my missions
        const { data: myMissions, error: missionError } = await supabase
            .from('sp_marketplace_missions')
            .select('id, title')
            .eq('user_id', userId);

        if (missionError) throw missionError;

        if (!myMissions || myMissions.length === 0) {
            return res.json([]);
        }

        const missionIds = myMissions.map(m => m.id);

        // 2. Get applications for these missions
        const { data: applications, error: appError } = await supabase
            .from('sp_marketplace_applications')
            .select('*')
            .in('mission_id', missionIds);

        if (appError) throw appError;

        // 3. Map mission titles
        const missionMap = Object.fromEntries(myMissions.map(m => [m.id, m.title]));
        const inbox = applications.map(app => ({
            ...app,
            mission_title: missionMap[app.mission_id]
        }));

        res.json(inbox);

    } catch (err) {
        console.error('[MARKETPLACE-INBOX] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   POST /api/marketplace/apply
 * @desc    Send a pitch application via SMTP
 * @access  Private
 */
router.post('/apply', async (req, res) => {
    const { to, subject, body, cc } = req.body;

    console.log('\n--- 📧 MAIL ATTEMPT ---');
    console.log('TO:', to);
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('-----------------------\n');

    if (!to || !subject || !body) {
        console.warn('[MARKETPLACE-APPLY] ⚠️ Missing fields:', { to: !!to, subject: !!subject, body: !!body });
        return res.status(400).json({ success: false, message: "Missing recipients, subject, or body." });
    }

    // Check SMTP configuration
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    console.log('[MARKETPLACE-APPLY] 🔍 Environment Trace:', {
        has_host: !!smtpHost,
        host_val: smtpHost,
        has_user: !!smtpUser,
        has_pass: !!smtpPass,
        env_keys: Object.keys(process.env).filter(k => k.startsWith('SMTP_'))
    });

    if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn('⚠️ SMTP Configuration is missing in .env');
        return res.status(503).json({
            success: false,
            message: "Le service d'envoi automatique n'est pas configuré. Veuillez contacter l'administrateur.",
            hint: "Check SMTP_HOST, SMTP_USER, and SMTP_PASS in environment variables."
        });
    }

    try {
        console.log(`[MAILER] 📧 Attempting to send application to ${to} (Cc: ${cc || 'none'})`);

        if (!smtpHost) {
            throw new Error('SMTP_HOST is not defined in environment variables.');
        }

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort == 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            tls: {
                rejectUnauthorized: false
            }
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

/**
 * @route   GET /api/marketplace/invitations
 * @desc    Get all invitations for current user (as recruiter or candidate)
 * @access  Private
 */
router.get('/invitations', async (req, res) => {
    const supabase = req.app.get('supabase');

    try {
        const { data, error } = await supabase
            .from('sp_marketplace_invitations')
            .select(`
                *,
                application:sp_marketplace_applications(
                    id,
                    message,
                    proposed_price,
                    mission:sp_marketplace_missions(
                        title,
                        description
                    )
                )
            `)
            .or(`recruiter_id.eq.${req.user.id},candidate_id.eq.${req.user.id}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[INVITATIONS] Error:', err);
        res.status(500).json({ message: 'Error fetching invitations', error: err.message });
    }
});

/**
 * @route   POST /api/marketplace/invitations
 * @desc    Create new interview invitation
 * @access  Private (Recruiter)
 */
router.post('/invitations', async (req, res) => {
    const supabase = req.app.get('supabase');
    const { application_id, candidate_id, message, proposed_slots } = req.body;

    if (!application_id || !candidate_id || !message || !proposed_slots) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const { data, error } = await supabase
            .from('sp_marketplace_invitations')
            .insert([{
                application_id,
                recruiter_id: req.user.id,
                candidate_id,
                message,
                proposed_slots,
                status: 'pending'
            }])
            .select();

        if (error) throw error;

        console.log('[INVITATIONS] Created:', data[0].id);
        res.status(201).json({ success: true, data: data[0] });
    } catch (err) {
        console.error('[INVITATIONS] Error:', err);
        res.status(500).json({ message: 'Error creating invitation', error: err.message });
    }
});

/**
 * @route   PATCH /api/marketplace/invitations/:id
 * @desc    Update invitation (candidate response)
 * @access  Private (Candidate)
 */
router.patch('/invitations/:id', async (req, res) => {
    const supabase = req.app.get('supabase');
    const { id } = req.params;
    const { status, selected_slot, candidate_response } = req.body;

    try {
        const updates = {};
        if (status) updates.status = status;
        if (selected_slot !== undefined) updates.selected_slot = selected_slot;
        if (candidate_response !== undefined) updates.candidate_response = candidate_response;

        const { data, error } = await supabase
            .from('sp_marketplace_invitations')
            .update(updates)
            .eq('id', id)
            .eq('candidate_id', req.user.id) // Ensure only candidate can respond
            .select();

        if (error) throw error;

        console.log('[INVITATIONS] Updated:', id);
        res.json({ success: true, data: data[0] });
    } catch (err) {
        console.error('[INVITATIONS] Error:', err);
        res.status(500).json({ message: 'Error updating invitation', error: err.message });
    }
});

module.exports = router;
