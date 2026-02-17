const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log("Listing all tables in public schema...");
    const { data: tables, error } = await supabase.rpc('get_tables'); // Some projects have this, let's try a direct query if it fails

    if (error) {
        console.log("Checking tables via select (brute force list)...");
        const commonTables = ['sp_clients', 'sp_quotes', 'sp_invoices', 'sp_leads', 'sp_expenses', 'sp_settings', 'sp_user_profiles', 'profiles', 'sp_user_profile', 'sp_user_data'];
        for (const t of commonTables) {
            const { error: e } = await supabase.from(t).select('count', { count: 'exact', head: true });
            if (!e) console.log(`[FOUND] ${t}`);
            else if (e.code !== '42P01') console.log(`[ERROR ${e.code}] ${t}: ${e.message}`);
        }
    } else {
        console.log("Tables:", tables);
    }
}

listTables();
