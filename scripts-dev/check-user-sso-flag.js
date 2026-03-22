const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser(email) {
    console.log(`Checking metadata for: ${email}`);
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
        console.error("Error listing users:", error.message);
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.log(`User not found: ${email}`);
        return;
    }

    console.log("User Metadata:", JSON.stringify(user.user_metadata, null, 2));
    
    if (user.user_metadata.is_partner_sso === true) {
        console.log("✅ SUCCESS: is_partner_sso is TRUE");
    } else {
        console.log("❌ FAILURE: is_partner_sso is NOT TRUE");
    }
}

const targetEmail = process.argv[2] || 'loickrv@gmail.com';
checkUser(targetEmail);
