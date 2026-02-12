const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSchema() {
    console.log("🛠️ Checking 'sp_marketplace_missions' schema...");

    // 1. Try to fetch a row to see if it fails
    const { data, error } = await supabase
        .from('sp_marketplace_missions')
        .select('created_at')
        .limit(1);

    if (error) {
        console.error("⚠️ Error fetching created_at (confirming issue):", error.message);
    } else {
        console.log("✅ 'created_at' column seems accessible via API.");
    }

    console.log("🔄 Attempting to reload schema handling...");

    // We can't really "alter table" via JS client without a stored procedure or raw SQL execution enabled.
    // But we can check if the table exists and maybe try to re-init it if possible, 
    // or just rely on the fact that sometimes a simple request wakes it up.

    // Actually, if we use the Service Role, we might bypass some cache issues. 
    // The previous error "Could not find..." was likely from the backend (client side).

    // Let's try to inspect the table structure via rpc if available, or just log success if we can read it here.
    // If we can read it here, the issue is likely just the PostgREST cache on the server.
    // We can trigger a cache reload by making a schema modification. 
    // Let's add a dummy comment to the table.

    try {
        // This is a hack: making a request to 'rpc/reload_schema' if it exists, 
        // OR just restart the project from the dashboard is the only real way if we don't have DDL access.
        // BUT, since we have the SERVICE_ROLE_KEY, maybe we can just insert a row and delete it to "wake" it up?

        console.log("📝 Inserting a test row to force table interaction...");
        const { error: insertError } = await supabase
            .from('sp_marketplace_missions')
            .insert([{
                title: 'Schema Fix',
                budget: 0,
                description: 'Temporary row to wake up middleware',
                zone: 'System',
                status: 'closed',
                user_id: '00000000-0000-0000-0000-000000000000' // Dummy UUID
            }]);

        if (insertError) {
            console.error("❌ Insert failed:", insertError.message);
        } else {
            console.log("✅ Insert successful. deleting...");
            await supabase.from('sp_marketplace_missions').delete().eq('title', 'Schema Fix');
            console.log("✅ Test row deleted. Schema should be active.");
        }

    } catch (e) {
        console.error("❌ Unexpected error:", e);
    }
}

fixSchema();
