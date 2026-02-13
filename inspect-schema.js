const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log("🔍 Inspecting 'sp_marketplace_missions' columns...");

    // We can't directly list columns with the JS client easily without RPC,
    // but we can try to fetch one row and see the keys, or try a dummy insert.

    const { data, error } = await supabase
        .from('sp_marketplace_missions')
        .select('*')
        .limit(1);

    if (error) {
        console.error("❌ Error fetching data:", error.message);
    } else if (data && data.length > 0) {
        console.log("✅ Columns found in first row:", Object.keys(data[0]));
    } else {
        console.log("ℹ️ No rows found. Trying to insert a record without company_name to see supported columns...");
        // If we can't find rows, we might need another way.
    }

    // Check applications table too as I just added columns there
    console.log("🔍 Inspecting 'sp_marketplace_applications' columns...");
    const { data: appData, error: appError } = await supabase
        .from('sp_marketplace_applications')
        .select('*')
        .limit(1);
    if (appData && appData.length > 0) {
        console.log("✅ Columns found in applications:", Object.keys(appData[0]));
    }
}

inspectSchema();
