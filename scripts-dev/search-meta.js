const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    console.log("SEARCH_META");
    const { data: m } = await supabase.from('sp_marketplace_missions').select('*').limit(1);
    if (m && m[0]) Object.keys(m[0]).filter(k => k.toLowerCase().includes('meta')).forEach(k => console.log("M_META:" + k));

    const { data: a } = await supabase.from('sp_marketplace_applications').select('*').limit(1);
    if (a && a[0]) Object.keys(a[0]).filter(k => k.toLowerCase().includes('meta')).forEach(k => console.log("A_META:" + k));
    console.log("DONE");
}
run();
