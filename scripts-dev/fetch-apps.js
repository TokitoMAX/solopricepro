const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    console.log("FETCHING_APPS");
    const { data, error } = await supabase.from('sp_marketplace_applications').select('*').limit(5);
    if (error) console.error("Error:", error.message);
    if (data) {
        console.log("Count:", data.length);
        if (data.length > 0) {
            console.log("Columns:", Object.keys(data[0]).join(', '));
        } else {
            console.log("Table is empty.");
        }
    }
}
run();
