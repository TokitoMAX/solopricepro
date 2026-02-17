const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    console.log("Checking 'profiles' table...");
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
        console.log(`❌ profiles: ${error.message}`);
    } else {
        console.log(`✅ profiles exists. Columns: ${Object.keys(data[0] || {}).join(', ')}`);
    }
}

checkProfiles();
