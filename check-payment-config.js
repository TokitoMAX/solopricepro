require('dotenv').config();

console.log('--- 🔍 BACKEND PAYMENT DIAGNOSTIC ---');

const paypalClientId = process.env.PAYPAL_CLIENT_ID;
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
const stripeKey = process.env.STRIPE_SECRET_KEY;
const nodeEnv = process.env.NODE_ENV || 'development';

console.log(`Environment: ${nodeEnv}`);
console.log(`Stripe Secret Key: ${stripeKey ? '✅ Configured' : '❌ MISSING'}`);
console.log(`PayPal Client ID: ${paypalClientId && paypalClientId !== 'A_remplir_depuis_paypal_developer' ? '✅ Configured' : '❌ MISSING or DEFAULT'}`);
console.log(`PayPal Client Secret: ${paypalClientSecret && paypalClientSecret !== 'A_remplir_depuis_paypal_developer' ? '✅ Configured' : '❌ MISSING or DEFAULT'}`);

if (nodeEnv !== 'production') {
    console.log('💡 Note: Backend will use PayPal SANDBOX endpoints.');
} else {
    console.log('🚀 Note: Backend will use PayPal PRODUCTION endpoints.');
}

console.log('------------------------------------');
