require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function discoverTables() {
    console.log("Discovering tables via REST endpoint...");
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const schema = await response.json();

        if (schema.paths) {
            const paths = Object.keys(schema.paths).filter(p => p !== '/').map(p => p.slice(1));
            console.log("Available tables:", paths.join(', '));
        } else {
            console.log("No paths found in schema.");
        }
    } catch (e) {
        console.error("Discovery failed:", e.message);
    }
}

discoverTables();
