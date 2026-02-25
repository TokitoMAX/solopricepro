const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkQuote() {
    const quoteId = 'mm1e608vl3fw2gcolof';
    console.log(`--- 🔍 QUOTE ${quoteId} CHECK ---`);
    const { data: quote, error } = await supabase
        .from('sp_quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

    if (error) {
        console.error('❌ Error fetching quote:', error.message);
        return;
    }

    console.log(`Quote ID: ${quote.id}`);
    console.log(`User ID: ${quote.user_id}`);
    console.log(`Status: ${quote.status}`);
}

checkQuote();
