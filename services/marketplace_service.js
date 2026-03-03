// SoloPrice Pro - Marketplace Service
// Handles backend API communication exclusively for Marketplace logic (Recruitment, Invitations, Applications)

const MarketplaceService = {
    /**
     * Retrieves all invitations for the current user.
     * @returns {Promise<Array>} Array of invitations
     */
    async getInvitations() {
        const res = await fetch(`${Auth.apiBase}/api/marketplace/invitations`, {
            headers: { 'Authorization': `Bearer ${Auth.token}` }
        });
        if (!res.ok) throw new Error('Erreur lors de la récupération des invitations');
        return await res.json();
    },

    /**
     * Updates an invitation (e.g., confirm or decline).
     * @param {string} invitationId The invitation ID
     * @param {Object} updateData Data to update (e.g., status, candidate_response, selected_slot)
     * @returns {Promise<Object>} The updated invitation
     */
    async updateInvitation(invitationId, updateData) {
        const res = await fetch(`${Auth.apiBase}/api/marketplace/invitations/${invitationId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.token}`
            },
            body: JSON.stringify(updateData)
        });
        if (!res.ok) throw new Error('Erreur serveur lors de la mise à jour de l\'invitation');
        return res;
    },

    /**
     * Updates an application status (e.g., accept, reject, hired).
     * @param {string} applicationId The application ID
     * @param {Object} updateData Data to update (e.g., { status: 'hired' })
     * @returns {Promise<Object>} The updated application
     */
    async updateApplication(applicationId, updateData) {
        const res = await fetch(`${Auth.apiBase}/api/marketplace/applications/${applicationId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.token}`
            },
            body: JSON.stringify(updateData)
        });
        if (!res.ok) throw new Error(`Erreur lors de la mise à jour du statut de la candidature (${res.status})`);
        return res;
    },

    /**
     * Sends an interview invitation to a candidate.
     * @param {Object} invitationData The invitation data (application_id, candidate_id, message, proposed_slots)
     * @returns {Promise<Object>} The created invitation
     */
    async sendInvitation(invitationData) {
        const res = await fetch(`${Auth.apiBase}/api/marketplace/invitations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.token}`
            },
            body: JSON.stringify(invitationData)
        });
        if (!res.ok) throw new Error('Erreur lors de la création de l\'invitation');
        return res;
    }
};

window.MarketplaceService = MarketplaceService;
