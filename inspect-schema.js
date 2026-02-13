require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function inspectSchema() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    console.log("--- sp_marketplace_applications columns ---");
    const { data: appData, error: appError } = await supabase.from('sp_marketplace_applications').select('*').limit(1);
    if (appError) console.error("Error apps:", appError.message);
    else if (appData.length > 0) console.log(Object.keys(appData[0]));
    else console.log("No data in apps, cannot infer columns via select *");

    console.log("\n--- sp_marketplace_invitations columns ---");
    const { data: invData, error: invError } = await supabase.from('sp_marketplace_invitations').select('*').limit(1);
    if (invError) console.error("Error invites:", invError.message);
    else if (invData.length > 0) console.log(Object.keys(invData[0]));
    else console.log("No data in invites, cannot infer columns via select *");
}

inspectSchema();
