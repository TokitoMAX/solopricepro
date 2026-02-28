require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const email = 'admin-test@soloprice.fr';
    const password = 'Password123!';

    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            first_name: 'Bypass',
            last_name: 'Test',
            company_name: 'SoloPrice Admin'
        }
    });

    if (error && error.message !== 'User already registered') {
        console.error('Error creating user:', error.message);
    } else {
        console.log('User ready!');
    }
}

run();
