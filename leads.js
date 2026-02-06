// SoloPrice Pro - Leads Module (Radar à Prospects)

const Leads = {
    lastContainerId: 'leads-content',

    render(containerId = 'leads-content') {
        this.lastContainerId = containerId;
        const container = document.getElementById(containerId);
        if (!container) return;

        const leads = Storage.getLeads();

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Prospection</h1>
                    <p class="page-subtitle">Suivi des opportunités commerciales</p>
                </div>
                <button class="button-primary" onclick="Leads.showAddForm()">
                    Nouveau Prospect
                </button>
            </div>

            <div id="lead-form-container"></div>

            <div class="leads-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
                ${leads.length > 0 ? leads.map(lead => this.renderLeadCard(lead)).join('') : `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <h3>Aucun prospect en cours</h3>
                        <p>Ajoutez vos premières opportunités pour commencer le suivi.</p>
                        <button class="button-secondary" onclick="Leads.showAddForm()">Ajouter un prospect</button>
                    </div>
                `}
            </div>
        `;
    },

    renderLeadCard(lead) {
        const statusColors = {
            cold: '#60a5fa', // Blue
            warm: '#fbbf24', // Amber
            won: '#10b981'   // Emerald
        };

        const statusLabels = {
            cold: 'Contact initial',
            warm: 'En négociation',
            won: 'Client confirmé'
        };

        return `
            <div class="lead-card glass" style="padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border-color); background: var(--bg-card); position: relative;">
                <div class="lead-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);">${this.escapeHtml(lead.name)}</h3>
                        <p style="margin: 0.2rem 0 0; font-size: 0.85rem; color: var(--text-muted);">${this.escapeHtml(lead.activity || 'Activité non spécifiée')}</p>
                    </div>
                    <span class="status-tag" style="background: ${statusColors[lead.status]}20; color: ${statusColors[lead.status]}; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">
                        ${statusLabels[lead.status]}
                    </span>
                </div>
                
                <div class="lead-info" style="margin-bottom: 1.5rem; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4;">
                    <div>Email: ${this.escapeHtml(lead.email || '-')}</div>
                    <div>Tel: ${this.escapeHtml(lead.phone || '-')}</div>
                </div>

                <div class="lead-actions" style="display: flex; gap: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                    ${lead.status !== 'cold' ? `<button class="button-secondary small" onclick="Leads.updateStatus('${lead.id}', 'cold')">Contact</button>` : ''}
                    ${lead.status !== 'warm' ? `<button class="button-secondary small" onclick="Leads.updateStatus('${lead.id}', 'warm')">Négociation</button>` : ''}
                    ${lead.status !== 'won' ? `<button class="button-primary small" onclick="Leads.convertToClient('${lead.id}')">Convertir</button>` : ''}
                    <button class="button-secondary small" onclick="Leads.convertToQuote('${lead.id}')" title="Créer un devis pour ce prospect">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        Devis
                    </button>
                    <button class="btn-icon btn-danger" style="margin-left: auto;" onclick="Leads.delete('${lead.id}')">Supprimer</button>
                </div>
            </div>
        `;
    },

    showAddForm() {
        const container = document.getElementById('lead-form-container');
        container.innerHTML = `
            <div class="form-card" style="margin-bottom: 2rem; animation: slideDown 0.3s ease;">
                <div class="form-header">
                    <h3>Nouveau Prospect</h3>
                    <button class="btn-close" onclick="Leads.hideForm()">✕</button>
                </div>
                <form onsubmit="Leads.save(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Nom / Entreprise *</label>
                            <input type="text" name="name" class="form-input" required placeholder="Ex: Jean Dupont">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Activité</label>
                            <input type="text" name="activity" class="form-input" placeholder="Ex: Boulangerie, Startup...">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" name="email" class="form-input" placeholder="Ex: contact@email.com">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Téléphone</label>
                            <input type="tel" name="phone" class="form-input" placeholder="Ex: 06 00 00 00 00">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="button-secondary" onclick="Leads.hideForm()">Annuler</button>
                        <button type="submit" class="button-primary">Suivre ce prospect</button>
                    </div>
                </form>
            </div>
        `;
        container.scrollIntoView({ behavior: 'smooth' });
    },

    async save(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const leadData = {
            name: formData.get('name'),
            activity: formData.get('activity'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            status: 'cold'
        };

        await Storage.addLead(leadData);
        App.showNotification('Prospect ajouté au suivi', 'success');
        this.hideForm();
        this.render(this.lastContainerId);
    },

    async updateStatus(id, newStatus) {
        await Storage.updateLead(id, { status: newStatus });
        App.showNotification('Statut mis à jour', 'success');
        this.render(this.lastContainerId);
    },

    async convertToClient(id) {
        if (!confirm('Convertir ce prospect en client ? Ses informations seront transférées dans le module Clients.')) return;

        const lead = Storage.getLeads().find(l => l.id === id);
        if (lead) {
            // Add to clients
            await Storage.addClient({
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                activity: lead.activity
            });

            // Delete from leads
            await Storage.deleteLead(id);

            App.showNotification('Nouveau client enregistré.', 'success');
            App.navigateTo('clients');
        }
    },

    async delete(id) {
        if (confirm('Supprimer ce prospect ?')) {
            await Storage.deleteLead(id);
            this.render(this.lastContainerId);
        }
    },

    hideForm() {
        document.getElementById('lead-form-container').innerHTML = '';
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    async convertToQuote(id) {
        const leads = Storage.getLeads();
        const lead = leads.find(l => l.id === id);

        if (!lead) return;

        if (!confirm(`Créer un devis pour ${lead.name} ?`)) return;

        // 1. Assurer que c'est un client
        let client = Storage.getClients().find(c => c.name === lead.name || c.email === lead.email);
        if (!client) {
            client = await Storage.addClient({
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                activity: lead.activity
            });
        }

        // 2. Créer le devis
        const newQuote = await Storage.addQuote({
            clientId: client.id,
            status: 'draft',
            title: `Prestation pour ${lead.name}`,
            items: [{ description: 'Prestation de service', quantity: 1, unitPrice: 0 }]
        });

        App.showNotification('Devis initialisé.', 'success');

        // 3. Rediriger
        App.navigateTo('quotes');
        setTimeout(() => {
            if (typeof Quotes !== 'undefined') {
                Quotes.edit(newQuote.id);
            }
        }, 500);
    }
};
