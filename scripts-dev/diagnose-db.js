const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function diagnose() {
    console.log("Testing specific columns for 'sp_clients'...");
    const columnsToTest = ['id', 'user_id', 'name', 'email', 'phone', 'city', 'address', 'zipCode', 'createdAt'];

    for (const col of columnsToTest) {
        const { data, error } = await supabase
            .from('sp_clients')
            .select(col)
            .limit(1);

        if (error) {
            console.error(` Column '${col}' error:`, error.message);
        } else {
            console.log(` Column '${col}' exists.`);
        }
    }
}

diagnose();
