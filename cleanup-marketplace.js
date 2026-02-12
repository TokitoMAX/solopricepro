require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function cleanupMarketplace() {
    console.log("🧹 Starting Marketplace Cleanup...");

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🗑️ Deleting all records from 'sp_marketplace_missions'...");

    // We use a dummy filter that matches everything (id is not null)
    const { data, error } = await supabase
        .from('sp_marketplace_missions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Standard way to delete all in some RLS setups

    if (error) {
        console.error(`❌ Cleanup failed: ${error.message}`);
    } else {
        console.log("✅ Marketplace table cleared successfully.");
    }

    console.log("\n✨ Cleanup Complete.");
}

cleanupMarketplace();
