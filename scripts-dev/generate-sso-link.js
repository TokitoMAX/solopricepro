const crypto = require('crypto');

// Configuration du test
const email = 'test-sso-user@example.com';
const name = 'Test SSO User';
const timestamp = Date.now().toString();
const secret = 'dtc_sso_default_secret_2026';
const partner = 'domtomconnect';

// Calcul de la signature
const payload = `${email}${name}${timestamp}`;
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

// Construction de l'URL (pour information)
const queryParams = new URLSearchParams({
    partner,
    email,
    name,
    timestamp,
    signature
});

console.log("\n--- TEST SSO SOLOPRICE PRO ---");
console.log("Email: ", email);
console.log("Signature calculée: ", signature);
console.log("Timestamp: ", timestamp);
console.log("\nURL DE TEST (Simulation Redirection):");
console.log(`http://localhost:5050/api/auth/partner-login?${queryParams.toString()}`);
console.log("\n-------------------------------\n");
