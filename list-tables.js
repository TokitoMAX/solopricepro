const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log("Listing tables in public schema...");
    // Using RPC to query information_schema if available, or a generic trick
    // Since we don't know the RPCs, let's try to fetch something and check error or use a known table to pivot.
    const { data: tables, error } = await supabase.rpc('get_tables'); // Rarely exists by default

    if (error) {
        console.log("RPC get_tables failed. Trying alternative via Postgrest...");
        // Postgrest allows listing tables if enabled, often on /
        // But with supabase-js we can try a raw SQL via another way or just guess common names.
        // Let's try to query 'sp_settings' to see if it exists as a baseline.
        const { data: settings, error: sErr } = await supabase.from('sp_settings').select('*').limit(1);
        if (!sErr) console.log("✅ sp_settings exists.");
        else console.log("❌ sp_settings missing: " + sErr.message);

        // Try a raw fetch to /rest/v1/ and see if it lists
        console.log("Checking schema via generic discovery...");
    } else {
        console.log("Tables found:", tables);
    }
}

listTables();
