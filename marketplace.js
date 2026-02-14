/**
 * SoloPrice Pro - Marketplace v4.4 (Job Board UI & Strict Roles)
 * - Roles: Recruteur (Client) vs Candidat (Talent)
 * - UI: Job Cards, Clear Actions, "Black Screen" fix
 * - Terminology: "Diffuser une Offre" / "Postuler"
 */
console.log('[MARKETPLACE-v4.4-UX] Module Initializing...');

const Marketplace = {
    // Configuration
    COMMISSION_RATE: 0.15, // 15% Add-on
    currentTab: 'radar',
    inboxCache: [], // [NEW] Cache for recruiter applications

    // Rendu Principal
    render(containerId = 'marketplace-root') {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.init(); // Start polling & background tasks

        container.innerHTML = `
            <div class="marketplace-feed-container">
                <!-- Sidebar (User Info / Quick Actions) -->
                <aside class="marketplace-sidebar">
                    <div class="user-quick-card glass">
                        <div class="user-banner"></div>
                        <div class="user-avatar-circle">${Auth.user?.email?.[0].toUpperCase() || 'U'}</div>
                        <div class="user-info">
                            <h3>${Auth.user?.company?.name || Auth.user?.email || 'Visiteur'}</h3>
                            <p>${Auth.user?.isPro ? 'Membre Pro' : 'Membre Standard'}</p>
                        </div>
                        <div class="user-stats">
                            <div class="stat">
                                <span>Prix de la Mission :</span>
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
                        <div class="author-avatar">${this.escape(companyName[0]) || 'M'}</div>
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
                    <div class="icon"><i class="fas fa-briefcase" style="font-size: 3rem; opacity: 0.3;"></i></div>
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
                         Supprimer l'offre
                     </button>
                </div>
            </div>
        `).join('');
    },

    async renderMyCandidatures(container) {
        try {
            const allApps = Storage.get(Storage.KEYS.MARKETPLACE_APPLICATIONS) || [];
            const myApps = allApps.filter(app => app.applicant_id === Auth.user?.id);
            const invitations = Storage.get(Storage.KEYS.MARKETPLACE_INVITATIONS) || [];

            // Identify priority invitations (Pending/Unanswered)
            const myInvitations = invitations.filter(inv => inv.candidate_id === Auth.user?.id);
            const pendingInvites = myInvitations.filter(inv => inv.status === 'pending');

            let html = '';

            // 1. TOP SECTION: PRIORITY INVITATIONS
            if (pendingInvites.length > 0) {
                html += `
                    <div class="marketplace-priority-alert glass" style="margin-bottom: 30px; border-left: 4px solid var(--primary);">
                        <div style="padding: 20px;">
                            <h2 style="margin: 0 0 10px 0; color: var(--primary-light); display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-calendar-star"></i> 
                                Vous avez ${pendingInvites.length} invitation(s) en attente !
                            </h2>
                            <p style="opacity: 0.8; margin-bottom: 20px;">Des recruteurs souhaitent vous rencontrer. Choisissez un créneau pour confirmer l'entretien.</p>
                            
                            <div class="pending-invitations-list" style="display: grid; gap: 15px;">
                                ${pendingInvites.map(inv => {
                    const app = myApps.find(a => a.id === inv.application_id);
                    const missionTitle = inv.application?.mission?.title || app?.mission_title || 'Mission';
                    const slots = inv.proposed_slots || [];

                    return `
                                        <div class="invitation-card-premium glass" style="background: rgba(16, 185, 129, 0.05); border: 1px solid var(--primary-glass); padding: 20px; border-radius: 12px;">
                                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                                                <div>
                                                    <h3 style="margin: 0; font-size: 1.1rem;">${this.escape(missionTitle)}</h3>
                                                    <span style="font-size: 0.8rem; opacity: 0.6;">Invitation reçue le ${new Date(inv.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div class="price-tag" style="background: var(--primary); color: white; padding: 4px 10px; border-radius: 6px; font-weight: bold;">
                                                    ${inv.application?.proposed_price || app?.proposed_price || '?'}€
                                                </div>
                                            </div>
                                            
                                            <p class="invitation-msg" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; font-size: 0.95rem; margin-bottom: 20px; border-left: 2px solid var(--primary-light);">
                                                "${this.escape(inv.message)}"
                                            </p>

                                            <div class="slot-response-area">
                                                <h4 style="margin-bottom: 15px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7;">Disponibilités proposées :</h4>
                                                <div class="slots-selector" style="display: grid; gap: 10px; margin-bottom: 20px;">
                                                    ${slots.map((slot, idx) => `
                                                        <label class="slot-option-premium">
                                                            <input type="radio" name="slot-choice-${inv.id}" value="${idx}">
                                                            <div class="slot-box">
                                                                <i class="far fa-calendar-alt"></i>
                                                                <span>${new Date(slot.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                                                <i class="far fa-clock" style="margin-left: 10px;"></i>
                                                                <strong>${slot.time}</strong>
                                                            </div>
                                                        </label>
                                                    `).join('')}
                                                </div>
                                                
                                                <div class="action-footer" style="display: flex; gap: 10px; align-items: stretch; flex-direction: column;">
                                                    <textarea id="reply-msg-${inv.id}" placeholder="Un petit mot pour le recruteur... (Ex: 'Disponible plus tôt', 'Plus possible mardi')" class="form-input" style="flex: 1; min-height: 80px; padding: 10px;"></textarea>
                                                    <div style="display: flex; gap: 10px;">
                                                        <button onclick="Marketplace.respondToInvitation('${inv.id}', '${inv.application_id}', false)" class="button-secondary" style="flex: 1; padding: 12px;">
                                                            <i class="fas fa-calendar-times"></i> Décliner / Autre créneau
                                                        </button>
                                                        <button onclick="Marketplace.respondToInvitation('${inv.id}', '${inv.application_id}', true)" class="button-primary" style="flex: 2; padding: 12px;">
                                                            <i class="fas fa-check"></i> Confirmer cet entretien
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                }).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }

            // 2. MAIN FEED: ALL CANDIDATURES
            if (myApps.length === 0) {
                html += `
                    <div class="empty-state">
                        <div class="icon"><i class="fas fa-file-alt" style="font-size: 3rem; opacity: 0.3;"></i></div>
                        <p>Vous n'avez encore postulé à aucune mission</p>
                        <button onclick="Marketplace.switchTab('radar')" class="button-primary">Découvrir les opportunités</button>
                    </div>`;
            } else {
                html += `<h2 style="margin: 20px 0 15px 0; font-size: 1.2rem; opacity: 0.8;">Suivi de mes candidatures</h2>`;
                html += myApps.map(app => {
                    const invitation = myInvitations.find(inv => inv.application_id === app.id);
                    const statusClass = app.status || 'pending';
                    const statusLabel = {
                        'pending': 'En attente',
                        'accepted': 'Retenue',
                        'rejected': 'Refusée',
                        'hired': '🎉 RECRUTÉ !'
                    }[statusClass] || statusClass;

                    let invStatusDisplay = '';
                    if (statusClass === 'hired') {
                        invStatusDisplay = `
                            <div class="hired-announcement glass" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1)); border: 2px solid var(--primary); padding: 20px; border-radius: 12px; margin-top: 15px; text-align: center; animation: pulse-glow 2s infinite;">
                                <h3 style="color: var(--primary-light); margin: 0 0 10px 0; font-size: 1.3rem;">🎊 Félicitations ! 🎊</h3>
                                <p style="font-weight: bold; margin: 0;">Votre candidature a été retenue par le recruteur.</p>
                                <p style="font-size: 0.9rem; opacity: 0.8; margin-top: 5px;">Le client va vous contacter prochainement pour les modalités opérationnelles.</p>
                            </div>
                        `;
                    } else if (invitation) {
                        if (invitation.status === 'confirmed') {
                            invStatusDisplay = `
                                <div class="confirmed-badge" style="background: var(--primary-glass); color: var(--primary-light); padding: 10px; border-radius: 8px; margin-top: 10px; display: flex; align-items: center; gap: 10px;">
                                    <i class="fas fa-check-circle"></i>
                                    <span>Entretien confirmé : <strong>${new Date(invitation.selected_slot.date).toLocaleDateString()} à ${invitation.selected_slot.time}</strong></span>
                                </div>
                            `;
                        } else if (invitation.status === 'declined') {
                            invStatusDisplay = `<div style="margin-top: 10px; opacity: 0.6; font-size: 0.85rem; background: rgba(239, 68, 68, 0.1); padding: 8px; border-radius: 6px;">
                                <i class="fas fa-info-circle"></i> Vous avez décliné cette invitation / demandé un changement de créneau.
                                ${invitation.candidate_response ? `<div style="font-style: italic; margin-top: 4px;">"${this.escape(invitation.candidate_response)}"</div>` : ''}
                            </div>`;
                        }
                    }

                    return `
                        <div class="application-card glass ${statusClass}" style="margin-bottom: 25px; border-left: 4px solid ${statusClass === 'hired' ? 'var(--primary)' : statusClass === 'rejected' ? 'var(--danger)' : 'transparent'};">
                            <div class="app-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <div>
                                    <h3 style="margin: 0; font-size: 1.1rem;">${this.escape(app.mission_title || 'Mission')}</h3>
                                    <span class="status-pill ${statusClass}" style="font-size: 0.8rem; margin-top: 5px; display: inline-block;">${statusLabel}</span>
                                </div>
                                <div style="text-align: right;">
                                    <strong style="color: var(--primary); font-size: 1.2rem;">${app.proposed_price || '?'}€</strong>
                                    <small style="display: block; opacity: 0.6; font-size: 0.7rem;">Ma proposition</small>
                                </div>
                            </div>
                            ${invStatusDisplay}
                        </div>
                    `;
                }).join('');
            }

            container.innerHTML = `<div class="my-candidatures-wrapper">${html}</div>`;

        } catch (err) {
            console.error('[MYCANDIDATURES] Error:', err);
            container.innerHTML = `<div class="error-box">Erreur lors du chargement de vos candidatures</div>`;
        }
    },

    async respondToInvitation(invitationId, appId, accept) {
        try {
            // New logic: Check for new premium IDs first, then fallback to old ones
            const selectedSlotInput = document.querySelector(`input[name="slot-choice-${invitationId}"]:checked`)
                || document.querySelector(`input[name="selected-slot-${appId}"]:checked`);

            if (accept && !selectedSlotInput) {
                App.showNotification('Veuillez choisir un créneau', 'warning');
                return;
            }

            const response = document.getElementById(`reply-msg-${invitationId}`)?.value
                || document.getElementById(`response-${appId}`)?.value
                || '';

            let updateData = { candidate_response: response };

            if (accept) {
                const slotIdx = parseInt(selectedSlotInput.value);

                // Fetch invitation data carefully
                const res = await fetch(`${Auth.apiBase}/api/marketplace/invitations`, {
                    headers: { 'Authorization': `Bearer ${Auth.token}` }
                });
                if (!res.ok) throw new Error('Fetch failed');

                const invitations = await res.json();
                const invitation = invitations.find(inv => inv.id === invitationId);

                if (invitation && invitation.proposed_slots && invitation.proposed_slots[slotIdx]) {
                    updateData.selected_slot = invitation.proposed_slots[slotIdx];
                    updateData.status = 'confirmed';
                } else {
                    throw new Error('Créneau invalide');
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

            if (!updateRes.ok) throw new Error('Erreur serveur lors de la mise à jour');

            App.showNotification(accept ? 'Entretien confirmé !' : 'Réponse envoyée', 'success');

            // Sync before refreshing UI to ensure data is up to date
            await Storage.fetchAllData();
            this.render(); // Refresh view
        } catch (err) {
            console.error('[RESPOND] Error:', err);
            App.showNotification(err.message || 'Erreur lors de la réponse', 'error');
        }
    },

    async renderInbox(container) {
        // Fetch Inbox Data
        const inbox = await Storage.getInbox();
        this.inboxCache = inbox || []; // Update local cache for direct lookups

        if (!inbox || inbox.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon"><i class="fas fa-user-clock" style="font-size: 3rem; opacity: 0.3;"></i></div>
                    <h3>Inbox Vide</h3>
                    <p>Aucune candidature reçue pour vos ordres de mission.</p>
                </div>`;
            return;
        }

        container.innerHTML = inbox.map(app => {
            const statusClass = app.status || 'pending';
            const statusLabel = {
                'pending': 'En attente',
                'accepted': 'Retenue',
                'rejected': 'Refusée',
                'hired': '✅ Recruté !'
            }[statusClass] || statusClass;

            const price = app.proposed_price || app.total_price || 0;
            const invitation = app.invitations?.[0]; // Get joined invitation from updated backend

            let workflowHtml = '';

            // 1. GESTION DES INVITATIONS / ÉTAPE ENTRETIEN
            if (invitation) {
                if (invitation.status === 'confirmed') {
                    workflowHtml = `
                        <div class="workflow-step confirmed" style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--primary); padding: 15px; border-radius: 8px; margin-top: 15px;">
                            <h4 style="color: var(--primary-light); margin: 0 0 5px 0;"><i class="fas fa-calendar-check"></i> Entretien Confirmé !</h4>
                            <p style="font-size: 0.9rem; margin-bottom: 10px;">Le candidat a accepté le créneau du <strong>${new Date(invitation.selected_slot.date).toLocaleDateString()} à ${invitation.selected_slot.time}</strong>.</p>
                            ${invitation.candidate_response ? `<p style="font-style: italic; font-size: 0.85rem; opacity: 0.8; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px;">"${invitation.candidate_response}"</p>` : ''}
                            <button class="button-primary full-width" onclick="Marketplace.finalizeRecruitment('${app.id}', '${app.mission_id}')" style="margin-top: 10px; font-weight: bold;">
                                <i class="fas fa-handshake"></i> Valider définitivement le recrutement
                            </button>
                        </div>
                    `;
                } else if (invitation.status === 'declined') {
                    workflowHtml = `
                        <div class="workflow-step declined" style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); padding: 15px; border-radius: 8px; margin-top: 15px;">
                            <h4 style="color: var(--danger); margin: 0 0 5px 0;"><i class="fas fa-calendar-times"></i> Invitation déclinée</h4>
                            <p style="font-size: 0.9rem; margin-bottom: 10px;">Le candidat a décliné ces créneaux ou souhaite un changement.</p>
                            ${invitation.candidate_response ? `<p style="font-style: italic; font-size: 0.85rem; opacity: 0.8; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px;">"${invitation.candidate_response}"</p>` : ''}
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button class="button-secondary" style="flex: 1;" onclick="Marketplace.openInterviewModal('${app.id}')">
                                    <i class="fas fa-calendar-plus"></i> Proposer d'autres créneaux
                                </button>
                                <button class="button-primary" style="flex: 1;" onclick="Marketplace.finalizeRecruitment('${app.id}', '${app.mission_id}')">
                                    <i class="fas fa-handshake"></i> Recruter quand même
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    workflowHtml = `
                        <div class="workflow-step pending" style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border); padding: 12px; border-radius: 8px; margin-top: 15px; font-size: 0.9rem;">
                            <i class="fas fa-hourglass-half"></i> Invitation envoyée. En attente de réponse du candidat...
                        </div>
                    `;
                    workflowHtml = `
                    <div class="workflow-step pending" style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border); padding: 12px; border-radius: 8px; margin-top: 15px; font-size: 0.9rem;">
                        <i class="fas fa-hourglass-half"></i> Invitation envoyée. En attente de réponse du candidat...
                    </div>
                `;
                }
            } else if (statusClass === 'pending') {
                // ACTIONS INITIALES : Proposer entretien OU Recruter directement
                workflowHtml = `
                    <div class="workflow-actions-initial" style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button class="button-secondary" onclick="Marketplace.validateApplication('${app.id}')">
                            <i class="fas fa-calendar-alt"></i> Proposer un entretien
                        </button>
                        <button class="button-primary" onclick="Marketplace.finalizeRecruitment('${app.id}', '${app.mission_id}')">
                            <i class="fas fa-bolt"></i> Recruter directement
                        </button>
                    </div>
                `;
            }

            return `
                <div class="application-card glass ${statusClass}" style="margin-bottom: 25px; border: 1px solid ${statusClass === 'hired' ? 'var(--primary)' : 'rgba(255,255,255,0.1)'};">
                    <div class="app-header-row">
                        <span class="app-mission-ref">Mission: <strong>${this.escape(app.mission_title)}</strong></span>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            ${statusClass === 'hired' ? '<i class="fas fa-star" style="color: var(--primary);"></i>' : ''}
                            <span class="status-pill ${statusClass}">${statusLabel}</span>
                        </div>
                    </div>
                    
                    <div class="candidate-profile-row" style="margin-bottom: 15px;">
                        <div class="candidate-avatar"><i class="fas fa-user-circle"></i></div>
                        <div class="candidate-meta">
                            <strong>Candidat sur le réseau</strong>
                            <div class="price-bubble" style="color: var(--primary); font-weight: bold;">${price}€</div>
                        </div>
                    </div>
 
                    <div class="pitch-content" style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; font-size: 0.9rem;">
                        <div class="pitch-text">${this.escape(app.message).replace(/\n/g, '<br>')}</div>
                    </div>

                    ${workflowHtml}

                    <div class="inbox-actions" style="margin-top: 15px; display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
                        ${statusClass === 'pending' || statusClass === 'accepted' ? `
                            <button class="action-btn danger-text" onclick="Marketplace.rejectApplication('${app.id}')" style="font-size: 0.8rem; opacity: 0.7;">
                                <i class="fas fa-times"></i> Écarter définitivement
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    async finalizeRecruitment(appId, missionId) {
        if (!confirm('Voulez-vous valider définitivement ce recrutement ?\n\nCela marquera le candidat comme "Recruté" et clôturera le processus de sélection.')) return;

        try {
            // 1. Mark application as hired VIA SPECIFIC BACKEND ENDPOINT
            const res = await fetch(`${Auth.apiBase}/api/marketplace/applications/${appId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.token}`
                },
                body: JSON.stringify({ status: 'hired' })
            });

            if (!res.ok) throw new Error('Erreur lors de la mise à jour du statut');

            // 2. Close the mission (using generic storage since mission is owned by user)
            await Storage.update(Storage.KEYS.MARKETPLACE_MISSIONS, missionId, { status: 'closed' });

            App.showNotification('🎊 Recrutement validé avec succès !', 'success');

            // 3. Trigger UI Refresh for recruiter
            await Storage.fetchAllData();
            this.render();
        } catch (err) {
            console.error('[FINALIZE] Error:', err);
            App.showNotification('Erreur lors de la validation finale', 'error');
        }
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

        // Pre-fill budget (Proposed Price = Total Mission Budget)
        const missions = Storage.getPublicMissions();
        const m = missions.find(x => x.id === missionId);

        if (m) {
            // Display remuneration info clearly
            const budgetDisplay = document.getElementById('apply-mission-budget');
            if (budgetDisplay) {
                const totalCost = Math.round(parseFloat(m.budget) * (1 + this.COMMISSION_RATE));
                const netExpert = Math.round(parseFloat(m.budget));
                budgetDisplay.innerHTML = `
                    <div style="font-size: 1.1rem; color: var(--success); margin-bottom: 5px;">
                        <strong>Rémunération : ${netExpert}€ Net</strong>
                    </div>
                    <div style="font-size: 0.85rem; opacity: 0.7;">
                        (Budget Client : ${totalCost}€ TTC)
                    </div>
                `;
            }

            // Hidden Price for submission
            const priceInput = document.getElementById('total-price-hidden');
            if (priceInput) {
                priceInput.value = Math.round(parseFloat(m.budget) * (1 + this.COMMISSION_RATE));
            }
        }

        // Auto-fill Profile Data
        if (typeof Auth !== 'undefined' && Auth.user) {
            const nameInput = document.querySelector('input[name="applicant_name"]');
            if (nameInput && !nameInput.value) {
                nameInput.value = Auth.user.user_metadata?.company || Auth.user.user_metadata?.full_name || '';
            }
            const portfolioInput = document.querySelector('input[name="portfolio_url"]');
            if (portfolioInput && !portfolioInput.value) {
                portfolioInput.value = Auth.user.user_metadata?.portfolio_url || '';
            }
        }
    },

    updateApplyCalc() {
        const input = document.getElementById('total-price-input');
        if (!input) return;
        const totalPrice = parseFloat(input.value) || 0;
        const netEarnings = totalPrice * 0.85; // 15% platform fee

        const display = document.getElementById('apply-net');
        if (display) display.textContent = Math.round(netEarnings) + ' €';
    },

    closeApplyForm() { document.getElementById('apply-modal').style.display = 'none'; },

    async submitApplication(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Envoi...';

        const formData = new FormData(e.target);
        const totalPrice = parseFloat(formData.get('total_price'));

        const application = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : this.generateFailsafeId(),
            mission_id: formData.get('mission_id'),
            applicant_id: Auth.user?.id, // CRITICAL: Linked to the new DB column
            // PACKING EVERYTHING into message because the table schema has No applicant_name column
            message: `CANDIDAT: ${formData.get('applicant_name') || 'Anonyme'}\n` +
                `EMAIL: ${Auth.user?.email || 'N/A'}\n` +
                `TEL: ${Auth.user?.company?.phone || Auth.user?.user_metadata?.phone || 'N/A'}\n` +
                `PORTFOLIO: ${formData.get('portfolio_url') || 'Non renseigné'}\n` +
                `DUREE: ${formData.get('estimated_duration') || 'Non précisée'}\n\n` +
                `MESSAGE:\n${formData.get('message')}`,
            proposed_price: totalPrice,
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
        // CRITICAL FIX: Ensure candidate_id is ALWAYS the applicant from the application record
        // Never default to current user if missing in record, instead log error
        const targetCandidateId = app.applicant_id;
        if (!targetCandidateId) {
            console.error('[MARKETPLACE] Missing applicant_id on application:', appId);
            App.showNotification('Erreur critique : ID candidat manquant sur cette application.', 'error');
            return;
        }
        document.getElementById('interview-candidate-id').value = targetCandidateId;
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
        // If in inbox tab, use inboxCache (Recruiter perspective)
        if (this.currentTab === 'inbox' && this.inboxCache.length > 0) {
            return this.inboxCache.find(app => app.id === appId);
        }

        // Fallback for Candidate perspective
        const allApps = Storage.get(Storage.KEYS.MARKETPLACE_APPLICATIONS) || [];
        return allApps.find(app => app.id === appId);
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

            // Mark application as accepted VIA SPECIFIC BACKEND ENDPOINT
            await fetch(`${Auth.apiBase}/api/marketplace/applications/${appId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.token}`
                },
                body: JSON.stringify({ status: 'accepted' })
            });

            App.showNotification('✅ Invitation envoyée avec succès !', 'success');
            this.closeInterviewModal();

            await Storage.fetchAllData();
            this.render();
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
            const res = await fetch(`${Auth.apiBase}/api/marketplace/applications/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.token}`
                },
                body: JSON.stringify({ status: 'rejected' })
            });

            if (!res.ok) throw new Error('Erreur lors du rejet');

            if (typeof App !== 'undefined') App.showNotification('Candidature écartée.', 'info');

            // Background sync & refresh
            await Storage.fetchAllData();
            this.render();
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
                    <h2>Diffuser une Offre</h2>
                    
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
                    <h2>Postuler à l'offre</h2>
                    <div class="mission-reminder" id="apply-mission-title" style="margin-bottom: 1rem; font-weight: bold; color: var(--primary);"></div>
                    
                    <form onsubmit="Marketplace.submitApplication(event)">
                        <input type="hidden" name="mission_id" id="apply-mission-id">
                        <input type="hidden" name="total_price" id="total-price-hidden">
                        
                        <div class="mission-budget-info" id="apply-mission-budget" style="background: rgba(var(--success-rgb), 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid var(--success); text-align: center;">
                             <!-- Dynamic budget info -->
                        </div>

                        <div class="form-row">
                            <label>Votre Nom / Agence
                                <input type="text" name="applicant_name" required placeholder="Votre Identité Pro" class="form-input">
                            </label>
                            <label>Lien Portfolio
                                <input type="url" name="portfolio_url" placeholder="https://..." class="form-input">
                            </label>
                        </div>

                        <div class="form-row">
                             <label>Disponibilité / Durée
                                <input type="text" name="estimated_duration" placeholder="Ex: Disponible de suite, 1 semaine..." class="form-input">
                            </label>
                        </div>

                        <label>Détails de votre Proposition / Motivation
                            <textarea name="message" required rows="5" class="form-input" placeholder="Bonjour, je suis très intéressé par cette mission car..."></textarea>
                        </label>

                        <button type="submit" class="button-primary full-width" style="margin-top:20px; padding: 15px; font-size: 1.1rem;">
                            Envoyer ma Proposition
                        </button>
                    </form>
                </div>
            </div>

            <!-- INTERVIEW INVITATION MODAL -->
            <div id="interview-modal" class="modal-overlay">
                <div class="modal-content glass" style="max-width: 700px;">
                    <button class="modal-close" onclick="Marketplace.closeInterviewModal()">✕</button>
                    <h2>Inviter à un Entretien</h2>
                    
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
    },

    init() {
        if (this._initialized) return;
        this._initialized = true;
        console.log('Marketplace Background Polling Started...');
        // Poll for invitations every 45 seconds
        setInterval(() => this.updateInvitationBadge(), 45000);
    }
};

window.Marketplace = Marketplace;
