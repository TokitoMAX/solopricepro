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
                        <button class="nav-btn ${this.currentTab === 'mycandidatures' ? 'active' : ''}" onclick="Marketplace.switchTab('mycandidatures')">
                            <i class="fas fa-paper-plane"></i> Mes Candidatures
                            <span id="invitation-badge" class="notification-badge" style="display: none;"></span>
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
            else if (this.currentTab === 'mycandidatures') await this.renderMyCandidatures(container);
        } catch (err) {
            console.error(err);
            container.innerHTML = `<div class="error-box">Erreur: ${err.message}</div>`;
        }

        // Update invitation badge
        this.updateInvitationBadge();
    },

    async updateInvitationBadge() {
        try {
            const res = await fetch(`${Auth.apiBase}/api/marketplace/invitations`, {
                headers: { 'Authorization': `Bearer ${Auth.token}` }
            });
            if (!res.ok) return;

            const invitations = await res.json();
            const pendingCount = invitations.filter(inv =>
                inv.candidate_id === Auth.user?.id && inv.status === 'pending'
            ).length;

            const badge = document.getElementById('invitation-badge');
            if (badge) {
                if (pendingCount > 0) {
                    badge.textContent = pendingCount;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        } catch (err) {
            console.error('[BADGE] Error:', err);
        }
    },

    // --- VUES (LinkedIn Style) ---

    async renderRadar(container) {
        const missions = await Storage.getPublicMissions();
        const currentUser = Auth.getUser();

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

        container.innerHTML = sorted.map(m => {
            const isOwner = currentUser && String(m.user_id) === String(currentUser.id);

            const createdAt = m.createdAt || m.created_at; // Flexibility for schema inconsistency
            const d = new Date(createdAt);
            const dateStr = (createdAt && !isNaN(d)) ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : 'Récemment';

            const companyName = m.poster_company || m.poster_name || 'Entreprise';

            return `
                <article class="feed-item glass" id="mission-${m.id}">
                    <div class="feed-item-header">
                        <div class="author-avatar">${this.escape(companyName[0]) || '🏢'}</div>
                        <div class="author-meta">
                            <strong>${this.escape(companyName)}</strong>
                            <span>Mission diffusée le ${dateStr}</span>
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
                        <div class="price-pill">
                            <span class="label">Coût Client (Total)</span>
                            <span class="value">${(parseFloat(m.budget) * (1 + this.COMMISSION_RATE)).toFixed(0)}€</span>
                        </div>
                    </div>

                    <div class="feed-item-actions">
                        ${isOwner ? `
                            <button onclick="Marketplace.deleteMission('${m.id}')" class="action-btn danger">
                                <i class="fas fa-trash"></i> Supprimer
                            </button>
                            <button class="action-btn" onclick="App.showNotification('Édition bientôt disponible', 'info')">
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                        ` : `
                            <button onclick="Marketplace.openApplyForm('${m.id}', '${this.escape(m.title)}')" class="action-btn primary">
                                <i class="fas fa-paper-plane"></i> Postuler / Contacter
                            </button>
                        `}
                    </div>
                </article>
            `;
        }).join('');
    },

    async renderMyMissions(container) {
        // Nécessite l'utilisateur connecté
        const user = (typeof Auth !== 'undefined') ? Auth.user : null;
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

    async renderMyCandidatures(container) {
        try {
            const allApps = Storage.get(Storage.KEYS.MARKETPLACE_APPLICATIONS) || [];
            const myApps = allApps.filter(app => app.message && app.message.includes(Auth.user?.email));

            const res = await fetch(`${Auth.apiBase}/api/marketplace/invitations`, {
                headers: { 'Authorization': `Bearer ${Auth.token}` }
            });

            let invitations = [];
            if (res.ok) {
                const allInvites = await res.json();
                invitations = allInvites.filter(inv => inv.candidate_id === Auth.user?.id);
            }

            const appDetails = myApps.map(app => {
                const invitation = invitations.find(inv => inv.application_id === app.id);
                return { ...app, invitation };
            });

            if (appDetails.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📄</div>
                        <p>Vous n'avez encore postulé à aucune mission</p>
                        <button onclick="Marketplace.switchTab('radar')" class="button-primary">Découvrir les opportunités</button>
                    </div>`;
                return;
            }

            container.innerHTML = appDetails.map(app => {
                const statusClass = app.status || 'pending';
                const statusLabel = { 'pending': '⏳ En attente', 'accepted': '✅ Retenue', 'rejected': '❌ Refusée' }[statusClass] || statusClass;

                let invitationSection = '';
                if (app.invitation) {
                    const inv = app.invitation;
                    const slots = inv.proposed_slots || [];

                    invitationSection = `
                        <div class="invitation-section" style="background: rgba(0,200,100,0.1); padding: 15px; border-radius: 8px; margin-top: 10px;">
                            <h4 style="margin: 0 0 10px 0; color: var(--success);">📅 Invitation à un Entretien</h4>
                            <p style="white-space: pre-wrap; font-size: 0.9rem; margin-bottom: 15px;">${this.escape(inv.message)}</p>
                            
                            ${inv.status === 'pending' ? `
                                <div class="slot-picker">
                                    <label style="display: block; margin-bottom: 10px; font-weight: bold;">Choisissez un créneau:</label>
                                    ${slots.map((slot, idx) => `
                                        <label style="display: block; margin: 5px 0; cursor: pointer;">
                                            <input type="radio" name="selected-slot-${app.id}" value="${idx}" style="margin-right: 8px;">
                                            📅 ${new Date(slot.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${slot.time}
                                        </label>
                                    `).join('')}
                                    <textarea id="response-${app.id}" placeholder="Votre message (optionnel)" class="form-input" rows="2" style="margin-top: 10px;"></textarea>
                                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                                        <button onclick="Marketplace.respondToInvitation('${inv.id}', '${app.id}', true)" class="button-primary">✅ Accepter ce créneau</button>
                                        <button onclick="Marketplace.respondToInvitation('${inv.id}', '${app.id}', false)" class="button-secondary">❌ Décliner poliment</button>
                                    </div>
                                </div>
                            ` : `
                                <div class="invitation-status" style="padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px;">
                                    <strong>Statut:</strong> ${inv.status === 'confirmed' ? '✅ Entretien confirmé' : inv.status === 'declined' ? '❌ Déclinée' : inv.status}
                                    ${inv.selected_slot ? `<br><strong>Créneau choisi:</strong> ${new Date(inv.selected_slot.date).toLocaleDateString('fr-FR')} à ${inv.selected_slot.time}` : ''}
                                    ${inv.candidate_response ? `<br><strong>Votre message:</strong> ${this.escape(inv.candidate_response)}` : ''}
                                </div>
                            `}
                        </div>
                    `;
                }

                return `
                    <div class="application-card glass" style="margin-bottom: 20px;">
                        <div class="app-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div>
                                <h3 style="margin: 0;">${this.escape(app.mission_title || 'Mission')}</h3>
                                <span class="status-pill ${statusClass}" style="font-size: 0.85rem; margin-top: 5px; display: inline-block;">${statusLabel}</span>
                            </div>
                            <div style="text-align: right;">
                                <strong style="font-size: 1.2rem; color: var(--primary);">${app.proposed_price}€</strong>
                                <small style="display: block; opacity: 0.7;">Votre proposition</small>
                            </div>
                        </div>
                        ${invitationSection}
                    </div>
                `;
            }).join('');

        } catch (err) {
            console.error('[MYCANDIDATURES] Error:', err);
            container.innerHTML = `<div class="error-box">Erreur lors du chargement de vos candidatures</div>`;
        }
    },

    async respondToInvitation(invitationId, appId, accept) {
        try {
            const selectedSlotInput = document.querySelector(`input[name="selected-slot-${appId}"]:checked`);

            if (accept && !selectedSlotInput) {
                App.showNotification('Veuillez choisir un créneau', 'warning');
                return;
            }

            const response = document.getElementById(`response-${appId}`)?.value || '';

            let updateData = { candidate_response: response };

            if (accept) {
                const slotIdx = parseInt(selectedSlotInput.value);
                const res = await fetch(`${Auth.apiBase}/api/marketplace/invitations`, {
                    headers: { 'Authorization': `Bearer ${Auth.token}` }
                });
                const invitations = await res.json();
                const invitation = invitations.find(inv => inv.id === invitationId);

                if (invitation && invitation.proposed_slots[slotIdx]) {
                    updateData.selected_slot = invitation.proposed_slots[slotIdx];
                    updateData.status = 'confirmed';
                }
            } else {
                updateData.status = 'declined';
            }

            const updateRes = await fetch(`${Auth.apiBase}/api/marketplace/invitations/${invitationId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.token}`
                },
                body: JSON.stringify(updateData)
            });

            if (!updateRes.ok) throw new Error('Erreur serveur');

            App.showNotification(accept ? '✅ Entretien confirmé !' : 'Réponse envoyée', 'success');
            this.render(); // Refresh view
        } catch (err) {
            console.error(err);
            App.showNotification('Erreur lors de la réponse', 'error');
        }
    },

    async renderInbox(container) {
        // Fetch Inbox Data
        const inbox = await Storage.getInbox();

        if (!inbox || inbox.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📥</div>
                    <h3>Inbox Vide</h3>
                    <p>Aucune candidature reçue pour vos ordres de mission.</p>
                </div>`;
            return;
        }

        container.innerHTML = inbox.map(app => {
            const statusClass = app.status || 'pending';
            const statusLabel = statusClass === 'pending' ? 'En attente' : (statusClass === 'accepted' ? 'Validé' : 'Refusé');

            const price = app.proposed_price || app.total_price || 0;
            const dateVal = app.created_at || app.createdAt;

            return `
                <div class="application-card glass ${statusClass}">
                    <div class="app-header-row">
                        <span class="app-mission-ref">Mission: <strong>${this.escape(app.mission_title)}</strong></span>
                        <span class="status-pill ${statusClass}">${statusLabel}</span>
                    </div>
                    
                    <div class="candidate-profile-row">
                        <div class="candidate-avatar">👤</div>
                        <div class="candidate-meta">
                            <div class="candidate-name-row">
                                <strong>Candidat sur le réseau</strong>
                            </div>
                            <div class="candidate-contact-info">
                                <span class="hint-text">Détails de contact dans le pitch ci-dessous</span>
                            </div>
                        </div>
                    </div>

                    <div class="pitch-content">
                        <div class="pitch-text">${this.escape(app.message).replace(/\n/g, '<br>')}</div>
                    </div>

                    <div class="app-footer-grid">
                        <div class="financial-summary">
                            <div class="fin-row total">
                                <span class="label">Proposition Finale</span>
                                <span class="value">${price}€</span>
                            </div>
                        </div>
                        
                        <div class="inbox-actions">
                            ${statusClass === 'pending' ? `
                                <button class="action-btn danger-text" onclick="Marketplace.rejectApplication('${app.id}')">
                                    <i class="fas fa-times"></i> Écarter
                                </button>
                                <button class="action-btn success-text" onclick="Marketplace.validateApplication('${app.id}')">
                                    <i class="fas fa-check-circle"></i> Retenir & Contacter
                                </button>
                            ` : `
                                <span class="status-summary">Dossier ${statusLabel.toLowerCase()}</span>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
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
            status: 'open',
            // Correct columns found in line-check.js
            poster_name: Auth.user?.user_metadata?.full_name || 'Anonyme',
            poster_company: Auth.user?.company?.name || Auth.user?.user_metadata?.company_name || 'Entreprise',
            contact: Auth.user?.email || ''
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

    async deleteMission(id) {
        if (!confirm('Voulez-vous vraiment supprimer cette offre ?')) return;

        try {
            await Storage.delete('sp_marketplace_missions', id);
            App.showNotification('Offre supprimée avec succès', 'success');
            // Refresh Feed
            this.render();
        } catch (err) {
            console.error(err);
            App.showNotification('Erreur lors de la suppression', 'error');
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
        if (typeof Auth !== 'undefined' && Auth.user) {
            const nameInput = document.querySelector('input[name="applicant_name"]');
            if (nameInput && !nameInput.value) {
                nameInput.value = Auth.user.user_metadata?.company || Auth.user.user_metadata?.full_name || '';
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
        const totalPrice = parseFloat(formData.get('total_price'));
        const fees = expertPrice * this.COMMISSION_RATE;
        const total = expertPrice + fees;

        const application = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : this.generateFailsafeId(),
            mission_id: formData.get('mission_id'),
            // PACKING EVERYTHING into message because the table schema has No applicant_name column
            message: `CANDIDAT: ${formData.get('applicant_name') || 'Anonyme'}\n` +
                `EMAIL: ${Auth.user?.email || 'N/A'}\n` +
                `TEL: ${Auth.user?.company?.phone || Auth.user?.user_metadata?.phone || 'N/A'}\n` +
                `PORTFOLIO: ${formData.get('portfolio_url') || 'Non renseigné'}\n\n` +
                `MESSAGE:\n${formData.get('message')}`,
            proposed_price: total,
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

    async validateApplication(appId) {
        // Open interview invitation modal instead of direct validation
        this.openInterviewModal(appId);
    },

    openInterviewModal(appId) {
        const app = this.getApplicationById(appId);
        if (!app) {
            App.showNotification('Candidature introuvable', 'error');
            return;
        }

        // Parse candidate info from message
        const candidateInfo = this.parseApplicationMessage(app.message);

        // Populate modal
        document.getElementById('interview-app-id').value = appId;
        document.getElementById('interview-candidate-id').value = candidateInfo.userId || app.user_id;
        document.getElementById('interview-candidate-name').textContent = candidateInfo.name || 'Candidat';
        document.getElementById('interview-mission-title').textContent = app.mission_title || 'Mission';
        document.getElementById('interview-price').textContent = app.proposed_price + '€';
        document.getElementById('interview-pitch').textContent = candidateInfo.pitch || app.message;

        // Pre-fill message template
        const defaultMessage = `Bonjour ${candidateInfo.name || ''},\n\nNous avons le plaisir de vous informer que votre candidature pour "${app.mission_title}" a retenu notre attention.\n\nNous souhaitons vous rencontrer pour échanger sur cette opportunité. Merci de choisir l'un des créneaux ci-dessous qui vous conviendrait le mieux.\n\nCordialement`;
        document.getElementById('interview-message').value = defaultMessage;

        // Show modal
        document.getElementById('interview-modal').style.display = 'flex';
    },

    closeInterviewModal() {
        document.getElementById('interview-modal').style.display = 'none';
    },

    parseApplicationMessage(message) {
        // Extract structured data from packed message
        const lines = message.split('\n');
        const info = { pitch: '' };

        lines.forEach(line => {
            if (line.startsWith('CANDIDAT:')) info.name = line.replace('CANDIDAT:', '').trim();
            else if (line.startsWith('EMAIL:')) info.email = line.replace('EMAIL:', '').trim();
            else if (line.startsWith('TEL:')) info.phone = line.replace('TEL:', '').trim();
            else if (line.startsWith('PORTFOLIO:')) info.portfolio = line.replace('PORTFOLIO:', '').trim();
            else if (line.startsWith('MESSAGE:')) {
                const idx = lines.indexOf(line);
                info.pitch = lines.slice(idx + 1).join('\n').trim();
            }
        });

        return info;
    },

    getApplicationById(appId) {
        const inbox = Storage.get(Storage.KEYS.MARKETPLACE_APPLICATIONS) || [];
        return inbox.find(app => app.id === appId);
    },

    async sendInterviewInvitation(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Envoi...';

        const formData = new FormData(e.target);
        const appId = formData.get('application_id');
        const candidateId = formData.get('candidate_id');
        const message = formData.get('message');

        // Gather slots
        const slots = [];
        for (let i = 1; i <= 3; i++) {
            const date = formData.get(`slot${i}_date`);
            const time = formData.get(`slot${i}_time`);
            if (date && time) {
                slots.push({ date, time, duration: '60min' });
            }
        }

        if (slots.length === 0) {
            App.showNotification('Veuillez proposer au moins un créneau', 'warning');
            btn.disabled = false;
            btn.textContent = 'Envoyer l\'Invitation';
            return;
        }

        try {
            const res = await fetch(`${Auth.apiBase}/api/marketplace/invitations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.token}`
                },
                body: JSON.stringify({
                    application_id: appId,
                    candidate_id: candidateId,
                    message,
                    proposed_slots: slots
                })
            });

            if (!res.ok) throw new Error('Erreur serveur');

            // Mark application as accepted
            await Storage.update(Storage.KEYS.MARKETPLACE_APPLICATIONS, appId, { status: 'accepted' });

            App.showNotification('✅ Invitation envoyée avec succès !', 'success');
            this.closeInterviewModal();
            this.render(); // Refresh
        } catch (err) {
            console.error(err);
            App.showNotification('Erreur lors de l\'envoi', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Envoyer l\'Invitation';
        }
    },

    async rejectApplication(id) {
        if (!confirm('Souhaitez-vous écarter ce candidat ?')) return;

        try {
            await Storage.update(Storage.KEYS.MARKETPLACE_APPLICATIONS, id, { status: 'rejected' });
            if (typeof App !== 'undefined') App.showNotification('Candidature écartée.', 'info');
            this.render(); // Refresh UI
        } catch (err) {
            console.error(err);
            if (typeof App !== 'undefined') App.showNotification('Erreur de mise à jour', 'error');
        }
    },

    // --- UPDATE CALC (Simplified v4.9.2) ---
    updateApplyCalc() {
        const input = document.getElementById('total-price-input');
        const totalPrice = parseFloat(input.value) || 0;
        const netEarnings = totalPrice * 0.85; // 15% platform fee

        document.getElementById('apply-net').textContent = netEarnings.toFixed(2) + ' €';
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
                            <label>Zone Géographique
                                <select name="zone" class="form-input">
                                    <option>Outre-Mer</option>
                                    <option>Métropole</option>
                                    <option>Diaspora</option>
                                    <option>International</option>
                                </select>
                            </label>
                        </div>
                        
                        <!-- Real-time Cost Preview for Client (Highlighted) -->
                        <div class="fee-calculator-box info-box" style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--primary); padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <div class="line" style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span class="text-muted">Paiement 1 (Expert) :</span>
                                <strong id="post-budget-display">0.00 €</strong>
                            </div>
                             <div class="line" style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.9em;">
                                <span class="text-muted">Paiement 2 (Commission Plateforme 15%) :</span>
                                <span id="post-fee-display">0.00 €</span>
                            </div>
                            <div class="line total" style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border);">
                                <span style="font-size: 1.1em; color: var(--text);">💰 Coût Total de l'Opération :</span>
                                <strong id="post-total-display" style="font-size: 1.4em; color: var(--primary);">0.00 €</strong>
                            </div>
                        </div>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 15px;">
                            <i class="fas fa-info-circle"></i> En publiant, vous acceptez de verser deux règlements distincts si vous recrutez via la plateforme.
                        </p>

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
                            <label>Votre Proposition (Tout Compris)
                                <input type="number" name="total_price" id="total-price-input" required class="form-input" placeholder="Ex: 600" oninput="Marketplace.updateApplyCalc()" onkeyup="Marketplace.updateApplyCalc()">
                                <small>Prix global que le client devra payer.</small>
                            </label>
                            <div class="breakdown" style="margin-top: 10px; font-size: 0.9rem; opacity: 0.7;">
                                <div class="line" style="display: flex; justify-content: space-between;">
                                    <span>💡 Vous recevrez environ (~85%) :</span>
                                    <span id="apply-net">0.00 €</span>
                                </div>
                                <small style="display: block; margin-top: 8px; font-size: 0.85rem; color: var(--text-secondary);">Après déduction des frais de plateforme (15%).</small>
                            </div>
                        </div>

                        <button type="submit" class="button-primary full-width" style="margin-top:15px;">Envoyer ma Candidature</button>
                    </form>
                </div>
            </div>

            <!-- INTERVIEW INVITATION MODAL -->
            <div id="interview-modal" class="modal-overlay">
                <div class="modal-content glass" style="max-width: 700px;">
                    <button class="modal-close" onclick="Marketplace.closeInterviewModal()">✕</button>
                    <h2>📅 Inviter à un Entretien</h2>
                    
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 0.9rem;">
                            <div>
                                <strong>Candidat:</strong> <span id="interview-candidate-name"></span>
                            </div>
                            <div>
                                <strong>Prix proposé:</strong> <span id="interview-price"></span>
                            </div>
                        </div>
                        <div style="margin-top: 10px;">
                            <strong>Mission:</strong> <span id="interview-mission-title"></span>
                        </div>
                        <div style="margin-top: 10px; font-size: 0.85rem; opacity: 0.7;">
                            <strong>Pitch:</strong>
                            <p id="interview-pitch" style="margin: 5px 0; white-space: pre-wrap;"></p>
                        </div>
                    </div>

                    <form onsubmit="Marketplace.sendInterviewInvitation(event)">
                        <input type="hidden" name="application_id" id="interview-app-id">
                        <input type="hidden" name="candidate_id" id="interview-candidate-id">

                        <label>Votre Message d'Invitation
                            <textarea name="message" id="interview-message" rows="5" class="form-input" required></textarea>
                        </label>

                        <h3 style="margin-top: 20px; margin-bottom: 10px;">Proposer des Créneaux</h3>
                        <small style="display: block; margin-bottom: 15px; opacity: 0.7;">Le candidat choisira celui qui lui convient le mieux.</small>

                        <div style="display: grid; gap: 12px;">
                            <div class="slot-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <input type="date" name="slot1_date" class="form-input" required>
                                <input type="time" name="slot1_time" class="form-input" required>
                            </div>
                            <div class="slot-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <input type="date" name="slot2_date" class="form-input">
                                <input type="time" name="slot2_time" class="form-input">
                            </div>
                            <div class="slot-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <input type="date" name="slot3_date" class="form-input">
                                <input type="time" name="slot3_time" class="form-input">
                            </div>
                        </div>

                        <button type="submit" class="button-primary full-width" style="margin-top: 20px;">📩 Envoyer l'Invitation</button>
                    </form>
                </div>
            </div>
        `;
    },

    generateFailsafeId() {
        return Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
    },

    escape(str) {
        if (!str) return '';
        return String(str).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
};

window.Marketplace = Marketplace;
