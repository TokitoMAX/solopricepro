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
        if (typeof App !== 'undefined') App.checkFreemiumLimits(); // Added line
        document.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active')); // Changed .settings-tab to .m-tab
        const activeTab = document.querySelector(`.m-tab[onclick*="${tabId}"]`); // Changed .settings-tab to .m-tab
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
            // Robust mapping (Handle case-sensitivity if DB has capitalized keys)
            const title = m.title || m.Title || 'Mission sans titre';
            const desc = m.description || m.Description || 'Pas de description.';
            const budget = m.budget || m.Budget || '0';
            const urgency = m.urgency || m.Urgence || 'Moyenne';
            const zone = m.zone || m.Zone || 'Outre-Mer';

            const urgencyColor = urgency === 'Haute' ? '#ff4757' : (urgency === 'Moyenne' ? '#ffa502' : '#2ed573');
            return `
                    <div class="mission-card elite-card" style="position: relative; padding: 2rem; border-radius: 24px; background: rgba(15, 15, 15, 0.6); border: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(10px);">
                        <div class="glow-edge" style="position: absolute; top: -1px; left: -1px; right: -1px; height: 3px; background: linear-gradient(90deg, transparent, ${urgencyColor}, transparent); opacity: 0.5;"></div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <span style="font-size: 0.65rem; font-weight: 800; color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase; background: rgba(255,255,255,0.03); padding: 4px 10px; border-radius: 100px;">${this.escapeHtml(zone)}</span>
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${urgencyColor}; box-shadow: 0 0 10px ${urgencyColor};" title="Urgence: ${urgency}"></div>
                        </div>

                        <h3 style="margin: 0 0 1.25rem 0; font-size: 1.4rem; color: var(--white); font-weight: 800; line-height: 1.25; letter-spacing: -0.02em;">${this.escapeHtml(title)}</h3>
                        
                        <div style="margin-bottom: 2rem;">
                            <div style="font-size: 2rem; font-weight: 900; color: var(--primary); font-family: 'Inter', sans-serif;">${this.escapeHtml(budget)}<span style="font-size: 1rem; margin-left: 4px;">€</span></div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8;">Budget Alloué</div>
                        </div>

                        <p style="font-size: 0.95rem; line-height: 1.7; color: rgba(255,255,255,0.6); margin: 0 0 2rem 0; flex-grow: 1; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; font-weight: 400;">
                            ${this.escapeHtml(desc)}
                        </p>

                        <div class="poster-info" style="display: flex; align-items: center; gap: 10px; margin-bottom: 2rem; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--primary-glass); display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 800; font-size: 0.8rem;">
                                ${(m.poster_name || m.Poster_name || 'E').charAt(0)}
                            </div>
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-size: 0.75rem; color: var(--white); font-weight: 700; line-height: 1.2;">${this.escapeHtml(m.poster_name || m.Poster_name || 'Expert SoloPrice')}</span>
                                <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600;">${this.escapeHtml(m.poster_company || m.Poster_company || 'Pro Vérifié')}</span>
                            </div>
                        </div>

                        <div style="display: flex; gap: 1rem; margin-top: auto;">
                            <button class="button-primary elite-btn" style="flex: 1; height: 50px; font-weight: 700; border-radius: 14px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.15);" onclick="Marketplace.convertMissionToQuote('${m.id}')">
                                <i class="fas fa-bolt" style="margin-right: 10px;"></i> Répondre
                            </button>
                            <button class="button-secondary" style="width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03);" onclick="Marketplace.applyForMission('${m.id}')" title="Postuler via DomTomConnect">
                                <i class="fas fa-paper-plane"></i>
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
            <div class="marketplace-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 2rem;">
                ${myMissions.map(m => `
                    <div class="mission-card elite-card" style="position: relative; padding: 2.25rem; border-radius: 28px; background: rgba(16, 185, 129, 0.04); border: 1px solid rgba(16, 185, 129, 0.15); display: flex; flex-direction: column; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(12px);">
                        <div class="glow-edge" style="position: absolute; top: -1px; left: -1px; right: -1px; height: 3px; background: linear-gradient(90deg, transparent, var(--primary), transparent); opacity: 0.6;"></div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <span style="font-size: 0.65rem; color: var(--primary); font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">MA PUBLICATION</span>
                                <h3 style="margin: 0; font-size: 1.4rem; color: var(--white); font-weight: 800; line-height: 1.25;">${this.escapeHtml(m.title)}</h3>
                            </div>
                            <div class="status-dot" style="width: 12px; height: 12px; border-radius: 50%; background: var(--primary); box-shadow: 0 0 15px var(--primary);" title="En ligne"></div>
                        </div>

                        <div style="background: rgba(255,255,255,0.02); padding: 1.25rem; border-radius: 18px; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.04);">
                            <div style="font-size: 2.2rem; font-weight: 900; color: var(--white); font-family: 'Inter', sans-serif; letter-spacing: -1px;">${this.escapeHtml(m.budget)}<span style="font-size: 1.2rem; margin-left: 4px; color: var(--primary);">€</span></div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Budget Radar</div>
                        </div>

                        <p style="font-size: 1rem; line-height: 1.7; color: rgba(255,255,255,0.65); margin: 0 0 2.5rem 0; flex-grow: 1; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; font-weight: 400;">
                            ${this.escapeHtml(m.description)}
                        </p>

                        <div style="display: flex; gap: 1rem; margin-top: auto; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.06);">
                            <button class="button-secondary" style="flex: 2; height: 50px; border-radius: 14px; font-weight: 700; background: rgba(255,255,255,0.03); font-size: 0.9rem;" onclick="Marketplace.editMission('${m.id}')">
                                <i class="fas fa-edit" style="margin-right: 10px;"></i> Corriger
                            </button>
                            <button class="button-secondary" style="flex: 1; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; border-color: rgba(239, 68, 68, 0.3); color: #ff4757; background: rgba(239, 68, 68, 0.05);" onclick="Marketplace.deleteMission('${m.id}')">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // ===== POST MISSION FORM =====
    showPostMissionForm(missionData = null) {
        const container = document.getElementById('mission-form-container');
        if (!container) return;

        container.innerHTML = `
            <div class="elite-form-card" style="animation: slideDown 0.4s ease-out;">
                <div class="form-header" style="margin-bottom: 2rem;">
                    <h3 class="form-title" style="color: var(--primary); font-size: 1.5rem; font-weight: 800;">
                        ${missionData ? '<i class="fas fa-edit"></i> Modifier l\'annonce' : '<i class="fas fa-plus-circle"></i> Publier sur le Marketplace'}
                    </h3>
                    <p class="form-subtitle" style="color: var(--text-muted); opacity: 0.8;">
                        ${missionData ? 'Ajustez les détails de votre besoin pour attirer les bons experts.' : 'Décrivez votre besoin pour mobiliser le réseau.'}
                    </p>
                    ${!missionData ? `
                        <div style="margin-top: 1rem; padding: 10px 15px; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2); display: inline-flex; align-items: center; gap: 8px;">
                            <i class="fas fa-user-check" style="color: var(--primary);"></i>
                            <span style="font-size: 0.85rem; color: var(--white); font-weight: 600;">Publication en tant que : ${Storage.getUser()?.name || 'Utilisateur'} ${Storage.getUser()?.company?.name ? `(${Storage.getUser().company.name})` : ''}</span>
                        </div>
                    ` : ''}
                </div>
                <form onsubmit="Marketplace.saveMission(event)">
                    ${missionData ? `<input type="hidden" name="id" value="${missionData.id}">` : ''}
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                        <div class="form-group">
                            <label class="form-label">Titre de la mission *</label>
                            <input type="text" name="title" class="form-input" required placeholder="Ex: Création de site e-commerce" value="${missionData ? this.escapeHtml(missionData.title) : ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Budget estimé (€) *</label>
                            <input type="number" name="budget" class="form-input" required placeholder="Ex: 2500" value="${missionData ? missionData.budget : ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Zone géographique *</label>
                            <select name="zone" class="form-input" required>
                                <option value="">-- Sélectionner --</option>
                                <option value="Guadeloupe" ${missionData?.zone === 'Guadeloupe' ? 'selected' : ''}>Guadeloupe (971)</option>
                                <option value="Martinique" ${missionData?.zone === 'Martinique' ? 'selected' : ''}>Martinique (972)</option>
                                <option value="Guyane" ${missionData?.zone === 'Guyane' ? 'selected' : ''}>Guyane (973)</option>
                                <option value="La Réunion" ${missionData?.zone === 'La Réunion' ? 'selected' : ''}>La Réunion (974)</option>
                                <option value="Mayotte" ${missionData?.zone === 'Mayotte' ? 'selected' : ''}>Mayotte (976)</option>
                                <option value="France Métropolitaine" ${missionData?.zone === 'France Métropolitaine' ? 'selected' : ''}>France Métropolitaine</option>
                                <option value="Remote" ${missionData?.zone === 'Remote' ? 'selected' : ''}>100% Remote</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Urgence</label>
                            <select name="urgency" class="form-input">
                                <option value="Basse" ${missionData?.urgency === 'Basse' ? 'selected' : ''}>Basse (Largo)</option>
                                <option value="Moyenne" ${missionData?.urgency === 'Moyenne' || !missionData ? 'selected' : ''}>Moyenne (Standard)</option>
                                <option value="Haute" ${missionData?.urgency === 'Haute' ? 'selected' : ''}>Haute (ASAP)</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group" style="margin-top: 1.5rem;">
                        <label class="form-label">Description détaillée *</label>
                        <textarea name="description" class="form-input" rows="5" required placeholder="Détaillez vos attentes, délais et livrables...">${missionData ? this.escapeHtml(missionData.description) : ''}</textarea>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 2rem; justify-content: flex-end;">
                        <button type="button" class="button-secondary" onclick="Marketplace.hidePostMissionForm()">Annuler</button>
                        <button type="submit" class="button-primary" style="padding: 0 2rem;">
                            ${missionData ? 'Mettre à jour l\'annonce' : 'Lancer l\'appel d\'offre'}
                        </button>
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
        const missionId = formData.get('id');

        const user = Storage.getUser();
        const mission = {
            title: formData.get('title'),
            budget: formData.get('budget'),
            zone: formData.get('zone'),
            urgency: formData.get('urgency'),
            description: formData.get('description'),
            poster_name: user?.name || 'Expert SoloPrice',
            poster_company: user?.company?.name || '',
            status: 'open'
        };

        try {
            if (missionId) {
                console.log('[MARKETPLACE] Updating existing mission:', missionId);
                await Storage.updateMission(missionId, mission);
                App.showNotification('Annonce mise à jour avec succès.', 'success');
            } else {
                mission.id = Date.now().toString();
                console.log('[MARKETPLACE-UI] 🚀 Preparing save with payload:', mission);
                await Storage.addMission(mission);
                App.showNotification('Mission publiée sur le Marketplace !', 'success');
            }
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
        this.render(undefined, this.activeTab);
        const query = value.toLowerCase();
        const cards = document.querySelectorAll('.mission-card');
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? 'flex' : 'none';
        });
    },

    editMission(id) {
        const missions = Storage.getPublicMissions() || [];
        const mission = missions.find(m => m.id == id);
        if (!mission) {
            App.showNotification('Annonce introuvable.', 'error');
            return;
        }
        this.showPostMissionForm(mission);
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
        try {
            console.log('[MARKETPLACE] Initiating conversion for mission:', id);

            if (!App.enforceLimit('marketplace_response')) {
                console.warn('[MARKETPLACE] Response limit reached.');
                return;
            }

            const missions = this.getPublicMissions();
            const mission = missions.find(m => m.id == id);

            if (!mission) {
                App.showNotification('Mission introuvable.', 'error');
                return;
            }

            // Robust data mapping
            const title = mission.title || mission.Title || 'Mission sans titre';
            const budget = mission.budget || mission.Budget || '0';
            const zone = mission.zone || mission.Zone || 'Outre-Mer';
            const urgency = mission.urgency || mission.Urgence || 'Moyenne';

            if (!confirm(`Voulez-vous créer automatiquement un devis pour la mission "${title}" ?\n\nCela va créer un client temporaire et pré-remplir le devis.`)) return;

            // 1. Créer le client (si besoin, ou client générique "Opportunité Radar")
            const clients = Storage.getClients();
            let client = clients.find(c => c.name === 'Prospect Radar');

            if (!client) {
                console.log('[MARKETPLACE] Creating generic prospect...');
                const newClientData = {
                    name: 'Prospect Radar',
                    email: 'contact@domtomconnect.com',
                    activity: 'Opportunité Marketplace'
                };
                client = await Storage.addClient(newClientData);
            }

            // 2. Créer le devis avec répartition automatique (Commission DomTomConnect)
            console.log('[MARKETPLACE] Creating quote with commission...');
            const rawBudget = parseFloat(budget) || 0;
            const commissionRate = 0.20; // 20% commission par défaut
            const commissionAmount = Math.round(rawBudget * commissionRate);
            const expertAmount = rawBudget - commissionAmount;

            const quoteData = {
                clientId: client.id,
                status: 'draft',
                items: [
                    {
                        description: `Prestation : ${title} (Radar: ${zone}, ${urgency})`,
                        quantity: 1,
                        unitPrice: expertAmount
                    },
                    {
                        description: `Frais de mise en relation & Plateforme DomTomConnect (20%)`,
                        quantity: 1,
                        unitPrice: commissionAmount
                    }
                ]
                // Notes removed to avoid SQL error (column missing in sp_quotes)
            };

            const newQuote = await Storage.addQuote(quoteData);
            if (!newQuote) throw new Error("Échec de la création du devis.");

            App.showNotification('Devis et client créés avec succès !', 'success');

            // 3. Rediriger vers l'édition du devis
            App.navigateTo('quotes');
            setTimeout(() => {
                if (typeof Quotes !== 'undefined') {
                    Quotes.edit(newQuote.id);
                }
            }, 500);
        } catch (error) {
            console.error('[MARKETPLACE] Conversion error:', error);
            App.showNotification('Erreur lors de la conversion : ' + error.message, 'error');
        }
    }
};

window.Marketplace = Marketplace;
