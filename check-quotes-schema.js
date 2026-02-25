const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    const results = { timestamp: new Date().toISOString() };
    try {
        const { data, error } = await supabase.from('sp_quotes').select('*').limit(1);
        if (error) {
            results.error = error.message;
        } else {
            results.reachable = true;
            if (data.length > 0) {
                results.columns = Object.keys(data[0]);
            } else {
                results.empty = true;
                const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
                    headers: {
                        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
                    }
                });
                const spec = await response.json();
                results.openapi = spec.definitions.sp_quotes ? Object.keys(spec.definitions.sp_quotes.properties) : 'not found';
            }
        }
    } catch (e) {
        results.exception = e.message;
    }
    fs.writeFileSync('schema_result.json', JSON.stringify(results, null, 2));
    console.log('Results written to schema_result.json');
}

checkSchema();
