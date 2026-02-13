const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function discoverApps() {
    console.log("🚀 Starting deep discovery for sp_marketplace_applications...");

    // Attempt 1: Just fetch any record
    const { data: fetchRes, error: fetchErr } = await supabase.from('sp_marketplace_applications').select('*').limit(1);

    if (fetchRes && fetchRes.length > 0) {
        console.log("✅ FOUND EXISTING RECORD. Columns:");
        console.log(JSON.stringify(Object.keys(fetchRes[0]), null, 2));
        return;
    }

    // Attempt 2: Minimal Insert to trigger return of all columns
    console.log("ℹ️ Table seems empty. Attempting minimal insert...");

    // Create a dummy mission first to satisfy FK if it exists
    const { data: mission } = await supabase.from('sp_marketplace_missions').insert([{
        title: 'SchemaCheck', budget: 0, description: 'S', zone: 'S'
    }]).select();

    if (!mission) {
        console.error("❌ Could not create dummy mission for FK check.");
        return;
    }

    const missionId = mission[0].id;

    // Now try to insert into applications with just the mission_id
    const { data: app, error: appErr } = await supabase.from('sp_marketplace_applications').insert([{
        mission_id: missionId
    }]).select();

    if (app) {
        console.log("✅ SUCCESS! Application Columns:");
        console.log(JSON.stringify(Object.keys(app[0]), null, 2));
        // Cleanup
        await supabase.from('sp_marketplace_applications').delete().eq('id', app[0].id);
    } else {
        console.error("❌ Application Insert Failed:", appErr.message);
        console.log("Details:", appErr.details);
        console.log("Hint:", appErr.hint);
    }

    // Cleanup mission
    await supabase.from('sp_marketplace_missions').delete().eq('id', missionId);
}

discoverApps();
