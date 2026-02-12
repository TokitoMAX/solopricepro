/**
 * SoloPrice Pro - Marketplace v4.3 (Refined Pro Flow)
 * - Tabs: Radar / Mes Missions / Inbox
 * - Commission: Add-on 15% (Client pays fees)
 * - Portfolio-First Applications
 * - Debug Mode: Type Coercion & Explicit Feedback
 */
console.log('⚡ [MARKETPLACE-v4.3-REFINED] Module Initializing...');

const Marketplace = {
    // Configuration
    COMMISSION_RATE: 0.15, // 15% Add-on
    currentTab: 'radar',

    // Rendu Principal
    render(containerId = 'marketplace-root') {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Header + Navigation
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">MARKETPLACE <span class="badge-pro">PRO v4.3</span></h1>
                    <p class="page-subtitle">Réseau d'Opportunités DomTomConnect</p>
                </div>
                <button class="button-primary" onclick="Marketplace.showPostForm()">
                    <i class="fas fa-plus"></i> Poster une Mission
                </button>
            </div>

            <!-- Tab Navigation -->
            <div class="marketplace-tabs">
                <button class="tab-btn ${this.currentTab === 'radar' ? 'active' : ''}" onclick="Marketplace.switchTab('radar')">📡 Radar</button>
                <button class="tab-btn ${this.currentTab === 'mymissions' ? 'active' : ''}" onclick="Marketplace.switchTab('mymissions')">📂 Mes Missions</button>
                <button class="tab-btn ${this.currentTab === 'inbox' ? 'active' : ''}" onclick="Marketplace.switchTab('inbox')">📬 Inbox (Candidatures)</button>
            </div>

            <div id="marketplace-content" class="marketplace-grid-lite">
                <div class="loading-spinner">Chargement...</div>
            </div>
            
            ${this.renderModals()}
        `;

        this.loadTabContent();
    },

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        if (event && event.target) event.target.classList.add('active');
        this.loadTabContent();
    },

    async loadTabContent() {
        const container = document.getElementById('marketplace-content');
        container.innerHTML = '<div class="loading-spinner">Chargement...</div>';

        try {
            // Force data sync to ensure freshness
            if (Storage.getPublicMissions().length === 0) await Storage.fetchAllData();

            if (this.currentTab === 'radar') await this.renderRadar(container);
            else if (this.currentTab === 'mymissions') await this.renderMyMissions(container);
            else if (this.currentTab === 'inbox') await this.renderInbox(container);
        } catch (err) {
            console.error(err);
            container.innerHTML = `<div class="error">Erreur: ${err.message}</div>`;
        }
    },

    // --- VUES ---

    async renderRadar(container) {
        const missions = await Storage.getPublicMissions();
        if (!missions || missions.length === 0) {
            container.innerHTML = '<div class="empty-state">Aucune mission disponible sur le Radar.</div>';
            return;
        }

        container.innerHTML = missions.map(m => `
            <div class="mission-card-lite">
                <div class="mission-header">
                    <h3>${this.escape(m.title)}</h3>
                    <span class="mission-budget">${m.budget}€</span>
                </div>
                <div class="mission-meta">
                    <span class="mission-zone">📍 ${m.zone || 'Global'}</span>
                    <span class="mission-comm">Frais inclus (15%)</span>
                </div>
                <p class="mission-desc">${this.escape(m.description)}</p>
                <div class="mission-actions">
                    <button onclick="Marketplace.openApplyForm('${m.id}', '${this.escape(m.title)}')" class="button-secondary small full-width">
                       ⚡ Candidater
                    </button>
                </div>
            </div>
        `).join('');
    },

    async renderMyMissions(container) {
        // Nécessite l'utilisateur connecté
        const user = (typeof Auth !== 'undefined') ? Auth.currentUser : null;
        if (!user) {
            container.innerHTML = '<div class="error">Veuillez vous connecter pour voir vos missions.</div>';
            return;
        }

        // Force explicit reload of "My Missions" via Storage helper
        const missions = Storage.getMyMissions(user.id);

        console.log('[MARKETPLACE] Render MyMissions:', missions);

        if (!missions || missions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Vous n'avez posté aucune mission.</p>
                    <small>Debug: User ID ${user.id}</small>
                </div>`;
            return;
        }

        container.innerHTML = missions.map(m => `
            <div class="mission-card-lite my-mission">
                <div class="mission-header">
                    <h3>${this.escape(m.title)}</h3>
                    <span class="status-badge ${m.status}">${m.status}</span>
                </div>
                <p class="mission-desc">${this.escape(m.description)}</p>
                <div class="mission-footer">
                    <span>Budget Cible: ${m.budget}€</span>
                    <button onclick="Marketplace.deleteMission('${m.id}')" class="button-danger small">
                       🗑️ Supprimer
                    </button>
                </div>
            </div>
        `).join('');
    },

    async renderInbox(container) {
        // Fetch Inbox Data via dedicated backend route
        const inbox = await Storage.getInbox();

        if (!inbox || inbox.length === 0) {
            container.innerHTML = '<div class="empty-state">Aucune candidature reçue pour le moment.</div>';
            return;
        }

        container.innerHTML = inbox.map(app => `
            <div class="application-card">
                <div class="app-header">
                    <div class="app-mission">
                        <small>Candidature pour :</small>
                        <strong>${this.escape(app.mission_title || 'Mission Inconnue')}</strong>
                    </div>
                    <div class="app-price">
                        <span class="expert-price">Demande Expert: ${app.expert_price}€ Net</span>
                        <span class="client-price" style="color:var(--accent); font-weight:bold;">Total à Payer: ${app.total_price}€</span>
                    </div>
                </div>
                
                <div class="app-candidate" style="display:flex; gap:10px; margin: 15px 0; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;">
                    <div class="candidate-avatar" style="font-size:2em;">👤</div>
                    <div class="candidate-info">
                        <strong>${this.escape(app.applicant_name || 'Candidat Anonyme')}</strong>
                        <div style="font-size:0.9em; margin-top:5px;">
                            ${app.portfolio_url ? `<a href="${this.escape(app.portfolio_url)}" target="_blank" class="portfolio-link">🌐 Voir Portfolio</a>` : '<span class="no-portfolio" style="opacity:0.5">Pas de portfolio</span>'}
                        </div>
                    </div>
                </div>

                <div class="app-message" style="font-style:italic; margin-bottom:15px; padding-left:10px; border-left:3px solid var(--primary);">
                    "${this.escape(app.message)}"
                </div>

                <div class="app-actions">
                    <button class="button-danger small" onclick="Marketplace.rejectApplication('${app.id}')">❌ Refuser</button>
                    <button class="button-success small" onclick="Marketplace.validateApplication('${app.id}')">✅ Accepter & Payer</button>
                </div>
            </div>
        `).join('');
    },

    // --- ACTIONS ---

    async deleteMission(id) {
        if (!confirm('Supprimer cette mission ?')) return;
        try {
            await Storage.deleteMission(id);
            if (typeof App !== 'undefined') App.showNotification('Mission supprimée', 'success');
            // Refresh current tab
            this.loadTabContent();
        } catch (e) {
            alert('Erreur: ' + e.message);
        }
    },

    async validateApplication(id) {
        if (!confirm('Valider ce devis et assigner la mission ? (Simulation)')) return;
        alert("✅ Candidature validée ! (Le flux de paiement sera intégré en v5)");
        // TODO: Update status in DB
    },

    async rejectApplication(id) {
        if (!confirm('Refuser cette candidature ?')) return;
        alert('Candidature refusée (Simulation)');
    },

    // --- MODALES ---

    renderModals() {
        return `
            <!-- POST FORM -->
            <div id="post-mission-modal" class="modal-overlay" style="display:none;">
                <div class="modal-content glass">
                    <button class="modal-close" onclick="Marketplace.closePostForm()">✕</button>
                    <h2>🚀 Poster une Mission</h2>
                    <form onsubmit="Marketplace.submitMission(event)">
                        <label>Titre
                            <input type="text" name="title" required placeholder="Ex: Refonte Site Web" class="form-input">
                        </label>
                        <div class="form-row">
                            <label>Budget Global Client (€)
                                <input type="number" name="budget" required placeholder="1000" class="form-input" disabled title="Calculé automatiquement" style="opacity:0.7">
                                <small>Le budget total sera calculé selon l'offre de l'expert.</small>
                            </label>
                            <label>Zone
                                <select name="zone" class="form-input">
                                    <option>Outre-Mer</option>
                                    <option>Métropole</option>
                                    <option>International</option>
                                </select>
                            </label>
                        </div>
                        <label>Description
                            <textarea name="description" required rows="3" class="form-input"></textarea>
                        </label>
                        <p style="font-size:0.8em; opacity:0.8;">Note: En postant, vous acceptez que les experts vous fassent des offres incluant 15% de frais de service.</p>
                        <button type="submit" class="button-primary full-width">Diffuser l'Appel d'Offres</button>
                    </form>
                </div>
            </div>

            <!-- APPLY FORM (Portfolio First) -->
            <div id="apply-modal" class="modal-overlay" style="display:none;">
                <div class="modal-content glass">
                    <button class="modal-close" onclick="Marketplace.closeApplyForm()">✕</button>
                    <h2>⚡ Candidater</h2>
                    <div class="mission-reminder" id="apply-mission-title"></div>
                    
                    <form onsubmit="Marketplace.submitApplication(event)">
                        <input type="hidden" name="mission_id" id="apply-mission-id">
                        
                        <div class="form-row">
                            <label>Votre Nom / Agence
                                <input type="text" name="applicant_name" required placeholder="Studio X..." class="form-input">
                            </label>
                            <label>Lien Portfolio
                                <input type="url" name="portfolio_url" placeholder="https://..." class="form-input">
                            </label>
                        </div>

                        <label>Pitch / Motivation
                            <textarea name="message" required rows="4" class="form-input" placeholder="Pourquoi vous ?"></textarea>
                        </label>
                         
                        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-top: 10px;">
                            <label>Votre Tarif Net (€)
                                <input type="number" name="expert_price" id="expert-price-input" required class="form-input" placeholder="Ex: 500" oninput="Marketplace.updateApplyCalc()">
                            </label>
                            <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:0.9em;">
                                <span>+ Frais de Service (15%):</span>
                                <span id="apply-fee">0 €</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-top:5px; padding-top:5px; border-top:1px solid rgba(255,255,255,0.1); font-weight:bold;">
                                <span>Total Client :</span>
                                <span id="apply-total" style="color:var(--accent);">0 €</span>
                            </div>
                        </div>

                        <button type="submit" class="button-primary full-width" style="margin-top:15px;">Envoyer Proposition</button>
                    </form>
                </div>
            </div>
        `;
    },

    updateApplyCalc() {
        const input = document.getElementById('expert-price-input');
        const expertPrice = parseFloat(input.value) || 0;
        const fees = expertPrice * this.COMMISSION_RATE;
        const total = expertPrice + fees;

        document.getElementById('apply-fee').textContent = fees.toFixed(2) + ' €';
        document.getElementById('apply-total').textContent = total.toFixed(2) + ' €';
    },

    showPostForm() {
        document.getElementById('post-mission-modal').style.display = 'flex';
        // Hack: Enable budget input for users who want to set a "Target Budget" even if it's auction based
        const budgetInput = document.querySelector('input[name="budget"]');
        if (budgetInput) budgetInput.disabled = false;
    },

    closePostForm() { document.getElementById('post-mission-modal').style.display = 'none'; },

    openApplyForm(missionId, missionTitle) {
        document.getElementById('apply-mission-id').value = missionId;
        document.getElementById('apply-mission-title').textContent = missionTitle;
        document.getElementById('apply-modal').style.display = 'flex';

        // Auto-fill identity if possible
        if (typeof Auth !== 'undefined' && Auth.currentUser) {
            const nameInput = document.querySelector('input[name="applicant_name"]');
            if (nameInput && !nameInput.value) {
                // Try to guess from metadata or email
                nameInput.value = Auth.currentUser.user_metadata?.company || Auth.currentUser.user_metadata?.full_name || '';
            }
        }
    },

    closeApplyForm() { document.getElementById('apply-modal').style.display = 'none'; },

    async submitMission(e) {
        e.preventDefault();
        const output = e.target.querySelector('button[type="submit"]');
        output.disabled = true;
        output.textContent = 'Envoi...';

        const formData = new FormData(e.target);

        const mission = {
            title: formData.get('title'),
            budget: parseFloat(formData.get('budget')), // Target Budget
            description: formData.get('description'),
            zone: formData.get('zone'),
            status: 'open'
        };

        try {
            await Storage.addMission(mission);
            if (typeof App !== 'undefined') App.showNotification('Mission publiée !', 'success');
            this.closePostForm();
            this.switchTab('mymissions'); // Redirect to manage view
            e.target.reset();
        } catch (err) {
            console.error(err);
            if (typeof App !== 'undefined') App.showNotification('Erreur publication', 'error');
        } finally {
            output.disabled = false;
            output.textContent = 'Diffuser';
        }
    },

    async submitApplication(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Envoi...';

        const formData = new FormData(e.target);
        const expertPrice = parseFloat(formData.get('expert_price'));
        const fees = expertPrice * this.COMMISSION_RATE;
        const total = expertPrice + fees;

        const application = {
            mission_id: formData.get('mission_id'),
            applicant_name: formData.get('applicant_name'),
            portfolio_url: formData.get('portfolio_url'),
            message: formData.get('message'),
            expert_price: expertPrice,
            total_price: total, // C'est ce que le client verra
            status: 'pending'
        };

        try {
            await Storage.addApplication(application);
            if (typeof App !== 'undefined') App.showNotification('Proposition envoyée !', 'success');
            this.closeApplyForm();
            e.target.reset();
        } catch (err) {
            console.error(err);
            if (typeof App !== 'undefined') App.showNotification('Erreur candidature', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Envoyer Proposition';
        }
    },

    escape(str) {
        if (!str) return '';
        return String(str).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
};

window.Marketplace = Marketplace;
