/**
 * SoloPrice Pro - Marketplace v3.0 NUCLEAR CACHE-BUST
 */
alert('📡 [SOLOPRICE-v3.0] Marketplace Loading...');
console.log('📡 [MARKETPLACE-v3.0] Nuclear script loading...');

const Marketplace = {
    render(containerId = 'marketplace-root') {
        console.log('📡 [MARKETPLACE-v3.0] Render called on:', containerId);
        const container = document.getElementById(containerId);
        if (!container) {
            alert('CRITICAL: Marketplace container not found: ' + containerId);
            return;
        }

        container.innerHTML = `
            <div class="page-header" style="margin-bottom: 2rem;">
                <div>
                    <h1 class="page-title" style="display: flex; align-items: center; gap: 10px;">
                        MARKETPLACE v3.0 <span class="badge-pro" style="background: var(--primary); font-size: 0.7rem; color: white; padding: 4px 8px; border-radius: 6px;">NUCLEAR FIX</span>
                    </h1>
                    <p class="page-subtitle">Cache-Bust forcé et Radar actif.</p>
                </div>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <button class="button-primary" onclick="Marketplace.showPostMissionForm()">
                        <i class="fas fa-plus"></i> Poster
                    </button>
                </div>
            </div>

            <div id="mission-form-container"></div>
            <div id="marketplace-dynamic-content" class="marketplace-container">
                <p style="text-align: center; color: var(--text-muted); padding: 4rem;">📡 Radar en cours d'initialisation...</p>
            </div>
        `;

        setTimeout(() => this.renderMissions(), 300);
    },

    getPublicMissions() {
        return (typeof Storage !== 'undefined' && Storage.getPublicMissions) ? Storage.getPublicMissions() : [];
    },

    renderMissions() {
        console.log('📡 [MARKETPLACE-v3.0] Rendering mission list');
        const container = document.getElementById('marketplace-dynamic-content');
        if (!container) return;

        const missions = this.getPublicMissions();
        const mktUser = (typeof Storage !== 'undefined') ? Storage.getUser() : null;

        if (missions.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 4rem 1rem; background: rgba(255,255,255,0.01); border-radius: 20px; border: 1px dashed var(--border);">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">📡</div>
                    <h3 style="color: var(--white); margin-bottom: 0.5rem;">Aucune mission</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Le radar est actif. Publiez pour voir votre annonce.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="marketplace-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem;">
                ${missions.map(m => {
            const isOwner = mktUser && (m.user_id === mktUser.id);
            const title = this.escapeHtml(m.title || 'Sans titre');
            const budget = this.escapeHtml(m.budget || '0');
            return `
                        <div class="mission-card elite-card" style="padding: 1.5rem; border-radius: 20px; background: rgba(255,255,255,0.02); border: 1px solid ${isOwner ? 'var(--primary-glass)' : 'rgba(255,255,255,0.05)'};">
                            <h3 style="color: var(--white); margin: 0 0 1rem 0;">${title}</h3>
                            <div style="font-size: 1.5rem; color: var(--primary); font-weight: 800;">${budget}€</div>
                            <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                                ${isOwner ? `
                                    <button class="button-secondary" style="flex: 1;" onclick="Marketplace.editMission('${m.id}')">Gérer</button>
                                ` : `
                                    <button class="button-primary" style="flex: 1;" onclick="Marketplace.applyForMission('${m.id}')">Répondre</button>
                                `}
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    showPostMissionForm(missionData = null) {
        const container = document.getElementById('mission-form-container');
        if (!container) return;
        container.innerHTML = `
            <div class="glass" style="padding: 2rem; border-radius: 20px; margin-bottom: 2rem; border: 1px solid var(--border);">
                <h3>${missionData ? 'Modifier' : 'Poster'}</h3>
                <form onsubmit="Marketplace.saveMission(event)">
                    ${missionData ? `<input type="hidden" name="id" value="${missionData.id}">` : ''}
                    <input type="text" name="title" class="form-input" required placeholder="Titre" value="${missionData ? this.escapeHtml(missionData.title) : ''}" style="margin-bottom: 1rem; width: 100%;">
                    <input type="number" name="budget" class="form-input" required placeholder="Budget" value="${missionData ? missionData.budget : ''}" style="margin-bottom: 1rem; width: 100%;">
                    <textarea name="description" class="form-input" rows="4" style="margin-bottom: 1rem; width: 100%;" required placeholder="Détails...">${missionData ? this.escapeHtml(missionData.description) : ''}</textarea>
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" class="button-secondary" onclick="Marketplace.hidePostMissionForm()">Annuler</button>
                        <button type="submit" class="button-primary">Publier</button>
                    </div>
                </form>
            </div>
        `;
    },

    hidePostMissionForm() {
        const container = document.getElementById('mission-form-container');
        if (container) container.innerHTML = '';
    },

    async saveMission(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const missionId = formData.get('id');
        const mission = {
            title: formData.get('title'),
            budget: formData.get('budget'),
            description: formData.get('description'),
            zone: 'Outre-Mer',
            status: 'open'
        };
        try {
            if (missionId) await Storage.updateMission(missionId, mission);
            else await Storage.addMission(mission);
            App.showNotification('Publication réussie !', 'success');
            this.hidePostMissionForm();
            this.renderMissions();
        } catch (err) { App.showNotification('Erreur', 'error'); }
    },

    editMission(id) {
        const missions = this.getPublicMissions();
        const mission = missions.find(m => m.id == id);
        if (mission) this.showPostMissionForm(mission);
    },

    applyForMission(id) {
        const mission = this.getPublicMissions().find(m => m.id === id);
        if (mission) {
            window.location.href = `mailto:domtomconnect@gmail.com?subject=Mission: ${encodeURIComponent(mission.title)}`;
        }
    },

    handleSearch(val) {
        const q = val.toLowerCase();
        document.querySelectorAll('.mission-card').forEach(c => {
            c.style.display = c.textContent.toLowerCase().includes(q) ? 'flex' : 'none';
        });
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

window.Marketplace = Marketplace;
console.log('📡 [MARKETPLACE-v3.0] Initialized.');
