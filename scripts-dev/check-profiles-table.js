const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    const tables = ['profiles', 'user_profiles', 'sp_user_profiles', 'sp_user_profile', 'user_profile'];
    console.log("Checking tables variations...");

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(` ${table}: ${error.code} - ${error.message}`);
        } else {
            console.log(` ${table} exists! Rows: ${data.length}`);
            if (data.length > 0) {
                console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
            } else {
                // Try to get headers/columns even if empty
                console.log(`   Table is empty but exists.`);
            }
        }
    }
}

checkProfiles();
