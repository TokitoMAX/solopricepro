
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function megaAudit() {
    console.log('--- 📊 MEGA MARKETPLACE AUDIT ---');

    const queries = [
        { name: 'Applications Columns', sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'sp_marketplace_applications'" },
        { name: 'Invitations Columns', sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'sp_marketplace_invitations'" },
        { name: 'FK: App -> Mission', sql: "SELECT conname FROM pg_constraint WHERE contype = 'f' AND conrelid = 'sp_marketplace_applications'::regclass" },
        { name: 'FK: Invite -> App', sql: "SELECT conname FROM pg_constraint WHERE contype = 'f' AND conrelid = 'sp_marketplace_invitations'::regclass" }
    ];

    for (const q of queries) {
        console.log(`\n> Testing: ${q.name}`);
        const { data, error } = await supabase.rpc('query_sql', { sql_query: q.sql });
        if (error) {
            console.log(`❌ FAILED: ${error.message}`);
        } else {
            console.log(`✅ SUCCESS: ${JSON.stringify(data)}`);
        }
    }
}

megaAudit();
