const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing ecosystem-experts query... (without order)");
    const { data, error } = await supabase
        .from('sp_network_providers')
        .select('*')
        .eq('is_ecosystem', true);

    if (error) {
        console.error("SUPABASE ERROR:", error);
    } else {
        console.log("SUCCESS length:", data.length);
    }
}
test();
