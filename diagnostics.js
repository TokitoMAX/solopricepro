(function () {
    console.log("--- DIAGNOSTICS START ---");
    let report = "Diagnostic Report (API Mode):\n";

    async function runCheck() {
        // 1. Check API Connection
        try {
            const response = await fetch('/api/auth/me', {
                headers: { 'Authorization': 'Bearer test' }
            });
            report += "✅ API Reachable (/api/auth/me responded)\n";
        } catch (e) {
            report += "❌ API UNREACHABLE (Is the server running on port 5000?)\n";
        }

        // 2. Check Auth Object
        if (window.Auth && typeof window.Auth.login === 'function') {
            report += "✅ window.Auth is defined and functional\n";
        } else {
            report += "❌ window.Auth is MISCONFIGURED\n";
        }

        // 3. Check Modals
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            report += "✅ Login Modal found in DOM\n";
        } else {
            report += "❌ Login Modal NOT found in DOM\n";
        }

        console.log(report);
        alert(report);
    }

    runCheck();
})();
