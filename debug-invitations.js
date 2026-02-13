require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function debugInvitations() {
    console.log("🔍 Debugging /api/marketplace/invitations query...");

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use a hardcoded user ID from the logs if possible, or just try to fetch any invitation
    // User ID from logs: 73a494c2-941c-459b-b848-85b7448bfcb4
    const testUserId = '73a494c2-941c-459b-b848-85b7448bfcb4';

    console.log(`📡 Fetching invitations for user: ${testUserId}`);

    try {
        const { data, error } = await supabase
            .from('sp_marketplace_invitations')
            .select(`
                *,
                application:sp_marketplace_applications(
                    id,
                    message,
                    proposed_price,
                    mission:sp_marketplace_missions(
                        title,
                        description
                    )
                )
            `)
            .or(`recruiter_id.eq.${testUserId},candidate_id.eq.${testUserId}`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("❌ Supabase Error:", JSON.stringify(error, null, 2));
        } else {
            console.log("✅ Success! Fetched invitations:", data.length);
            console.log("Sample:", JSON.stringify(data[0], null, 2));
        }
    } catch (err) {
        console.error("💥 Execution Error:", err);
    }
}

debugInvitations();
