// SoloPrice Pro - Clients Module

const Clients = {
    editingId: null,

    render(containerId = 'clients-content') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const clients = Storage.getClients();
        const limits = App.checkFreemiumLimits();

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Clients</h1>
                    <p class="page-subtitle">${clients.length} client(s) enregistré(s) ${!limits.canAddClient ? `(limite: ${limits.maxClients})` : ''}</p>
                </div>
                <button class="button-primary" onclick="Clients.showAddForm()" ${!limits.canAddClient ? 'disabled' : ''}>
                    Nouveau Client
                </button>
            </div>

            <div id="client-form-container"></div>

            ${clients.length > 0 ? `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Email</th>
                                <th>Téléphone</th>
                                <th>Ville</th>
                                <th>Ajouté le</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clients.map(client => `
                                <tr>
                                    <td><strong>${this.escapeHtml(client.name)}</strong></td>
                                    <td>${this.escapeHtml(client.email || '-')}</td>
                                    <td>${this.escapeHtml(client.phone || '-')}</td>
                                    <td>${this.escapeHtml(client.city || '-')}</td>
                                    <td>${App.formatDate(client.createdAt)}</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn-icon" onclick="Clients.showDetail('${client.id}')" title="Voir détails et historique">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            </button>
                                            <button class="btn-icon" onclick="Clients.createQuoteFor('${client.id}')" title="Créer un devis">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                            </button>
                                            <button class="btn-icon" onclick="Clients.createInvoiceFor('${client.id}')" title="Créer une facture">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                                            </button>
                                            <button class="btn-icon" onclick="Clients.edit('${client.id}')" title="Modifier le client">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            </button>
                                            <button class="btn-icon btn-danger" onclick="Clients.delete('${client.id}')" title="Supprimer">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="empty-state">
                    <p>Aucun client enregistré</p>
                    <button class="button-primary" onclick="Clients.showAddForm()">Ajouter un client</button>
                </div>
            `}
        `;
    },

    createQuoteFor(clientId) {
        App.navigateTo('quotes');
        if (typeof Quotes !== 'undefined') Quotes.showAddForm(clientId);
    },

    createInvoiceFor(clientId) {
        App.navigateTo('invoices');
        if (typeof Invoices !== 'undefined') Invoices.showAddForm(clientId);
    },

    showAddForm() {
        const limits = App.checkFreemiumLimits();
        if (!limits.canAddClient) {
            App.showUpgradeModal('limit');
            return;
        }

        this.editingId = null;
        const container = document.getElementById('client-form-container');

        container.innerHTML = `
            <div class="form-card">
                <div class="form-header">
                    <h3>Nouveau Client</h3>
                    <button class="btn-close" onclick="Clients.hideForm()">✕</button>
                </div>
                <form id="client-form" onsubmit="Clients.save(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Nom / Entreprise *</label>
                            <input type="text" name="name" class="form-input" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" name="email" class="form-input">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Téléphone</label>
                            <input type="tel" name="phone" class="form-input">
                        </div>

                        <div class="form-group">
                            <label class="form-label">SIRET</label>
                            <input type="text" name="siret" class="form-input">
                        </div>

                        <div class="form-group full-width">
                            <label class="form-label">Adresse</label>
                            <input type="text" name="address" class="form-input">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Code Postal</label>
                            <input type="text" name="zipCode" class="form-input">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Ville</label>
                            <input type="text" name="city" class="form-input">
                        </div>

                        <div class="form-group full-width">
                            <label class="form-label">Notes</label>
                            <textarea name="notes" class="form-input" rows="3"></textarea>
                        </div>

                        <div class="form-group full-width">
                            <label class="form-label">Prestations habituelles pour ce client</label>
                            <div class="services-selection-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; margin-top: 0.5rem; max-height: 200px; overflow-y: auto; padding: 1rem; background: var(--dark); border-radius: 8px; border: 1px solid var(--border);">
                                ${Storage.getServices().map(service => `
                                    <label class="checkbox-container" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem;">
                                        <input type="checkbox" name="defaultServiceIds" value="${service.id}" style="accent-color: var(--primary);">
                                        <span>${service.label}</span>
                                    </label>
                                `).join('') || '<p class="text-muted text-sm">Aucune prestation enregistrée dans le catalogue.</p>'}
                            </div>
                            <p class="text-sm text-muted" style="margin-top: 0.5rem;">Ces prestations seront automatiquement ajoutées à ses nouveaux devis/factures.</p>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="button-secondary" onclick="Clients.hideForm()">Annuler</button>
                        <button type="submit" class="button-primary">Enregistrer</button>
                    </div>
                </form>
            </div>
        `;

        container.scrollIntoView({ behavior: 'smooth' });
    },

    edit(id) {
        this.editingId = id;
        const client = Storage.getClient(id);
        if (!client) return;

        this.showAddForm();

        // Pré-remplir le formulaire
        const form = document.getElementById('client-form');
        const header = form.previousElementSibling.querySelector('h3');
        header.textContent = 'Modifier le Client';

        ['name', 'email', 'phone', 'siret', 'address', 'zipCode', 'city', 'notes'].forEach(field => {
            const input = form.elements[field];
            if (input && client[field]) {
                input.value = client[field];
            }
        });

        // Cocher les prestations par défaut
        if (client.defaultServiceIds) {
            form.querySelectorAll('input[name="defaultServiceIds"]').forEach(checkbox => {
                if (client.defaultServiceIds.includes(checkbox.value)) {
                    checkbox.checked = true;
                }
            });
        }
    },

    save(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const clientData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            siret: formData.get('siret'),
            address: formData.get('address'),
            zipCode: formData.get('zipCode'),
            city: formData.get('city'),
            notes: formData.get('notes'),
            defaultServiceIds: Array.from(formData.getAll('defaultServiceIds'))
        };

        if (this.editingId) {
            Storage.updateClient(this.editingId, clientData);
            App.showNotification('Client modifié.', 'success');
            this.hideForm();
            this.render();
        } else {
            const newClient = Storage.addClient(clientData);
            App.showNotification('Client ajouté.', 'success');
            this.hideForm();
            this.render();

            // Check redirect logic
            if (sessionStorage.getItem('sp_return_to_quote') === 'true') {
                sessionStorage.removeItem('sp_return_to_quote');
                setTimeout(() => {
                    App.navigateTo('quotes');
                    if (typeof Quotes !== 'undefined') {
                        Quotes.showAddForm(newClient.id);
                    }
                }, 500);
            }
        }
    },

    delete(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
            Storage.deleteClient(id);
            App.showNotification('Client supprimé.', 'success');
            this.render();
        }
    },

    // Quick Add Features
    quickAddCallback: null,

    openQuickAdd(callback) {
        this.quickAddCallback = callback;
        const modal = document.getElementById('quick-client-modal');
        if (modal) modal.classList.add('active');
        document.getElementById('quick-client-form').reset();
    },

    closeQuickAdd() {
        const modal = document.getElementById('quick-client-modal');
        if (modal) modal.classList.remove('active');
        this.quickAddCallback = null;
    },

    handleQuickAdd(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        const clientData = {
            name: formData.get('name'),
            email: formData.get('email'),
            city: formData.get('city'),
            type: 'company' // Default
        };

        const newClient = Storage.addClient(clientData);
        App.showNotification('Client créé.', 'success');

        this.closeQuickAdd();

        if (this.quickAddCallback) {
            this.quickAddCallback(newClient);
        } else {
            this.render();
        }
    },

    hideForm() {
        const container = document.getElementById('client-form-container');
        container.innerHTML = '';
        this.editingId = null;
    },

    // Detail View Logic - Overhauled Professional CRM Experience
    showDetail(id) {
        this.editingId = id;
        const client = Storage.getClient(id);
        if (!client) return;

        const modal = document.getElementById('client-detail-modal');
        const nameEl = document.getElementById('detail-client-name');
        const detailContent = modal.querySelector('.modal-body');

        nameEl.textContent = client.name;

        // Fetch activity
        const quotes = Storage.getQuotes().filter(q => q.clientId === id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const invoices = Storage.getInvoices().filter(i => i.clientId === id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Merge activities into a timeline
        const activities = [
            ...quotes.map(q => ({ type: 'quote', date: q.createdAt, data: q, icon: '', label: 'Devis créé' })),
            ...invoices.map(i => ({ type: 'invoice', date: i.createdAt, data: i, icon: '', label: 'Facture créée' }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        detailContent.innerHTML = `
            <div class="crm-detail-grid" style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem;">
                
                <!-- Left Column: Contact & Metadata -->
                <div class="crm-sidebar-info">
                    <div class="detail-section">
                        <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 1rem; letter-spacing: 1px;">Coordonnées</h4>
                        <div class="info-card" style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 12px; border: 1px solid var(--border);">
                            <div class="detail-info-row" style="margin-bottom: 0.8rem;">
                                <div class="label" style="font-size: 0.75rem; color: var(--text-muted);">Email</div>
                                <div class="value" style="font-weight: 600;">${client.email || 'Non renseigné'}</div>
                            </div>
                            <div class="detail-info-row" style="margin-bottom: 0.8rem;">
                                <div class="label" style="font-size: 0.75rem; color: var(--text-muted);">Téléphone</div>
                                <div class="value" style="font-weight: 600;">${client.phone || '-'}</div>
                            </div>
                            <div class="detail-info-row" style="margin-bottom: 0.8rem;">
                                <div class="label" style="font-size: 0.75rem; color: var(--text-muted);">Adresse</div>
                                <div class="value" style="font-weight: 600; font-size: 0.9rem;">${client.address || '-'}<br>${client.zipCode || ''} ${client.city || ''}</div>
                            </div>
                            <div class="detail-info-row">
                                <div class="label" style="font-size: 0.75rem; color: var(--text-muted);">SIRET</div>
                                <div class="value" style="font-weight: 600; font-family: monospace;">${client.siret || '-'}</div>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section" style="margin-top: 2rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px;">Notes CRM</h4>
                            <button class="button-secondary small" onclick="Clients.saveNotes()" style="padding: 2px 8px; font-size: 0.7rem;">Enregistrer</button>
                        </div>
                        <textarea id="client-detail-notes" class="form-input" style="width: 100%; min-height: 120px; font-size: 0.9rem; line-height: 1.4; background: rgba(0,0,0,0.2);" placeholder="Prenez des notes sur ce client (projets, préférences, rappels)...">${client.notes || ''}</textarea>
                    </div>
                </div>

                <!-- Right Column: Activity Timeline -->
                <div class="crm-main-activity">
                    <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 1rem; letter-spacing: 1px;">Fil d'activité</h4>
                    
                    <div class="crm-timeline" style="position: relative; padding-left: 2rem;">
                        <div class="timeline-line" style="position: absolute; left: 7px; top: 0; bottom: 0; width: 2px; background: var(--border);"></div>
                        
                        ${activities.length > 0 ? activities.map(act => `
                            <div class="timeline-item" style="position: relative; margin-bottom: 1.5rem;">
                                <div class="timeline-dot" style="position: absolute; left: -2rem; width: 16px; height: 16px; border-radius: 50%; background: var(--dark); border: 2px solid var(--primary); z-index: 1;"></div>
                                <div class="timeline-content" style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 12px; border: 1px solid var(--border); transition: all 0.2s ease;">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.3rem;">
                                        <div style="font-weight: 700; font-size: 0.95rem;">${act.icon} ${act.label}</div>
                                        <div style="font-size: 0.75rem; color: var(--text-muted);">${App.formatDate(act.date)}</div>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div style="font-size: 0.85rem; color: var(--text-muted);">${act.type === 'quote' ? 'Devis' : 'Facture'} #${act.data.number}</div>
                                        <div style="font-weight: 700; color: var(--primary-light);">${App.formatCurrency(act.data.total)}</div>
                                    </div>
                                    <div style="margin-top: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                                        <span class="status-badge status-${act.data.status || 'draft'}" style="font-size: 0.7rem; padding: 2px 8px;">${act.data.status || 'Brouillon'}</span>
                                        <button class="link-button" style="font-size: 0.75rem;" onclick="App.navigateTo('${act.type === 'quote' ? 'quotes' : 'quotes'}')">Voir le document</button>
                                    </div>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="empty-timeline" style="padding: 2rem; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed var(--border);">
                                <p style="font-size: 0.9rem;">Aucune activité facturable pour le moment.</p>
                            </div>
                        `}
                    </div>
                </div>

            </div>
            
            <div class="modal-actions" style="border-top: 1px solid var(--border); padding-top: 1.5rem; margin-top: 1.5rem;">
                <button class="button-secondary" onclick="Clients.closeDetail()">Fermer</button>
                <div style="flex: 1;"></div>
                <button class="button-primary" onclick="Clients.createQuoteFor('${id}')">Créer un Devis</button>
                <button class="button-primary" onclick="Clients.createInvoiceFor('${id}')">Créer une Facture</button>
            </div>
        `;

        modal.classList.add('active');
    },

    closeDetail() {
        const modal = document.getElementById('client-detail-modal');
        modal.classList.remove('active');
        this.editingId = null;
    },

    saveNotes() {
        if (!this.editingId) return;
        const notesEl = document.getElementById('client-detail-notes');
        Storage.updateClient(this.editingId, { notes: notesEl.value });
        App.showNotification('Note client mise à jour.', 'success');
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
