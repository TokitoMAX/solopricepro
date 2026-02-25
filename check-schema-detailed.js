const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    const results = {};
    try {
        // Query information_schema for sp_quotes
        const { data: quoteCols, error } = await supabase.rpc('query_sql', {
            sql_query: `
                SELECT column_name, data_type, character_maximum_length 
                FROM information_schema.columns 
                WHERE table_name = 'sp_quotes'
            `
        });

        if (error) {
            results.rpcError = error.message;
            // Fallback: try to guess from a row
            const { data: rows } = await supabase.from('sp_quotes').select('*').limit(1);
            results.sampleRow = rows[0];
            results.inferredTypes = rows.length > 0 ? {
                id: typeof rows[0].id,
                signature: typeof rows[0].signature
            } : 'no rows';
        } else {
            results.columns = quoteCols;
        }
    } catch (e) {
        results.exception = e.message;
    }
    fs.writeFileSync('schema_detailed.json', JSON.stringify(results, null, 2));
    console.log('Results written to schema_detailed.json');
}

checkSchema();
