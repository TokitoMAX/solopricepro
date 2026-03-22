// SoloPrice Pro - Backend Server - Cleaned Version
console.log("\n\n*****************************************");
console.log("        SOLOPRICE PRO  v1.5           ");
console.log("       BACKEND IS STARTING...          ");
console.log("*****************************************\n\n");
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5050;

// Supabase Initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase;
try {
    if (supabaseUrl && supabaseKey) {
        console.log(' Initialisation de Supabase (Mode Service Role)...');
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log(' Supabase client créé.');
    } else {
        console.warn('️ Attention: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant.');
    }
} catch (err) {
    console.error(' Erreur initialisation Supabase:', err.message);
}

app.set('supabase', supabase);

// 1. Middlewares Globaux (CORS, Body Parser, Logs)
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}]  ${req.method} ${req.path}`);
    next();
});

app.use((req, res, next) => {
    if (req.originalUrl && req.originalUrl.includes('/webhook')) {
        return express.raw({ type: '*/*' })(req, res, (err) => {
            if (err) return next(err);
            req.rawBody = req.body;
            next();
        });
    }
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) && Object.keys(req.body).length > 0) {
        return next();
    }
    express.json({ limit: '10mb' })(req, res, (err) => {
        if (err) return next(err);
        express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
    });
});

// 2. Health Check (Public)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        supabase: supabase ? 'CONNECTED' : 'DISCONNECTED',
        environment: process.env.NODE_ENV || 'development'
    });
});

// --- SSO PARTNER LOGIC (Intégré directement pour éviter tout 404 de routage) ---
async function handleDirectSSOLogin(req, res, params) {
    const { email, name, timestamp, signature, partner } = params;
    console.log(`[SSO-DIRECT] Processing for ${email}`);
    try {
        const secret = process.env.PARTNER_SSO_SECRET || 'dtc_sso_default_secret_2026';
        const crypto = require('crypto');
        if (!email || !signature || !timestamp) return res.status(400).json({ message: 'Paramètres SSO manquants.' });
        const payload = `${email}${name || ''}${timestamp}`;
        const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        if (signature !== expectedSignature) return res.status(401).json({ message: 'Signature invalide.' });
        
        const adminClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data: { users } } = await adminClient.auth.admin.listUsers();
        let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        const metadata = { 
            full_name: name || '', 
            company_name: name || '', 
            partner: partner || 'domtomconnect', 
            is_partner_sso: true 
        };

        if (!user) {
            const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({ email, email_confirm: true, user_metadata: metadata });
            if (createError) throw createError;
            user = newUser.user;
        } else {
            await adminClient.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, ...metadata } });
        }

        await adminClient.from('sp_user_profile').upsert({ user_id: user.id, email: user.email, full_name: name || user.user_metadata?.full_name || '', updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const origin = process.env.APP_URL || `${protocol}://${host}`;
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: `${origin}/index.html` } });
        if (linkError) throw linkError;

        const actionLink = linkData?.properties?.action_link;
        if (req.method === 'GET') {
            res.setHeader('Content-Type', 'text/html');
            return res.send(`<html><body style="background:#0f172a;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;"><div style="text-align:center;"><h2>Connexion...</h2><p>Preparation de SoloPrice Pro.</p><a href="${actionLink}" style="color:#10b981;text-decoration:none;font-size:0.8rem;">Cliquez ici si bloqué</a></div><script>setTimeout(()=>{window.location.href="${actionLink}";},500);</script></body></html>`);
        }
        res.json({ user: { id: user.id, email: user.email, user_metadata: metadata }, session: { access_token: actionLink?.split('token=')[1]?.split('&')[0] || 'sso_verified' }, redirect_to: actionLink });
    } catch (err) {
        console.error("[SSO-DIRECT] Error:", err.message);
        res.status(500).json({ message: 'Erreur SSO', debug: err.message });
    }
}

app.get('/api/partner-sso', (req, res) => handleDirectSSOLogin(req, res, req.query));
app.post('/api/partner-sso', (req, res) => handleDirectSSOLogin(req, res, req.body));

// 3. Gardiennage Supabase pour les routes API
app.use(['/api/auth', '/api/data', '/api/admin', '/api/marketplace'], (req, res, next) => {
    if (!supabase) {
        console.error(`[BACKEND-GUARD] Supabase client is MISSING for ${req.path}`);
        return res.status(503).json({ message: "Service indisponible.", debug: "Supabase client not initialized." });
    }
    next();
});

// 4. Routes API
const authRoutes = require('./backend/routes/auth');
const dataRoutes = require('./backend/routes/data');
const paymentRoutes = require('./backend/routes/payments');
const adminRoutes = require('./backend/routes/admin');
const marketplaceRoutes = require('./backend/routes/marketplace');
const publicRoutes = require('./backend/routes/public');
const ratingsRoutes = require('./backend/routes/ratings');

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/ratings', ratingsRoutes);

// 5. Fichiers Statiques & SPA Fallback
app.use(express.static(process.cwd()));

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        console.warn(`[404] API route not found: ${req.method} ${req.path}`);
        return res.status(404).json({ message: `API route ${req.method} ${req.path} non trouvée.` });
    }
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(` Server Error on ${req.method} ${req.path}:`, err);
    res.status(err.status || 500).json({ message: 'Une erreur interne est survenue.', error: err.message });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n  SoloPrice Pro est prêt sur http://localhost:${PORT}`);
    });
}

module.exports = app;
