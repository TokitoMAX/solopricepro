const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
    console.log("Testing insert without ID...");
    const { data, error } = await supabase.from('sp_marketplace_applications').insert([{
        mission_id: '00000000-0000-0000-0000-000000000000',
        message: 'Test Insert',
        proposed_price: 100,
        status: 'pending'
    }]).select();

    if (error) {
        console.error(" Insert Failed:", error.message);
    } else {
        console.log(" Insert Success! ID:", data[0].id);
        await supabase.from('sp_marketplace_applications').delete().eq('id', data[0].id);
    }
}
testInsert();
