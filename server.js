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
