require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function inspectSchema() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    async function getColumns(tableName) {
        // We use a RPC or a query that is likely to succeed even with few permissions, 
        // but since we have SERVICE_ROLE, we can just try to fetch 1 row.
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        if (error) {
            console.log(`Error reading ${tableName}: ${error.message}`);
            return [];
        }
        if (data && data.length > 0) {
            return Object.keys(data[0]);
        }
        // If no data, we can try to get column names from information_schema via RPC if available,
        // but here we'll just report no data.
        return ["NO DATA FOUND"];
    }

    const appCols = await getColumns('sp_marketplace_applications');
    const invCols = await getColumns('sp_marketplace_invitations');

    console.log("APP_COLUMNS=" + appCols.join(','));
    console.log("INV_COLUMNS=" + invCols.join(','));

    // Check relationship
    const { error: joinError } = await supabase
        .from('sp_marketplace_invitations')
        .select('*, application:sp_marketplace_applications(id)')
        .limit(1);

    if (joinError) {
        console.log("JOIN_ERROR=" + joinError.message);
    } else {
        console.log("JOIN_STATUS=OK");
    }
}

inspectSchema();
