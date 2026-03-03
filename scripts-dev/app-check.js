const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    console.log("---START_APP---");
    const { data: a } = await supabase.from('sp_marketplace_applications').insert([{ mission_id: '00000000-0000-0000-0000-000000000000', applicant_name: 'X', expert_price: 0, total_price: 0, message: 'X' }]).select();
    if (a) {
        Object.keys(a[0]).forEach(c => console.log("COL_A:" + c));
        await supabase.from('sp_marketplace_applications').delete().eq('id', a[0].id);
    }
}
run();
