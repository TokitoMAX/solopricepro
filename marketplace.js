/**
 * SoloPrice Pro - Marketplace v4.0 (Simple, Rapide, Efficace)
 * Version allégée pour performance maximale et zéro bug.
 */
console.log('⚡ [MARKETPLACE-v4.0-LITE] Module Initializing...');

const Marketplace = {
    // Rendu Principal - Le Radar
    render(containerId = 'marketplace-root') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">MARKETPLACE <span class="badge-pro">LITE v4.0</span></h1>
                    <p class="page-subtitle">Réseau d'Opportunités DomTomConnect</p>
                </div>
                <button class="button-primary" onclick="Marketplace.showPostForm()">
                    <i class="fas fa-plus"></i> Poster une Mission
                </button>
            </div>

            <div id="marketplace-content" class="marketplace-grid-lite">
                <div class="loading-spinner">📡 Scan du Radar...</div>
            </div>
            
            <!-- Modale de Publication Simplifiée -->
            <div id="post-mission-modal" class="modal-overlay" style="display:none;">
                <div class="modal-content glass">
                    <button class="modal-close" onclick="Marketplace.closePostForm()">✕</button>
                    <h2>🚀 Nouvelle Mission</h2>
                    <form onsubmit="Marketplace.submitMission(event)">
                        <label>Titre de la mission
                            <input type="text" name="title" required placeholder="Ex: Dév Site Vitrine" class="form-input">
                        </label>
                        <div class="form-row">
                            <label>Budget (€)
                                <input type="number" name="budget" required placeholder="500" class="form-input">
                            </label>
                            <label>Zone
                                <select name="zone" class="form-input">
                                    <option>Outre-Mer</option>
                                    <option>Métropole</option>
                                    <option>International</option>
                                </select>
                            </label>
                        </div>
                        <label>Description Court & Efficace
                            <textarea name="description" required rows="3" class="form-input"></textarea>
                        </label>
                        <button type="submit" class="button-primary full-width">Diffuser</button>
                    </form>
                </div>
            </div>
        `;

        this.loadMissions();
    },

    async loadMissions() {
        try {
            const missions = await Storage.getPublicMissions(); // Utilise le cache ou fetch
            const container = document.getElementById('marketplace-content');

            if (!missions || missions.length === 0) {
                container.innerHTML = '<div class="empty-state">Aucune mission pour le moment.</div>';
                return;
            }

            container.innerHTML = missions.map(m => `
                <div class="mission-card-lite">
                    <div class="mission-header">
                        <h3>${this.escape(m.title)}</h3>
                        <span class="mission-budget">${m.budget}€</span>
                    </div>
                    <p class="mission-desc">${this.escape(m.description)}</p>
                    <div class="mission-actions">
                        <span class="mission-zone">📍 ${m.zone || 'Global'}</span>
                        <a href="mailto:domtomconnect@gmail.com?subject=Answer: ${encodeURIComponent(m.title)}&body=Bonjour, je suis intéressé par votre mission..." 
                           class="button-secondary small">
                           Répondre
                        </a>
                    </div>
                </div>
            `).join('');

        } catch (e) {
            console.error(e);
            document.getElementById('marketplace-content').innerHTML = '<div class="error">Erreur de chargement.</div>';
        }
    },

    showPostForm() {
        document.getElementById('post-mission-modal').style.display = 'flex';
    },

    closePostForm() {
        document.getElementById('post-mission-modal').style.display = 'none';
    },

    async submitMission(e) {
        e.preventDefault();
        console.log('🚀 [MARKETPLACE] Submit triggered');

        const output = document.querySelector('#post-mission-modal button[type="submit"]');
        const originalText = output.textContent;
        output.disabled = true;
        output.textContent = 'Envoi...';

        const formData = new FormData(e.target);
        const mission = {
            title: formData.get('title'),
            budget: formData.get('budget'),
            description: formData.get('description'),
            zone: formData.get('zone'),
            status: 'open',
            created_at: new Date().toISOString()
        };

        console.log('📦 [MARKETPLACE] Payload:', mission);

        try {
            console.log('☁️ [MARKETPLACE] Sending to Storage...');
            const result = await Storage.addMission(mission);
            console.log('✅ [MARKETPLACE] Storage response:', result);

            if (typeof App !== 'undefined') App.showNotification('Mission publiée !', 'success');
            this.closePostForm();
            this.loadMissions();
            e.target.reset();
        } catch (err) {
            console.error('❌ [MARKETPLACE] Submit Error:', err);
            if (typeof App !== 'undefined') App.showNotification('Erreur: ' + (err.message || 'Inconnue'), 'error');
        } finally {
            output.disabled = false;
            output.textContent = originalText;
        }
    },

    escape(str) {
        if (!str) return '';
        return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
};

// Global Exposure
window.Marketplace = Marketplace;
