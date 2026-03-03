require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE env vars.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const email = 'jean.dupont' + Date.now().toString().slice(-4) + '@soloprice.fr';
    const password = 'Password123!';

    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            first_name: 'Jean',
            last_name: 'Dupont',
            company_name: ''
        }
    });

    if (error) {
        console.error('Error creating user:', error.message);
    } else {
        console.log('SUCCESS_EMAIL=' + email);
        console.log('SUCCESS_PASSWORD=' + password);
    }
}

run();
