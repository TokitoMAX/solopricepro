require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkColumns() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const tables = ['sp_quotes', 'sp_invoices'];

    for (const table of tables) {
        console.log(`\n--- Checking columns for ${table} ---`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error selecting from ${table}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`Columns found:`, Object.keys(data[0]));
        } else {
            console.log(`Table ${table} is empty, checking schema via RPC or information_schema if possible...`);
            // Attempt to get columns via a dummy query if empty
            const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { table_name: table });
            if (colError) {
                console.error(`RPC check failed (normal if not defined):`, colError.message);
            } else {
                console.log(`Columns:`, cols);
            }
        }
    }
}

checkColumns();
