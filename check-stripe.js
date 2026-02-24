const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verify() {
    console.log('🔍 Starting Stripe/Supabase Configuration Check...');

    // 1. Check Env Vars
    const vars = {
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };
    console.table(vars);

    if (Object.values(vars).includes(false)) {
        console.error('❌ Missing critical environment variables!');
        return;
    }

    // 2. Test Stripe Connectivity
    try {
        const events = await stripe.events.list({ limit: 1 });
        console.log('✅ Stripe Connectivity: OK');
        console.log('   Recent Event Type:', events.data[0]?.type || 'No events found');
    } catch (err) {
        console.error('❌ Stripe Connection Failed:', err.message);
    }

    // 3. Test Supabase Connectivity
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;
        console.log('✅ Supabase Connectivity: OK');
        console.log(`   Total Users: ${data.users.length}`);
    } catch (err) {
        console.error('❌ Supabase Connection Failed:', err.message);
    }

    console.log('\n🚀 Verifications complete. If everything is green, redeploy Vercel and check your Stripe Webhook logs.');
}

verify();
