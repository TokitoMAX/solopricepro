
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log('--- 🔍 DATABASE SCHEMA DIAGNOSTIC (v2) ---');

    try {
        // Direct SQL check for columns
        const { data, error } = await supabase.from('sp_marketplace_applications').select('*').limit(0);

        if (error) {
            console.error('❌ DIRECT SELECT ERROR:', error.message);
            console.log('Details:', JSON.stringify(error, null, 2));
        } else {
            // This is a bit of a hack since table might be empty, but PostgREST might return column headers in some clients
            // However, with supabase-js, if it's empty, data is [].
            console.log('✅ Connected to sp_marketplace_applications');
        }

        // Better way: Check if we can describe the table
        const { data: cols, error: rpcError } = await supabase.rpc('query_sql', {
            sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sp_marketplace_applications' ORDER BY column_name"
        });

        if (rpcError) {
            console.log('⚠️ query_sql RPC failed. Checking via a test insert (dry run)...');
            const testId = '00000000-0000-0000-0000-000000000000';
            const { error: testError } = await supabase.from('sp_marketplace_applications').insert([{ id: testId, applicant_id: testId }]).select();

            if (testError && testError.message.includes('applicant_id')) {
                console.log('❌ CONFIRMED: applicant_id column is MISSING.');
            } else if (testError) {
                console.log('⚠️ Test insert failed with other error:', testError.message);
            } else {
                console.log('✅ CONFIRMED: applicant_id column EXISTS.');
                // Clean up if it actually succeeded (unlikely with all zeros but possible)
                await supabase.from('sp_marketplace_applications').delete().eq('id', testId);
            }
        } else {
            console.log('📊 Column List:');
            cols.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));

            const hasApplicantId = cols.some(c => c.column_name === 'applicant_id');
            console.log(hasApplicantId ? '✅ applicant_id EXISTS' : '❌ applicant_id MISSING');
        }

    } catch (err) {
        console.error('💥 CRITICAL FAILURE during diagnostic:', err.message);
    }
}

checkSchema();
