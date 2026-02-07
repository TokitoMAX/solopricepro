const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load .env
dotenv.config();

console.log('--- 🛡️ DIAGNOSTIC SMTP SOLOPRICE PRO ---');
console.log('Host:', process.env.SMTP_HOST);
console.log('Port:', process.env.SMTP_PORT);
console.log('User:', process.env.SMTP_USER);
console.log('Pass:', process.env.SMTP_PASS ? '********' : 'MANQUANT');
console.log('From:', process.env.SMTP_FROM);

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ ERREUR: Libellés SMTP manquants dans le fichier .env');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

console.log('📡 Vérification de la connexion au serveur SMTP...');

transporter.verify((error, success) => {
    if (error) {
        console.error('❌ ERREUR DE CONNEXION SMTP:');
        console.error(error);
    } else {
        console.log('✅ CONNEXION RÉUSSIE ! Le serveur est prêt à envoyer des emails.');
    }
    process.exit(0);
});
