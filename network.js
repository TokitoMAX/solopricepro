/**
 * SoloPrice Pro - Network Module
 * Handles Personal Service Providers & DomTomConnect Ecosystem
 */

const ADMIN_EMAIL = 'domtomconnect@gmail.com';

const Network = {
    providers: [],
    ecosystemExperts: [],

    init() {
        console.log('Network module initialized');
        this.loadProviders();
        this.render();
    },

    loadProviders() {
        this.providers = Storage.get(Storage.KEYS.PROVIDERS) || [];
    },

    isAdmin() {
        const user = Auth.getUser();
        return user && user.email === ADMIN_EMAIL;
    },

    async refresh() {
        this.loadProviders();
        this.render();
    },

    render(tabId = 'clients') {
        const container = document.getElementById('network-content');
        if (!container) return;

        const isAdmin = this.isAdmin();

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Mon Cercle</h1>
                <p class="page-subtitle">Gérez vos clients, prospects, partenaires et explorez l'écosystème d'experts.</p>
            </div>

            <div class="settings-tabs" style="flex-wrap: wrap; gap: 0.25rem;">
                <button class="settings-tab" data-tab-id="clients" onclick="Network.switchTab('clients')">
                    <i class="fas fa-users"></i> Mes Clients
                </button>
                <button class="settings-tab" data-tab-id="leads" onclick="Network.switchTab('leads')">
                    <i class="fas fa-funnel-dollar"></i> Mes Prospects
                </button>
                <button class="settings-tab" data-tab-id="partners" onclick="Network.switchTab('partners')">
                    <i class="fas fa-handshake"></i> Mes Partenaires
                </button>
                <button class="settings-tab" data-tab-id="ecosystem" onclick="Network.switchTab('ecosystem')">
                    <i class="fas fa-globe"></i> L'Écosystème
                    <span style="font-size: 0.6rem; background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px; margin-left: 5px;">CERCLE</span>
                </button>
                <button class="settings-tab" data-tab-id="join" onclick="Network.switchTab('join')">
                    <i class="fas fa-paper-plane"></i> Rejoindre
                </button>
                ${isAdmin ? `
                <button class="settings-tab" data-tab-id="applications" onclick="Network.switchTab('applications')" style="border-color: #a855f7;">
                    <i class="fas fa-inbox"></i> Candidatures
                    <span style="font-size: 0.6rem; background: #a855f7; color: white; padding: 2px 6px; border-radius: 4px; margin-left: 5px;">ADMIN</span>
                </button>` : ''}
            </div>
            <div id="cercle-dynamic-content" style="margin-top: 2rem;">
                <!-- Rempli par switchTab -->
            </div>
        `;

        this.switchTab(tabId || 'clients');
    },

    switchTab(tabId) {
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.settings-tab[data-tab-id="${tabId}"]`);
        if (activeTab) activeTab.classList.add('active');

        if (typeof App !== 'undefined' && App.currentPage === 'network') {
            const route = App.getPageFromHash();
            if (route && route.page === 'network' && route.tab !== tabId) {
                Analytics.trackEvent('switch_cercle_tab', { tab: tabId });
                App.navigateTo('network', tabId);
            }
        }

        const container = document.getElementById('cercle-dynamic-content');
        if (!container) return;

        if (tabId === 'clients') {
            container.innerHTML = '<div id="clients-embedded-container"></div>';
            if (typeof Clients !== 'undefined') Clients.render('clients-embedded-container');
        } else if (tabId === 'leads') {
            container.innerHTML = '<div id="leads-embedded-container"></div>';
            if (typeof Leads !== 'undefined') Leads.render('leads-embedded-container');
        } else if (tabId === 'partners') {
            this.renderPartners(container);
        } else if (tabId === 'ecosystem') {
            this.renderEcosystem(container);
        } else if (tabId === 'join') {
            this.renderJoinTab(container);
        } else if (tabId === 'applications') {
            if (this.isAdmin()) this.renderApplications(container);
        }
    },

    // =============================================
    // TAB: MES PARTENAIRES (personal contacts)
    // =============================================
    renderPartners(container) {
        if (this.providers.length === 0) {
            container.innerHTML = `
                <div class="empty-state glass" style="padding: 3rem; border-radius: 16px; text-align: center; margin-bottom: 2rem;">
                    <i class="fas fa-handshake" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem; display: block;"></i>
                    <h3 style="margin-bottom: 0.5rem;">Mes Partenaires Privés</h3>
                    <p style="color: var(--text-muted); margin-bottom: 2rem;">Vos contacts réseau confidentiels — prestataires, sous-traitants, collaborateurs.</p>
                    <button class="button-primary" onclick="Network.showAddModal()"><i class="fas fa-plus"></i> Ajouter un contact</button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="network-container">
                <div class="section-header-inline">
                    <h3 class="section-title-small">Mes Partenaires Privés</h3>
                    <button class="button-primary small" onclick="Network.showAddModal()">+ Nouveau</button>
                </div>
                <div class="partners-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
                    ${this.providers.map(p => `
                        <div class="network-card glass" style="background: #0a0a0a; border: 1px solid var(--border); padding: 1.5rem; border-radius: 12px; border-left: 4px solid ${p.isVerified ? 'var(--primary)' : 'var(--border)'};">
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                                <div style="width: 45px; height: 45px; background: var(--dark); color: var(--text-muted); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 1px solid var(--border); font-size: 1.2rem;">${(p.name || '?').charAt(0).toUpperCase()}</div>
                                <div>
                                    <h3 style="margin: 0; font-size: 1rem;">${p.name}</h3>
                                    <p style="margin: 2px 0 0; color: var(--text-muted); font-size: 0.82rem;">${p.specialty || 'Non renseigné'}</p>
                                </div>
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">${p.city || ''} ${p.email ? `· ${p.email}` : ''}</div>
                            <div style="display: flex; gap: 0.5rem; border-top: 1px solid var(--border); padding-top: 1rem;">
                                <button class="button-secondary sm" style="flex: 1; font-size: 0.75rem;" onclick="Network.contactProvider('${p.id}')">
                                    <i class="fas fa-envelope"></i> Contacter
                                </button>
                                <button class="button-secondary sm" style="flex: 1; font-size: 0.75rem; border-color: var(--danger-glass); color: var(--danger-light);" onclick="Network.deleteProvider('${p.id}')">
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // =============================================
    // TAB: L'ÉCOSYSTÈME (admin-curated, all users)
    // =============================================
    async renderEcosystem(container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem;"></i>
                <p style="margin-top: 1rem;">Chargement des experts...</p>
            </div>
        `;

        let experts = [];
        try {
            const token = Auth.token;
            const res = await fetch(`${Auth.apiBase}/api/marketplace/ecosystem-experts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) experts = await res.json();
        } catch (e) {
            console.warn('[ECOSYSTEM] Could not load experts:', e.message);
        }

        const isAdmin = this.isAdmin();

        container.innerHTML = `
            <div class="page-header" style="padding: 0; margin-bottom: 1.5rem;">
                <div>
                    <h2 style="font-size: 1.3rem; margin: 0;">Le Cercle SoloPrice</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0.3rem 0 0;">Experts sélectionnés et validés par SoloPrice Pro.</p>
                </div>
                ${isAdmin ? `<button class="button-primary small" onclick="Network.showAddEcosystemModal()"><i class="fas fa-plus"></i> Ajouter un expert</button>` : ''}
            </div>

            ${experts.length === 0 ? `
                <div class="empty-state glass" style="padding: 3rem; border-radius: 16px; text-align: center;">
                    <i class="fas fa-globe" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem; display: block;"></i>
                    <h3>L'Écosystème se construit</h3>
                    <p style="color: var(--text-muted);">Les premiers experts validés apparaîtront ici bientôt.</p>
                    ${isAdmin ? `<button class="button-primary" style="margin-top: 1rem;" onclick="Network.showAddEcosystemModal()"><i class="fas fa-plus"></i> Ajouter le premier expert</button>` : `
                    <button class="button-secondary" style="margin-top: 1rem;" onclick="Network.switchTab('join')"><i class="fas fa-paper-plane"></i> Postuler pour rejoindre</button>`}
                </div>
            ` : `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                    ${experts.map(e => `
                        <div class="glass" style="padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border); border-left: 4px solid var(--primary); position: relative;">
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                                <div style="width: 50px; height: 50px; background: var(--primary-glass); color: var(--primary-light); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.3rem; border: 1px solid var(--primary-glass);">
                                    ${(e.name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div style="flex: 1;">
                                    <h3 style="margin: 0; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                                        ${e.name}
                                        <span style="font-size: 0.55rem; background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px;">VÉRIFIÉ</span>
                                    </h3>
                                    <p style="margin: 2px 0 0; color: var(--primary-light); font-size: 0.82rem; font-weight: 600;">${e.specialty || ''}</p>
                                </div>
                                ${isAdmin ? `
                                <button onclick="Network.deleteEcosystemExpert('${e.id}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;" title="Supprimer"></button>
                                ` : ''}
                            </div>
                            ${e.city ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;"><i class="fas fa-map-marker-alt" style="margin-right: 5px;"></i>${e.city}</div>` : ''}
                            ${e.description ? `<p style="font-size: 0.82rem; color: var(--text-light); line-height: 1.5; margin-bottom: 1rem;">${e.description}</p>` : ''}
                            ${e.portfolio ? `
                            <a href="${e.portfolio}" target="_blank" rel="noopener noreferrer" class="button-secondary sm" style="font-size: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                                <i class="fas fa-external-link-alt"></i> Portfolio / LinkedIn
                            </a>` : ''}
                        </div>
                    `).join('')}
                </div>
            `}
        `;
    },

    // =============================================
    // TAB: REJOINDRE (application form for users)
    // =============================================
    renderJoinTab(container) {
        const user = Auth.getUser();
        const userName = user ? `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() : '';
        const userEmail = user ? user.email : '';

        container.innerHTML = `
            <div style="max-width: 650px; margin: 0 auto;">
                <div class="glass" style="padding: 2.5rem; border-radius: 20px; border: 1px solid var(--primary-glass);">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--primary), #7c3aed); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                            <i class="fas fa-rocket" style="color: white; font-size: 1.5rem;"></i>
                        </div>
                        <h2 style="margin: 0 0 0.5rem;">Rejoindre Le Cercle SoloPrice</h2>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">Proposez vos services dans notre réseau d'experts validés. Notre équipe examinera votre profil.</p>
                    </div>

                    <form id="ecosystem-join-form" onsubmit="Network.submitJoinApplication(event)">
                        <div class="form-group" style="margin-bottom: 1.25rem;">
                            <label class="form-label">Votre Nom Complet *</label>
                            <input type="text" name="user_name" class="form-input" required value="${userName}" placeholder="Jean Dupont">
                        </div>
                        <div class="form-group" style="margin-bottom: 1.25rem;">
                            <label class="form-label">Email de Contact *</label>
                            <input type="email" name="user_email" class="form-input" required value="${userEmail}" placeholder="vous@exemple.com">
                        </div>
                        <div class="form-group" style="margin-bottom: 1.25rem;">
                            <label class="form-label">Votre Spécialité *</label>
                            <input type="text" name="specialty" class="form-input" required placeholder="Ex: Développeur Web React, Coach Agile...">
                        </div>
                        <div class="form-group" style="margin-bottom: 1.25rem;">
                            <label class="form-label">Lien Portfolio / LinkedIn *</label>
                            <input type="url" name="portfolio" class="form-input" required placeholder="https://votresite.com">
                        </div>
                        <div class="form-group" style="margin-bottom: 1.25rem;">
                            <label class="form-label">Ville / Région</label>
                            <input type="text" name="city" class="form-input" placeholder="Ex: Paris, Fort-de-France...">
                        </div>
                        <div class="form-group" style="margin-bottom: 1.75rem;">
                            <label class="form-label">Pourquoi voulez-vous rejoindre le Cercle ?</label>
                            <textarea name="description" class="form-input" rows="4" placeholder="Présentez votre valeur ajoutée et votre vision..."></textarea>
                        </div>
                        <button type="submit" class="button-primary full-width" id="join-submit-btn" style="padding: 1rem; font-size: 1rem;">
                            <i class="fas fa-paper-plane"></i> Envoyer ma Candidature
                        </button>
                        <p style="text-align: center; font-size: 0.75rem; color: var(--text-muted); margin-top: 1rem;">Notre équipe vous recontactera dans les 48h.</p>
                    </form>
                </div>
            </div>
        `;
    },

    async submitJoinApplication(e) {
        e.preventDefault();
        const btn = document.getElementById('join-submit-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

        const formData = new FormData(e.target);
        const payload = {
            user_name: formData.get('user_name'),
            user_email: formData.get('user_email'),
            specialty: formData.get('specialty'),
            portfolio: formData.get('portfolio'),
            city: formData.get('city'),
            description: formData.get('description')
        };

        try {
            const token = Auth.token;
            const response = await fetch(`${Auth.apiBase}/api/marketplace/apply-ecosystem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Erreur lors de l\'envoi');

            // Show success state
            const container = document.getElementById('cercle-dynamic-content');
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem 2rem; animation: fadeInUp 0.5s ease;">
                    <div style="width: 80px; height: 80px; background: var(--success); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);">
                        <i class="fas fa-check" style="color: white; font-size: 2rem;"></i>
                    </div>
                    <h2 style="margin-bottom: 0.75rem;">Candidature Envoyée !</h2>
                    <p style="color: var(--text-muted); max-width: 400px; margin: 0 auto 2rem;">Notre équipe examinera votre profil et vous recontactera sous 48h à l'adresse <strong>${payload.user_email}</strong>.</p>
                    <button class="button-secondary" onclick="Network.switchTab('ecosystem')">
                        <i class="fas fa-globe"></i> Voir l'Écosystème
                    </button>
                </div>
            `;
            App.showNotification('Candidature envoyée !', 'success');
        } catch (err) {
            console.error('[JOIN] Error:', err);
            App.showNotification('Erreur : ' + err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer ma Candidature';
        }
    },

    // =============================================
    // TAB: CANDIDATURES (admin only)
    // =============================================
    async renderApplications(container) {
        if (!this.isAdmin()) return;

        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem;"></i>
                <p style="margin-top: 1rem;">Chargement des candidatures...</p>
            </div>
        `;

        let apps = [];
        try {
            const token = Auth.token;
            const res = await fetch(`${Auth.apiBase}/api/marketplace/ecosystem-applications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) apps = await res.json();
        } catch (e) {
            console.warn('[ADMIN] Could not load applications:', e.message);
        }

        const pending = apps.filter(a => a.status === 'pending');
        const decided = apps.filter(a => a.status !== 'pending');

        container.innerHTML = `
            <div style="max-width: 900px;">
                <div class="section-header-inline" style="margin-bottom: 1.5rem;">
                    <h2 style="font-size: 1.3rem; margin: 0;">
                        <i class="fas fa-inbox" style="color: #a855f7; margin-right: 8px;"></i>
                        Candidatures Écosystème
                    </h2>
                    <span style="background: #a855f7; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem;">${pending.length} en attente</span>
                </div>

                ${pending.length === 0 ? `
                    <div class="glass" style="padding: 2rem; border-radius: 12px; text-align: center; color: var(--text-muted);">
                        <i class="fas fa-check-circle" style="font-size: 2rem; color: var(--success); margin-bottom: 0.75rem; display: block;"></i>
                        Aucune candidature en attente.
                    </div>
                ` : `
                    <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
                        ${pending.map(a => `
                            <div class="glass" style="padding: 1.5rem; border-radius: 12px; border: 1px solid #a855f755; border-left: 4px solid #a855f7;">
                                <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem; flex-wrap: wrap;">
                                    <div style="flex: 1;">
                                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem;">
                                            <strong style="font-size: 1.05rem;">${a.user_name || 'Anonyme'}</strong>
                                            <span style="font-size: 0.75rem; color: var(--primary-light); background: var(--primary-glass); padding: 2px 8px; border-radius: 20px;">${a.specialty}</span>
                                        </div>
                                        <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                                            ️ ${a.user_email}  ${a.city ? `·  ${a.city}` : ''}
                                        </div>
                                        ${a.portfolio ? `<a href="${a.portfolio}" target="_blank" style="font-size: 0.8rem; color: var(--primary-light);"> ${a.portfolio}</a>` : ''}
                                        ${a.description ? `<p style="font-size: 0.82rem; color: var(--text-light); margin: 0.75rem 0 0; line-height: 1.5;">${a.description}</p>` : ''}
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 140px;">
                                        <button class="button-primary small" onclick="Network.reviewApplication('${a.id}', 'accepted', ${JSON.stringify(a).replace(/"/g, '&quot;')})">
                                            <i class="fas fa-check"></i> Accepter
                                        </button>
                                        <button class="button-secondary small" style="border-color: var(--danger-glass); color: var(--danger-light);" onclick="Network.reviewApplication('${a.id}', 'rejected', null)">
                                            <i class="fas fa-times"></i> Refuser
                                        </button>
                                    </div>
                                </div>
                                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.75rem;">
                                    <i class="fas fa-clock" style="margin-right: 4px;"></i> ${new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}

                ${decided.length > 0 ? `
                    <details style="opacity: 0.6;">
                        <summary style="cursor: pointer; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
                            Candidatures traitées (${decided.length})
                        </summary>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${decided.map(a => `
                                <div class="glass" style="padding: 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <strong>${a.user_name}</strong>
                                        <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 8px;">${a.specialty}</span>
                                    </div>
                                    <span style="font-size: 0.75rem; padding: 3px 10px; border-radius: 20px; background: ${a.status === 'accepted' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; color: ${a.status === 'accepted' ? 'var(--success)' : 'var(--danger-light)'};">
                                        ${a.status === 'accepted' ? ' Accepté' : ' Refusé'}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </details>
                ` : ''}
            </div>
        `;
    },

    async reviewApplication(id, status, applicantData) {
        const token = Auth.token;
        try {
            const res = await fetch(`${Auth.apiBase}/api/marketplace/ecosystem-applications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status, applicant: applicantData })
            });
            if (!res.ok) throw new Error((await res.json()).message);
            App.showNotification(status === 'accepted' ? 'Expert ajouté à l\'écosystème !' : 'Candidature refusée.', status === 'accepted' ? 'success' : 'info');
            this.switchTab('applications');
        } catch (err) {
            App.showNotification('Erreur : ' + err.message, 'error');
        }
    },

    // =============================================
    // MODALS: ADD PERSONAL PARTNER
    // =============================================
    showAddModal() {
        const modal = document.getElementById('network-add-modal');
        if (modal) modal.classList.add('active');
    },

    hideAddModal() {
        const modal = document.getElementById('network-add-modal');
        if (modal) modal.classList.remove('active');
    },

    // =============================================
    // MODAL: ADD ECOSYSTEM EXPERT (admin only)
    // =============================================
    showAddEcosystemModal() {
        // Dynamically create and show a quick modal for admin
        let modal = document.getElementById('ecosystem-add-expert-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ecosystem-add-expert-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content glass" style="max-width: 500px;">
                    <button type="button" class="modal-close" onclick="document.getElementById('ecosystem-add-expert-modal').classList.remove('active')"></button>
                    <div class="modal-header">
                        <h2>Ajouter un Expert</h2>
                        <p class="text-muted">Cet expert sera visible par tous les utilisateurs de l'app.</p>
                    </div>
                    <div class="modal-body">
                        <form onsubmit="Network.addEcosystemExpert(event)" style="display: flex; flex-direction: column; gap: 1rem;">
                            <div class="form-group">
                                <label class="form-label">Nom complet *</label>
                                <input type="text" name="name" class="form-input" required placeholder="Marie Dupont">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Spécialité *</label>
                                <input type="text" name="specialty" class="form-input" required placeholder="Développeur Web, Coach...">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" name="email" class="form-input" placeholder="expert@domaine.com">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Ville</label>
                                <input type="text" name="city" class="form-input" placeholder="Paris, Fort-de-France...">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Portfolio / LinkedIn</label>
                                <input type="url" name="portfolio" class="form-input" placeholder="https://...">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Description courte</label>
                                <textarea name="description" class="form-input" rows="3" placeholder="Ce que cet expert apporte au réseau..."></textarea>
                            </div>
                            <button type="submit" class="button-primary full-width"><i class="fas fa-plus"></i> Ajouter à l'Écosystème</button>
                        </form>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.classList.add('active');
    },

    async addEcosystemExpert(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const expert = {
            name: formData.get('name'),
            specialty: formData.get('specialty'),
            email: formData.get('email'),
            city: formData.get('city'),
            portfolio: formData.get('portfolio'),
            description: formData.get('description'),
            is_ecosystem: true
        };

        try {
            const token = Auth.token;
            const res = await fetch(`${Auth.apiBase}/api/marketplace/ecosystem-experts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(expert)
            });
            if (!res.ok) throw new Error((await res.json()).message);
            document.getElementById('ecosystem-add-expert-modal')?.classList.remove('active');
            e.target.reset();
            App.showNotification('Expert ajouté à l\'écosystème !', 'success');
            this.switchTab('ecosystem');
        } catch (err) {
            App.showNotification('Erreur : ' + err.message, 'error');
        }
    },

    async deleteEcosystemExpert(id) {
        if (!confirm('Retirer cet expert de l\'écosystème ?')) return;
        try {
            const token = Auth.token;
            await fetch(`${Auth.apiBase}/api/marketplace/ecosystem-experts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            App.showNotification('Expert retiré.', 'success');
            this.switchTab('ecosystem');
        } catch (err) {
            App.showNotification('Erreur : ' + err.message, 'error');
        }
    },

    // =============================================
    // PERSONAL PARTNER ACTIONS
    // =============================================
    showAddModal() {
        let modal = document.getElementById('provider-add-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'provider-add-modal';
            modal.className = 'modal glass';
            modal.innerHTML = `
                <div class="modal-content glass-card" style="max-width: 500px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2 style="margin: 0;"><i class="fas fa-handshake"></i> Partenaire Privé</h2>
                        <button class="btn-icon" onclick="Network.hideAddModal()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted);"><i class="fas fa-times"></i></button>
                    </div>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Ce contact restera strictement privé et ne sera visible que par vous.</p>
                    <form onsubmit="Network.addProvider(event)">
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Nom / Entreprise *</label>
                            <input type="text" name="name" class="form-input" required placeholder="Ex: Jean Dupont...">
                        </div>
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Spécialité *</label>
                            <input type="text" name="specialty" class="form-input" required placeholder="Ex: Developpeur, SEO...">
                        </div>
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Email de Contact</label>
                            <input type="email" name="email" class="form-input" placeholder="vous@exemple.com">
                        </div>
                        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div class="form-group">
                                <label class="form-label">Téléphone</label>
                                <input type="tel" name="phone" class="form-input" placeholder="+33 6...">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Ville</label>
                                <input type="text" name="city" class="form-input" placeholder="Paris...">
                            </div>
                        </div>
                        <button type="submit" class="button-primary full-width" style="margin-top: 1rem; padding: 1rem;">
                            <i class="fas fa-save"></i> Enregistrer le partenaire
                        </button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.classList.add('active');
    },

    hideAddModal() {
        const modal = document.getElementById('provider-add-modal');
        if (modal) modal.classList.remove('active');
    },

    async addProvider(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newProvider = {
            name: formData.get('name'),
            specialty: formData.get('specialty'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            city: formData.get('city')
        };

        try {
            await Storage.add(Storage.KEYS.PROVIDERS, newProvider);
            this.loadProviders();
            this.hideAddModal();
            e.target.reset();
            App.showNotification('Partenaire ajouté au réseau.', 'success');
            this.switchTab('partners');
        } catch (err) {
            console.error('Network error:', err);
            App.showNotification('Erreur lors de l\'ajout.', 'error');
        }
    },

    async deleteProvider(id) {
        if (confirm('Supprimer ce partenaire de votre réseau ?')) {
            try {
                await Storage.delete(Storage.KEYS.PROVIDERS, id);
                this.loadProviders();
                App.showNotification('Partenaire supprimé.', 'success');
                this.switchTab('partners');
            } catch (err) {
                App.showNotification('Erreur lors de la suppression.', 'error');
            }
        }
    },

    contactProvider(id) {
        const p = this.providers.find(p => p.id === id);
        if (p && p.email) {
            window.location.href = `mailto:${p.email}`;
        } else {
            App.showNotification('Aucun email renseigné pour ce contact.', 'info');
        }
    },

    // Legacy modals for backward compat
    showEcosystemModal() { this.switchTab('join'); },
    hideEcosystemModal() { }
};

window.Network = Network;
