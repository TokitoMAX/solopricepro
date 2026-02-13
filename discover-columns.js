const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function determineColumns() {
    console.log("🧪 Inserting minimal rows to discover columns...");

    // Mission
    const { data: mid, error: me } = await supabase.from('sp_marketplace_missions').insert([{
        title: 'Discovery',
        budget: 0,
        description: 'Discovery',
        zone: 'Discovery',
        status: 'open'
    }]).select();

    if (mid) console.log("Missions Columns:", Object.keys(mid[0]));
    else console.error("Mission Discovery failed:", me.message);

    // Application
    const { data: aid, error: ae } = await supabase.from('sp_marketplace_applications').insert([{
        mission_id: '00000000-0000-0000-0000-000000000000',
        applicant_name: 'Discovery',
        message: 'Discovery',
        expert_price: 0,
        total_price: 0,
        status: 'pending'
    }]).select();

    if (aid) console.log("Applications Columns:", Object.keys(aid[0]));
    else console.error("Application Discovery failed:", ae.message);

    // Cleanup
    if (mid) await supabase.from('sp_marketplace_missions').delete().eq('id', mid[0].id);
    if (aid) await supabase.from('sp_marketplace_applications').delete().eq('id', aid[0].id);
}

determineColumns();
