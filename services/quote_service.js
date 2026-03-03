// SoloPrice Pro - Quote Service
// Handles backend API communication exclusively for Quotes (Signatures & Payments)

const QuoteService = {
    /**
     * Signs a public quote directly on the backend.
     * @param {string} id The quote ID
     * @param {string} signatureDataUrl Base64 png data url of the signature
     * @returns {Promise<Object>} Success response or throws Error
     */
    async signPublicQuote(id, signatureDataUrl) {
        const res = await fetch(`${Auth.apiBase}/api/public/quote/${id}/sign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signature: signatureDataUrl })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.message || `Erreur serveur (${res.status}) lors de la signature`);
        }
        return data;
    },

    /**
     * Creates a PayPal checkout order to pay an Expert directly.
     * @param {string} id The quote ID
     * @returns {Promise<string>} The PayPal approval URL to redirect to
     */
    async createExpertPaymentOrder(id) {
        const res = await fetch(`${Auth.apiBase}/api/payments/create-quote-paypal-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quoteId: id, type: 'expert' })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = data.details || data.message || `Erreur de paiement prestataire (${res.status}).`;
            throw new Error(msg);
        }

        if (data.approval_url) {
            return data.approval_url;
        } else {
            throw new Error('URL de paiement PayPal manquante.');
        }
    },

    /**
     * Creates a PayPal checkout order to pay the Platform protection fee.
     * @param {string} id The quote ID
     * @returns {Promise<string>} The PayPal approval URL to redirect to
     */
    async createPlatformPaymentOrder(id) {
        const res = await fetch(`${Auth.apiBase}/api/payments/create-quote-paypal-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quoteId: id, type: 'platform' })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = data.details || data.message || `Erreur de paiement protection (${res.status}).`;
            throw new Error(msg);
        }

        if (data.approval_url) {
            return data.approval_url;
        } else {
            throw new Error('URL de paiement PayPal manquante.');
        }
    },

    /**
     * Captures an authorized PayPal payment.
     * @param {string} orderID The PayPal Order ID
     * @returns {Promise<Object>} The capture result
     */
    async capturePaypalQuote(orderID) {
        try {
            const res = await fetch(`${Auth.apiBase}/api/payments/paypal-capture-quote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderID })
            });
            if (!res.ok) throw new Error('Échec de la confirmation PayPal.');
            return await res.json();
        } catch (e) {
            console.error('[QuoteService] capturePaypalQuote Error:', e);
            throw e;
        }
    },

    /**
     * Fetches a public quote by ID.
     * @param {string} id The quote ID
     * @returns {Promise<Object>} The quote data payload
     */
    async getPublicQuote(id) {
        try {
            const res = await fetch(`${Auth.apiBase}/api/public/quote/${id}`);
            if (!res.ok) throw new Error('Devis introuvable ou lien expiré.');
            return await res.json();
        } catch (e) {
            console.error('[QuoteService] getPublicQuote Error:', e);
            throw e;
        }
    }
};

window.QuoteService = QuoteService;
