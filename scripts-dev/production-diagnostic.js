// SoloPrice Pro - Production Diagnostic Tool
// Run this in the browser console on your LIVE SITE to diagnose auth issues

(async function () {
    console.log(" SoloPrice Pro - Production Diagnostics");
    console.log("==========================================\n");

    const results = [];

    // 1. Check current location
    results.push(` Current URL: ${window.location.href}`);
    results.push(` Hostname: ${window.location.hostname}`);
    results.push(` Protocol: ${window.location.protocol}`);

    // 2. Check Auth object
    if (window.Auth) {
        results.push(` window.Auth exists`);
        results.push(` API Base: ${window.Auth.apiBase}`);
    } else {
        results.push(` window.Auth is MISSING`);
    }

    // 3. Test Health Endpoint
    results.push(`\n Testing /api/health...`);
    try {
        const healthUrl = `${window.Auth?.apiBase || ''}/api/health`;
        results.push(`   URL: ${healthUrl}`);

        const response = await fetch(healthUrl);
        const data = await response.json();

        results.push(`    Status: ${response.status}`);
        results.push(`   Response: ${JSON.stringify(data, null, 2)}`);

        // Check critical flags
        if (data.config?.supabaseInitialized) {
            results.push(`    Supabase is initialized`);
        } else {
            results.push(`    Supabase NOT initialized - Check environment variables!`);
        }
    } catch (error) {
        results.push(`    FAILED: ${error.message}`);
        results.push(`   This means the API is not reachable at all.`);
    }

    // 4. Test Auth Register Endpoint
    results.push(`\n Testing /api/auth/register...`);
    try {
        const registerUrl = `${window.Auth?.apiBase || ''}/api/auth/register`;
        results.push(`   URL: ${registerUrl}`);

        // Don't actually register, just check if endpoint responds
        const response = await fetch(registerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: '123456' })
        });

        results.push(`   Status: ${response.status}`);

        if (response.status === 503) {
            results.push(`   ️ Service Unavailable - Supabase not configured`);
        } else if (response.status === 404) {
            results.push(`    Route Not Found - Routing issue in vercel.json`);
        } else {
            results.push(`    Endpoint is reachable`);
        }

        const text = await response.text();
        results.push(`   Response: ${text.substring(0, 200)}`);
    } catch (error) {
        results.push(`    FAILED: ${error.message}`);
    }

    // 5. Check Network Tab suggestion
    results.push(`\n Next Steps:`);
    results.push(`   1. Open DevTools (F12) > Network tab`);
    results.push(`   2. Try to register again`);
    results.push(`   3. Look for the /api/auth/register request`);
    results.push(`   4. Check the Status Code and Response`);

    // Print all results
    const report = results.join('\n');
    console.log(report);

    // Also show in alert for easy copy-paste
    alert("Diagnostic Complete! Check the console for full report.\n\nKey findings:\n" +
        results.slice(0, 8).join('\n'));

    return report;
})();
