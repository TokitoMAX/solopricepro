/**
 * SoloPrice Pro - Network Module
 * Handles Personal Service Providers & DomTomConnect Ecosystem
 */

const ADMIN_EMAIL = 'domtomconnect@gmail.com';

const Network = {
    providers: [],
    ecosystemExperts: [],

    async init() {
        console.log('Network module initialized');
        await this.loadProviders();
        this.render();
    },

    async loadProviders() {
        // Use cache if already populated by Storage.fetchAllData()
        const cached = Storage._cache[Storage.KEYS.PROVIDERS];
        if (cached && cached.length > 0) {
            this.providers = cached;
            return;
        }
        // Cache not ready yet — fetch via NetworkService
        try {
            const data = await NetworkService.fetchProviders();
            this.providers = Array.isArray(data) ? data : [];
            Storage._cache[Storage.KEYS.PROVIDERS] = this.providers;
        } catch (e) {
            console.warn('[NETWORK] loadProviders fallback error:', e.message);
            this.providers = Storage.get(Storage.KEYS.PROVIDERS) || [];
        }
    },

    isAdmin() {
        const user = Auth.getUser();
        return user && user.email === ADMIN_EMAIL;
    },

    isExpert() {
        const user = Auth.getUser();
        if (!user) return false;
        const tier = user.user_metadata?.tier || user.tier || '';
        return tier === 'expert';
    },

    async refresh() {
        this.loadProviders();
        this.render();
    },

    render(tabId) {
        const container = document.getElementById('network-content');
        if (!container) return;

        // Fallback intelligent
        if (!tabId) tabId = this.activeTab || localStorage.getItem('sp_last_tab_network') || 'clients';
        this.activeTab = tabId;

        const isAdmin = this.isAdmin();

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">${i18n.t('network.title')}</h1>
                <p class="page-subtitle">${i18n.t('network.subtitle')}</p>
            </div>

            <div class="settings-tabs" style="flex-wrap: wrap; gap: 0.25rem;">
                <button class="settings-tab" data-tab-id="clients" onclick="Network.switchTab('clients')">
                    <i class="fas fa-users"></i> ${i18n.t('network.tab.clients')}
                </button>
                <button class="settings-tab" data-tab-id="leads" onclick="Network.switchTab('leads')">
                    <i class="fas fa-funnel-dollar"></i> ${i18n.t('network.tab.leads')}
                </button>
                <button class="settings-tab" data-tab-id="partners" onclick="Network.switchTab('partners')">
                    <i class="fas fa-handshake"></i> ${i18n.t('network.tab.partners')}
                </button>
                <button class="settings-tab" data-tab-id="ecosystem" onclick="Network.switchTab('ecosystem')">
                    <i class="fas fa-globe"></i> ${i18n.t('network.tab.ecosystem')}
                    <span style="font-size: 0.6rem; background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px; margin-left: 5px;">${i18n.t('network.badge.circle')}</span>
                </button>
                <button class="settings-tab" data-tab-id="join" onclick="Network.switchTab('join')">
                    <i class="fas fa-paper-plane"></i> ${i18n.t('network.tab.join')}
                </button>
                ${isAdmin ? `
                <button class="settings-tab" data-tab-id="applications" onclick="Network.switchTab('applications')" style="border-color: #a855f7;">
                    <i class="fas fa-inbox"></i> ${i18n.t('network.tab.applications')}
                    <span style="font-size: 0.6rem; background: #a855f7; color: white; padding: 2px 6px; border-radius: 4px; margin-left: 5px;">${i18n.t('network.badge.admin')}</span>
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
                    <h3 style="margin-bottom: 0.5rem;">${i18n.t('network.partners.empty.title')}</h3>
                    <p style="color: var(--text-muted); margin-bottom: 2rem;">${i18n.t('network.partners.empty.desc')}</p>
                    <button class="button-primary" onclick="Network.showAddModal()"><i class="fas fa-plus"></i> ${i18n.t('network.partners.btn.add')}</button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="network-container">
                <div class="section-header-inline" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 class="section-title-small" style="margin: 0;">${i18n.t('network.partners.title')}</h3>
                    <button class="button-primary small" onclick="Network.showAddModal()">${i18n.t('network.partners.btn.new')}</button>
                </div>
                <div class="partners-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
                    ${this.providers.map(p => `
                        <div class="network-card glass" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 1.5rem; border-radius: 16px; border-left: 4px solid ${p.isVerified ? 'var(--primary)' : 'var(--border)'}; transition: all 0.3s ease;">
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                                <div style="width: 45px; height: 45px; background: var(--primary-glass); color: var(--primary-light); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 1px solid var(--primary-glass); font-size: 1.2rem;">${(p.name || '?').charAt(0).toUpperCase()}</div>
                                <div style="flex: 1; min-width: 0;">
                                    <h3 style="margin: 0; font-size: 1rem; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</h3>
                                    <p style="margin: 2px 0 0; color: var(--text-muted); font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.specialty || i18n.t('network.partners.specialty_empty')}</p>
                                </div>
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem; opacity: 0.8;">
                                <i class="fas fa-map-marker-alt" style="margin-right: 4px;"></i> ${p.city || ''} ${p.email ? `· ${p.email}` : ''}
                            </div>
                            <div style="display: flex; gap: 0.5rem; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 1.2rem;">
                                <button class="button-secondary sm" style="flex: 1; font-size: 0.75rem;" onclick="Network.contactProvider('${p.id}')">
                                    <i class="fas fa-envelope"></i> ${i18n.t('network.partners.btn.contact')}
                                </button>
                                <button class="button-secondary sm" style="flex: 0 0 auto; width: 36px; padding: 0; border-color: rgba(239, 68, 68, 0.2); color: #ef4444;" onclick="Network.deleteProvider('${p.id}')" title="${i18n.t('network.partners.btn.delete')}">
                                    <i class="fas fa-trash-alt"></i>
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
                <p style="margin-top: 1rem;">${i18n.t('network.ecosystem.loading')}</p>
            </div>
        `;

        let experts = [];
        try {
            experts = await NetworkService.getEcosystemExperts();
        } catch (e) {
            console.warn('[ECOSYSTEM] Could not load experts:', e.message);
        }

        const isAdmin = this.isAdmin();

        container.innerHTML = `
            <div class="page-header" style="padding: 0; margin-bottom: 1.5rem;">
                <div>
                    <h2 style="font-size: 1.3rem; margin: 0;">${i18n.t('network.ecosystem.title')}</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0.3rem 0 0;">${i18n.t('network.ecosystem.subtitle')}</p>
                </div>
                ${isAdmin ? `<button class="button-primary small" onclick="Network.showAddEcosystemModal()"><i class="fas fa-plus"></i> ${i18n.t('network.ecosystem.btn.add')}</button>` : ''}
            </div>

            ${this.isExpert() ? (() => {
                const u = Auth.getUser();
                const profile = Storage.get(Storage.KEYS.USER_PROFILE) || {};
                const name = profile.company_name || profile.first_name || u?.email?.split('@')[0] || 'Vous';
                const specialty = profile.activity || profile.specialty || 'Expert SoloPrice';
                const city = profile.city || profile.ville || '';
                const email = u?.email || '';
                const portfolio = profile.portfolio || profile.website || '';
                return `
                <div style="margin-bottom: 2rem; padding: 1.5rem 2rem; border-radius: 20px; background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(99,102,241,0.08)); border: 1px solid var(--primary); position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.1);">
                    <div style="position: absolute; top: 12px; right: 15px; font-size: 0.65rem; font-weight: 800; letter-spacing: 1.5px; color: var(--primary-light); text-transform: uppercase; background: rgba(0,0,0,0.2); padding: 4px 10px; border-radius: 20px;">${i18n.t('network.expert.profile_notice')}</div>
                    <div style="display: flex; align-items: center; gap: 1.5rem; margin-top: 0.5rem;">
                        <div style="width: 60px; height: 60px; background: var(--primary-glass); color: var(--primary-light); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.6rem; border: 2px solid var(--primary); flex-shrink: 0; box-shadow: 0 0 15px var(--primary-glass);">${name.charAt(0).toUpperCase()}</div>
                        <div style="flex:1;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                                <strong style="font-size: 1.1rem; color: white;">${name}</strong>
                                <span style="font-size: 0.6rem; background: var(--primary); color: white; padding: 2px 8px; border-radius: 6px; font-weight: 800;">${i18n.t('network.expert.badge')}</span>
                            </div>
                            <div style="color: var(--primary-light); font-size: 0.9rem; font-weight: 700;">${specialty}</div>
                            ${city ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;"><i class="fas fa-map-marker-alt" style="margin-right: 6px; color: var(--primary-light);"></i>${city}</div>` : ''}
                        </div>
                        <div style="display: flex; gap: 0.75rem; flex-shrink: 0;">
                            ${portfolio ? `<a href="${portfolio}" target="_blank" class="button-secondary sm" style="font-size: 0.8rem; text-decoration: none; padding: 0.6rem 1rem; border-radius: 10px;"><i class="fas fa-external-link-alt"></i> ${i18n.t('network.expert.btn.portfolio')}</a>` : ''}
                            ${email ? `<a href="mailto:${email}" class="button-primary small" style="font-size: 0.8rem; text-decoration: none; padding: 0.6rem 1rem; border-radius: 10px;"><i class="fas fa-envelope"></i> ${i18n.t('network.expert.btn.contact')}</a>` : ''}
                        </div>
                    </div>
                </div>
                `;
            })() : ''}

            ${experts.length === 0 ? `
                <div class="empty-state glass" style="padding: 4rem 2rem; border-radius: 20px; text-align: center; border: 1px dashed var(--border);">
                    <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.03); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                        <i class="fas fa-globe" style="font-size: 2.5rem; color: var(--text-muted);"></i>
                    </div>
                    <h3 style="font-size: 1.25rem; margin-bottom: 0.75rem;">${i18n.t('network.ecosystem.empty.title')}</h3>
                    <p style="color: var(--text-muted); max-width: 400px; margin: 0 auto 2rem;">${i18n.t('network.ecosystem.empty.desc')}</p>
                    ${isAdmin ? `<button class="button-primary" style="padding: 0.8rem 1.5rem;" onclick="Network.showAddEcosystemModal()"><i class="fas fa-plus"></i> ${i18n.t('network.ecosystem.empty.btn_admin')}</button>` : `
                    <button class="button-secondary" style="padding: 0.8rem 1.5rem;" onclick="Network.switchTab('join')"><i class="fas fa-paper-plane"></i> ${i18n.t('network.ecosystem.empty.btn_join')}</button>`}
                </div>
            ` : `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
                    ${await (async () => {
                const expertCards = await Promise.all(experts.map(async e => {
                    const ratings = await Ratings.getUserRatings(e.id);
                    const canRate = Auth.user && Auth.user.id !== e.id;
                    const hasAvatar = e.user_metadata?.avatar_url || e.avatar_url;

                    return `
                                <div class="glass" style="padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border); border-left: 4px solid var(--primary); position: relative; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                                        <div style="width: 50px; height: 50px; background: var(--primary-glass); color: var(--primary-light); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.3rem; border: 1px solid var(--primary-glass); overflow: hidden;">
                                            ${hasAvatar
                            ? `<img src="${hasAvatar}" style="width:100%; height:100%; object-fit:cover;">`
                            : (e.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div style="flex: 1;">
                                            <h3 style="margin: 0; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                                                ${e.name}
                                                <span style="font-size: 0.55rem; background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px;">VÉRIFIÉ</span>
                                            </h3>
                                            <div style="display: flex; align-items: center; gap: 5px; margin-top: 2px;">
                                                ${Ratings.renderStars(ratings.average)}
                                                <span style="font-size: 0.7rem; color: var(--text-muted);">(${ratings.count} avis)</span>
                                            </div>
                                        </div>
                                        ${isAdmin ? `
                                        <button onclick="Network.deleteEcosystemExpert('${e.id}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;" title="Supprimer"><i class="fas fa-trash"></i></button>
                                        ` : ''}
                                    </div>
                                    <p style="margin: 2px 0 0; color: var(--primary-light); font-size: 0.82rem; font-weight: 600; margin-bottom: 0.5rem;">${e.specialty || ''}</p>
                                    ${e.city ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;"><i class="fas fa-map-marker-alt" style="margin-right: 5px;"></i>${e.city}</div>` : ''}
                                    ${e.description ? `<p style="font-size: 0.82rem; color: var(--text-light); line-height: 1.5; margin-bottom: 1.25rem;">${e.description}</p>` : ''}
                                    
                                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                        ${e.portfolio ? `
                                        <a href="${e.portfolio}" target="_blank" rel="noopener noreferrer" class="button-secondary sm" style="font-size: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                                            <i class="fas fa-external-link-alt"></i> Portfolio
                                        </a>` : ''}
                                        <a href="mailto:${e.email}" class="button-secondary sm" style="font-size: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                                            <i class="fas fa-envelope"></i> Contacter
                                        </a>
                                        ${canRate ? `
                                        <button class="button-primary small" style="font-size: 0.75rem; background: var(--primary-glass); color: var(--primary-light); border: 1px solid var(--primary-glass);" onclick="Ratings.showRatingModal('${e.id}', '${e.name.replace(/'/g, "\\'")}')">
                                            ⭐ Noter
                                        </button>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                }));
                return expertCards.join('');
            })()}
                </div>
            `}
        `;
    },

    // =============================================
    // TAB: REJOINDRE (application form for users)
    // =============================================
    renderJoinTab(container) {
        container.innerHTML = `
            <div class="join-expert-hero glass" style="padding: 4rem 2rem; border-radius: 24px; text-align: center; background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.05)); border: 1px solid rgba(255,255,255,0.05); margin-bottom: 2rem;">
                <div style="display: inline-block; padding: 0.5rem 1rem; background: var(--primary-glass); color: var(--primary-light); border-radius: 30px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1.5rem; border: 1px solid var(--primary-glass);">${i18n.t('network.tab.join')}</div>
                <h1 style="font-size: 2.5rem; margin-bottom: 1rem; background: linear-gradient(to right, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${i18n.t('network.join.title')}</h1>
                <p style="color: var(--text-muted); font-size: 1.1rem; max-width: 600px; margin: 0 auto 2.5rem;">${i18n.t('network.join.subtitle')}</p>

                <div class="perks-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; max-width: 900px; margin: 0 auto;">
                    <div class="perk-item">
                        <div style="width: 50px; height: 50px; background: rgba(99,102,241,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #818cf8; font-size: 1.5rem;"><i class="fas fa-rocket"></i></div>
                        <h4 style="margin-bottom: 0.5rem;">${i18n.t('network.join.perk1.title')}</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">${i18n.t('network.join.perk1.desc')}</p>
                    </div>
                    <div class="perk-item">
                        <div style="width: 50px; height: 50px; background: rgba(16,185,129,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #34d399; font-size: 1.5rem;"><i class="fas fa-check-circle"></i></div>
                        <h4 style="margin-bottom: 0.5rem;">${i18n.t('network.join.perk2.title')}</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">${i18n.t('network.join.perk2.desc')}</p>
                    </div>
                    <div class="perk-item">
                        <div style="width: 50px; height: 50px; background: rgba(245,158,11,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #fbbf24; font-size: 1.5rem;"><i class="fas fa-star"></i></div>
                        <h4 style="margin-bottom: 0.5rem;">${i18n.t('network.join.perk3.title')}</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">${i18n.t('network.join.perk3.desc')}</p>
                    </div>
                </div>
            </div>

            <div class="join-form-container glass" style="max-width: 700px; margin: 0 auto; padding: 2.5rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <h3 style="margin-bottom: 2rem; text-align: center;">${i18n.t('network.join.form.title')}</h3>
                <form id="expert-application-form" onsubmit="Network.handleJoinSubmit(event)">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                        <div class="form-group">
                            <label class="form-label">${i18n.t('network.join.label.role')}</label>
                            <input type="text" name="specialty" class="modern-input" required placeholder="${i18n.t('network.join.placeholder.role')}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">${i18n.t('network.join.label.portfolio')}</label>
                            <input type="url" name="portfolio" class="modern-input" required placeholder="https://...">
                        </div>
                    </div>
                    <div class="form-group" style="margin-top: 1.5rem;">
                        <label class="form-label">${i18n.t('network.join.label.desc')}</label>
                        <textarea name="description" class="modern-input" rows="4" placeholder="${i18n.t('network.join.placeholder.desc')}"></textarea>
                    </div>
                    <button type="submit" class="button-primary full-width" id="join-submit-btn" style="margin-top: 2rem; padding: 1rem; border-radius: 12px; font-weight: 700;">
                        <i class="fas fa-paper-plane" style="margin-right: 8px;"></i> ${i18n.t('network.join.btn.submit')}
                    </button>
                    <p style="text-align: center; color: var(--text-muted); font-size: 0.8rem; margin-top: 1.5rem;">
                        <i class="fas fa-info-circle"></i> ${i18n.t('network.join.notice')}
                    </p>
                </form>
            </div>
        `;
    },

    async handleJoinSubmit(e) {
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
            await NetworkService.applyToEcosystem(payload);


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
            apps = await NetworkService.getEcosystemApplications();
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
        try {
            await NetworkService.reviewEcosystemApplication(id, status, applicantData);
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
        if (typeof App !== 'undefined' && !App.enforceLimit('partners')) return;
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
            await NetworkService.addEcosystemExpert(expert);
            document.getElementById('ecosystem-add-expert-modal')?.classList.remove('active');
            e.target.reset();
            App.showNotification(i18n.t('network.ecosystem.notify.added'), 'success');
            this.switchTab('ecosystem');
        } catch (err) {
            App.showNotification('Erreur : ' + err.message, 'error');
        }
    },

    async deleteEcosystemExpert(id) {
        if (!confirm(i18n.t('network.confirm.remove_expert'))) return;
        try {
            await NetworkService.deleteEcosystemExpert(id);
            App.showNotification(i18n.t('network.ecosystem.notify.removed'), 'success');
            this.switchTab('ecosystem');
        } catch (err) {
            App.showNotification('Erreur : ' + err.message, 'error');
        }
    },

    // =============================================
    // PERSONAL PARTNER ACTIONS
    // =============================================
    showAddModal() {
        if (typeof App !== 'undefined' && !App.enforceLimit('partners')) return;

        let modal = document.getElementById('provider-add-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'provider-add-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2 style="margin: 0; font-size: 1.2rem;"><i class="fas fa-handshake"></i> Partenaire Privé</h2>
                        <button class="modal-close" onclick="Network.hideAddModal()"><i class="fas fa-times"></i></button>
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
            const saved = await Storage.add(Storage.KEYS.PROVIDERS, newProvider);
            // Update local list from cache
            this.providers = Storage._cache[Storage.KEYS.PROVIDERS] || [...this.providers, saved || newProvider];
            this.hideAddModal();
            e.target.reset();
            App.showNotification(i18n.t('network.partners.notify.added'), 'success');
            this.switchTab('partners');
        } catch (err) {
            console.error('Network error:', err);
            App.showNotification('Erreur lors de l\'ajout.', 'error');
        }
    },

    async deleteProvider(id) {
        if (confirm(i18n.t('network.confirm.delete_partner'))) {
            try {
                await Storage.delete(Storage.KEYS.PROVIDERS, id);
                this.loadProviders();
                App.showNotification(i18n.t('network.partners.notify.removed'), 'success');
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
            App.showNotification(i18n.t('network.partners.notify.no_email'), 'info');
        }
    },

    // Legacy modals for backward compat
    showEcosystemModal() { this.switchTab('join'); },
    hideEcosystemModal() { }
};

window.Network = Network;
