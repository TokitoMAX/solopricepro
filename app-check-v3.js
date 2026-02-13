const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data } = await supabase.from('sp_marketplace_applications').select('*').limit(1);
    if (data && data.length > 0) {
        Object.keys(data[0]).forEach(k => console.log("APP_COL| " + k));
    } else {
        console.log("APP_EMPTY");
    }
}
run();
