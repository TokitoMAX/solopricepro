require('dotenv').config();

async function discoverTables() {
    try {
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
            headers: {
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            }
        });
        const schema = await response.json();
        if (schema.paths) {
            const paths = Object.keys(schema.paths)
                .filter(p => p !== '/')
                .map(p => p.slice(1));
            console.log("=== TABLES FOUND ===");
            paths.forEach(p => console.log(p));
            console.log("====================");
        }
    } catch (e) {
        console.error(e);
    }
}
discoverTables();
