const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    console.log("APP_START");
    const { data: a } = await supabase.from('sp_marketplace_applications').insert([{ mission_id: '00000000-0000-0000-0000-000000000000', applicant_name: 'TEST_COLS', expert_price: 0, total_price: 0, message: 'TEST' }]).select();
    if (a) {
        for (let k of Object.keys(a[0])) {
            console.log("APP_COL| " + k);
        }
    }
    console.log("APP_END");
}
run();
