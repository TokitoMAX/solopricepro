/**
 * SoloPrice Pro - Marketplace v4.1 (Centralized Platform)
 * Modèle WeChat : Tout se passe sur la plateforme.
 */
console.log('⚡ [MARKETPLACE-v4.1-CENTRAL] Module Initializing...');

const Marketplace = {
    // Configuration
    COMMISSION_RATE: 0.20, // 20%

    // Rendu Principal - Le Radar
    render(containerId = 'marketplace-root') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">MARKETPLACE <span class="badge-pro">CENTRAL v4.1</span></h1>
                    <p class="page-subtitle">Réseau d'Opportunités DomTomConnect</p>
                </div>
                <button class="button-primary" onclick="Marketplace.showPostForm()">
                    <i class="fas fa-plus"></i> Poster une Mission
                </button>
            </div>

            <div id="marketplace-content" class="marketplace-grid-lite">
                <div class="loading-spinner">📡 Scan du Radar...</div>
            </div>
            
            <!-- Modale de Publication Simplifiée + Commission -->
            <div id="post-mission-modal" class="modal-overlay" style="display:none;">
                <div class="modal-content glass">
                    <button class="modal-close" onclick="Marketplace.closePostForm()">✕</button>
                    <h2>🚀 Nouvelle Mission</h2>
                    <form onsubmit="Marketplace.submitMission(event)">
                        <label>Titre de la mission
                            <input type="text" name="title" required placeholder="Ex: Dév Site Vitrine" class="form-input">
                        </label>
                        <div class="form-row">
                            <label>Budget Client Global (€)
                                <input type="number" name="budget" id="mission-budget-input" required placeholder="1000" class="form-input" oninput="Marketplace.updateCommissionDisplay()">
                            </label>
                            <label>Zone
                                <select name="zone" class="form-input">
                                    <option>Outre-Mer</option>
                                    <option>Métropole</option>
                                    <option>International</option>
                                </select>
                            </label>
                        </div>
                        
                        <!-- Commission Calculator Display -->
                        <div id="commission-preview" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 0.9em;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                <span>Budget Client :</span>
                                <span id="comm-total" style="font-weight:bold;">0 €</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:5px; color: var(--accent);">
                                <span>Commission (20%) :</span>
                                <span id="comm-fee">0 €</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top:5px;">
                                <span><strong>Net Expert :</strong></span>
                                <span id="comm-net" style="color: var(--success); font-weight:bold;">0 €</span>
                            </div>
                        </div>

                        <label>Description Court & Efficace
                            <textarea name="description" required rows="3" class="form-input"></textarea>
                        </label>
                        <button type="submit" class="button-primary full-width">Diffuser</button>
                    </form>
                </div>
            </div>

            <!-- Modale de Candidature Centralisée -->
            <div id="apply-modal" class="modal-overlay" style="display:none;">
                <div class="modal-content glass">
                    <button class="modal-close" onclick="Marketplace.closeApplyForm()">✕</button>
                    <h2>⚡ Candidater</h2>
                    <p style="font-size: 0.9em; opacity: 0.8; margin-bottom: 1rem;">
                        Votre réponse sera envoyée directement au client via la plateforme.
                    </p>
                    <form onsubmit="Marketplace.submitApplication(event)">
                        <input type="hidden" name="mission_id" id="apply-mission-id">
                        <label>Votre Message / Pitch
                            <textarea name="message" required rows="4" class="form-input" placeholder="Bonjour, je suis disponible pour cette mission..."></textarea>
                        </label>
                         <label>Votre Tarif Proposé (€)
                            <input type="number" name="price" required class="form-input" placeholder="Votre montant net">
                        </label>
                         <p style="font-size: 0.8em; color: var(--accent); margin-bottom: 1rem;">
                            * La plateforme ajoutera automatiquement sa commission au montant présenté au client.
                        </p>
                        <button type="submit" class="button-primary full-width">Envoyer Candidature</button>
                    </form>
                </div>
            </div>
        `;

        this.loadMissions();
    },

    updateCommissionDisplay() {
        const budgetInput = document.getElementById('mission-budget-input');
        const total = parseFloat(budgetInput.value) || 0;
        const commission = total * this.COMMISSION_RATE;
        const net = total - commission;

        document.getElementById('comm-total').textContent = total.toFixed(2) + ' €';
        document.getElementById('comm-fee').textContent = commission.toFixed(2) + ' €';
        document.getElementById('comm-net').textContent = net.toFixed(2) + ' €';
    },

    async loadMissions() {
        try {
            const missions = await Storage.getPublicMissions();
            const container = document.getElementById('marketplace-content');

            if (!missions || missions.length === 0) {
                container.innerHTML = '<div class="empty-state">Aucune mission pour le moment.</div>';
                return;
            }

            container.innerHTML = missions.map(m => `
                <div class="mission-card-lite">
                    <div class="mission-header">
                        <h3>${this.escape(m.title)}</h3>
                        <span class="mission-budget">${m.budget}€</span>
                    </div>
                    <p class="mission-desc">${this.escape(m.description)}</p>
                    <div class="mission-actions">
                        <span class="mission-zone">📍 ${m.zone || 'Global'}</span>
                        <button onclick="Marketplace.openApplyForm('${m.id}')" class="button-secondary small">
                           Candidater
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (e) {
            console.error(e);
            document.getElementById('marketplace-content').innerHTML = '<div class="error">Erreur de chargement.</div>';
        }
    },

    showPostForm() {
        document.getElementById('post-mission-modal').style.display = 'flex';
        this.updateCommissionDisplay();
    },

    closePostForm() {
        document.getElementById('post-mission-modal').style.display = 'none';

        // Reset form
        const form = document.querySelector('#post-mission-modal form');
        if (form) form.reset();
        document.getElementById('comm-total').textContent = '0 €';
        document.getElementById('comm-fee').textContent = '0 €';
        document.getElementById('comm-net').textContent = '0 €';
    },

    openApplyForm(missionId) {
        document.getElementById('apply-mission-id').value = missionId;
        document.getElementById('apply-modal').style.display = 'flex';
    },

    closeApplyForm() {
        document.getElementById('apply-modal').style.display = 'none';
    },

    async submitMission(e) {
        e.preventDefault();
        console.log('🚀 [MARKETPLACE] Submit triggered');

        const output = document.querySelector('#post-mission-modal button[type="submit"]');
        const originalText = output.textContent;
        output.disabled = true;
        output.textContent = 'Envoi...';

        const formData = new FormData(e.target);

        // Calcul automatique pour sauvegarde
        const budgetTotal = parseFloat(formData.get('budget'));
        const commission = budgetTotal * this.COMMISSION_RATE;
        const netExpert = budgetTotal - commission;

        const mission = {
            title: formData.get('title'),
            budget: budgetTotal,
            commission_amount: commission,
            net_expert_amount: netExpert,
            description: formData.get('description'),
            zone: formData.get('zone'),
            status: 'open'
        };

        console.log('📦 [MARKETPLACE] Payload:', mission);

        try {
            console.log('☁️ [MARKETPLACE] Sending to Storage...');
            const result = await Storage.addMission(mission);
            console.log('✅ [MARKETPLACE] Storage response:', result);

            if (typeof App !== 'undefined') App.showNotification('Mission publiée !', 'success');
            this.closePostForm();
            this.loadMissions();
        } catch (err) {
            console.error('❌ [MARKETPLACE] Submit Error:', err);
            if (typeof App !== 'undefined') App.showNotification('Erreur: ' + (err.message || 'Inconnue'), 'error');
        } finally {
            output.disabled = false;
            output.textContent = originalText;
        }
    },

    async submitApplication(e) {
        e.preventDefault();
        const btn = document.querySelector('#apply-modal button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Envoi...';
        btn.disabled = true;

        const formData = new FormData(e.target);

        // On vire created_at pour laisser Supabase gérer (bypass erreur schema)
        const application = {
            mission_id: formData.get('mission_id'),
            message: formData.get('message'),
            proposed_price: parseFloat(formData.get('price')),
            status: 'pending'
        };

        try {
            await Storage.addApplication(application);
            if (typeof App !== 'undefined') App.showNotification('Candidature envoyée !', 'success');
            this.closeApplyForm();
            e.target.reset();
        } catch (err) {
            console.error('❌ [MARKETPLACE] Apply Error:', err);
            if (typeof App !== 'undefined') App.showNotification('Erreur candidature', 'error');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    },

    escape(str) {
        if (!str) return '';
        return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
};

// Global Exposure
window.Marketplace = Marketplace;
