/**
 * SoloPrice Pro - Network Module
 * Handles Personal Service Providers & DomTomConnect Ecosystem
 */
const Network = {
    providers: [],

    init() {
        console.log('Network module initialized');
        this.loadProviders();
        this.render();
    },

    loadProviders() {
        this.providers = JSON.parse(localStorage.getItem('sp_network_providers') || '[]');
    },

    saveProviders() {
        localStorage.setItem('sp_network_providers', JSON.stringify(this.providers));
        this.render();
    },

    render(startTab = 'clients') {
        const container = document.getElementById('network-content');
        if (!container) return;

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Mon Cercle</h1>
                <p class="page-subtitle">Gérez vos clients, prospects et partenaires réseau.</p>
            </div>

            <div class="settings-tabs">
                <button class="settings-tab" onclick="Network.switchTab('clients')">Mes Clients</button>
                <button class="settings-tab" onclick="Network.switchTab('leads')">Mes Prospects</button>
                <button class="settings-tab" onclick="Network.switchTab('partners')">Mes Partenaires</button>
            </div>
            <div id="cercle-dynamic-content" style="margin-top: 2rem;">
                <!-- Rempli par switchTab -->
            </div>
        `;

        // Utiliser l'onglet demandé
        this.switchTab(startTab);
    },

    switchTab(tabId) {
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.settings-tab[onclick*="${tabId}"]`);
        if (activeTab) activeTab.classList.add('active');

        const container = document.getElementById('cercle-dynamic-content');
        if (!container) return;

        if (tabId === 'clients') {
            container.innerHTML = '<div id="clients-embedded-container"></div>';
            if (typeof Clients !== 'undefined') {
                Clients.render('clients-embedded-container');
            }
        } else if (tabId === 'leads') {
            container.innerHTML = '<div id="leads-embedded-container"></div>';
            if (typeof Leads !== 'undefined') {
                Leads.render('leads-embedded-container');
            }
        } else if (tabId === 'partners') {
            this.renderPartners(container);
        }
    },

    renderPartners(container) {
        if (this.providers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Vous n'avez pas encore de prestataires dans votre réseau.</p>
                    <div style="display: flex; gap: 1rem; justify-content: center;">
                        <button class="button-primary" onclick="Network.showAddModal()">Ajouter manuellement</button>
                        <button class="button-secondary" onclick="App.navigateTo('marketplace', 'experts')">Découvrir des Experts</button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="network-container">
                 <div class="section-header-inline">
                    <h3 class="section-title-small">Partenaires Réseau</h3>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="button-secondary small" onclick="App.navigateTo('marketplace', 'experts')">Trouver des Experts</button>
                        <button class="button-primary small" onclick="Network.showAddModal()">+ Nouveau</button>
                    </div>
                </div>
                <div class="partners-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
                    ${this.providers.map(p => `
                        <div class="network-card glass" style="background: #0a0a0a; border: 1px solid var(--border); padding: 1.5rem; border-radius: 12px; border-left: 4px solid ${p.isVerified ? 'var(--primary)' : 'var(--border)'};">
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                                <div class="provider-avatar" style="width: 45px; height: 45px; background: ${p.isVerified ? 'var(--primary-glass)' : 'var(--dark)'}; color: ${p.isVerified ? 'var(--primary-light)' : 'var(--text-muted)'}; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 1px solid var(--border);">${p.name.charAt(0)}</div>
                                <div class="provider-info">
                                    <h3 style="margin: 0; font-size: 1.1rem; color: var(--white);">${p.name} ${p.isVerified ? '<span class="pro-badge-small">VÉRIFIÉ</span>' : ''}</h3>
                                    <p class="provider-specialty" style="margin: 2px 0 0 0; color: var(--text-muted); font-size: 0.85rem;">${p.specialty}</p>
                                </div>
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.2rem;">
                                <div>${p.city || 'Non renseigné'}</div>
                            </div>
                            <div class="provider-actions" style="display: flex; gap: 0.5rem; border-top: 1px solid var(--border); padding-top: 1rem;">
                                <button class="button-secondary sm" style="flex: 1; font-size: 0.75rem;" onclick="Network.contactProvider('${p.id}')">Contacter</button>
                                <button class="button-secondary sm" style="flex: 1; font-size: 0.75rem; border-color: var(--danger-glass); color: var(--danger-light);" onclick="Network.deleteProvider('${p.id}')">Supprimer</button>
                            </div>
                        </div>
                    `).join('')}
                </div>

            </div>
        `;
    },
    showAddModal() {
        const modal = document.getElementById('network-add-modal');
        if (modal) modal.classList.add('active');
    },

    hideAddModal() {
        const modal = document.getElementById('network-add-modal');
        if (modal) modal.classList.remove('active');
    },

    addProvider(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newProvider = {
            id: Date.now().toString(),
            name: formData.get('name'),
            specialty: formData.get('specialty'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            city: formData.get('city')
        };

        this.providers.push(newProvider);
        this.saveProviders();
        this.hideAddModal();
        e.target.reset();
        App.showNotification('Partenaire ajouté au réseau.', 'success');
    },

    deleteProvider(id) {
        if (confirm('Supprimer ce partenaire de votre réseau ?')) {
            this.providers = this.providers.filter(p => p.id !== id);
            this.saveProviders();
            App.showNotification('Partenaire supprimé.', 'success');
        }
    }
};

// Auto-init for testing
window.Network = Network;
