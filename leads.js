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
            <div class="lead-card glass" style="padding: 1.8rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); position: relative; transition: all 0.3s ease; display: flex; flex-direction: column; justify-content: space-between;">
                <div class="lead-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.2rem;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700; color: var(--white); letter-spacing: -0.01em;">${this.escapeHtml(lead.name)}</h3>
                        <p style="margin: 0.3rem 0 0; font-size: 0.85rem; color: var(--primary-light); opacity: 0.8; font-weight: 500;">${this.escapeHtml(lead.activity || 'Activité non spécifiée')}</p>
                    </div>
                    <span class="status-tag" style="background: ${statusColors[lead.status]}15; color: ${statusColors[lead.status]}; padding: 6px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid ${statusColors[lead.status]}30;">
                        ${statusLabels[lead.status]}
                    </span>
                </div>
                
                <div class="lead-info" style="margin-bottom: 1.8rem; font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; display: grid; gap: 0.4rem;">
                    <div style="display: flex; align-items: center; gap: 10px;"><i class="far fa-envelope" style="width: 14px; opacity: 0.5;"></i> ${this.escapeHtml(lead.email || '-')}</div>
                    <div style="display: flex; align-items: center; gap: 10px;"><i class="fas fa-phone-alt" style="width: 14px; opacity: 0.5;"></i> ${this.escapeHtml(lead.phone || '-')}</div>
                </div>

                <div class="lead-actions" style="display: flex; gap: 0.6rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.2rem;">
                    <div style="display: flex; gap: 0.4rem; flex: 1;">
                        ${lead.status === 'cold' ?
                `<button class="button-secondary small" onclick="Leads.updateStatus('${lead.id}', 'warm')" style="padding: 6px 10px; font-size: 0.75rem;">Négociation</button>` :
                `<button class="button-secondary small" onclick="Leads.updateStatus('${lead.id}', 'cold')" style="padding: 6px 10px; font-size: 0.75rem;">Contact</button>`
            }
                        
                        <button class="button-primary small" onclick="Leads.convertToQuote('${lead.id}')" title="Générer un devis" style="padding: 6px 10px; font-size: 0.75rem; background: var(--primary-glass); color: var(--primary-light); border: 1px solid var(--primary-glass);">
                            <i class="fas fa-file-invoice"></i> Devis
                        </button>
                        
                        <button class="button-primary small" onclick="Leads.convertToClient('${lead.id}')" style="padding: 6px 10px; font-size: 0.75rem;">
                            <i class="fas fa-user-check"></i> Convertir
                        </button>
                    </div>
                    
                    <button class="btn-icon" onclick="Leads.delete('${lead.id}')" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; transition: all 0.2s;" title="Supprimer">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    },

    showAddForm() {
        const container = document.getElementById('lead-form-container');
        container.innerHTML = `
            <div class="form-card glass" style="margin-bottom: 2rem; animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1); background: rgba(255, 255, 255, 0.03); border: 1px solid var(--primary-glass); box-shadow: 0 20px 50px rgba(0,0,0,0.3);">
                <div class="form-header" style="border-bottom: 1px solid var(--primary-glass); padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--primary-light);"><i class="fas fa-user-plus" style="margin-right: 10px;"></i> Nouveau Prospect</h3>
                    <button class="btn-close" onclick="Leads.hideForm()" style="background: none; border: none; color: white; cursor: pointer; opacity: 0.6; transition: opacity 0.2s;">✕</button>
                </div>
                <form onsubmit="Leads.save(event)" style="padding: 2rem;">
                    <div class="form-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                        <div class="form-group">
                            <label class="form-label">Nom / Entreprise <span style="color: var(--primary);">*</span></label>
                            <input type="text" name="name" class="modern-input" required placeholder="Ex: Jean Dupont" style="width: 100%;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Activité</label>
                            <input type="text" name="activity" class="modern-input" placeholder="Ex: Boulangerie, Startup..." style="width: 100%;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email de contact</label>
                            <input type="email" name="email" class="modern-input" placeholder="Ex: contact@email.com" style="width: 100%;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Téléphone</label>
                            <input type="tel" name="phone" class="modern-input" placeholder="Ex: 06 00 00 00 00" style="width: 100%;">
                        </div>
                    </div>
                    <div class="form-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2.5rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 2rem;">
                        <button type="button" class="button-outline" onclick="Leads.hideForm()" style="min-width: 120px;">Annuler</button>
                        <button type="submit" class="button-primary" style="min-width: 200px; box-shadow: var(--primary-shadow);">🚀 Suivre ce prospect</button>
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
        try {
            const leads = Storage.getLeads();
            const lead = leads.find(l => l.id === id);

            if (!lead) return;

            if (!confirm(`Créer un devis pour ${lead.name} ?`)) return;

            // 1. Assurer que c'est un client
            let client = (Storage.getClients() || []).find(c => c.name === lead.name || (lead.email && c.email === lead.email));

            if (!client) {
                console.log('[LEADS] Client not found, creating new client from lead data...');
                client = await Storage.addClient({
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone,
                    activity: lead.activity
                });
            }

            if (!client || !client.id) throw new Error('Impossible de créer ou récupérer le client.');

            // 2. Créer le devis
            const newQuote = await Storage.addQuote({
                clientId: client.id,
                status: 'draft',
                title: `Prestation pour ${lead.name}`,
                notes: 'Radar DomTomConnect - Opportunité convertie',
                items: [{ description: 'Prestation de service (à définir)', quantity: 1, unitPrice: 0 }]
            });

            if (!newQuote || !newQuote.id) throw new Error('Échec de la création du devis.');

            App.showNotification('Devis initialisé dans vos documents.', 'success');

            // 3. Rediriger et ouvrir l'édition
            App.navigateTo('quotes');

            // On laisse un peu de temps pour le rendu de la page Quotes
            setTimeout(() => {
                if (typeof Quotes !== 'undefined') {
                    console.log('[LEADS] Triggering Quote edit for ID:', newQuote.id);
                    Quotes.edit(newQuote.id);
                } else {
                    console.warn('[LEADS] Quotes module not loaded yet.');
                }
            }, 800);

        } catch (err) {
            console.error('[LEADS] Conversion Error:', err);
            App.showNotification('Erreur lors de la conversion : ' + err.message, 'error');
        }
    }
};
