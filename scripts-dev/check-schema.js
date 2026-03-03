
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkMissionIdType() {
    console.log('---  MISSION ID TYPE CHECK ---');

    const { data: cols, error } = await supabase.rpc('query_sql', {
        sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sp_marketplace_missions' AND column_name = 'id'"
    });

    if (error) {
        console.error(' SQL Error:', error.message);
    } else {
        console.log(' id type:', cols[0]?.data_type);
    }
}

checkMissionIdType();
