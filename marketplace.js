/**
 * SoloPrice Pro - Marketplace v4.0 (Clean & Robust)
 */
console.log('📡 [MARKETPLACE-v4.0] Module Initializing...');

const Marketplace = {
    render(containerId = 'marketplace-root') {
        console.log('📡 [MARKETPLACE-v4.0] Render called');
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="page-header" style="margin-bottom: 2rem;">
                <div>
                    <h1 class="page-title" style="display: flex; align-items: center; gap: 10px;">
                        MARKETPLACE <span class="badge-pro" style="background: var(--primary); font-size: 0.7rem; color: white; padding: 4px 8px; border-radius: 6px;">v4.0 RADAR</span>
                    </h1>
                    <p class="page-subtitle">Trouvez des missions ou recrutez des experts DomTomConnect.</p>
                </div>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <button class="button-primary" onclick="Marketplace.showPostMissionForm()">
                        <i class="fas fa-plus"></i> Publier une Mission
                    </button>
                </div>
            </div>

            <div id="mission-form-container"></div>
            <div id="marketplace-dynamic-content" class="marketplace-container">
                <p style="text-align: center; color: var(--text-muted); padding: 4rem;">📡 Radar en cours d'analyse...</p>
            </div>
        `;

        // Load data immediately
        this.renderMissions();
    },

    async renderMissions() {
        console.log('📡 [MARKETPLACE-v4.0] Loading missions...');
        const container = document.getElementById('marketplace-dynamic-content');
        if (!container) return;

        try {
            // Fetch fresh data from Storage
            const missions = (typeof Storage !== 'undefined' && Storage.getPublicMissions) ? await Storage.getPublicMissions() : [];
            const user = (typeof Storage !== 'undefined') ? Storage.getUser() : null;

            if (!missions || missions.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="text-align: center; padding: 4rem 1rem; background: rgba(255,255,255,0.01); border-radius: 20px; border: 1px dashed var(--border);">
                        <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">📡</div>
                        <h3 style="color: var(--white); margin-bottom: 0.5rem;">Radar Vide</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">Aucune mission active pour le moment. Soyez le premier à publier !</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="marketplace-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
                    ${missions.map(m => this.createMissionCard(m, user)).join('')}
                </div>
            `;
        } catch (err) {
            console.error('Marketplace Refresh Error:', err);
            container.innerHTML = `<p style="color: var(--error); text-align: center;">Erreur lors du chargement du radar.</p>`;
        }
    },

    createMissionCard(m, user) {
        const isOwner = user && (m.user_id === user.id);
        const title = this.escapeHtml(m.title || 'Mission sans titre');
        const budget = this.escapeHtml(m.budget || 'À discuter');
        const desc = this.escapeHtml(m.description || '').substring(0, 120);

        return `
            <div class="mission-card elite-card" style="padding: 1.5rem; border-radius: 20px; background: rgba(255,255,255,0.02); border: 1px solid ${isOwner ? 'var(--primary-glass)' : 'rgba(255,255,255,0.05)'}; transition: transform 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <h3 style="color: var(--white); margin: 0; font-size: 1.1rem; line-height: 1.4;">${title}</h3>
                    ${isOwner ? '<span class="status-badge status-draft" style="font-size: 0.6rem;">MA MISSION</span>' : ''}
                </div>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem; min-height: 3rem;">${desc}${m.description?.length > 120 ? '...' : ''}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                    <div style="color: var(--primary); font-weight: 800; font-size: 1.2rem;">${budget}${!isNaN(budget) ? '€' : ''}</div>
                    <div style="display: flex; gap: 0.5rem;">
                        ${isOwner ? `
                            <button class="button-secondary small" onclick="Marketplace.editMission('${m.id}')">Gérer</button>
                        ` : `
                            <button class="button-primary small" onclick="Marketplace.applyForMission('${m.id}')">Répondre</button>
                        `}
                    </div>
                </div>
            </div>
        `;
    },

    showPostMissionForm(missionData = null) {
        const container = document.getElementById('mission-form-container');
        if (!container) return;

        container.innerHTML = `
            <div class="glass" style="padding: 2rem; border-radius: 20px; margin-bottom: 2rem; border: 1px solid var(--primary-glass); animation: fadeIn 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0;">${missionData ? '🖋️ Modifier la mission' : '🚀 Publier sur le Radar'}</h3>
                    <button class="modal-close" onclick="Marketplace.hidePostMissionForm()" style="position: static; padding: 0.5rem;">✕</button>
                </div>
                <form onsubmit="Marketplace.saveMission(event)" style="display: grid; gap: 1.2rem;">
                    ${missionData ? `<input type="hidden" name="id" value="${missionData.id}">` : ''}
                    <div>
                        <label class="form-label">Titre de la mission</label>
                        <input type="text" name="title" class="form-input" required placeholder="Ex: Création site e-commerce" value="${missionData ? this.escapeHtml(missionData.title) : ''}">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label class="form-label">Budget (€)</label>
                            <input type="number" name="budget" class="form-input" required placeholder="500" value="${missionData ? missionData.budget : ''}">
                        </div>
                        <div>
                            <label class="form-label">Zone</label>
                            <select name="zone" class="form-input">
                                <option value="Outre-Mer">Outre-Mer</option>
                                <option value="Métropole">Métropole</option>
                                <option value="International">International</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="form-label">Description détaillée</label>
                        <textarea name="description" class="form-input" rows="4" required placeholder="Détails de votre besoin...">${missionData ? this.escapeHtml(missionData.description) : ''}</textarea>
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 0.5rem;">
                        <button type="button" class="button-secondary" onclick="Marketplace.hidePostMissionForm()">Annuler</button>
                        <button type="submit" class="button-primary">Diffuser sur le Radar</button>
                    </div>
                </form>
            </div>
        `;
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    hidePostMissionForm() {
        const container = document.getElementById('mission-form-container');
        if (container) container.innerHTML = '';
    },

    async saveMission(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Diffusion...';

        const formData = new FormData(e.target);
        const missionId = formData.get('id');
        const mission = {
            title: formData.get('title'),
            budget: formData.get('budget'),
            description: formData.get('description'),
            zone: formData.get('zone'),
            status: 'open'
        };

        try {
            if (missionId) await Storage.updateMission(missionId, mission);
            else await Storage.addMission(mission);

            if (typeof App !== 'undefined') App.showNotification('Mission publiée avec succès !', 'success');
            this.hidePostMissionForm();
            this.renderMissions();
        } catch (err) {
            console.error('Save Mission Error:', err);
            if (typeof App !== 'undefined') App.showNotification('Échec de la publication.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Diffuser sur le Radar';
        }
    },

    editMission(id) {
        if (typeof Storage === 'undefined') return;
        const missions = Storage.getPublicMissions();
        const mission = missions.find(m => m.id === id);
        if (mission) this.showPostMissionForm(mission);
    },

    applyForMission(id) {
        if (typeof Storage === 'undefined') return;
        const mission = Storage.getPublicMissions().find(m => m.id === id);
        if (mission) {
            const subject = encodeURIComponent(`Réponse Mission: ${mission.title}`);
            const body = encodeURIComponent(`Bonjour,\n\nJe suis intéressé par votre mission "${mission.title}" publiée sur SoloPrice Pro.\n\n[Détails de ma proposition...]`);
            window.location.href = `mailto:domtomconnect@gmail.com?subject=${subject}&body=${body}`;
            if (typeof App !== 'undefined') App.showNotification('Redirection vers votre messagerie...', 'info');
        }
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

window.Marketplace = Marketplace;
console.log('✅ [MARKETPLACE-v4.0] Ready.');
