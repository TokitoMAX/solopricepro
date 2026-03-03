require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findMission() {
    const { data, error } = await supabase
        .from('sp_marketplace_missions')
        .select('*')
        .or('title.eq.sdfsdfsf,title.eq.ffffffff');

    if (error) {
        console.error('Error fetching missions:', error);
        return;
    }

    fs.writeFileSync('mission_result.json', JSON.stringify(data, null, 2));
    console.log('Results written to mission_result.json');
}

findMission();
