const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateBucket() {
    console.log("Attempting to update 'logos' bucket settings...");

    // updateBucket is available in newer versions of supabase-js storage client
    const { data, error } = await supabase.storage.updateBucket('logos', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
        fileSizeLimit: 2097152 // 2MB
    });

    if (error) {
        console.error(" updateBucket ERROR:", error.message);
        console.log("Trying via raw SQL if possible (requires proper permissions)...");
    } else {
        console.log(" Bucket 'logos' updated successfully!");
    }
}

updateBucket();
