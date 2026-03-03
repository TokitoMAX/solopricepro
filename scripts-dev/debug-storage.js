const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugStorage() {
    console.log("--- Supabase Storage Debug ---");

    // 1. Check Buckets
    console.log("Listing buckets...");
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
        console.error(" listBuckets ERROR:", bucketError.message);
        return;
    }
    console.log("Buckets found:", buckets.map(b => b.id).join(', '));

    const logoBucket = buckets.find(b => b.id === 'logos');
    if (!logoBucket) {
        console.log("️ Creating 'logos' bucket...");
        const { error: createError } = await supabase.storage.createBucket('logos', {
            public: true
        });
        if (createError) {
            console.error(" createBucket ERROR:", createError.message);
            return;
        }
        console.log(" Bucket 'logos' created.");
    } else {
        console.log(" Bucket 'logos' already exists.");
    }

    // 2. Test Upload
    console.log("Testing upload...");
    const testContent = "Test logo content";
    const testPath = `test_${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(testPath, testContent, {
            contentType: 'text/plain',
            upsert: true
        });

    if (uploadError) {
        console.error(" upload ERROR:", uploadError.message);
    } else {
        console.log(" Upload successful:", uploadData.path);

        const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(testPath);
        console.log(" Public URL:", publicUrl);

        // Cleanup
        await supabase.storage.from('logos').remove([testPath]);
    }
}

debugStorage();
