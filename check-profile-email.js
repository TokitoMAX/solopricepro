const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProfile() {
    console.log('--- 🔍 SP_USER_PROFILE CHECK ---');
    const { data: profiles, error } = await supabase
        .from('sp_user_profile')
        .select('*')
        .limit(5);

    if (error) {
        console.error('❌ Error fetching profiles:', error.message);
        return;
    }

    console.log(`Found ${profiles.length} profiles.`);
    profiles.forEach(p => {
        console.log(`User: ${p.user_id} | Email: ${p.email} | PayPal: ${p.paypal_email || 'NOT SET'}`);
    });

    console.log('\n--- Full data for first row ---');
    console.log(JSON.stringify(profiles[0], null, 2));
}

checkProfile();
