/**
 * SoloPrice Pro - Marketplace v4.4 (Job Board UI & Strict Roles)
 * - Roles: Recruteur (Client) vs Candidat (Talent)
 * - UI: Job Cards, Clear Actions, "Black Screen" fix
 * - Terminology: "Diffuser une Offre" / "Postuler"
 */
console.log('⚡ [MARKETPLACE-v4.4-UX] Module Initializing...');

const Marketplace = {
    // Configuration
    COMMISSION_RATE: 0.15, // 15% Add-on
    currentTab: 'radar',

    // Rendu Principal
    render(containerId = 'marketplace-root') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="marketplace-feed-container">
                <!-- Sidebar (User Info / Quick Actions) -->
                <aside class="marketplace-sidebar">
                    <div class="user-quick-card glass">
                        <div class="user-banner"></div>
                        <div class="user-avatar-circle">${Auth.user?.email?.[0].toUpperCase() || 'U'}</div>
                        <div class="user-info">
                            <h3>${Auth.user?.company?.name || Auth.user?.email || 'Visiteur'}</h3>
                            <p>${Auth.user?.isPro ? 'Membre Pro 💎' : 'Membre Standard'}</p>
                        </div>
                        <div class="user-stats">
                            <div class="stat">
                                <span>Mes Offres</span>
                                <strong>${Storage.getMyMissions(Auth.user?.id).length}</strong>
                            </div>
                        </div>
                    </div>
                    
                    <div class="marketplace-nav glass">
                        <button class="nav-btn ${this.currentTab === 'radar' ? 'active' : ''}" onclick="Marketplace.switchTab('radar')">
                            <i class="fas fa-rss"></i> Fil d'actualité
                        </button>
                        <button class="nav-btn ${this.currentTab === 'mymissions' ? 'active' : ''}" onclick="Marketplace.switchTab('mymissions')">
                            <i class="fas fa-briefcase"></i> Mes Recrutements
                        </button>
                        <button class="nav-btn ${this.currentTab === 'inbox' ? 'active' : ''}" onclick="Marketplace.switchTab('inbox')">
                            <i class="fas fa-envelope-open-text"></i> Inbox Candidatures
                        </button>
                    </div>
                </aside>

                <!-- Central Feed -->
                <main class="marketplace-main-feed">
                    <div class="post-trigger-box glass" onclick="Marketplace.showPostForm()">
                        <div class="search-avatar-mini">${Auth.user?.email?.[0].toUpperCase() || 'U'}</div>
                        <div class="search-placeholder">Diffuser une offre de mission...</div>
                    </div>

                    <div id="marketplace-content">
                        <!-- Content injected by loadTabContent -->
                    </div>
                </main>
            </div>
            
            ${this.renderModals()}
        `;

        this.loadTabContent();
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.render(); // Full re-render for layout consistency
    },

    async loadTabContent() {
        const container = document.getElementById('marketplace-content');
        if (!container) return;

        try {
            // Force data sync if cache empty
            const missions = Storage.getPublicMissions();
            if (missions.length === 0) {
                container.innerHTML = '<div class="loading-spinner">Mise à jour du feed...</div>';
                await Storage.fetchAllData();
            }

            if (this.currentTab === 'radar') await this.renderRadar(container);
            else if (this.currentTab === 'mymissions') await this.renderMyMissions(container);
            else if (this.currentTab === 'inbox') await this.renderInbox(container);
        } catch (err) {
            console.error(err);
            container.innerHTML = `<div class="error-box">Erreur: ${err.message}</div>`;
        }
    },

    // --- VUES (LinkedIn Style) ---

    async renderRadar(container) {
        const missions = await Storage.getPublicMissions();
        if (!missions || missions.length === 0) {
            container.innerHTML = `
                <div class="empty-feed glass">
                    <h3>C'est bien calme ici...</h3>
                    <p>Soyez le premier à dynamiser le réseau DomTomConnect !</p>
                    <button class="button-primary" onclick="Marketplace.showPostForm()">Diffuser la 1ère offre</button>
                </div>`;
            return;
        }

        // Sort by date (latest first)
        const sorted = [...missions].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        container.innerHTML = sorted.map(m => `
            <article class="feed-item glass">
                <div class="feed-item-header">
                    <div class="author-avatar">${this.escape(m.company_name?.[0]) || '🏢'}</div>
                    <div class="author-meta">
                        <strong>${this.escape(m.company_name || 'Entreprise anonyme')}</strong>
                        <span>Mission diffusée le ${new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="item-badge">${m.zone || 'Remote'}</div>
                </div>
                
                <div class="feed-item-content">
                    <h2 class="feed-title">${this.escape(m.title)}</h2>
                    <p class="feed-description">${this.escape(m.description)}</p>
                </div>

                <div class="feed-item-pricing">
                    <div class="price-pill">
                        <span class="label">Budget Net Expert</span>
                        <span class="value">${m.budget}€</span>
                    </div>
                </div>

                <div class="feed-item-actions">
                    <button onclick="Marketplace.openApplyForm('${m.id}', '${this.escape(m.title)}')" class="action-btn primary">
                        <i class="fas fa-paper-plane"></i> Postuler / Contacter
                    </button>
                </div>
            </article>
        `).join('');
    },

    async renderMyMissions(container) {
        // Nécessite l'utilisateur connecté
        const user = (typeof Auth !== 'undefined') ? Auth.currentUser : null;
        if (!user) {
            container.innerHTML = '<div class="error">Veuillez vous connecter pour gérer vos recrutements.</div>';
            return;
        }

        const missions = Storage.getMyMissions(user.id);

        if (!missions || missions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">💼</div>
                    <h3>Aucun recrutement en cours</h3>
                    <p>Vous n'avez diffusé aucune offre pour le moment.</p>
                </div>`;
            return;
        }

        container.innerHTML = missions.map(m => `
            <div class="job-card my-job">
                <div class="job-card-header">
                    <h3 class="job-title">${this.escape(m.title)}</h3>
                    <div class="job-status ${m.status}">${m.status === 'open' ? 'Active' : m.status}</div>
                </div>
                <div class="job-body">
                    <p>${this.escape(m.description)}</p>
                </div>
                <div class="job-footer managed">
                    <span class="budget-info">Budget: ${m.budget}€</span>
                    <button onclick="Marketplace.deleteMission('${m.id}')" class="button-danger small">
                       🗑️ Supprimer l'offre
                    </button>
                </div>
            </div>
        `).join('');
    },

    async renderInbox(container) {
        // Fetch Inbox Data
        const inbox = await Storage.getInbox();

        if (!inbox || inbox.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📥</div>
                    <h3>Inbox Vide</h3>
                    <p>Aucune candidature reçue pour vos offres.</p>
                </div>`;
            return;
        }

        container.innerHTML = inbox.map(app => `
            <div class="application-card">
                <div class="app-header-row">
                    <span class="app-mission-ref">Réf: ${this.escape(app.mission_title)}</span>
                    <span class="app-date">Reçu récemment</span>
                </div>
                
                <div class="candidate-profile">
                    <div class="avatar-circle">👤</div>
                    <div class="candidate-identity">
                        <strong>${this.escape(app.applicant_name || 'Candidat')}</strong>
                        ${app.portfolio_url ? `<a href="${this.escape(app.portfolio_url)}" target="_blank" class="link-portfolio">🌐 Voir Portfolio</a>` : '<span class="text-muted">Pas de portfolio</span>'}
                    </div>
                </div>

                <div class="pitch-box">
                    <strong>Message du candidat :</strong>
                    <p>"${this.escape(app.message)}"</p>
                </div>

                <div class="financial-breakdown">
                    <div class="row">
                        <span>Prétention Expert (Net)</span>
                        <strong>${app.expert_price}€</strong>
                    </div>
                    <div class="row total">
                        <span>Total à Payer (Vous)</span>
                        <strong class="highlight">${app.total_price}€</strong>
                    </div>
                    <small>Inclut 15% de frais de service plateforme.</small>
                </div>

                <div class="app-actions-row">
                    <button class="button-outline-danger" onclick="Marketplace.rejectApplication('${app.id}')">Refuser</button>
                    <button class="button-success" onclick="Marketplace.validateApplication('${app.id}')">✅ Valider & Recruter</button>
                </div>
            </div>
        `).join('');
    },

    // --- ACTIONS ---

    showPostForm() {
        // Check Authentication FIRST
        if (!Auth.isLoggedIn()) {
            if (typeof App !== 'undefined') {
                App.showNotification('Vous devez être connecté pour diffuser une offre.', 'error');
            }
            // Optionally redirect to auth
            setTimeout(() => {
                if (confirm('Vous devez créer un compte pour diffuser une offre. Rediriger vers l\'inscription ?')) {
                    window.location.href = '/auth.html';
                }
            }, 500);
            return;
        }

        // Check Limits
        const limits = App.checkFreemiumLimits();
        if (!limits.canAddMarketplaceResponse && !Storage.isPro()) {
            // Logic kept as is
        }

        const modal = document.getElementById('post-mission-modal');
        if (modal) {
            modal.style.display = 'flex';
            // Reset calculator
            document.getElementById('post-budget-input').value = '';
            this.updatePostCalc();
        }
    },

    closePostForm() {
        const modal = document.getElementById('post-mission-modal');
        if (modal) modal.style.display = 'none';
    },

    updatePostCalc() {
        const input = document.getElementById('post-budget-input');
        const net = parseFloat(input.value) || 0;
        const fees = net * this.COMMISSION_RATE;
        const total = net + fees;

        const feeEl = document.getElementById('post-fee-display');
        const budgetEl = document.getElementById('post-budget-display');
        const totalEl = document.getElementById('post-total-display');

        if (feeEl) feeEl.textContent = fees.toFixed(2) + ' €';
        if (budgetEl) budgetEl.textContent = net.toFixed(2) + ' €';
        if (totalEl) totalEl.textContent = total.toFixed(2) + ' €';
    },

    async submitMission(e) {
        e.preventDefault();

        // CRITICAL: Double-check authentication (fail-safe)
        if (!Auth.isLoggedIn()) {
            if (typeof App !== 'undefined') {
                App.showNotification('Session expirée. Veuillez vous reconnecter.', 'error');
            }
            this.closePostForm();
            return;
        }

        const output = e.target.querySelector('button[type="submit"]');
        output.disabled = true;
        output.textContent = 'Diffusion en cours...';

        const formData = new FormData(e.target);

        const mission = {
            title: formData.get('title'),
            budget: parseFloat(formData.get('budget')),
            description: formData.get('description'),
            zone: formData.get('zone'),
            status: 'open'
        };

        try {
            await Storage.addMission(mission);
            if (typeof App !== 'undefined') App.showNotification('Offre diffusée avec succès !', 'success');
            this.closePostForm();
            this.switchTab('mymissions');
            e.target.reset();
        } catch (err) {
            console.error(err);

            // Intelligent error handling for expired tokens
            if (err.message && err.message.includes('Invalid or expired token')) {
                if (typeof App !== 'undefined') {
                    App.showNotification('⚠️ Session expirée. Reconnexion nécessaire.', 'error');
                }

                // Auto-logout and redirect
                setTimeout(() => {
                    if (confirm('Votre session a expiré.\n\nCliquez OK pour vous reconnecter.')) {
                        // Clear expired token
                        localStorage.removeItem('sp_token');
                        localStorage.removeItem('sp_user');

                        // Redirect to auth
                        window.location.href = '/auth.html';
                    } else {
                        // Just reload to show logged-out state
                        window.location.reload();
                    }
                }, 500);
            } else {
                // Other errors
                if (typeof App !== 'undefined') App.showNotification('Erreur lors de la diffusion', 'error');
            }
        } finally {
            output.disabled = false;
            output.textContent = 'Diffuser l\'Offre';
        }
    },

    async deleteMission(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette offre de recrutement ?')) return;
        try {
            await Storage.deleteMission(id);
            if (typeof App !== 'undefined') App.showNotification('Offre supprimée', 'success');
            this.loadTabContent();
        } catch (e) {
            alert('Erreur: ' + e.message);
        }
    },

    // --- CANDIDATE ACTIONS ---

    openApplyForm(missionId, missionTitle) {
        // Check Authentication FIRST
        if (!Auth.isLoggedIn()) {
            if (typeof App !== 'undefined') {
                App.showNotification('Vous devez être connecté pour postuler.', 'error');
            }
            setTimeout(() => {
                if (confirm('Vous devez créer un compte pour postuler. Rediriger vers l\'inscription ?')) {
                    window.location.href = '/auth.html';
                }
            }, 500);
            return;
        }

        // Check Limits for Candidates
        const limits = App.checkFreemiumLimits();
        if (!limits.canAddMarketplaceResponse && !Storage.isPro()) {
            App.showUpgradeModal('marketplace_limit');
            return;
        }

        document.getElementById('apply-mission-id').value = missionId;
        document.getElementById('apply-mission-title').textContent = missionTitle;
        document.getElementById('apply-modal').style.display = 'flex';

        // Auto-fill
        if (typeof Auth !== 'undefined' && Auth.currentUser) {
            const nameInput = document.querySelector('input[name="applicant_name"]');
            if (nameInput && !nameInput.value) {
                nameInput.value = Auth.currentUser.user_metadata?.company || Auth.currentUser.user_metadata?.full_name || '';
            }
        }
    },

    closeApplyForm() { document.getElementById('apply-modal').style.display = 'none'; },

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
            total_price: total,
            status: 'pending'
        };

        try {
            await Storage.addApplication(application);
            if (typeof App !== 'undefined') App.showNotification('Candidature transmise au recruteur !', 'success');
            this.closeApplyForm();
            e.target.reset();
        } catch (err) {
            console.error(err);
            if (typeof App !== 'undefined') App.showNotification('Erreur d\'envoi', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Postuler';
        }
    },

    async validateApplication(id) {
        if (!confirm('Valider ce recrutement ?\nCela confirmera votre accord pour travailler avec cet expert.')) return;
        alert("✅ Recrutement Validé !");
        // Update Logic here
    },

    async rejectApplication(id) {
        if (!confirm('Refuser ce candidat ?')) return;
        // Update Logic here
        alert("Candidature refusée.");
    },

    // --- UPDATE CALC ---
    updateApplyCalc() {
        const input = document.getElementById('expert-price-input');
        const expertPrice = parseFloat(input.value) || 0;
        const fees = expertPrice * this.COMMISSION_RATE;
        const total = expertPrice + fees;

        document.getElementById('apply-fee').textContent = fees.toFixed(2) + ' €';
        document.getElementById('apply-total').textContent = total.toFixed(2) + ' €';
    },

    // --- MODALES (Job Board Style) ---

    renderModals() {
        return `
            <!-- POST FORM -->
            <div id="post-mission-modal" class="modal-overlay">
                <div class="modal-content glass" style="max-width: 600px;">
                    <button class="modal-close" onclick="Marketplace.closePostForm()">✕</button>
                    <h2>📢 Diffuser une Offre</h2>
                    
                    <form onsubmit="Marketplace.submitMission(event)">
                        <label>Titre de la Mission
                            <input type="text" name="title" required placeholder="Ex: Développeur React Freelance..." class="form-input">
                        </label>
                        
                        <div class="form-row">
                            <label>Budget "Net Expert" (€)
                                <input type="number" name="budget" id="post-budget-input" required placeholder="1000" class="form-input" oninput="Marketplace.updatePostCalc()" onkeyup="Marketplace.updatePostCalc()">
                                <small>Montant versé au freelance.</small>
                            </label>
                            <label>Zone
                                <select name="zone" class="form-input">
                                    <option>Outre-Mer</option>
                                    <option>Métropole</option>
                                    <option>Full Remote</option>
                                </select>
                            </label>
                        </div>
                        
                        <!-- Real-time Cost Preview for Client (Highlighted) -->
                        <div class="fee-calculator-box info-box" style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--primary); padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <div class="line" style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span class="text-muted">Budget Expert :</span>
                                <span id="post-budget-display" style="font-weight:bold;">0.00 €</span>
                            </div>
                             <div class="line" style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.9em;">
                                <span class="text-muted">+ Frais de Service (15%) :</span>
                                <span id="post-fee-display">0.00 €</span>
                            </div>
                            <div class="line total" style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border);">
                                <span style="font-size: 1.1em; color: var(--text);">💰 Total à Payer (Estimate) :</span>
                                <strong id="post-total-display" style="font-size: 1.4em; color: var(--primary);">0.00 €</strong>
                            </div>
                        </div>

                        <label>Description du besoin
                            <textarea name="description" required rows="4" class="form-input" placeholder="Détaillez votre besoin..."></textarea>
                        </label>
                        <button type="submit" class="button-primary full-width" style="font-size: 1.1rem; padding: 12px;">Diffuser l'Offre</button>
                    </form>
                </div>
            </div>

            <!-- APPLY FORM -->
            <div id="apply-modal" class="modal-overlay">
                <div class="modal-content glass">
                    <button class="modal-close" onclick="Marketplace.closeApplyForm()">✕</button>
                    <h2>⚡ Postuler à l'offre</h2>
                    <div class="mission-reminder" id="apply-mission-title" style="margin-bottom: 1rem; font-weight: bold; color: var(--primary);"></div>
                    
                    <form onsubmit="Marketplace.submitApplication(event)">
                        <input type="hidden" name="mission_id" id="apply-mission-id">
                        
                        <div class="form-row">
                            <label>Votre Nom / Agence
                                <input type="text" name="applicant_name" required placeholder="Votre Identité Pro" class="form-input">
                            </label>
                            <label>Lien Portfolio
                                <input type="url" name="portfolio_url" placeholder="https://..." class="form-input">
                            </label>
                        </div>

                        <label>Votre Pitch
                            <textarea name="message" required rows="4" class="form-input" placeholder="Bonjour, je suis l'expert qu'il vous faut car..."></textarea>
                        </label>
                         
                        <div class="fee-calculator-box" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <label>Votre Prétention (Net Vendeur)
                                <input type="number" name="expert_price" id="expert-price-input" required class="form-input" placeholder="Ex: 500" oninput="Marketplace.updateApplyCalc()" onkeyup="Marketplace.updateApplyCalc()">
                                <small>Ce que vous recevrez réellement.</small>
                            </label>
                            <div class="breakdown" style="margin-top: 10px; font-size: 0.9rem;">
                                <div class="line" style="display: flex; justify-content: space-between;">
                                    <span>+ Frais Client (15%):</span>
                                    <span id="apply-fee">0.00 €</span>
                                </div>
                                <div class="line total" style="display: flex; justify-content: space-between; margin-top: 5px; font-weight: bold; color: var(--text);">
                                    <span>Prix affiché au Client :</span>
                                    <span id="apply-total">0.00 €</span>
                                </div>
                            </div>
                        </div>

                        <button type="submit" class="button-primary full-width" style="margin-top:15px;">Envoyer ma Candidature</button>
                    </form>
                </div>
            </div>
        `;
    },

    escape(str) {
        if (!str) return '';
        return String(str).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
};

window.Marketplace = Marketplace;
