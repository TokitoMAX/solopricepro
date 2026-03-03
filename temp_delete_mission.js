require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deleteMission() {
    const { data, error } = await supabase
        .from('sp_marketplace_missions')
        .update({ status: 'deleted' })
        .eq('id', '5f6e9d25-b56b-47d2-b2ba-91f9d61f9794')
        .select();

    if (error) {
        console.error('Error deleting mission:', error);
        return;
    }

    console.log('Mission marked as deleted:', JSON.stringify(data, null, 2));
}

deleteMission();
