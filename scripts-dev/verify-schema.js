require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function verifySupabase() {
    console.log(" Starting Supabase Remediation Verification...");

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error(" Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const requiredTables = [
        'sp_clients', 'sp_quotes', 'sp_invoices', 'sp_services',
        'sp_leads', 'sp_revenues', 'sp_expenses', 'sp_settings',
        'sp_calculator_data', 'sp_marketplace_missions'
    ];

    console.log("\n--- Tables Verification ---");
    for (const table of requiredTables) {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        if (error) {
            console.error(` Table '${table}' check failed: ${error.message}`);
        } else {
            console.log(` Table '${table}' exists and is accessible.`);
        }
    }

    console.log("\n--- Storage Verification ---");
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
        console.error(` Could not list buckets: ${bucketError.message}`);
    } else {
        const logoBucket = buckets.find(b => b.id === 'logos');
        if (logoBucket) {
            console.log(" Bucket 'logos' exists.");
            console.log(`   Public: ${logoBucket.public}`);
        } else {
            console.error(" Bucket 'logos' is missing! Run the upload route once or create it manually.");
        }
    }

    console.log("\n--- Auth Configuration ---");
    const { data: users, error: userError } = await supabase.auth.admin.listUsers({ limit: 1 });
    if (userError) {
        console.error(` Auth Admin API check failed: ${userError.message}`);
    } else {
        console.log(" Auth Admin API is working (Service Role Key valid).");
    }

    console.log("\n Verification Complete.");
}

verifySupabase();
