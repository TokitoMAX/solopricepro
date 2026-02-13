const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectColumns() {
    console.log("🔍 Querying column names from information_schema...");

    // We can use the 'rpc' to run arbitrary SQL if any exists, but usually not.
    // However, we can try to select from a non-existent table to see if Postgres lets us query system tables.
    // Actually, Supabase restricts direct access to information_schema via the API.

    // Alternative: Try to fetch a record and log it.
    const { data: mData } = await supabase.from('sp_marketplace_missions').select('*').limit(1);
    console.log("Missions Columns:", mData && mData[0] ? Object.keys(mData[0]) : "Table empty or error");

    const { data: aData } = await supabase.from('sp_marketplace_applications').select('*').limit(1);
    console.log("Applications Columns:", aData && aData[0] ? Object.keys(aData[0]) : "Table empty or error");

    // If both empty, let's try a dummy insert with ONLY 'id' and see if we get back the full record on return.
}

inspectColumns();
