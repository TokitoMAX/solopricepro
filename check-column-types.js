const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumnTypes() {
    console.log('--- 🔍 SP_QUOTES COLUMN TYPES CHECK ---');

    // Attempting to use a raw query if RPC is available, or just probing
    const { data, error } = await supabase.rpc('query_sql', {
        sql_query: "SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'sp_quotes'"
    });

    if (error) {
        console.log('❌ RPC query_sql failed, trying direct select on a known row to infer type.');
        const { data: quote, error: selectError } = await supabase.from('sp_quotes').select('*').limit(1);
        if (selectError) {
            console.error('❌ Still failing:', selectError.message);
        } else {
            console.log('Sample Data Data types (inferred):', typeof quote[0]?.id, typeof quote[0]?.signature);
            console.log('Full sample row:', JSON.stringify(quote[0], null, 2));
        }
    } else {
        console.table(data);
    }
}

checkColumnTypes();
