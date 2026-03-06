require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkColumns() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.from('sp_expenses').select('*').limit(1);

    if (error) {
        console.error("Error from Supabase:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("COLUMNS_FOUND:" + Object.keys(data[0]).join(','));
    } else {
        console.log("No data found, trying to get column names via an intentional error...");
        const { error: insertError } = await supabase.from('sp_expenses').insert({ project_id_test: '123' });
        if (insertError) {
            console.log("Insert Error Details:", insertError);
        }
    }
}

checkColumns();
