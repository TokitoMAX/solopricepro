const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findProfileTable() {
    const candidates = ['sp_user_profiles', 'profiles', 'sp_user_profile', 'sp_user_data'];
    console.log("Searching for the correct profile table...");

    for (const table of candidates) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`[X] ${table}: ${error.message}`);
        } else {
            console.log(`[MATCH] ${table} exists. Columns: ${Object.keys(data[0] || {}).join(', ')}`);
        }
    }
}

findProfileTable();
