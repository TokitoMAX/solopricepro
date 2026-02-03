// SoloPrice Pro - Quotes Module

const Quotes = {
    editingId: null,
    currentItems: [],

    init() {
        console.log('Quotes module initialized');
    },


    render(containerId = 'quotes-content') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const quotes = Storage.getQuotes();
        const limits = App.checkFreemiumLimits();

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Mes Documents</h1>
                <p class="page-subtitle">Gérez vos devis, factures et documents commerciaux.</p>
            </div>

            <div class="settings-tabs">
                <button class="settings-tab active" onclick="Quotes.switchTab('quotes')">Devis</button>
                <button class="settings-tab" onclick="Quotes.switchTab('invoices')">Factures</button>
            </div>

            <div id="documents-dynamic-content" style="margin-top: 2rem;">
                <!-- Rempli par switchTab -->
            </div>
        `;

        this.switchTab('quotes');
    },

    switchTab(tabId) {
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.settings-tab[onclick*="${tabId}"]`);
        if (activeTab) activeTab.classList.add('active');

        const container = document.getElementById('documents-dynamic-content');
        if (!container) return;

        if (tabId === 'quotes') {
            this.renderQuotes(container);
        } else if (tabId === 'invoices') {
            container.innerHTML = '<div id="invoices-embedded-container"></div>';
            if (typeof Invoices !== 'undefined') {
                Invoices.render('invoices-embedded-container');
            }
        }
    },

    renderQuotes(container) {
        const quotes = Storage.getQuotes();
        const limits = App.checkFreemiumLimits();

        container.innerHTML = `
            <div class="section-header-inline">
                <h3 class="section-title-small">${quotes.length} Devis</h3>
                <button class="button-primary small" onclick="Quotes.showAddForm()" ${!limits.canAddQuote ? 'disabled' : ''}>
                    Nouveau Devis
                </button>
            </div>

            <div id="quote-form-container"></div>

            ${quotes.length > 0 ? `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Numéro</th>
                                <th>Client</th>
                                <th>Date</th>
                                <th>Montant TTC</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${quotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(quote => {
            const client = Storage.getClient(quote.clientId);
            return `
                                    <tr>
                                        <td><strong>${quote.number}</strong></td>
                                        <td>${client?.name || 'Client supprimé'}</td>
                                        <td>${App.formatDate(quote.createdAt)}</td>
                                        <td>${App.formatCurrency(quote.total)}</td>
                                        <td><span class="status-badge status-${quote.status}">${this.getStatusLabel(quote.status)}</span></td>
                                        <td>
                                            <div class="action-buttons">
                                                <button class="btn-icon" onclick="Quotes.edit('${quote.id}')" title="Modifier le devis">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                </button>
                                                <button class="btn-icon" onclick="Quotes.fastSend('${quote.id}')" title="Envoyer par email">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                                </button>
                                                <button class="btn-icon" onclick="Quotes.openQuickClientAdd()" title="Ajouter un client">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="17" y1="11" x2="23" y2="11"></line></svg>
                                                </button>
                                                <button class="btn-icon" onclick="Quotes.changeStatus('${quote.id}')" title="Changer le statut">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9 9 9 0 0 1 9 9z"></path><path d="M12 8v4l3 3"></path></svg>
                                                </button>
                                                <button class="btn-icon ${quote.status === 'accepted' ? 'btn-success' : ''}" 
                                                        onclick="Quotes.convertToInvoice('${quote.id}')" 
                                                        title="${quote.status === 'accepted' ? 'Convertir en facture' : 'Valider et Facturer'}">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                                                </button>
                                                <button class="btn-icon" onclick="Quotes.duplicate('${quote.id}')" title="Dupliquer">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                </button>
                                                <button class="btn-icon" onclick="Quotes.downloadPDF('${quote.id}')" title="Télécharger PDF">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                </button>
                                                <button class="btn-icon btn-danger" onclick="Quotes.delete('${quote.id}')" title="Supprimer">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
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
                    <p>Aucun devis enregistré</p>
                    <button class="button-primary" onclick="Quotes.showAddForm()">Créer mon premier devis</button>
                </div>
            `}
        `;
    },

    duplicate(id) {
        const quote = Storage.getQuote(id);
        if (!quote) return;

        if (confirm('Voulez-vous dupliquer ce devis (créer une copie) ?')) {
            const newQuoteData = {
                clientId: quote.clientId,
                status: 'draft',
                items: JSON.parse(JSON.stringify(quote.items)), // Deep copy
                subtotal: quote.subtotal,
                tax: quote.tax,
                total: quote.total
            };

            Storage.addQuote(newQuoteData);
            App.showNotification('Devis dupliqué.', 'success');
            this.render();
        }
    },

    showAddForm(preselectedClientId = null) {
        const limits = App.checkFreemiumLimits();
        if (!limits.canAddQuote) {
            App.showUpgradeModal('limit');
            return;
        }

        const clients = Storage.getClients();

        // Si aucun client n'existe, on redirige vers l'ajout de client
        if (clients.length === 0) {
            if (confirm('Vous devez d\'abord créer un client pour établir un devis. Voulez-vous en créer un maintenant ?')) {
                // Sauvegarder l'état pour revenir ici après la création du client
                sessionStorage.setItem('sp_return_to_quote', 'true');

                // Si on vient du scoper, on garde les items en mémoire dans le Storage
                // (déjà géré par Scoper.createQuote qui met dans sp_draft_quote_items)

                if (typeof Clients !== 'undefined') {
                    // On utilise le mode "Full Page" ou modal rapide selon préférence
                    // Ici on simule une navigation vers Clients -> Nouveau
                    App.navigateTo('network', 'clients');
                    setTimeout(() => Clients.showAddForm(), 100);
                }
            }
            return;
        }

        this.editingId = null;

        // Check for draft items (array) from scoper
        const draftItems = Storage.get('sp_draft_quote_items');
        // Check for single draft item from calculator (legacy or simple)
        const draftItem = Storage.get('sp_draft_quote_item');

        if (draftItems && Array.isArray(draftItems) && draftItems.length > 0) {
            this.currentItems = draftItems;
            Storage.set('sp_draft_quote_items', null);
            App.showNotification('Estimation importée avec succès !', 'success');
        } else if (draftItem) {
            this.currentItems = [draftItem];
            Storage.set('sp_draft_quote_item', null);
            App.showNotification('Tarif importé depuis le calculateur !', 'success');
        } else {
            this.currentItems = [{ description: '', quantity: 1, unitPrice: 0 }];
        }

        const container = document.getElementById('quote-form-container');
        container.innerHTML = this.renderForm(clients, null, preselectedClientId);
        this.updateTotals();
        container.scrollIntoView({ behavior: 'smooth' });

        // Auto-populate services for new quote
        if (preselectedClientId) {
            this.addDefaultServicesForClient(preselectedClientId);
        }

        // Listener for client change
        const select = document.getElementById('quote-client-select');
        if (select) {
            select.addEventListener('change', (e) => {
                this.addDefaultServicesForClient(e.target.value);
            });
        }

        // Render Tax Selector
        if (typeof TaxEngine !== 'undefined') {
            TaxEngine.renderSelector('quote-tax-selector-container', () => this.updateTotals());
        }
    },

    renderForm(clients, quote = null, preselectedClientId = null) {
        const settings = Storage.get(Storage.KEYS.SETTINGS);
        const items = quote ? quote.items : this.currentItems;
        const services = Storage.getServices(); // Fetch services

        return `
            <div class="form-card">
                <datalist id="quote-services-list">
                    ${services.map(s => `<option value="${s.label}">${App.formatCurrency(s.unitPrice)}</option>`).join('')}
                </datalist>

                <div class="form-header">
                    <h3>${quote ? 'Modifier le Devis' : 'Nouveau Devis'}</h3>
                    <button class="btn-close" onclick="Quotes.hideForm()">✕</button>
                </div>
                <form id="quote-form" onsubmit="Quotes.save(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Client *</label>
                            <div style="display: flex; gap: 10px;">
                                <select name="clientId" id="quote-client-select" class="form-input" required style="flex: 1;">
                                    <option value="">Sélectionner un client</option>
                                    ${clients.map(c => `
                                        <option value="${c.id}" ${(quote?.clientId === c.id || preselectedClientId === c.id) ? 'selected' : ''}>
                                            ${c.name}
                                        </option>
                                    `).join('')}
                                </select>
                                <button type="button" class="button-secondary" onclick="Quotes.openQuickClientAdd()">
                                    Nouveau
                                </button>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Statut</label>
                            <select name="status" class="form-input">
                                <option value="draft" ${quote?.status === 'draft' ? 'selected' : ''}>Brouillon</option>
                                <option value="sent" ${quote?.status === 'sent' ? 'selected' : ''}>Envoyé</option>
                                <option value="accepted" ${quote?.status === 'accepted' ? 'selected' : ''}>Accepté</option>
                                <option value="refused" ${quote?.status === 'refused' ? 'selected' : ''}>Refusé</option>
                            </select>
                        </div>
                        
                        <div class="form-group full-width" id="quote-tax-selector-container">
                            <!-- TaxEngine will render here -->
                        </div>
                    </div>

                    <div class="form-section">
                        <div class="section-header-inline">
                            <h4>Lignes du devis</h4>
                            <button type="button" class="button-secondary" onclick="Quotes.addItem()">
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
                            <div class="total-row tax-context-info">
                                <span id="tax-info-display" class="text-xs text-muted"></span>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="button-secondary" onclick="Quotes.hideForm()">Annuler</button>
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
                           list="quote-services-list"
                           value="${item.description || ''}"
                           oninput="Quotes.handleServiceSelect(this, ${index})"
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
                           onchange="Quotes.updateTotals()"
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
                           onchange="Quotes.updateTotals()"
                           required>
                </div>
                <div class="item-field item-total">
                    <span class="item-total-display">${App.formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}</span>
                </div>
                <div class="item-field item-actions">
                    <button type="button" class="btn-icon btn-danger" onclick="Quotes.removeItem(${index})">
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
            App.showNotification('Un devis doit avoir au moins une ligne.', 'error');
            return;
        }
        this.currentItems.splice(index, 1);
        document.querySelector(`.item-row[data-index="${index}"]`).remove();
        this.updateTotals();
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

    updateTotals() {
        const form = document.getElementById('quote-form');
        if (!form) return;

        const settings = Storage.get(Storage.KEYS.SETTINGS);
        let subtotal = 0;

        form.querySelectorAll('.item-row').forEach(row => {
            const qty = parseFloat(row.querySelector('[name*="[quantity]"]')?.value) || 0;
            const price = parseFloat(row.querySelector('[name*="[unitPrice]"]')?.value) || 0;
            const itemTotal = qty * price;

            const display = row.querySelector('.item-total-display');
            if (display) display.textContent = App.formatCurrency(itemTotal);

            subtotal += itemTotal;
        });

        let tax = subtotal * (settings.taxRate / 100);
        let total = subtotal + tax;
        let taxLabel = `TVA (${settings.taxRate}%) :`;

        if (typeof TaxEngine !== 'undefined') {
            const taxResult = TaxEngine.calculate(subtotal);
            tax = taxResult.vat;
            total = taxResult.ttc;
            taxLabel = `TVA (${TaxEngine.getCurrent().vat}%) :`;
            document.getElementById('tax-info-display').textContent = TaxEngine.getCurrent().description;
        }

        document.getElementById('subtotal-display').textContent = App.formatCurrency(subtotal);
        document.getElementById('tax-display').previousElementSibling.textContent = taxLabel;
        document.getElementById('tax-display').textContent = App.formatCurrency(tax);
        document.getElementById('total-display').textContent = App.formatCurrency(total);

        this.renderMarginGuard(subtotal);
    },

    renderMarginGuard(subtotal) {
        const container = document.getElementById('margin-guard-container');
        if (!container) return;

        const calcData = Storage.get('sp_calculator_data') || { dailyRate: 400 };
        const targetTJM = calcData.dailyRate || 400;

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
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">Basé sur votre TJM cible de ${App.formatCurrency(targetTJM)}.</p>
            </div>
        `;
    },

    save(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

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

        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const settings = Storage.get(Storage.KEYS.SETTINGS);
        let tax = subtotal * (settings.taxRate / 100);
        let total = subtotal + tax;
        let taxContext = null;

        if (typeof TaxEngine !== 'undefined') {
            const taxResult = TaxEngine.calculate(subtotal);
            tax = taxResult.vat;
            total = taxResult.ttc;
            taxContext = TaxEngine.currentContext;
        }

        const quoteData = {
            clientId: formData.get('clientId'),
            status: formData.get('status'),
            items: items,
            subtotal: subtotal,
            tax: tax,
            total: total,
            taxContext: taxContext
        };

        if (this.editingId) {
            Storage.updateQuote(this.editingId, quoteData);
            App.showNotification('Devis modifié.', 'success');
        } else {
            Storage.addQuote(quoteData);
            App.showNotification('Devis créé.', 'success');
        }

        this.hideForm();
        this.render();
    },

    // Convertir un devis en facture
    convertToInvoice(id) {
        const quote = Storage.getQuote(id);
        if (!quote) return;

        if (quote.status !== 'accepted') {
            if (!confirm('Le devis n\'est pas encore marqué comme accepté. Souhaitez-vous tout de même générer la facture ?')) {
                return;
            }
            Storage.updateQuote(id, { status: 'accepted' });
        } else {
            if (!confirm('Voulez-vous convertir ce devis en facture ?')) {
                return;
            }
        }

        const invoiceData = {
            clientId: quote.clientId,
            status: 'draft',
            items: quote.items,
            subtotal: quote.subtotal,
            tax: quote.tax,
            total: quote.total,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        Storage.addInvoice(invoiceData);
        App.showNotification('Facture générée avec succès.', 'success');
        App.navigateTo('invoices');
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
    },

    changeStatus(id) {
        const quote = Storage.getQuote(id);
        if (!quote) return;

        const statuses = [
            { value: 'draft', label: 'Brouillon' },
            { value: 'sent', label: 'Envoyé' },
            { value: 'accepted', label: 'Accepté' },
            { value: 'refused', label: 'Refusé' }
        ];

        const currentIndex = statuses.findIndex(s => s.value === quote.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        const nextStatus = statuses[nextIndex].value;

        Storage.updateQuote(id, { status: nextStatus });
        App.showNotification(`Statut mis à jour : ${statuses[nextIndex].label}`, 'success');
        this.render();
    },

    downloadPDF(id) {
        const isPro = Storage.isPro();
        if (!isPro) {
            App.showUpgradeModal('pdf');
            return;
        }

        const user = Storage.getUser();
        if (!user.company.name || !user.company.address) {
            if (confirm('Vos informations entreprise sont incomplètes. Souhaitez-vous les compléter maintenant ?')) {
                App.navigateTo('settings');
            }
            return;
        }

        const quote = Storage.getQuote(id);
        const client = Storage.getClient(quote.clientId);

        if (typeof PDFGenerator !== 'undefined' && PDFGenerator.generateQuote) {
            PDFGenerator.generateQuote(quote, client, user);
        } else {
            App.showNotification('Module PDF indisponible pour le moment.', 'info');
        }
    },

    fastSend(id) {
        const quote = Storage.getQuote(id);
        const client = Storage.getClient(quote?.clientId);
        const user = Storage.getUser();

        if (!quote || !client) return;

        const subject = encodeURIComponent(`Devis ${quote.number} - ${user.company.name || 'Proposition'}`);
        const body = encodeURIComponent(`Bonjour ${client.name},\n\nVeuillez trouver ci-joint mon devis ${quote.number} d'un montant de ${App.formatCurrency(quote.total)}.\n\nJe reste à votre disposition pour en discuter.\n\nCordialement,\n${user.company.name || 'Votre prestataire'}`);

        const mailtoUrl = `mailto:${client.email || ''}?subject=${subject}&body=${body}`;

        App.showNotification('Ouverture de votre messagerie...', 'info');

        Storage.updateQuote(id, { status: 'sent' });
        this.render();

        setTimeout(() => {
            window.location.href = mailtoUrl;
        }, 800);
    },

    edit(id) {
        const quote = Storage.getQuote(id);
        if (!quote) return;

        this.editingId = id;
        this.currentItems = quote.items;

        const clients = Storage.getClients();
        const container = document.getElementById('quote-form-container');
        if (container) {
            container.innerHTML = this.renderForm(clients, quote);
            this.updateTotals();
            container.scrollIntoView({ behavior: 'smooth' });
        }
    },

    delete(id) {
        if (confirm('Confirmer la suppression de ce devis ?')) {
            Storage.deleteQuote(id);
            App.showNotification('Devis supprimé.', 'success');
            this.render();
        }
    },

    hideForm() {
        const container = document.getElementById('quote-form-container');
        if (container) container.innerHTML = '';
        this.editingId = null;
        this.currentItems = [];
    },

    openQuickClientAdd() {
        if (typeof Clients !== 'undefined') {
            Clients.openQuickAdd((newClient) => {
                const select = document.getElementById('quote-client-select');
                if (select) {
                    const option = document.createElement('option');
                    option.value = newClient.id;
                    option.text = newClient.name;
                    option.selected = true;
                    select.add(option);
                    select.value = newClient.id;
                }
            });
        }
    },

    getStatusLabel(status) {
        const labels = {
            draft: 'Brouillon',
            sent: 'Envoyé',
            accepted: 'Accepté',
            refused: 'Refusé'
        };
        return labels[status] || status;
    }
};
