/**
 * Diagnostic Script for Stripe Webhooks
 * Simulates a Stripe checkout.session.completed event
 */
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
// const fetch = require('node-fetch'); // Native fetch available in Node 22
const crypto = require('crypto');

dotenv.config();

const API_BASE = 'http://localhost:5050';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const TEST_USER_ID = '73a494c2-941c-459b-b848-85b7448bfcb4';

async function simulateWebhook() {
    console.log(' Simulating Stripe Webhook...');

    const payload = JSON.stringify({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
            object: {
                id: 'cs_test_123',
                client_reference_id: TEST_USER_ID,
                amount_total: 1500, // 15.00€
                metadata: {
                    planId: 'pro'
                }
            }
        }
    });

    // Stripe signature simulation
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET)
        .update(signedPayload)
        .digest('hex');
    const signature = `t=${timestamp},v1=${hmac}`;

    try {
        const res = await fetch(`${API_BASE}/api/payments/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Stripe-Signature': signature
            },
            body: payload
        });

        const result = await res.text();
        console.log('Response Status:', res.status);
        console.log('Response Body:', result);

        if (res.ok) {
            console.log(' Webhook processed successfully (Simulation).');
        } else {
            console.error(' Webhook processing failed.');
        }
    } catch (err) {
        console.error(' Fetch Error:', err.message);
    }
}

simulateWebhook();
