// SoloPrice Pro - Backend Server
console.log("\n\n*****************************************");
console.log("        SOLOPRICE PRO  v1.2           ");
console.log("       BACKEND IS STARTING...          ");
console.log("*****************************************\n\n");
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables with absolute path for reliability
dotenv.config({ path: path.join(__dirname, '.env') });

// Validation des variables d'environnement critiques
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'STRIPE_WEBHOOK_SECRET'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
    console.warn('️ ATTENTION : Variables d\'environnement manquantes :', missingVars.join(', '));
    console.warn('Le backend risque de ne pas fonctionner correctement.');
} else {
    console.log(' Configuration environnement : OK');
}

const app = express();
const PORT = process.env.PORT || 5050; // Changé de 5000 à 5050

// Supabase Initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase;
try {
    if (!supabaseUrl || !supabaseKey) {
        console.warn('️ Attention: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant.');
    } else {
        console.log(' Initialisation de Supabase (Mode Service Role)...');
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log(' Supabase client créé.');
    }
} catch (err) {
    console.error(' Erreur initialisation Supabase:', err.message);
}

// Injecter supabase (peut être null si échec init)
app.set('supabase', supabase);

// 1. Health Check (Public)
app.get('/api/health', (req, res) => {
    const sb = req.app.get('supabase');
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        supabase: sb ? 'CONNECTED' : 'DISCONNECTED',
        environment: process.env.NODE_ENV || 'development'
    });
});

// 1. Logs & CORS
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}]  ${req.method} ${req.path}`);
    next();
});

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. GESTION DU BODY - Compatible Local + Vercel
app.use((req, res, next) => {
    // Webhooks: buffer brut uniquement
    if (req.originalUrl && req.originalUrl.includes('/webhook')) {
        return express.raw({ type: '*/*' })(req, res, (err) => {
            if (err) return next(err);
            req.rawBody = req.body;
            next();
        });
    }

    // Vercel pre-parse: body already populated with actual data (non-empty object)
    // Important: check Object.keys().length > 0 to avoid the empty-{} bug
    if (req.body &&
        typeof req.body === 'object' &&
        !Buffer.isBuffer(req.body) &&
        Object.keys(req.body).length > 0) {
        return next();
    }

    // Standard Express parsing (local + non-Vercel deployments)
    express.json({ limit: '10mb' })(req, res, (err) => {
        if (err) return next(err);
        express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
    });
});

// [LOG] Diagnostic final avant les routes
app.use('/api', (req, res, next) => {
    if (req.method === 'POST') {
        const hasBody = (req.body && typeof req.body === 'object' && req.body !== null && Object.keys(req.body).length > 0);
        console.log(` [DISPATCH] ${req.path} | Body: ${hasBody ? 'OK' : 'VIDE'} | CT: ${req.get('Content-Type')}`);
    }
    next();
});

// Routes
// Health Check & Debug
app.get('/api/health', (req, res) => {
    const supabase = req.app.get('supabase');
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        config: {
            hasSupabaseUrl: !!process.env.SUPABASE_URL,
            hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
            supabaseInitialized: !!supabase,
            supabaseUrlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 15) + '...' : 'missing',
            appUrl: process.env.APP_URL || 'not set',
            smtp: {
                host: process.env.SMTP_HOST || 'not set',
                user: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '...' : 'not set',
                pass: process.env.SMTP_PASS ? 'configured' : 'not set',
                from: process.env.SMTP_FROM || 'not set',
                debug_trace: `H:${!!process.env.SMTP_HOST} U:${!!process.env.SMTP_USER} P:${!!process.env.SMTP_PASS}`
            }
        }
    });
});

const authRoutes = require('./backend/routes/auth');
const dataRoutes = require('./backend/routes/data');
const paymentRoutes = require('./backend/routes/payments');
const adminRoutes = require('./backend/routes/admin'); // [NEW] Admin Routes
const marketplaceRoutes = require('./backend/routes/marketplace'); // [NEW] Marketplace Routes
const publicRoutes = require('./backend/routes/public'); // [NEW] Public Routes (No Auth)
const ratingsRoutes = require('./backend/routes/ratings'); // [NEW] Ratings Routes

// Supabase Guard Middleware for Auth & Data Routes
app.use(['/api/auth', '/api/data', '/api/admin', '/api/marketplace'], (req, res, next) => {
    if (!req.app.get('supabase')) {
        console.error(`[BACKEND-GUARD]  Supabase client is MISSING for ${req.path}`);
        return res.status(503).json({
            message: "Service indisponible.",
            debug: "Supabase client not initialized."
        });
    }
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes); // [NEW] Mount Admin API
app.use('/api/marketplace', marketplaceRoutes); // [NEW] Mount Marketplace API
app.use('/api/public', publicRoutes); // [NEW] Mount Public API (Shared Links)
app.use('/api/ratings', ratingsRoutes); // [NEW] Mount Ratings API

// 2. Static Files
app.use(express.static(process.cwd()));

// 3. SPA Fallback (LAST)
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        console.warn(`[404] API route not found: ${req.method} ${req.path}`);
        return res.status(404).json({ message: `API route ${req.method} ${req.path} non trouvée.` });
    }
    // Disable caching for the entry file to force updates
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// Global Error Handler to prevent empty responses
app.use((err, req, res, next) => {
    console.error(` Server Error on ${req.method} ${req.path}:`, err);
    res.status(err.status || 500).json({
        message: 'Une erreur interne est survenue sur le serveur.',
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        code: err.code || err.type
    });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n  SoloPrice Pro [V-SCHEMA-FIX-1.5] est prêt sur http://localhost:${PORT}`);
        console.log(`Mode: Professional Backend (Supabase Auth - Cache Clear)\n`);
    });
}

// Export for Vercel
module.exports = app;
