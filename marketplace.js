/**
 * SoloPrice Pro - Marketplace & Hub Module
 * Fusion des Opportunités DomTomConnect, de la Prospection et du Réseau.
 */
const Marketplace = {
    activeTab: 'missions',

    missions: [],

    render(containerId = 'marketplace-content', startTab = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (startTab) this.activeTab = startTab;

        container.innerHTML = `
            <div class="page-header" style="margin-bottom: 2.5rem;">
                <div>
                    <h1 class="page-title" style="display: flex; align-items: center; gap: 10px;">
                        Marketplace <span class="badge-pro" style="background: var(--primary); font-size: 0.7rem; color: white; padding: 4px 8px; border-radius: 6px;">DOMTOM CONNECT</span>
                    </h1>
                    <p class="page-subtitle">Exploitez le premier réseau d'affaires des outre-mer.</p>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <div class="search-box" style="position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 12px; top: 12px; color: var(--text-muted); font-size: 0.9rem;"></i>
                        <input type="text" id="marketplace-search" class="form-input" placeholder="Rechercher une mission..." style="padding-left: 35px; width: 250px; background: rgba(255,255,255,0.03);" oninput="Marketplace.handleSearch(this.value)">
                    </div>
                    <button class="button-primary" onclick="Marketplace.showPostMissionForm()" style="box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                        <i class="fas fa-plus" style="margin-right: 8px;"></i> Poster une Mission
                    </button>
                </div>
            </div>

            <div id="mission-form-container"></div>

            <div class="marketplace-tabs-container" style="background: rgba(255,255,255,0.02); padding: 0.4rem; border-radius: 14px; display: inline-flex; gap: 0.5rem; margin-bottom: 2.5rem; border: 1px solid var(--border);">
                <button class="m-tab ${this.activeTab === 'missions' ? 'active' : ''}" onclick="Marketplace.switchTab('missions')">Radar Opportunités</button>
                <button class="m-tab ${this.activeTab === 'my-missions' ? 'active' : ''}" onclick="Marketplace.switchTab('my-missions')">Mes Annonces</button>
                <button class="m-tab ${this.activeTab === 'experts' ? 'active' : ''}" onclick="Marketplace.switchTab('experts')">Annuaire Experts</button>
            </div>

            <div id="marketplace-dynamic-content" class="marketplace-container" style="animation: fadeIn 0.4s ease;">
                <!-- Content -->
            </div>
            
            <style>
                .m-tab { padding: 0.6rem 1.2rem; border-radius: 10px; border: none; background: transparent; color: var(--text-muted); font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s ease; }
                .m-tab.active { background: var(--white); color: #000; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
                .m-tab:hover:not(.active) { color: var(--white); background: rgba(255,255,255,0.05); }
                .mission-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .mission-card:hover { transform: translateY(-5px); border-color: var(--primary-glass); box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
                .btn-icon { background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: var(--text-muted); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .btn-icon:hover { background: rgba(255,255,255,0.08); color: var(--white); }
            </style>
        `;

        this.switchTab(this.activeTab);
    },

    switchTab(tabId) {
        this.activeTab = tabId;
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.settings-tab[onclick*="${tabId}"]`);
        if (activeTab) activeTab.classList.add('active');

        const container = document.getElementById('marketplace-dynamic-content');
        if (!container) return;

        if (tabId === 'missions') {
            this.renderMissions(container);
        } else if (tabId === 'my-missions') {
            this.renderMyMissions(container);
        } else if (tabId === 'experts') {
            this.renderExperts(container);
        }
    },

    getPublicMissions() {
        // Read from Storage Cache (populated by Storage.fetchAllData)
        return Storage.getPublicMissions() || [];
    },

    // ===== MISSIONS RADAR (from others) =====
    renderMissions(container) {
        const missions = this.getPublicMissions();

        if (missions.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 6rem 2rem; background: rgba(255,255,255,0.01); border-radius: 32px; border: 1px dashed var(--border);">
                    <div style="font-size: 5rem; margin-bottom: 2rem; opacity: 0.4; filter: grayscale(1);">🚀</div>
                    <h2 style="color: var(--white); margin-bottom: 0.75rem; font-weight: 800; letter-spacing: -0.5px;">Le Radar est en Scan...</h2>
                    <p style="color: var(--text-muted); max-width: 420px; margin: 0 auto; line-height: 1.7; font-size: 0.95rem;">
                        Nous surveillons le réseau DomTom Connect. Les nouvelles opportunités apparaîtront ici dès qu'elles seront publiées.
                    </p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="marketplace-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 2rem;">
                ${missions.map(m => {
            const urgencyColor = m.urgency === 'Haute' ? '#ff4757' : (m.urgency === 'Moyenne' ? '#ffa502' : '#2ed573');
            return `
                    <div class="mission-card elite-card" style="position: relative; padding: 2rem; border-radius: 24px; background: rgba(15, 15, 15, 0.6); border: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(10px);">
                        <div class="glow-edge" style="position: absolute; top: -1px; left: -1px; right: -1px; height: 3px; background: linear-gradient(90deg, transparent, ${urgencyColor}, transparent); opacity: 0.5;"></div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <span style="font-size: 0.65rem; font-weight: 800; color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase; background: rgba(255,255,255,0.03); padding: 4px 10px; border-radius: 100px;">${m.zone || 'Outre-Mer'}</span>
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${urgencyColor}; box-shadow: 0 0 10px ${urgencyColor};" title="Urgence: ${m.urgency}"></div>
                        </div>

                        <h3 style="margin: 0 0 1.25rem 0; font-size: 1.4rem; color: var(--white); font-weight: 800; line-height: 1.25; letter-spacing: -0.02em;">${this.escapeHtml(m.title)}</h3>
                        
                        <div style="margin-bottom: 2rem;">
                            <div style="font-size: 2rem; font-weight: 900; color: var(--primary); font-family: 'Inter', sans-serif;">${this.escapeHtml(m.budget)}<span style="font-size: 1rem; margin-left: 4px;">€</span></div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8;">Budget Alloué</div>
                        </div>

                        <p style="font-size: 0.95rem; line-height: 1.7; color: rgba(255,255,255,0.6); margin: 0 0 2.5rem 0; flex-grow: 1; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; font-weight: 400;">
                            ${this.escapeHtml(m.description)}
                        </p>

                        <div style="display: flex; gap: 1rem; margin-top: auto;">
                            <button class="button-primary elite-btn" style="flex: 1; height: 50px; font-weight: 700; border-radius: 14px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.15);" onclick="Marketplace.convertMissionToQuote('${m.id}')">
                                <i class="fas fa-bolt" style="margin-right: 10px;"></i> Répondre
                            </button>
                            <button class="button-secondary" style="width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03);" onclick="Marketplace.applyForMission('${m.id}')">
                                <i class="fas fa-envelope"></i>
                            </button>
                        </div>
                    </div>
                `}).join('')}
            </div>
            <style>
                .elite-card:hover { transform: translateY(-8px) scale(1.02); border-color: rgba(16, 185, 129, 0.4); box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
                .elite-btn { transition: all 0.3s ease; }
                .elite-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
            </style>
        `;
    },

    // ===== MY MISSIONS (posted by user) =====
    renderMyMissions(container) {
        const myMissions = this.getMyMissions();

        if (myMissions.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 5rem 2rem; background: var(--bg-sidebar); border-radius: 24px; border: 1px dashed var(--border);">
                    <div style="font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.6;">�</div>
                    <h3 style="color: var(--white); margin-bottom: 0.5rem; font-weight: 800;">Votre vitrine est vide</h3>
                    <p style="color: var(--text-muted); margin-bottom: 2rem; line-height: 1.6;">Publiez vos besoins et mobilisez les talents du réseau DomTomConnect.</p>
                    <button class="button-primary" onclick="Marketplace.showPostMissionForm()" style="border-radius: 12px; font-weight: 700;">Poster ma première mission</button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="marketplace-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
                ${myMissions.map(m => `
                    <div class="mission-card premium-glass" style="padding: 1.75rem; border-radius: 20px; border: 1px solid var(--primary-glass); background: rgba(16, 185, 129, 0.03); display: flex; flex-direction: column; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 0; right: 0; padding: 6px 14px; background: var(--primary); color: white; font-size: 0.6rem; font-weight: 900; letter-spacing: 1px; border-bottom-left-radius: 12px; box-shadow: -2px 2px 10px rgba(0,0,0,0.3);">ACTIVE</div>
                        
                        <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 1.25rem;">
                             <span style="font-size: 0.65rem; color: var(--primary); font-weight: 800;">MISSION PUBLIÉE</span>
                             <h3 style="margin: 0; font-size: 1.25rem; color: var(--white); font-weight: 700;">${this.escapeHtml(m.title)}</h3>
                        </div>

                        <div style="margin-bottom: 1.5rem; display: flex; align-items: baseline; gap: 0.5rem;">
                            <span style="font-size: 1.6rem; font-weight: 900; color: var(--primary);">${this.escapeHtml(m.budget)}€</span>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">${this.escapeHtml(m.zone)}</span>
                        </div>

                        <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-muted); margin: 0 0 2.5rem 0; flex-grow: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                            ${this.escapeHtml(m.description)}
                        </p>

                        <div style="display: flex; gap: 0.75rem; margin-top: auto; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05);">
                            <button class="button-secondary" style="flex: 1; border-radius: 10px; font-weight: 600; font-size: 0.85rem;" onclick="Marketplace.editMission('${m.id}')">
                                <i class="fas fa-pen-nib" style="margin-right: 6px;"></i> Éditer
                            </button>
                            <button class="button-secondary" style="border-radius: 10px; border-color: #ef4444; color: #ef4444; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center;" onclick="Marketplace.deleteMission('${m.id}')">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // ===== POST MISSION FORM =====
    showPostMissionForm() {
        const container = document.getElementById('mission-form-container');
        if (!container) return;

        const user = Auth.getUser();
        const companyName = user?.company?.name || '';

        container.innerHTML = `
            <div class="form-card" style="margin-bottom: 2rem; animation: slideDown 0.3s ease; background: #0a0a0a; border: 1px solid var(--border); border-radius: 12px; padding: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0; color: var(--white);">Poster une nouvelle mission</h3>
                    <button class="btn-close" onclick="Marketplace.hidePostMissionForm()" style="background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer;">✕</button>
                </div>
                <form onsubmit="Marketplace.saveMission(event)">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                        <div class="form-group">
                            <label class="form-label">Titre de la mission *</label>
                            <input type="text" name="title" class="form-input" required placeholder="Ex: Développement d'une app mobile">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Budget estimé (€) *</label>
                            <input type="number" name="budget" class="form-input" required placeholder="Ex: 3500">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Zone géographique *</label>
                            <select name="zone" class="form-input" required>
                                <option value="">-- Sélectionner --</option>
                                <option value="Guadeloupe">Guadeloupe (971)</option>
                                <option value="Martinique">Martinique (972)</option>
                                <option value="Guyane">Guyane (973)</option>
                                <option value="La Réunion">La Réunion (974)</option>
                                <option value="Mayotte">Mayotte (976)</option>
                                <option value="France Métropolitaine">France Métropolitaine</option>
                                <option value="Remote">100% Remote</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Urgence</label>
                            <select name="urgency" class="form-input">
                                <option value="Basse">Basse (flexible)</option>
                                <option value="Moyenne" selected>Moyenne (quelques semaines)</option>
                                <option value="Haute">Haute (urgent)</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group" style="margin-top: 1.5rem;">
                        <label class="form-label">Description de la mission *</label>
                        <textarea name="description" class="form-input" rows="4" required placeholder="Décrivez le projet, les compétences recherchées, les délais..."></textarea>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 2rem; justify-content: flex-end;">
                        <button type="button" class="button-secondary" onclick="Marketplace.hidePostMissionForm()">Annuler</button>
                        <button type="submit" class="button-primary">Publier la mission</button>
                    </div>
                </form>
            </div>
        `;
        container.scrollIntoView({ behavior: 'smooth' });
    },

    hidePostMissionForm() {
        const container = document.getElementById('mission-form-container');
        if (container) container.innerHTML = '';
    },

    async saveMission(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const mission = {
            id: Date.now().toString(),
            title: formData.get('title'),
            budget: formData.get('budget'),
            zone: formData.get('zone'),
            urgency: formData.get('urgency'),
            description: formData.get('description'),
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        // Saving via Central Storage (Cloud-First)
        try {
            console.log('[MARKETPLACE] Saving mission...', mission);
            const result = await Storage.addMission(mission);
            console.log('[MARKETPLACE] Mission saved successfully:', result);
            App.showNotification('Mission publiée et synchronisée !', 'success');
        } catch (err) {
            console.error('[MARKETPLACE] Sync error:', err);
            App.showNotification('Erreur de synchronisation : ' + err.message, 'error');
        }

        this.hidePostMissionForm();
        this.switchTab('my-missions');
    },

    getMyMissions() {
        const user = Auth.getUser();
        if (!user) return [];

        // Filter the collective marketplace missions to find "my" announcements
        return (Storage.getPublicMissions() || []).filter(m => m.user_id === user.id);
    },

    async deleteMission(id) {
        if (!confirm('Voulez-vous vraiment retirer cette annonce du Marketplace ?')) return;

        try {
            console.log('[MARKETPLACE] Deleting mission:', id);
            await Storage.deleteMission(id);
            App.showNotification('Annonce retirée du Marketplace.', 'success');
            this.switchTab(this.activeTab);
        } catch (e) {
            console.error('[MARKETPLACE] Delete error:', e);
            App.showNotification('Erreur lors de la suppression sur le serveur.', 'error');
        }
    },

    handleSearch(value) {
        this.render(undefined, this.activeTab); // Re-render with existing tab but could use logic to filter
        // Optimized: only filter current view
        const query = value.toLowerCase();
        const cards = document.querySelectorAll('.mission-card');
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? 'flex' : 'none';
        });
    },

    editMission(id) {
        App.showNotification('Fonctionnalité d\'édition à venir.', 'info');
    },

    // ===== PROVIDERS (Mes Prestataires) =====
    renderProviders(container) {
        // Unifié avec le module Network
        const providers = Storage.get(Storage.KEYS.PROVIDERS) || [];

        if (providers.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 4rem 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1.5rem;"></div>
                    <h3 style="color: var(--white); margin-bottom: 1rem;">Vos collaborations actives</h3>
                    <p style="color: var(--text-muted); margin-bottom: 2rem; max-width: 500px; margin-left: auto; margin-right: auto;">
                        Retrouvez ici les experts avec qui vous travaillez. Contactez un expert vérifié pour démarrer une collaboration.
                    </p>
                    <button class="button-primary" onclick="Marketplace.switchTab('experts')">Trouver un Expert</button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="section-header-inline">
                <h3 class="section-title-small">Mes Prestataires Actifs</h3>
            </div>
            <div class="partners-grid">
                ${providers.map(p => `
                    <div class="network-card glass" style="background: #0a0a0a; border: 1px solid var(--border); padding: 1.5rem; border-radius: 12px;">
                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--white);">${p.name}</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">${p.role}</p>
                        <button class="button-secondary small" style="margin-top: 1rem; width: 100%;">Contacter</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // ===== EXPERTS =====
    renderExperts(container) {
        // Liste des experts (dynamique dans le futur)
        const experts = []; // Initialement vide pour éviter le "fake" content

        container.innerHTML = `
            <div class="experts-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; gap: 2rem; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 300px;">
                    <h3 class="section-title-small">Annuaire des Experts Vérifiés</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Retrouvez des professionnels qualifiés et recommandés par DomTomConnect.</p>
                </div>
                <div style="background: var(--primary-glass); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--primary); max-width: 400px;">
                    <h4 style="margin: 0 0 0.5rem 0; color: var(--primary-light);">Vous êtes un expert ?</h4>
                    <p style="font-size: 0.8rem; margin-bottom: 1rem; opacity: 0.9;">Boostez votre visibilité et recevez des missions qualifiées en rejoignant le réseau.</p>
                    <button class="button-primary small" onclick="Marketplace.becomeExpert()" style="width: 100%;">Postuler au programme Expert</button>
                </div>
            </div>

            <div class="partners-grid">
                ${experts.length === 0 ? `
                    <div class="empty-state" style="grid-column: 1 / -1; padding: 2rem;">
                         <p class="text-muted">Chargement des profils vérifiés...</p>
                    </div>
                ` : experts.map(e => `
                    <div class="network-card glass" style="background: #0a0a0a; border: 1px solid var(--border); padding: 1.5rem; border-radius: 12px; display: flex; align-items: center; gap: 1.5rem; transition: all 0.3s ease;">
                        <div class="provider-avatar" style="width: 50px; height: 50px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; border: 2px solid white;">${e.avatar}</div>
                        <div class="provider-info" style="flex: 1;">
                            <h3 style="margin: 0; font-size: 1.1rem; color: var(--white);">${e.name} <span class="pro-badge-small" style="background: var(--primary); margin-left: 5px;">VÉRIFIÉ</span></h3>
                            <p style="margin: 0.2rem 0; color: var(--text-muted); font-size: 0.9rem;">${e.specialty}</p>
                            <p style="margin: 0; font-size: 0.8rem; opacity: 0.7;">${e.zone}</p>
                        </div>
                        <div style="display: flex; gap: 0.5rem; flex-direction: column;">
                            <button class="button-secondary small" style="padding: 0.4rem; font-size: 0.75rem;" onclick="Marketplace.contactExpert('${e.name}')">Message</button>
                            <button class="button-primary small" style="padding: 0.4rem; font-size: 0.75rem;" onclick="Marketplace.addExpertToCircle('${e.id}')">+ Cercle</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    addExpertToCircle(id) {
        // Dans une version réelle, on récupèrerait les données de l'API
        App.showNotification('Fonctionnalité d\'ajout en cours de développement.', 'info');
    },

    applyForMission(id) {
        // Use Storage cache
        const mission = this.getPublicMissions().find(m => m.id === id);
        if (mission) {
            const subject = encodeURIComponent(`Candidature pour la mission : ${mission.title}`);
            const body = encodeURIComponent(`Bonjour,\n\nJe souhaite postuler pour la mission "${mission.title}" (Budget: ${mission.budget}).\n\nCordialement,`);
            window.location.href = `mailto:domtomconnect@gmail.com?subject=${subject}&body=${body}`;
            App.showNotification('Ouverture de votre messagerie...', 'success');
        } else {
            window.location.href = `mailto:domtomconnect@gmail.com`;
        }
    },

    contactExpert(name) {
        App.showNotification(`Lancer une conversation avec ${name} via DomTomConnect...`, 'info');
    },

    becomeExpert() {
        const subject = encodeURIComponent("Candidature Expert Vérifié DomTom Connect");
        const body = encodeURIComponent("Bonjour,\n\nJe souhaite rejoindre le réseau d'experts DomTom Connect.\n\nVoici mon profil et mes compétences :\n\nCordialement,");
        window.location.href = `mailto:domtomconnect@gmail.com?subject=${subject}&body=${body}`;
        App.showNotification('Ouverture de votre messagerie...', 'success');
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    async convertMissionToQuote(id) {
        if (App.isFeatureProGated('marketplace_automation')) {
            App.showUpgradeModal('marketplace_automation');
            return;
        }

        const missions = this.getPublicMissions();
        const mission = missions.find(m => m.id == id);

        if (!mission) {
            App.showNotification('Mission introuvable.', 'error');
            return;
        }

        if (!confirm(`Voulez-vous créer automatiquement un devis pour la mission "${mission.title}" ?\n\nCela va créer un client temporaire et pré-remplir le devis.`)) return;

        // 1. Créer le client (si besoin, ou client générique "Opportunité Radar")
        const clients = Storage.getClients();
        let client = clients.find(c => c.name === 'Prospect Radar');

        if (!client) {
            client = {
                id: 'prospect-' + Date.now(),
                name: 'Prospect Radar',
                email: 'contact@domtomconnect.com',
                activity: 'Opportunité Marketplace',
                createdAt: new Date().toISOString()
            };
            // Async creation
            client = await Storage.addClient(client);
        }

        // 2. Créer le devis
        const quoteData = {
            clientId: client.id,
            status: 'draft',
            title: mission.title,
            items: [
                {
                    description: `Prestation : ${mission.title}\n(${mission.description})`,
                    quantity: 1,
                    unitPrice: parseFloat(mission.budget) || 0
                }
            ],
            notes: `Opportunité issue du Radar DomTomConnect. Zone: ${mission.zone}. Urgence: ${mission.urgency}.`
        };

        const newQuote = await Storage.addQuote(quoteData);

        App.showNotification('Devis et client créés avec succès !', 'success');

        // 3. Rediriger vers l'édition du devis
        App.navigateTo('quotes');
        setTimeout(() => {
            if (typeof Quotes !== 'undefined') {
                Quotes.edit(newQuote.id);
            }
        }, 500);
    }
};

window.Marketplace = Marketplace;
