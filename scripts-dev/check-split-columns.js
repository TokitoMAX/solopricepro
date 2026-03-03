const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkColumns() {
    const { data, error } = await supabase.from('sp_quotes').select('*').limit(1);
    if (error) console.error('Error fetching quotes:', error);
    else if (data.length > 0) console.log('Columns in sp_quotes:', Object.keys(data[0]));
    else console.log('sp_quotes is empty, cannot detect columns via select.');

    const { data: data2, error: error2 } = await supabase.from('sp_invoices').select('*').limit(1);
    if (error2) console.error('Error fetching invoices:', error2);
    else if (data2.length > 0) console.log('Columns in sp_invoices:', Object.keys(data2[0]));
    else console.log('sp_invoices is empty, cannot detect columns via select.');
}

checkColumns();
