const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
    console.log("Checking unique constraints for UPSERT...");
    const tables = ['sp_settings', 'sp_user_profile', 'sp_user_profiles'];

    for (const table of tables) {
        console.log(`\nTable: ${table}`);
        // Try to insert a dummy row or just check if user_id is unique via RPC if available
        // Or just try to see if we can identify the PK
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`[X] Error: ${error.message}`);
        } else {
            console.log(`[OK] Found. Data: ${JSON.stringify(data[0] || 'empty')}`);
        }
    }
}

checkConstraints();
