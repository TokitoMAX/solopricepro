const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpsert() {
    console.log("🧪 Testing UPSERT with new columns...");

    const { data, error } = await supabase
        .from('sp_user_profile')
        .upsert({
            user_id: '00000000-0000-0000-0000-000000000000', // Dummy
            payment_type: 'iban',
            iban: 'TEST-IBAN'
        });

    if (error) {
        console.error("❌ UPSERT FAILED as expected:", error);
    } else {
        console.log("✅ UPSERT SUCCEEDED? (That's unexpected if columns are missing)");
    }
}

testUpsert();
