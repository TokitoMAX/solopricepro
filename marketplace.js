/**
 * SoloPrice Pro - Marketplace & Hub Module
 * Fusion des Opportunités DomTomConnect, de la Prospection et du Réseau.
 */
const Marketplace = {
    activeTab: 'missions',

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

    getPublicMissions() {
        return Storage.getPublicMissions() || [];
    },

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

            let posterName = m.poster_name || 'Utilisateur';
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
                                <button class="button-secondary" style="width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03);" onclick="Marketplace.editMission('${m.id}')" title="Modifier l'annonce">
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
            <style>
                .elite-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .elite-card:hover { transform: translateY(-8px); border-color: var(--primary-glass); box-shadow: 0 15px 30px rgba(0,0,0,0.4); }
                .elite-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
            </style>
        `;
    },

    showPostMissionForm(missionData = null) {
        const container = document.getElementById('mission-form-container');
        if (!container) return;

        container.innerHTML = `
            <div class="elite-form-card" style="animation: slideDown 0.4s ease-out; background: rgba(255,255,255,0.02); padding: 2rem; border-radius: 20px; border: 1px solid var(--border); margin-bottom: 2rem;">
                <div class="form-header" style="margin-bottom: 1.5rem;">
                    <h3 style="color: var(--primary); font-size: 1.2rem; font-weight: 800; margin: 0;">
                        ${missionData ? 'Modifier l\'annonce' : 'Publier une mission'}
                    </h3>
                </div>
                <form onsubmit="Marketplace.saveMission(event)">
                    ${missionData ? `<input type="hidden" name="id" value="${missionData.id}">` : ''}
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem;">
                        <input type="text" name="title" class="form-input" required placeholder="Titre de la mission" value="${missionData ? this.escapeHtml(missionData.title) : ''}">
                        <input type="number" name="budget" class="form-input" required placeholder="Budget (€)" value="${missionData ? missionData.budget : ''}">
                        <select name="zone" class="form-input" required>
                            <option value="Guadeloupe" ${missionData?.zone === 'Guadeloupe' ? 'selected' : ''}>Guadeloupe (971)</option>
                            <option value="Martinique" ${missionData?.zone === 'Martinique' ? 'selected' : ''}>Martinique (972)</option>
                            <option value="Guyane" ${missionData?.zone === 'Guyane' ? 'selected' : ''}>Guyane (973)</option>
                            <option value="La Réunion" ${missionData?.zone === 'La Réunion' ? 'selected' : ''}>La Réunion (974)</option>
                            <option value="Mayotte" ${missionData?.zone === 'Mayotte' ? 'selected' : ''}>Mayotte (976)</option>
                            <option value="France Métropolitaine" ${missionData?.zone === 'France Métropolitaine' ? 'selected' : ''}>France Métropolitaine</option>
                            <option value="Remote" ${missionData?.zone === 'Remote' || !missionData ? 'selected' : ''}>Remote</option>
                        </select>
                    </div>
                    <textarea name="description" class="form-input" rows="4" style="margin-top: 1rem;" required placeholder="Détaillez votre besoin...">${missionData ? this.escapeHtml(missionData.description) : ''}</textarea>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem; justify-content: flex-end;">
                        <button type="button" class="button-secondary" onclick="Marketplace.hidePostMissionForm()">Annuler</button>
                        <button type="submit" class="button-primary">Publier</button>
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
            description: formData.get('description'),
            urgency: 'Normal',
            status: 'open'
        };

        try {
            if (missionId) {
                await Storage.updateMission(missionId, mission);
                App.showNotification('Mise à jour réussie', 'success');
            } else {
                await Storage.addMission(mission);
                App.showNotification('Publication réussie', 'success');
            }
            this.hidePostMissionForm();
            this.renderMissions();
        } catch (err) {
            App.showNotification('Erreur: ' + err.message, 'error');
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
        const missions = this.getPublicMissions();
        const mission = missions.find(m => m.id === id);
        if (mission) this.showPostMissionForm(mission);
    },

    applyForMission(id) {
        const mission = this.getPublicMissions().find(m => m.id === id);
        if (mission) {
            const subject = encodeURIComponent(`Intérêt : ${mission.title}`);
            const body = encodeURIComponent(`Bonjour,\n\nJe suis intéressé par votre mission "${mission.title}".`);
            window.location.href = `mailto:domtomconnect@gmail.com?subject=${subject}&body=${body}`;
        }
    },

    async showPitchModal(id) {
        const mission = this.getPublicMissions().find(m => m.id === id);
        if (!mission) return;

        // Simple alert for now as pitch modal is complex to rewrite perfectly without reference
        App.showNotification('Pitch en cours d\'ouverture...', 'info');
        this.applyForMission(id);
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

window.Marketplace = Marketplace;
