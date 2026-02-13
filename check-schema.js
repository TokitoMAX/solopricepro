
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function dumpKeys() {
    console.log('--- 🧪 KEY DUMP ---');

    const { data, error } = await supabase.from('sp_marketplace_applications').select('*').limit(1);

    if (error) {
        console.error('❌ FETCH FAILED:', error.message);
    } else if (data && data.length > 0) {
        console.log('✅ Found record. Keys:', Object.keys(data[0]));
        console.log('Data sample:', data[0]);
    } else {
        console.log('⚠️ No records found in sp_marketplace_applications to inspect.');

        // Try to insert a dummy row to see what happens
        console.log('--- 🧪 TEST INSERT ---');
        const testPayload = {
            id: '00000000-0000-0000-0000-000000000000',
            mission_id: '00000000-0000-0000-0000-000000000000',
            message: 'test',
            status: 'pending'
        };
        const { error: insError } = await supabase.from('sp_marketplace_applications').insert([testPayload]).select();
        if (insError) {
            console.log('❌ Insert failed:', insError.message);
        } else {
            console.log('✅ Insert worked with basic fields.');
        }
    }
}

dumpKeys();
