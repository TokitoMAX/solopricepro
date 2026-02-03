// SoloPrice Pro - Invoices Module

const Invoices = {
    editingId: null,
    currentItems: [],

    render(containerId = 'invoices-content') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const invoices = Storage.getInvoices();
        const limits = App.checkFreemiumLimits();

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Factures</h1>
                    <p class="page-subtitle">${invoices.length} facture(s) ${!limits.canAddInvoice ? `(limite: ${limits.maxInvoices})` : ''}</p>
                </div>
                <button class="button-primary" onclick="alert('Pour créer une facture, convertissez un devis dans le menu Devis.')" title="Créez d'abord un devis pour sécuriser le process">
                    Nouvelle Facture
                </button>
            </div>

            <div id="invoice-form-container"></div>

            ${invoices.length > 0 ? `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Numéro</th>
                                <th>Client</th>
                                <th>Date</th>
                                <th>Échéance</th>
                                <th>Montant HT</th>
                                <th>Montant TTC</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(invoice => {
            const client = Storage.getClient(invoice.clientId);
            const subtotal = invoice.items.reduce((sum, item) =>
                sum + (item.quantity * item.unitPrice), 0
            );
            return `
                                    <tr>
                                        <td><strong>${invoice.number}</strong></td>
                                        <td>${client?.name || 'Client supprimé'}</td>
                                        <td>${App.formatDate(invoice.createdAt)}</td>
                                        <td>${invoice.dueDate ? App.formatDate(invoice.dueDate) : '-'}</td>
                                        <td>${App.formatCurrency(subtotal)}</td>
                                        <td>${App.formatCurrency(invoice.total)}</td>
                                        <td><span class="status-badge status-${invoice.status}">${this.getStatusLabel(invoice.status)}</span></td>
                                        <td>
                                            <div class="action-buttons">
                                                <button class="btn-icon" onclick="Invoices.edit('${invoice.id}')" title="Modifier la facture">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                </button>
                                                <button class="btn-icon" onclick="Invoices.fastSend('${invoice.id}')" title="Envoyer par email">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                                </button>
                                                <button class="btn-icon" onclick="Invoices.changeStatus('${invoice.id}')" title="Changer le statut">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9 9 9 0 0 1 9 9z"></path><path d="M12 8v4l3 3"></path></svg>
                                                </button>
                                                <button class="btn-icon" onclick="Invoices.duplicate('${invoice.id}')" title="Dupliquer">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                </button>
                                                <button class="btn-icon" onclick="Invoices.downloadPDF('${invoice.id}')" title="Générer PDF">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                                </button>
                                                <button class="btn-icon btn-danger" onclick="Invoices.delete('${invoice.id}')" title="Supprimer">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                </button>
                                                <button class="btn-icon" onclick="Invoices.openRelanceModal('${invoice.id}')" title="Assistant Relance (Expert)" style="color: #f59e0b;">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"></path><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="empty-state">
                    <p>Aucune facture enregistrée</p>
                    <button class="button-primary" onclick="alert('Processus : Créez un devis, faites-le valider, puis convertissez-le en facture.'); App.navigateTo('quotes');">Créer mon premier devis</button>
                </div>
            `}
        `;
    },

    showAddForm() {
        const limits = App.checkFreemiumLimits();
        if (!limits.canAddInvoice) {
            App.showUpgradeModal('limit');
            return;
        }

        const clients = Storage.getClients();
        if (clients.length === 0) {
            App.showNotification('Veuillez d\'abord créer un client', 'error');
            App.navigateTo('clients');
            return;
        }

        this.editingId = null;
        this.currentItems = [{ description: '', quantity: 1, unitPrice: 0 }];

        const container = document.getElementById('invoice-form-container');
        container.innerHTML = this.renderForm(clients);
        container.scrollIntoView({ behavior: 'smooth' });

        // Écouteur pour changement de client
        const select = document.querySelector('select[name="clientId"]');
        if (select) {
            select.addEventListener('change', (e) => {
                this.addDefaultServicesForClient(e.target.value);
            });
        }
    },

    renderForm(clients, invoice = null) {
        const settings = Storage.get(Storage.KEYS.SETTINGS);
        const items = invoice ? invoice.items : this.currentItems;
        const services = Storage.getServices(); // Fetch services

        // Calcul du due date par défaut (30 jours)
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 30);
        const dueDateStr = defaultDueDate.toISOString().split('T')[0];

        return `
            <div class="form-card">
                <datalist id="invoice-services-list">
                    ${services.map(s => `<option value="${s.label}">${App.formatCurrency(s.unitPrice)}</option>`).join('')}
                </datalist>

                <div class="form-header">
                    <h3>${invoice ? 'Modifier la Facture' : 'Nouvelle Facture'}</h3>
                    <button class="btn-close" onclick="Invoices.hideForm()">✕</button>
                </div>
                <form id="invoice-form" onsubmit="Invoices.save(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Client *</label>
                            <select name="clientId" class="form-input" required>
                                <option value="">Sélectionner un client</option>
                                ${clients.map(c => `
                                    <option value="${c.id}" ${invoice?.clientId === c.id ? 'selected' : ''}>
                                        ${c.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Date d'échéance</label>
                            <input type="date" name="dueDate" class="form-input" 
                                   value="${invoice?.dueDate ? invoice.dueDate.split('T')[0] : dueDateStr}">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Statut</label>
                            <select name="status" class="form-input">
                                <option value="draft" ${invoice?.status === 'draft' ? 'selected' : ''}>Brouillon</option>
                                <option value="sent" ${invoice?.status === 'sent' ? 'selected' : ''}>Envoyée</option>
                                <option value="paid" ${invoice?.status === 'paid' ? 'selected' : ''}>Payée</option>
                                <option value="overdue" ${invoice?.status === 'overdue' ? 'selected' : ''}>En retard</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-section">
                        <div class="section-header-inline">
                            <h4>Lignes de facturation</h4>
                            <button type="button" class="button-secondary" onclick="Invoices.addItem()">
                                Ajouter une ligne
                            </button>
                        </div>

                        <div id="items-container">
                            ${items.map((item, index) => this.renderItemRow(item, index)).join('')}
                        </div>

                        <div id="margin-guard-container" style="margin-top: 1.5rem;"></div>

                        <div class="invoice-totals">
                            <div class="total-row">
                                <span>Sous-total HT :</span>
                                <span id="subtotal-display">0€</span>
                            </div>
                            <div class="total-row">
                                <span>TVA (${settings.taxRate}%) :</span>
                                <span id="tax-display">0€</span>
                            </div>
                            <div class="total-row total">
                                <span>Total TTC :</span>
                                <span id="total-display">0€</span>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="button-secondary" onclick="Invoices.hideForm()">Annuler</button>
                        <button type="submit" class="button-primary">Enregistrer</button>
                    </div>
                </form>
            </div>
        `;
    },

    renderItemRow(item, index) {
        return `
            <div class="item-row" data-index="${index}">
                <div class="item-field item-description">
                    <input type="text" 
                           name="items[${index}][description]" 
                           placeholder="Description (ou choisir dans la liste)" 
                           class="form-input" 
                           list="invoice-services-list"
                           value="${item.description || ''}"
                           oninput="Invoices.handleServiceSelect(this, ${index})"
                           required>
                </div>
                <div class="item-field item-quantity">
                    <input type="number" 
                           name="items[${index}][quantity]" 
                           placeholder="Qté" 
                           class="form-input" 
                           value="${item.quantity || 1}"
                           min="0.01"
                           step="0.01"
                           onchange="Invoices.updateTotals()"
                           required>
                </div>
                <div class="item-field item-price">
                    <input type="number" 
                           name="items[${index}][unitPrice]" 
                           placeholder="Prix unitaire" 
                           class="form-input" 
                           value="${item.unitPrice || 0}"
                           min="0"
                           step="0.01"
                           onchange="Invoices.updateTotals()"
                           required>
                </div>
                <div class="item-field item-total">
                    <span class="item-total-display">${App.formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}</span>
                </div>
                <div class="item-field item-actions">
                    <button type="button" class="btn-icon btn-danger" onclick="Invoices.removeItem(${index})">
                        Supprimer
                    </button>
                </div>
            </div>
        `;
    },

    addItem() {
        this.currentItems.push({ description: '', quantity: 1, unitPrice: 0 });
        const container = document.getElementById('items-container');
        container.insertAdjacentHTML('beforeend',
            this.renderItemRow({ description: '', quantity: 1, unitPrice: 0 }, this.currentItems.length - 1)
        );
        this.updateTotals();
    },

    removeItem(index) {
        if (this.currentItems.length <= 1) {
            this.showNotification('Une facture doit avoir au moins une ligne.', 'error');
            return;
        }
        this.currentItems.splice(index, 1);
        document.querySelector(`.item-row[data-index="${index}"]`).remove();
        this.updateTotals();
    },

    updateTotals() {
        const form = document.getElementById('invoice-form');
        if (!form) return;

        const settings = Storage.get(Storage.KEYS.SETTINGS);
        let subtotal = 0;

        // Calculer à partir des inputs actuels
        form.querySelectorAll('.item-row').forEach(row => {
            const qty = parseFloat(row.querySelector('[name*="[quantity]"]')?.value) || 0;
            const price = parseFloat(row.querySelector('[name*="[unitPrice]"]')?.value) || 0;
            const itemTotal = qty * price;

            // Mettre à jour l'affichage du total de ligne
            const display = row.querySelector('.item-total-display');
            if (display) display.textContent = App.formatCurrency(itemTotal);

            subtotal += itemTotal;
        });

        const tax = subtotal * (settings.taxRate / 100);
        const total = subtotal + tax;

        document.getElementById('subtotal-display').textContent = App.formatCurrency(subtotal);
        document.getElementById('tax-display').textContent = App.formatCurrency(tax);
        document.getElementById('total-display').textContent = App.formatCurrency(total);

        this.renderMarginGuard(subtotal);
    },

    renderMarginGuard(subtotal) {
        const container = document.getElementById('margin-guard-container');
        if (!container) return;

        const calcData = Storage.get('sp_calculator_data') || { dailyRate: 400 };
        const targetTJM = calcData.dailyRate || 400;

        // Estimation simple : on compare le total HT au TJM cible
        // On considère qu'une ligne standard est une journée pour ce calcul de santé
        // C'est indicatif pour aider le freelance à ne pas brader.

        const health = Math.min(100, (subtotal / targetTJM) * 100);
        let color = '#ef4444'; // Red
        let label = 'Rentabilité critique';

        if (health > 80) { color = '#10b981'; label = 'Seuil de rentabilité atteint'; }
        else if (health > 50) { color = '#fbbf24'; label = 'Vigilance rentabilité'; }

        container.innerHTML = `
            <div style="background: var(--bg-card); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 600;">
                    <span style="color: var(--text-secondary);">Analyse de Rentabilité</span>
                    <span style="color: ${color};">${label}</span>
                </div>
                <div style="height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                    <div style="width: ${health}%; height: 100%; background: ${color}; transition: width 0.3s ease;"></div>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">Comparé à votre objectif de ${App.formatCurrency(targetTJM)} / jour.</p>
            </div>
        `;
    },

    handleServiceSelect(input, index) {
        const val = input.value;
        const services = Storage.getServices();
        const found = services.find(s => s.label === val);

        if (found) {
            const row = document.querySelector(`.item-row[data-index="${index}"]`);
            if (row) {
                const priceInput = row.querySelector('[name*="[unitPrice]"]');
                if (priceInput) {
                    priceInput.value = found.unitPrice;
                    this.updateTotals();
                }
            }
        }
    },

    save(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        // Extraire les items
        const items = [];
        form.querySelectorAll('.item-row').forEach((row, index) => {
            const description = formData.get(`items[${index}][description]`);
            const quantity = parseFloat(formData.get(`items[${index}][quantity]`));
            const unitPrice = parseFloat(formData.get(`items[${index}][unitPrice]`));

            if (description && quantity && unitPrice >= 0) {
                items.push({ description, quantity, unitPrice });
            }
        });

        if (items.length === 0) {
            App.showNotification('Veuillez ajouter au moins une ligne.', 'error');
            return;
        }

        const settings = Storage.get(Storage.KEYS.SETTINGS);
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const tax = subtotal * (settings.taxRate / 100);
        const total = subtotal + tax;

        const invoiceData = {
            clientId: formData.get('clientId'),
            dueDate: formData.get('dueDate'),
            status: formData.get('status'),
            items: items,
            subtotal: subtotal,
            tax: tax,
            total: total
        };

        if (this.editingId) {
            Storage.updateInvoice(this.editingId, invoiceData);
            App.showNotification('Facture modifiée.', 'success');
        } else {
            Storage.addInvoice(invoiceData);
            App.showNotification('Facture créée.', 'success');
        }

        this.hideForm();
        this.render();
    },

    changeStatus(id) {
        const invoice = Storage.getInvoice(id);
        if (!invoice) return;

        const statuses = [
            { value: 'draft', label: 'Brouillon' },
            { value: 'sent', label: 'Envoyée' },
            { value: 'paid', label: 'Payée' },
            { value: 'overdue', label: 'En retard' }
        ];

        const currentIndex = statuses.findIndex(s => s.value === invoice.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        const nextStatus = statuses[nextIndex].value;

        Storage.updateInvoice(id, { status: nextStatus });
        App.showNotification(`Statut mis à jour : ${statuses[nextIndex].label}`, 'success');
        this.render();
    },

    fastSend(id) {
        const invoice = Storage.getInvoice(id);
        const client = Storage.getClient(invoice?.clientId);
        const user = Storage.getUser();

        if (!invoice || !client) return;

        // Préparer le mailto
        const subject = encodeURIComponent(`Facture ${invoice.number} - ${user.company.name || 'Prestation'}`);
        const body = encodeURIComponent(`Bonjour ${client.name},\n\nVeuillez trouver ci-joint la facture ${invoice.number} d'un montant de ${App.formatCurrency(invoice.total)}.\n\nCordialement,\n${user.company.name || 'Votre prestataire'}`);

        const mailtoUrl = `mailto:${client.email || ''}?subject=${subject}&body=${body}`;

        App.showNotification('Ouverture de votre messagerie...', 'info');

        // Simuler le passage en mode "envoyé" immédiatement pour l'action-réaction
        Storage.updateInvoice(id, { status: 'sent' });
        this.render();

        setTimeout(() => {
            window.location.href = mailtoUrl;
        }, 800);
    },

    // --- Assistant Relances (Expert Feature) ---

    openRelanceModal(id) {
        if (Storage.getTier() !== 'expert') {
            App.showUpgradeModal('feature');
            return;
        }

        const invoice = Storage.getInvoice(id);
        const client = Storage.getClient(invoice?.clientId);
        const user = Storage.getUser(); // Safe access
        if (!invoice || !client) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'relance-modal';

        // Templates de relance
        const templates = {
            soft: {
                label: '1. Rappel Amiable',
                subject: `Rappel : Facture ${invoice.number} en attente - ${user.company?.name || ''}`,
                body: `Bonjour ${client.name},\n\nSauf erreur de notre part, la facture ${invoice.number} du ${new Date(invoice.createdAt).toLocaleDateString()} d'un montant de ${App.formatCurrency(invoice.total)} reste impayée à ce jour.\n\nPouvez-vous me confirmer son statut ?\n\nBien cordialement,\n${user.company?.name || ''}`
            },
            firm: {
                label: '2. Retard Confirmé',
                subject: `Urgent : Retard de paiement Facture ${invoice.number}`,
                body: `Bonjour ${client.name},\n\nLa facture ${invoice.number} (Échéance : ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Passée'}) est toujours en attente de règlement malgré notre précédente relance.\n\nJe vous remercie de procéder au virement des ${App.formatCurrency(invoice.total)} sans délai.\n\nCordialement,\n${user.company?.name || ''}`
            },
            hard: {
                label: '3. Mise en Demeure',
                subject: `Mise en demeure : Facture ${invoice.number}`,
                body: `Madame, Monsieur,\n\nMalgré mes relances, la facture ${invoice.number} reste impayée.\nJe vous mets par la présente en demeure de régler la somme de ${App.formatCurrency(invoice.total)} sous 48h, faute de quoi je transmettrai le dossier au service recouvrement.\n\nDans l'attente de votre virement immédiat.\n\n${user.company?.name || ''}`
            }
        };

        modal.innerHTML = `
            <div class="modal-content glass" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Assistant Relance Recouvrement</h3>
                    <button class="modal-close" onclick="Invoices.closeRelanceModal()">✕</button>
                </div>
                <div class="modal-body" style="padding: 1rem;">
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                        <button class="button-outline small active" id="btn-soft" onclick="Invoices.switchRelanceTemplate('${id}', 'soft')">Amiable</button>
                        <button class="button-outline small" id="btn-firm" onclick="Invoices.switchRelanceTemplate('${id}', 'firm')">Ferme</button>
                        <button class="button-outline small" id="btn-hard" onclick="Invoices.switchRelanceTemplate('${id}', 'hard')">Dernier Avis</button>
                    </div>

                    <label class="form-label">Objet</label>
                    <input type="text" id="relance-subject" class="form-input" value="${templates.soft.subject}" readonly style="margin-bottom: 1rem;">
                    
                    <label class="form-label">Message</label>
                    <textarea id="relance-body" class="form-input" rows="8" style="resize: vertical;">${templates.soft.body}</textarea>
                </div>
                <div class="modal-footer">
                    <button class="button-secondary" onclick="Invoices.copyToClipboard()">Copier le Texte</button>
                    <button class="button-primary" onclick="Invoices.sendRelanceEmail('${client.email}')">Ouvrir Email</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        // Store current templates in DOM for switcher
        modal.dataset.templates = JSON.stringify(templates);
    },

    closeRelanceModal() {
        const modal = document.getElementById('relance-modal');
        if (modal) modal.remove();
    },

    switchRelanceTemplate(id, type) {
        const modal = document.getElementById('relance-modal');
        const templates = JSON.parse(modal.dataset.templates);
        const t = templates[type];

        document.getElementById('relance-subject').value = t.subject;
        document.getElementById('relance-body').value = t.body;

        // Toggle active buttons
        modal.querySelectorAll('.button-outline').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`btn-${type}`);
        if (btn) btn.classList.add('active');
    },

    copyToClipboard() {
        const body = document.getElementById('relance-body');
        const textToCopy = body.value;

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                App.showNotification('Texte copié !', 'success');
            }).catch(err => {
                console.error('Clipboard API fail:', err);
                this.fallbackCopyText(body);
            });
        } else {
            this.fallbackCopyText(body);
        }
    },

    fallbackCopyText(element) {
        element.select();
        try {
            document.execCommand('copy');
            App.showNotification('Texte copié !', 'success');
        } catch (err) {
            App.showNotification('Impossible de copier automatiquement.', 'error');
        }
    },

    sendRelanceEmail(email) {
        const subject = encodeURIComponent(document.getElementById('relance-subject').value);
        const body = encodeURIComponent(document.getElementById('relance-body').value);
        const url = `mailto:${email}?subject=${subject}&body=${body}`;
        window.location.href = url;
    },

    downloadPDF(id) {
        const isPro = Storage.isPro();
        if (!isPro) {
            App.showUpgradeModal('pdf');
            return;
        }

        const user = Storage.getUser();
        if (!user.company.name || !user.company.address) {
            if (confirm('Vos informations entreprise sont incomplètes.\n\nVoulez-vous les compléter maintenant pour l\'export PDF ?')) {
                App.navigateTo('settings');
            }
            return;
        }

        const invoice = Storage.getInvoice(id);
        const client = Storage.getClient(invoice.clientId);

        // Utiliser le module PDF si disponible
        if (typeof PDFGenerator !== 'undefined') {
            PDFGenerator.generateInvoice(invoice, client, user);
        } else {
            App.showNotification('Module PDF en cours de chargement...', 'error');
        }
    },

    duplicate(id) {
        const invoice = Storage.getInvoice(id);
        if (!invoice) return;

        if (confirm('Voulez-vous dupliquer cette facture ?')) {
            // Recalculate echeance for new invoice
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);

            const newInvoiceData = {
                clientId: invoice.clientId,
                status: 'draft',
                items: JSON.parse(JSON.stringify(invoice.items)), // Deep copy
                subtotal: invoice.subtotal,
                tax: invoice.tax,
                total: invoice.total,
                dueDate: dueDate.toISOString()
            };

            Storage.addInvoice(newInvoiceData);
            App.showNotification('Facture dupliquée.', 'success');
            this.render();
        }
    },

    edit(id) {
        const invoice = Storage.getInvoice(id);
        if (!invoice) return;

        this.editingId = id;
        this.currentItems = invoice.items;

        const clients = Storage.getClients();
        const container = document.getElementById('invoice-form-container');
        if (container) {
            container.innerHTML = this.renderForm(clients, invoice);
            this.updateTotals();
            container.scrollIntoView({ behavior: 'smooth' });
        }
    },

    delete(id) {
        if (confirm('Confirmer la suppression de cette facture ?')) {
            Storage.deleteInvoice(id);
            App.showNotification('Facture supprimée.', 'success');
            this.render();
        }
    },

    hideForm() {
        const container = document.getElementById('invoice-form-container');
        container.innerHTML = '';
        this.editingId = null;
        this.currentItems = [];
    },

    getStatusLabel(status) {
        const labels = {
            draft: 'Brouillon',
            sent: 'Envoyée',
            paid: 'Payée',
            overdue: 'En retard'
        };
        return labels[status] || status;
    },

    addDefaultServicesForClient(clientId) {
        if (!clientId) return;
        const client = Storage.getClient(clientId);
        if (client && client.defaultServiceIds && client.defaultServiceIds.length > 0) {
            const services = Storage.getServices();
            client.defaultServiceIds.forEach(serviceId => {
                const service = services.find(s => s.id === serviceId);
                if (service) {
                    const alreadyPresent = this.currentItems.some(item => item.description === service.label);
                    if (!alreadyPresent) {
                        this.addItem();
                        const lastIndex = this.currentItems.length - 1;
                        this.currentItems[lastIndex] = {
                            description: service.label,
                            quantity: 1,
                            unitPrice: service.unitPrice
                        };
                        const row = document.querySelector(`.item-row[data-index="${lastIndex}"]`);
                        if (row) {
                            row.querySelector('[name*="[description]"]').value = service.label;
                            row.querySelector('[name*="[unitPrice]"]').value = service.unitPrice;
                        }
                    }
                }
            });
            this.updateTotals();
        }
    }
};
