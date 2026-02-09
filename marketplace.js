/**
 * SoloPrice Pro - Marketplace & Hub Module
 * Fusion des Opportunités DomTomConnect, de la Prospection et du Réseau.
 */
const Marketplace = {
    activeTab: 'missions',

    missions: [],

    render(containerId = 'marketplace-content') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="page-header" style="margin-bottom: 2rem;">
                <div>
                    <h1 class="page-title" style="display: flex; align-items: center; gap: 10px;">
                        Marketplace <span class="badge-pro" style="background: var(--primary); font-size: 0.7rem; color: white; padding: 4px 8px; border-radius: 6px;">DOMTOM CONNECT</span>
                    </h1>
                    <p class="page-subtitle">Opportunités et collaborations dans les outre-mer.</p>
                </div>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div class="search-box" style="position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 12px; top: 12px; color: var(--text-muted); font-size: 0.9rem;"></i>
                        <input type="text" id="marketplace-search" class="form-input" placeholder="Filtrer..." style="padding-left: 35px; width: 180px; background: rgba(255,255,255,0.03);" oninput="Marketplace.handleSearch(this.value)">
                    </div>
                    <button class="button-primary" onclick="Marketplace.showPostMissionForm()" style="box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                        <i class="fas fa-plus"></i> Poster
                    </button>
                </div>
            </div>

            <div id="mission-form-container"></div>

            <div id="marketplace-dynamic-content" class="marketplace-container" style="animation: fadeIn 0.4s ease;">
                <!-- Content via renderMissions -->
            </div>
        `;

        this.renderMissions();
    },

    switchTab(tabId) {
        // Obsolete but kept for compatibility during transition
        this.renderMissions();
    },

    getPublicMissions() {
        // Read from Storage Cache (populated by Storage.fetchAllData)
        return Storage.getPublicMissions() || [];
    },

    // ===== MISSIONS RADAR (from others) =====
    renderMissions() {
        const container = document.getElementById('marketplace-dynamic-content');
        if (!container) return;

        const missions = this.getPublicMissions();
        const currentUser = Storage.getUser();

        if (missions.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 4rem 1rem; background: rgba(255,255,255,0.01); border-radius: 20px; border: 1px dashed var(--border);">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">📡</div>
                    <h3 style="color: var(--white); margin-bottom: 0.5rem;">Radar Activé</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Aucune mission trouvée pour le moment. Elles s'afficheront ici dès leur publication.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="marketplace-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem;">
                ${missions.map(m => {
            const isOwner = currentUser && (m.user_id === currentUser.id);
            const title = m.title || m.Title || 'Mission sans titre';
            const budget = m.budget || m.Budget || '0';
            const zone = m.zone || m.Zone || 'Outre-Mer';
            const urgency = m.urgency || m.Urgency || 'Normal';
            const desc = m.description || m.Description || '';

            // Poster info extraction or fallback
            let posterName = m.poster_name || 'Utilisateur';
            let posterCompany = m.poster_company || 'Membre du réseau';
            const isProPoster = (m.poster_role || '').toLowerCase().includes('pro');
            const initials = (posterName).charAt(0).toUpperCase();

            const urgencyColor = urgency === 'Urgent' ? '#ef4444' : (urgency === 'Prioritaire' ? '#f59e0b' : '#10b981');

            return `
                    <div class="mission-card elite-card" style="position: relative; padding: 1.5rem; border-radius: 20px; background: ${isOwner ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${isOwner ? 'var(--primary-glass)' : 'rgba(255,255,255,0.05)'}; display: flex; flex-direction: column; gap: 1rem; min-height: 280px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 0.6rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">${this.escapeHtml(zone)}</span>
                                ${isOwner ? '<span style="background: var(--primary); color: #000; font-size: 0.55rem; font-weight: 900; padding: 2px 6px; border-radius: 4px;">MA MISSION</span>' : ''}
                            </div>
                            <div style="width: 8px; height: 8px; border-radius: 50%; background: ${urgencyColor}; box-shadow: 0 0 8px ${urgencyColor};"></div>
                        </div>

                        <h3 style="margin: 0; font-size: 1.2rem; color: var(--white); font-weight: 700;">${this.escapeHtml(title)}</h3>
                        
                        <div style="display: flex; align-items: baseline; gap: 4px;">
                            <span style="font-size: 1.8rem; font-weight: 800; color: var(--primary);">${this.escapeHtml(budget)}€</span>
                        </div>

                        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.6); margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; flex-grow: 1;">
                            ${this.escapeHtml(desc)}
                        </p>

                        <div style="display: flex; gap: 0.8rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05);">
                            ${isOwner ? `
                                <button class="button-secondary" style="flex: 1; height: 40px; font-weight: 700; border-radius: 10px; opacity: 0.7; cursor: default;" disabled>
                                    C'est votre annonce
                                </button>
                                <button class="button-secondary" style="width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03);" onclick="Marketplace.showPostMissionForm(${JSON.stringify(m).replace(/"/g, '&quot;')})" title="Modifier l'annonce">
                                    <i class="fas fa-edit"></i>
                                </button>
                            ` : `
                                <button class="button-primary elite-btn" style="flex: 1; height: 40px; font-weight: 700; border-radius: 10px;" onclick="Marketplace.showPitchModal('${m.id}')">
                                    <i class="fas fa-bolt" style="margin-right: 8px;"></i> Proposer
                                </button>
                                <button class="button-secondary" style="width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03);" onclick="Marketplace.applyForMission('${m.id}')">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            `}
                        </div>
                    </div>
                `}).join('')}
            </div>
        `;
    },
            </div >
    <style>
        .elite-card:hover {transform: translateY(-8px) scale(1.02); border-color: rgba(16, 185, 129, 0.4); box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        <style>
            .elite-card:hover {transform: translateY(-8px) scale(1.02); border-color: rgba(16, 185, 129, 0.4); box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
            .elite-btn {transition: all 0.3s ease; }
            .elite-btn:hover {filter: brightness(1.1); transform: scale(1.02); }
        </style>
        `;
    },

        // Simplified My Missions getter
        getMyMissions() {
        const user = Auth.getUser();
        if (!user) return [];
        return (Storage.getPublicMissions() || []).filter(m => m.user_id === user.id);
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
                        <input type="number" name="budget" id="post-mission-budget" class="form-input" required placeholder="Ex: 2500" value="${missionData ? missionData.budget : ''}" oninput="Marketplace.updateCommissionBreakdown(this.value, 'commission-breakdown-post')">
                            <div id="commission-breakdown-post" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                                <span>Part Reçue par l'Expert (80%) : <strong>${missionData ? Math.round(missionData.budget * 0.8) : 0}€</strong></span><br>
                                    <span>Frais Plateforme (20%) : <span style="color: var(--warning);">${missionData ? Math.round(missionData.budget * 0.2) : 0}€</span></span>
                            </div>
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
        container.scrollIntoView({behavior: 'smooth' });
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
        const roleLabel = user?.isPro ? 'Expert Pro' : 'Client';
        const portfolio = user?.company?.portfolio || '';

        const mission = {
            title: formData.get('title'),
        budget: formData.get('budget'),
        zone: formData.get('zone'),
        urgency: formData.get('urgency'),
        description: formData.get('description') + `\n\n(Publié par : ${roleLabel} - ${user?.name || 'Utilisateur'} / Email : ${user?.email || ''} ${user?.company?.name ? ` / Enterprise : ${user.company.name}` : ''}${portfolio ? ` / Portfolio : ${portfolio}` : ''})`,
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
        this.renderMissions();
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
        const user = Storage.getUser();
        const portfolio = user?.company?.portfolio || '';
        const posterName = mission.poster_name || mission.Poster_name || 'Recruteur';
        const subject = encodeURIComponent(`Intérêt pour votre mission : ${mission.title} (Via Radar SoloPrice)`);

        let bodyText = `Bonjour ${posterName},\n\nJ'ai vu votre annonce "${mission.title}" sur le Radar SoloPrice Pro et votre projet m'intéresse vivement.\n\nEn tant qu'expert sur le réseau, je souhaiterais vous proposer mes services pour vous accompagner sur ce besoin (Budget: ${mission.budget}€).\n\nVoici pourquoi mon profil pourrait correspondre :\n- [Décrivez votre expertise ici...]\n`;

        if (portfolio) {
            bodyText += `\nVous pouvez consulter mon portfolio ici : ${portfolio}\n`;
        }

        bodyText += `\nDans l'attente de votre retour,\n\nCordialement,`;

        window.location.href = `mailto:domtomconnect@gmail.com?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
        App.showNotification('Préparation de votre message de contact...', 'success');
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

        async showPitchModal(id) {
    if (!App.enforceLimit('marketplace_response')) return;

        const missions = this.getPublicMissions();
    const mission = missions.find(m => m.id == id);
        if (!mission) return;

        const user = Auth.getUser();
        const portfolio = user?.company?.portfolio || '';

        // Create modal overlay if it doesn't exist
        let modal = document.getElementById('pitch-modal');
        if (!modal) {
            modal = document.createElement('div');
        modal.id = 'pitch-modal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

        modal.innerHTML = `
        <div class="modal-content glass" style="max-width: 600px; padding: 2.5rem;">
            <button class="modal-close" onclick="Marketplace.hidePitchModal()">✕</button>

            <div style="margin-bottom: 2rem;">
                <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--white); margin-bottom: 0.5rem;">Pitch de Mission</h2>
                <p class="text-muted" style="font-size: 0.9rem;">Convainquez le client par la <strong>valeur</strong> que vous apportez.</p>
            </div>

            <div class="mission-mini-card" style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 16px; margin-bottom: 2rem; border-left: 4px solid var(--primary);">
                <div style="font-size: 0.75rem; color: var(--primary); font-weight: 800; text-transform: uppercase;">PROJET</div>
                <div style="font-size: 1.1rem; color: var(--white); font-weight: 700;">${this.escapeHtml(mission.title)}</div>
            </div>

            <form onsubmit="Marketplace.submitPitch(event, '${id}')">
                <input type="hidden" id="pitch-poster-email" value="${mission.poster_email || ''}">
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label class="form-label" style="display: flex; justify-content: space-between;">
                            Projection de Valeur (ROI)
                            <span style="font-size: 0.7rem; color: var(--primary); font-weight: 900;">CONCEPT UNIQUE <i class="fas fa-crown"></i></span>
                        </label>
                        <textarea id="pitch-roi" class="form-input" rows="2" placeholder="Ex: 'Ce projet vous fera gagner 10h/semaine via l'automatisation' ou 'Je vise +15% de CA'..." required></textarea>
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px;">C'est ici que vous faites la différence. Vendez le résultat, pas votre temps.</p>
                    </div>

                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label class="form-label">Message d'accroche personnel</label>
                        <textarea id="pitch-message" class="form-input" rows="4" placeholder="Bonjour, votre projet m'intéresse car..." required></textarea>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                        <div class="form-group">
                            <label class="form-label">Budget PROJET (€)</label>
                            <input type="number" id="pitch-budget" class="form-input" value="${mission.budget}" oninput="Marketplace.updateCommissionBreakdown(this.value)" required>
                                <div id="commission-breakdown" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                                    <span>Net Expert : <strong>${Math.round(mission.budget * 0.8)}€</strong></span><br>
                                        <span>Commission (20%) : <span style="color: var(--warning);">${Math.round(mission.budget * 0.2)}€</span></span>
                                </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Délai estimé</label>
                            <input type="text" id="pitch-deadline" class="form-input" placeholder="Ex: 10 jours" required>
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 2.5rem;">
                        <label class="form-label">Lien Portfolio / Référence</label>
                        <input type="url" id="pitch-portfolio" class="form-input" value="${portfolio}" placeholder="https://votre-site.com">
                    </div>

                    <div style="background: rgba(16, 185, 129, 0.05); padding: 15px; border-radius: 12px; margin-bottom: 2rem; border: 1px solid rgba(16, 185, 129, 0.1);">
                        <p style="font-size: 0.8rem; color: var(--primary-light); margin: 0; line-height: 1.4;">
                            <i class="fas fa-info-circle"></i> <strong>Ce qui va se passer :</strong> 1. Votre messagerie s'ouvre avec le pitch prêt à l'envoi. 2. Un devis brouillon est créé pour vous dans "Documents".
                        </p>
                    </div>

                    <button type="submit" class="button-primary full-width" style="height: 55px; font-size: 1.1rem; font-weight: 800; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);">
                        <i class="fas fa-paper-plane" style="margin-right: 12px;"></i> Envoyer ma proposition
                    </button>
            </form>
        </div>
        `;

        modal.classList.add('active');
        modal.style.display = 'flex';
},

        async submitPitch(e, missionId) {
            e.preventDefault();
        const roi = document.getElementById('pitch-roi').value.trim();
        const message = document.getElementById('pitch-message').value.trim();
        const budget = parseFloat(document.getElementById('pitch-budget').value) || 0;
        const deadline = document.getElementById('pitch-deadline').value.trim();
        const portfolio = document.getElementById('pitch-portfolio').value.trim();
        const posterEmail = document.getElementById('pitch-poster-email').value || 'domtomconnect@gmail.com';

        const commission = Math.round(budget * 0.2);
        const netExpert = budget - commission;

        const missions = this.getPublicMissions();
    const mission = missions.find(m => m.id == missionId);
        if (!mission) return;

        const user = Auth.getUser();
        const posterName = mission.poster_name || mission.Poster_name || 'Recruteur';
        const subject = encodeURIComponent(`Proposition Smart Pitch : ${mission.title} (Via Radar SoloPrice)`);

        let bodyText = `Bonjour ${posterName},\n\nJ'ai analysé votre besoin pour "${mission.title}" et je souhaite vous proposer mes services.\n\n`;
        bodyText += `PROJECTION DE VALEUR :\n${roi}\n\n`;
        bodyText += `Message d'accroche :\n${message}\n\n`;
        bodyText += `ESTIMATION :\n- Budget Total (Plateforme DomTomConnect incluse) : ${budget}€\n- Délai estimé : ${deadline}\n`;

        if (portfolio) {
            bodyText += `\nMon Portfolio : ${portfolio}\n`;
    }

        // Send to poster, Cc to platform
        const mailTo = posterEmail;
        const cc = posterEmail === 'domtomconnect@gmail.com' ? '' : 'domtomconnect@gmail.com';

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnHtml = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

        const response = await fetch(`${Auth.apiBase}/api/marketplace/apply`, {
            method: 'POST',
        headers: Storage.getHeaders(),
        body: JSON.stringify({
            to: mailTo,
        subject: decodeURIComponent(subject),
        body: bodyText,
        cc: cc
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Erreur lors de l'envoi");
        }

        this.hidePitchModal();
        App.showNotification('Votre proposition a été envoyée avec succès !', 'success');

        // Optionnel: Créer un devis en brouillon quand même en arrière plan
        this.convertMissionToQuote(missionId, true);

    } catch (error) {
            console.error('[MARKETPLACE] Application error:', error);
        App.showNotification(`Erreur : ${error.message}. Assurez-vous que le service SMTP est configuré.`, 'error');

        // Fallback: If direct send fails and user is desperate, offer the old mailto?
        // For now, just re-enable the button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
    }
},

        hidePitchModal() {
    const modal = document.getElementById('pitch-modal');
        if (modal) {
            modal.classList.remove('active');
        modal.style.display = 'none';
    }
},

        updateCommissionBreakdown(val, elementId = 'commission-breakdown') {
    const budget = parseFloat(val) || 0;
        const breakdown = document.getElementById(elementId);
        if (breakdown) {
        const commission = Math.round(budget * 0.2);
        const net = budget - commission;
        if (elementId === 'commission-breakdown-post') {
            breakdown.innerHTML = `
                    <span>Part Reçue par l'Expert (80%) : <strong>${net}€</strong></span><br>
                    <span>Frais Plateforme (20%) : <span style="color: var(--warning);">${commission}€</span></span>
                `;
        } else {
            breakdown.innerHTML = `
                    <span>Net Expert : <strong>${net}€</strong></span><br>
                    <span>Commission (20%) : <span style="color: var(--warning);">${commission}€</span></span>
                `;
        }
    }
},

        async convertMissionToQuote(id, silent = false) {
    try {
            console.log('[MARKETPLACE] Initiating conversion for mission:', id);

        if (!silent && !App.enforceLimit('marketplace_response')) {
            console.warn('[MARKETPLACE] Response limit reached.');
        return;
        }

        const missions = this.getPublicMissions();
        const mission = missions.find(m => m.id == id);

        if (!mission) {
            if (!silent) App.showNotification('Mission introuvable.', 'error');
        return;
        }

        // Robust data mapping
        const title = mission.title || mission.Title || 'Mission sans titre';
        const budget = mission.budget || mission.Budget || '0';
        const zone = mission.zone || mission.Zone || 'Outre-Mer';
        const urgency = mission.urgency || mission.Urgence || 'Moyenne';

        if (!silent) {
            if (!confirm(`Voulez-vous créer automatiquement un devis pour la mission "${title}" ?\n\nCela va créer un client temporaire et pré-remplir le devis.`)) return;
        }

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
        };

        const newQuote = await Storage.addQuote(quoteData);
        if (!newQuote) throw new Error("Échec de la création du devis.");

        if (!silent) {
            App.showNotification('Devis et client créés avec succès !', 'success');
        // 3. Rediriger vers l'édition du devis
        App.navigateTo('quotes');
            setTimeout(() => {
                if (typeof Quotes !== 'undefined') {
            Quotes.edit(newQuote.id);
                }
            }, 500);
        }
    } catch (error) {
            console.error('[MARKETPLACE] Conversion error:', error);
        if (!silent) App.showNotification('Erreur lors de la conversion : ' + error.message, 'error');
    }
}
};

        window.Marketplace = Marketplace;
