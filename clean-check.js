const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data: m } = await supabase.from('sp_marketplace_missions').insert([{ title: 'T', budget: 0, description: 'D', zone: 'Z' }]).select();
    if (m) console.log("MISSION_COLS:" + Object.keys(m[0]).join(','));
    const { data: a } = await supabase.from('sp_marketplace_applications').insert([{ mission_id: '00000000-0000-0000-0000-000000000000', applicant_name: 'N', expert_price: 0, total_price: 0, message: 'M' }]).select();
    if (a) console.log("APP_COLS:" + Object.keys(a[0]).join(','));
    // Cleanup
    if (m) await supabase.from('sp_marketplace_missions').delete().eq('id', m[0].id);
    if (a) await supabase.from('sp_marketplace_applications').delete().eq('id', a[0].id);
}
run();
