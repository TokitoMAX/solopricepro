
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log('Checking columns for sp_marketplace_applications...');
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'sp_marketplace_applications' });

    if (error) {
        // Fallback: try to select one row
        const { data: row, error: selectError } = await supabase.from('sp_marketplace_applications').select('*').limit(1);
        if (selectError) {
            console.error('Error getting schema:', selectError);
        } else {
            console.log('Columns found:', Object.keys(row[0] || {}));
        }
    } else {
        console.log('Columns:', data);
    }
}

checkSchema();
