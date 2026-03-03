const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error(" Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log(" Diagnosing 'sp_user_profile'...");

    // 1. Try to fetch one row
    const { data, error } = await supabase
        .from('sp_user_profile')
        .select('*')
        .limit(1);

    if (error) {
        console.error(" Error fetching sp_user_profile:", error);
    } else {
        console.log(" Fetch successful. Columns found in first row:", data.length > 0 ? Object.keys(data[0]) : "Empty table");
    }

    // 2. Try to add a test column (this will fail if not using SQL, but we can try to see the error)
    // Actually, let's just try to check if it exists at all
}

diagnose();
