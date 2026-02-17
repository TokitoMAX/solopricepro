const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpSchema() {
    console.log("Dumping public schema tables...");

    // We try to use a direct SQL query via remote if possible, or just list tables via a system query
    // Since we don't have direct SQL access through the client for system tables easily,
    // we'll try to probe the tables we found earlier again and check for specific columns.

    const candidates = [
        'sp_user_profiles',
        'profiles',
        'sp_user_profile',
        'sp_user_data',
        'users',
        'user_metadata',
        'sp_settings'
    ];

    for (const table of candidates) {
        process.stdout.write(`Testing ${table}... `);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`❌ ERROR: ${error.code} - ${error.message}`);
        } else {
            console.log(`✅ FOUND! Columns: ${Object.keys(data[0] || {}).join(', ')}`);
        }
    }
}

dumpSchema();
