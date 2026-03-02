const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('--- SoloPrice Pro Auth Diagnostic ---');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'PRESENT' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing configuration. Check your .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    console.log('\nTesting login route logic...');

    // Simulate what's in backend/routes/auth.js
    const email = 'test@example.com'; // Change if you want to test a real account
    const password = 'password123';

    try {
        console.log(`Attempting signInWithPassword for: ${email}`);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.log(' Login Error (Expected 401):', error.message);
            return;
        }

        console.log(' Login Response Data:', JSON.stringify(data, null, 2));

        if (!data.user) {
            console.error(' ERROR: data.user is NULL');
        } else {
            console.log('User ID:', data.user.id);
        }

        if (!data.session) {
            console.error(' ERROR: data.session is NULL');
        } else {
            console.log('Access Token:', data.session.access_token ? 'PRESENT' : 'MISSING');
        }

    } catch (err) {
        console.error(' CATCH ERROR:', err.message);
        console.error(err.stack);
    }
}

testLogin();
