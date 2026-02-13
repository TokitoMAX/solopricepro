const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function determineColumns() {
    // Mission
    const { data: mid } = await supabase.from('sp_marketplace_missions').insert([{
        title: 'Disc', budget: 0, description: 'D', zone: 'D', status: 'open'
    }]).select();
    if (mid) {
        console.log("COLUMNS_MISSION:" + JSON.stringify(Object.keys(mid[0])));
        await supabase.from('sp_marketplace_missions').delete().eq('id', mid[0].id);
    }

    // Application
    const { data: aid } = await supabase.from('sp_marketplace_applications').insert([{
        mission_id: '00000000-0000-0000-0000-000000000000',
        applicant_name: 'D', message: 'D', expert_price: 0, total_price: 0, status: 'pending'
    }]).select();
    if (aid) {
        console.log("COLUMNS_APP:" + JSON.stringify(Object.keys(aid[0])));
        await supabase.from('sp_marketplace_applications').delete().eq('id', aid[0].id);
    }
}
determineColumns();
