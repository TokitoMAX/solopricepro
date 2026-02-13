const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("🧪 Testing insert into 'sp_marketplace_missions'...");
    const { error: missionError } = await supabase
        .from('sp_marketplace_missions')
        .insert([{
            title: 'Test',
            budget: 0,
            description: 'Test',
            zone: 'Test',
            company_name: 'Test' // This is the one we expect to fail
        }]);

    if (missionError) {
        console.error("❌ Mission Insert Error:", missionError.message);
    } else {
        console.log("✅ Mission Insert worked? (Maybe column exists)");
    }

    console.log("🧪 Testing insert into 'sp_marketplace_applications'...");
    const { error: appError } = await supabase
        .from('sp_marketplace_applications')
        .insert([{
            mission_id: '00000000-0000-0000-0000-000000000000',
            applicant_name: 'Test',
            applicant_email: 'test@example.com' // Testing this
        }]);

    if (appError) {
        console.error("❌ Application Insert Error:", appError.message);
    } else {
        console.log("✅ Application Insert worked?");
    }
}

testInsert();
