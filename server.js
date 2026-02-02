// SoloPrice Pro - Backend Server
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050; // Changé de 5000 à 5050

// Supabase Initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase;
try {
    if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ Attention: SUPABASE_URL ou SUPABASE_ANON_KEY manquant.');
    } else {
        console.log('📡 Initialisation de Supabase...');
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase client créé.');
    }
} catch (err) {
    console.error('❌ Erreur initialisation Supabase:', err.message);
}

// Injecter supabase (peut être null si échec init)
app.set('supabase', supabase);

// Middleware de Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    next();
});

// CORS - Allow all origins in production
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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
            appUrl: process.env.APP_URL || 'not set'
        }
    });
});

const authRoutes = require('./backend/routes/auth');
const dataRoutes = require('./backend/routes/data');
const paymentRoutes = require('./backend/routes/payments');

// Supabase Guard Middleware for Auth & Data Routes
app.use(['/api/auth', '/api/data'], (req, res, next) => {
    if (!req.app.get('supabase')) {
        console.error(`[BACKEND-GUARD] ❌ Supabase client is MISSING for ${req.path}`);
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

// 2. Static Files
app.use(express.static(process.cwd()));

// 3. SPA Fallback (LAST)
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        // Si on arrive ici pour un /api/, c'est que la route n'existe pas
        console.warn(`[404] API route not found: ${req.method} ${req.path}`);
        return res.status(404).json({ message: `API route ${req.method} ${req.path} non trouvée.` });
    }
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// Global Error Handler to prevent empty responses
app.use((err, req, res, next) => {
    console.error('💥 Server Error:', err);
    res.status(500).json({
        message: 'Une erreur interne est survenue sur le serveur.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀  SoloPrice Pro est prêt sur http://localhost:${PORT}`);
        console.log(`Mode: Professional Backend (Supabase Auth)\n`);
    });
}

// Export for Vercel
module.exports = app;
