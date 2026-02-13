require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkProposedPrice() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.from('sp_marketplace_applications').select('*').limit(1);

    if (error) {
        console.log("ERROR:" + error.message);
        return;
    }

    if (data && data.length > 0) {
        const carriesProposedPrice = Object.keys(data[0]).includes('proposed_price');
        console.log("PROPOSED_PRICE_EXISTS=" + carriesProposedPrice);
        console.log("ALL_COLUMNS=" + Object.keys(data[0]).join(','));
    } else {
        console.log("NO_DATA: Cannot check columns without rows.");
        // Try to insert a dummy row to see columns if possible, but that's invasive.
    }
}

checkProposedPrice();
