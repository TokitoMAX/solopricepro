const fetch = require('node-fetch'); // Not installed, but I can use a simpler approach or install it.
// Actually, I'll use a pure node script or just run a command.

async function testRoute() {
    const port = 5050;
    const url = `http://localhost:${port}/api/auth/partner-login`;
    
    console.log(`Testing GET ${url}...`);
    // Since I don't have fetch easily, I'll use a shell command to curl it.
}

// I'll just use run_command with curl.
