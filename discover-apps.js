const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data } = await supabase.from('sp_marketplace_applications').insert([{
        mission_id: '00000000-0000-0000-0000-000000000000',
        applicant_name: 'D', message: 'D', expert_price: 0, total_price: 0, status: 'pending'
    }]).select();
    if (data) {
        console.log("COLUMNS_APP:" + JSON.stringify(Object.keys(data[0])));
        await supabase.from('sp_marketplace_applications').delete().eq('id', data[0].id);
    }
}
run();
