// SoloPrice Pro - Network Service
// Handles backend API communication for Ecosystem and Partnerships

const NetworkService = {
    /**
     * Loads the private network providers for the current user.
     * @returns {Promise<Array>} Array of provider objects
     */
    async fetchProviders() {
        if (!Auth.user || !Auth.token) return [];
        try {
            const res = await fetch(`${Auth.apiBase}/api/data/${Storage.KEYS.PROVIDERS}`, {
                headers: { 'Authorization': `Bearer ${Auth.token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch providers');
            return await res.json();
        } catch (e) {
            console.error('[NetworkService.fetchProviders] Error:', e);
            throw e;
        }
    },

    /**
     * Submits an application to join the public ecosystem.
     * @param {Object} payload The application details
     * @returns {Promise<Object>} Success message or throws error
     */
    async applyToEcosystem(payload) {
        if (!Auth.token) throw new Error('Non autorisé');
        const res = await fetch(`${Auth.apiBase}/api/marketplace/apply-ecosystem`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.token}`
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erreur lors de l\'envoi');
        return data;
    },

    /**
     * Admin: Reviews an ecosystem application.
     * @param {string} id Application ID
     * @param {string} status 'accepted' or 'rejected'
     * @param {Object} applicantData Details of the applicant to merge
     * @returns {Promise<Object>} Success message or throws error
     */
    async reviewEcosystemApplication(id, status, applicantData) {
        if (!Auth.token) throw new Error('Non autorisé');
        const res = await fetch(`${Auth.apiBase}/api/marketplace/ecosystem-applications/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.token}`
            },
            body: JSON.stringify({ status, applicant: applicantData })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erreur d\'approbation');
        return data;
    },

    /**
     * Admin: Directly adds an expert to the ecosystem.
     * @param {Object} expert Expert profile data
     * @returns {Promise<Object>} The added expert data
     */
    async addEcosystemExpert(expert) {
        if (!Auth.token) throw new Error('Non autorisé');
        const res = await fetch(`${Auth.apiBase}/api/marketplace/ecosystem-experts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.token}`
            },
            body: JSON.stringify(expert)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erreur d\'ajout');
        return data;
    },

    /**
     * Admin: Deletes an expert from the ecosystem.
     * @param {string} id Expert ID
     * @returns {Promise<void>}
     */
    async deleteEcosystemExpert(id) {
        if (!Auth.token) throw new Error('Non autorisé');
        const res = await fetch(`${Auth.apiBase}/api/marketplace/ecosystem-experts/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${Auth.token}` }
        });
        if (!res.ok) throw new Error('Erreur de suppression');
    },

    /**
     * Retrieves the list of public ecosystem experts.
     * @returns {Promise<Array>} List of experts
     */
    async getEcosystemExperts() {
        try {
            const res = await fetch(`${Auth.apiBase}/api/marketplace/ecosystem-experts`, {
                headers: { 'Authorization': `Bearer ${Auth.token}` }
            });
            if (!res.ok) throw new Error('Erreur de récupération des experts');
            return await res.json();
        } catch (e) {
            console.error('[NetworkService] getEcosystemExperts Error:', e);
            throw e;
        }
    },

    /**
     * Retrieves the list of pending ecosystem applications.
     * @returns {Promise<Array>} List of applications
     */
    async getEcosystemApplications() {
        try {
            const res = await fetch(`${Auth.apiBase}/api/marketplace/ecosystem-applications`, {
                headers: { 'Authorization': `Bearer ${Auth.token}` }
            });
            if (!res.ok) throw new Error('Erreur de récupération des candidatures');
            return await res.json();
        } catch (e) {
            console.error('[NetworkService] getEcosystemApplications Error:', e);
            throw e;
        }
    },

    /**
     * Validates a company SIRET via the backend data proxy.
     * @param {string} siret Company siret code
     * @returns {Promise<Object>} Validation response
     */
    async validateCompanySiret(siret) {
        try {
            const res = await fetch(`${Auth.apiBase}/api/data/validate/company?siret=${siret}`, {
                headers: { 'Authorization': `Bearer ${Auth.token}` }
            });
            return { ok: res.ok, data: await res.json() };
        } catch (e) {
            console.error('[NetworkService] validateCompanySiret Error:', e);
            throw e;
        }
    }
};

window.NetworkService = NetworkService;
