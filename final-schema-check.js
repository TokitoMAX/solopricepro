const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function discover() {
    console.log("--- MISSION COLUMNS ---");
    const { data: mData, error: mErr } = await supabase.from('sp_marketplace_missions').select('*').limit(1);
    if (mErr) console.error("Missions Error:", mErr.message);
    if (mData && mData.length > 0) {
        Object.keys(mData[0]).forEach(k => console.log("- " + k));
    } else {
        // Try to insert one and get it back
        const { data: mNew, error: mNewErr } = await supabase.from('sp_marketplace_missions').insert([{
            title: 'Scan', budget: 0, description: 'S', zone: 'S', status: 'open'
        }]).select();
        if (mNew) {
            Object.keys(mNew[0]).forEach(k => console.log("- " + k));
            await supabase.from('sp_marketplace_missions').delete().eq('id', mNew[0].id);
        } else {
            console.error("Missions Scan Failure:", mNewErr.message);
        }
    }

    console.log("\n--- APPLICATION COLUMNS ---");
    const { data: aData, error: aErr } = await supabase.from('sp_marketplace_applications').select('*').limit(1);
    if (aErr) console.error("Applications Error:", aErr.message);
    if (aData && aData.length > 0) {
        Object.keys(aData[0]).forEach(k => console.log("- " + k));
    } else {
        const { data: aNew, error: aNewErr } = await supabase.from('sp_marketplace_applications').insert([{
            mission_id: '00000000-0000-0000-0000-000000000000',
            applicant_name: 'Scan', expert_price: 0, total_price: 0, message: 'S', status: 'pending'
        }]).select();
        if (aNew) {
            Object.keys(aNew[0]).forEach(k => console.log("- " + k));
            await supabase.from('sp_marketplace_applications').delete().eq('id', aNew[0].id);
        } else {
            console.error("Applications Scan Failure:", aNewErr.message);
        }
    }
}
discover();
