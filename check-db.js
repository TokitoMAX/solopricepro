const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking tables for user_id constraints...");
    const tables = ['sp_settings', 'sp_user_profile', 'sp_calculator_data'];

    for (const table of tables) {
        console.log(`\nTable: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error fetching from ${table}:`, error.message);
        } else {
            console.log(`Fetch successful. Columns present: ${Object.keys(data[0] || {}).join(', ')}`);
        }
    }
}

checkSchema();
