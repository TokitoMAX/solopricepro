const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testMetadata() {
    console.log("🧪 Testing insert into 'sp_marketplace_missions' with 'user_metadata'...");
    const { error } = await supabase
        .from('sp_marketplace_missions')
        .insert([{
            title: 'Meta Test',
            budget: 0,
            description: 'Test',
            zone: 'Test',
            user_metadata: { company_name: 'Test Meta' }
        }]);

    if (error) {
        console.error("❌ Metadata Insert Error:", error.message);
    } else {
        console.log("✅ Metadata Insert worked!");
    }
}

testMetadata();
