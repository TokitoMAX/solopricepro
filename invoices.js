// SoloPrice Pro - Invoices Module

const Invoices = {
    editingId: null,
    currentItems: [],
    lastContainerId: 'invoices-content',

    render(containerId = 'invoices-content') {
        this.lastContainerId = containerId;
        const container = document.getElementById(containerId);
        if (!container) return;

        // Auto-close dropdowns
        document.addEventListener('click', () => {
            document.querySelectorAll('.actions-menu.active').forEach(m => m.classList.remove('active'));
        });

        const invoices = Storage.getInvoices();
        const limits = App.checkFreemiumLimits();

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Factures</h1>
                    <p class="page-subtitle">${invoices.length} facture(s) ${!limits.canAddInvoice ? `(limite: ${limits.maxInvoices})` : ''}</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="button-secondary" onclick="App.exportReceiptsLedger()">
                        <i class="fas fa-file-pdf"></i> Livre des Recettes
                    </button>
                    <button class="button-primary" onclick="alert('Pour créer une facture, convertissez un devis dans le menu Devis.')" title="Créez d'abord un devis pour sécuriser le process">
                        Nouvelle Facture
                    </button>
                </div>
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
                                        <td data-label="Numéro"><strong>${invoice.number}</strong></td>
                                        <td data-label="Client">${client?.name || 'Client supprimé'}</td>
                                        <td data-label="Date">${App.formatDate(invoice.createdAt)}</td>
                                        <td data-label="Échéance">${invoice.dueDate ? App.formatDate(invoice.dueDate) : '-'}</td>
                                        <td data-label="Montant HT">${App.formatCurrency(subtotal)}</td>
                                        <td data-label="Montant TTC">${App.formatCurrency(invoice.total)}</td>
                                        <td data-label="Statut">
                                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                                <span class="status-badge status-${invoice.status}">${this.getStatusLabel(invoice.status)}</span>
                                                ${(invoice.status === 'sent' || invoice.status === 'paid' || invoice.status === 'overdue') ? `
                                                    <div style="display: flex; gap: 4px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase;">
                                                        <span title="Part Prestataire" style="padding: 2px 4px; border-radius: 4px; background: ${invoice.expert_paid_at ? 'var(--primary-glass)' : 'rgba(255,255,255,0.05)'}; color: ${invoice.expert_paid_at ? 'var(--primary-light)' : 'var(--text-muted)'}; border: 1px solid ${invoice.expert_paid_at ? 'var(--primary-light)' : 'var(--border)'};">P</span>
                                                        <span title="Commission Plateforme" style="padding: 2px 4px; border-radius: 4px; background: ${invoice.platform_paid_at ? 'var(--primary-glass)' : 'rgba(255,255,255,0.05)'}; color: ${invoice.platform_paid_at ? 'var(--primary-light)' : 'var(--text-muted)'}; border: 1px solid ${invoice.platform_paid_at ? 'var(--primary-light)' : 'var(--border)'};">C</span>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        </td>
                                        <td data-label="Actions" class="actions-cell">
                                            <div class="table-actions-dropdown">
                                                <button class="button-secondary small action-trigger" onclick="event.stopPropagation(); Invoices.toggleActions('${invoice.id}')">
                                                    Actions <i class="fas fa-chevron-down" style="font-size: 0.7rem; margin-left: 5px;"></i>
                                                </button>
                                                <div id="invoice-actions-${invoice.id}" class="actions-menu glass">
                                                    <div class="menu-section">
                                                        <label>Essentiel</label>
                                                        <button onclick="Invoices.edit('${invoice.id}')"><i class="fas fa-edit"></i> Modifier</button>
                                                        <button onclick="Invoices.downloadPDF('${invoice.id}')"><i class="fas fa-file-pdf"></i> PDF Pro</button>
                                                        <button onclick="Invoices.fastSend('${invoice.id}')"><i class="fas fa-paper-plane"></i> Envoyer</button>
                                                    </div>
                                                    
                                                    <div class="menu-section">
                                                        <label>Gestion</label>
                                                        <button onclick="Invoices.changeStatus('${invoice.id}')"><i class="fas fa-sync-alt"></i> Statut</button>
                                                        <button onclick="Invoices.duplicate('${invoice.id}')"><i class="fas fa-copy"></i> Dupliquer</button>
                                                        <button onclick="Invoices.openRelanceModal('${invoice.id}')" style="color: #f59e0b;"><i class="fas fa-hourglass-half"></i> Relance (Expert)</button>
                                                    </div>

                                                    <div class="menu-section">
                                                        <label>Paiements</label>
                                                        <button onclick="Invoices.togglePaymentStatus('${invoice.id}', 'expert')" style="color: ${invoice.expert_paid_at ? 'var(--primary)' : 'var(--text-muted)'};">
                                                            <i class="fas fa-user-check"></i> Part Prestataire
                                                        </button>
                                                        <button onclick="Invoices.togglePaymentStatus('${invoice.id}', 'platform')" style="color: ${invoice.platform_paid_at ? 'var(--primary)' : 'var(--text-muted)'};">
                                                            <i class="fas fa-percentage"></i> Commission SoloPrice
                                                        </button>
                                                    </div>

                                                    <div class="menu-section">
                                                        <button onclick="Invoices.delete('${invoice.id}')" class="text-danger"><i class="fas fa-trash-alt"></i> Supprimer</button>
                                                    </div>
                                                </div>
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

    renderPaymentTracker(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const invoices = Storage.getInvoices();
        const trackedInvoices = invoices.filter(i =>
            i.status === 'sent' || i.status === 'paid' || i.status === 'overdue'
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (trackedInvoices.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>${i18n.t('dashboard.no_docs')}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="section-header-inline">
                <h3 class="section-title-small">${i18n.t('payments.title')}</h3>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${i18n.t('pdf.number')}</th>
                            <th>${i18n.t('pdf.client')}</th>
                            <th>${i18n.t('pdf.total_ttc')}</th>
                            <th>${i18n.t('payments.table.expert')}</th>
                            <th>${i18n.t('payments.table.platform')}</th>
                            <th>${i18n.t('quotes.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${trackedInvoices.map(invoice => {
            const client = Storage.getClient(invoice.clientId);
            return `
                                <tr>
                                    <td><strong>${invoice.number}</strong></td>
                                    <td>${client?.name || 'Client supprimé'}</td>
                                    <td>${App.formatCurrency(invoice.total)}</td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span class="status-badge" style="background: ${invoice.expert_paid_at ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${invoice.expert_paid_at ? '#10b981' : '#ef4444'};">
                                                ${invoice.expert_paid_at ? i18n.t('payments.status.collected') : i18n.t('payments.status.pending')}
                                            </span>
                                            ${!invoice.expert_paid_at ? `<button class="button-ghost small" onclick="Invoices.togglePaymentStatus('${invoice.id}', 'expert')"><i class="fas fa-check"></i></button>` : ''}
                                        </div>
                                    </td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span class="status-badge" style="background: ${invoice.platform_paid_at ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; color: ${invoice.platform_paid_at ? '#10b981' : '#f59e0b'};">
                                                ${invoice.platform_paid_at ? i18n.t('payments.status.collected') : i18n.t('payments.status.pending')}
                                            </span>
                                            ${!invoice.platform_paid_at ? `<button class="button-ghost small" onclick="Invoices.togglePaymentStatus('${invoice.id}', 'platform')"><i class="fas fa-check"></i></button>` : ''}
                                        </div>
                                    </td>
                                    <td class="actions-cell">
                                        <button class="button-secondary small" onclick="Invoices.edit('${invoice.id}')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    showAddForm() {
        if (typeof App !== 'undefined' && !App.enforceLimit('invoices')) {
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

        // Render Tax Selector
        if (typeof TaxEngine !== 'undefined') {
            TaxEngine.renderSelector('invoice-tax-selector-container', () => this.updateTotals());
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
                    <button class="btn-close" onclick="Invoices.hideForm()"></button>
                </div>

                <div class="compliance-checklist info-box" style="background: rgba(var(--primary-rgb), 0.05); border: 1px dashed var(--primary); padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 0.85rem;">
                    <strong style="display: block; margin-bottom: 8px; color: var(--primary-light);"><i class="fas fa-certificate"></i> Standards Professionnels SoloPrice Pro</strong>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 8px;"><i class="fas fa-check-circle" style="color: var(--primary);"></i> SIRET & Mentions légales</div>
                        <div style="display: flex; align-items: center; gap: 8px;"><i class="fas fa-check-circle" style="color: var(--primary);"></i> Calcul automatique TVA</div>
                        <div style="display: flex; align-items: center; gap: 8px;"><i class="fas fa-check-circle" style="color: var(--primary);"></i> Date d'échéance claire</div>
                        <div style="display: flex; align-items: center; gap: 8px;"><i class="fas fa-check-circle" style="color: var(--primary);"></i> Conformité art. 293B CGI</div>
                    </div>
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

                        <div class="form-group full-width" id="invoice-tax-selector-container">
                            <!-- TaxEngine will render here -->
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

                        <div class="invoice-totals" style="border-top: 2px solid var(--border); padding-top: 1.5rem;">
                            <div class="total-row">
                                <span style="opacity: 0.8;">Prestations HT :</span>
                                <span id="subtotal-display">0€</span>
                            </div>
                            <div class="total-row" style="color: var(--primary-light);">
                                <span style="font-weight: 600;">Protection SoloPrice (Obligatoire) :</span>
                                <span id="margin-display">0€</span>
                            </div>
                            <div class="total-row" style="border-top: 1px solid var(--border); margin-top: 0.5rem; padding-top: 0.5rem;">
                                <span style="font-weight: 700;">Total Hors Taxes :</span>
                                <span id="final-subtotal-display" style="font-weight: 700;">0€</span>
                            </div>
                            <div class="total-row">
                                <span id="tax-label-display">TVA (${settings.taxRate}%) :</span>
                                <span id="tax-display">0€</span>
                            </div>
                            <div class="total-row total" style="background: var(--primary-glass); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                                <span style="font-size: 1.2rem; font-weight: 800;">TOTAL TTC :</span>
                                <span id="total-display" style="font-size: 1.2rem; font-weight: 800; color: var(--primary-light);">0€</span>
                            </div>
                            <div class="total-row tax-context-info">
                                <span id="tax-info-display" class="text-xs text-muted"></span>
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
        let itemsSubtotal = 0;

        // Calculer à partir des inputs actuels
        form.querySelectorAll('.item-row').forEach(row => {
            const qty = parseFloat(row.querySelector('[name*="[quantity]"]')?.value) || 0;
            const price = parseFloat(row.querySelector('[name*="[unitPrice]"]')?.value) || 0;
            const itemTotal = qty * price;

            // Mettre à jour l'affichage du total de ligne
            const display = row.querySelector('.item-total-display');
            if (display) display.textContent = App.formatCurrency(itemTotal);

            itemsSubtotal += itemTotal;
        });

        // Calcul de la Protection SoloPrice (15%)
        const SERVICE_MARGIN_RATE = 0.15;
        const margin = itemsSubtotal * SERVICE_MARGIN_RATE;
        const finalSubtotal = itemsSubtotal + margin;

        const tax = finalSubtotal * (settings.taxRate / 100);
        const total = finalSubtotal + tax;

        // Update UI
        const subtotalEl = document.getElementById('subtotal-display');
        const marginEl = document.getElementById('margin-display');
        const finalSubtotalEl = document.getElementById('final-subtotal-display');
        const taxEl = document.getElementById('tax-display');
        const totalEl = document.getElementById('total-display');

        if (subtotalEl) subtotalEl.textContent = App.formatCurrency(itemsSubtotal);
        if (marginEl) marginEl.textContent = App.formatCurrency(margin);
        if (finalSubtotalEl) finalSubtotalEl.textContent = App.formatCurrency(finalSubtotal);

        if (taxLabelEl) {
            const taxName = (typeof TaxEngine !== 'undefined') ? TaxEngine.getCurrent().taxName : 'TVA';
            const taxRate = (typeof TaxEngine !== 'undefined') ? TaxEngine.getCurrent().vat : settings.taxRate;
            taxLabelEl.textContent = `${taxName} (${taxRate}%) :`;
        }

        if (taxEl) taxEl.textContent = App.formatCurrency(tax);
        if (totalEl) totalEl.textContent = App.formatCurrency(total);

        // Update Tax Info
        const taxInfoEl = document.getElementById('tax-info-display');
        if (taxInfoEl && typeof TaxEngine !== 'undefined') {
            taxInfoEl.textContent = TaxEngine.getCurrent().description;
        }

        this.renderMarginGuard(itemsSubtotal);
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

    async save(e) {
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
        const itemsSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

        // Protection SoloPrice (15%)
        const SERVICE_MARGIN_RATE = 0.15;
        const margin = itemsSubtotal * SERVICE_MARGIN_RATE;
        const finalSubtotal = itemsSubtotal + margin;

        let tax = finalSubtotal * (settings.taxRate / 100);
        let total = finalSubtotal + tax;
        let taxContext = null;
        let taxRate = settings.taxRate;
        let taxName = typeof TaxEngine !== 'undefined' ? TaxEngine.getCurrent().taxName : 'TVA';

        if (typeof TaxEngine !== 'undefined') {
            const taxResult = TaxEngine.calculate(finalSubtotal);
            tax = taxResult.vat;
            total = taxResult.ttc;
            taxRate = taxResult.taxRate;
            taxName = taxResult.taxName;
            taxContext = TaxEngine.currentContext;
        }

        const invoiceData = {
            clientId: formData.get('clientId'),
            dueDate: formData.get('dueDate'),
            status: formData.get('status'),
            items: items,
            itemsSubtotal: itemsSubtotal,
            margin: margin,
            subtotal: finalSubtotal,
            tax: tax,
            taxRate: taxRate,
            taxName: taxName,
            total: total,
            taxContext: taxContext
        };

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Sauvegarde...';
        btn.disabled = true;

        try {
            if (this.editingId) {
                await Storage.updateInvoice(this.editingId, invoiceData);
                App.showNotification('Facture modifiée.', 'success');
            } else {
                await Storage.addInvoice(invoiceData);
                App.showNotification('Facture créée.', 'success');
            }
            this.hideForm();
            this.render(this.lastContainerId);
        } catch (e) {
            console.error(e);
            App.showNotification('Erreur de sauvegarde.', 'error');
        } finally {
            if (btn) {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }
    },

    async changeStatus(id) {
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

        await Storage.updateInvoice(id, { status: nextStatus });
        App.showNotification(`Statut mis à jour : ${statuses[nextIndex].label}`, 'success');
        this.render(this.lastContainerId);
    },

    async togglePaymentStatus(id, type) {
        const invoice = Storage.getInvoice(id);
        if (!invoice) return;

        const field = type === 'expert' ? 'expert_paid_at' : 'platform_paid_at';
        const newValue = invoice[field] ? null : new Date().toISOString();

        try {
            await Storage.updateInvoice(id, { [field]: newValue });
            App.showNotification(`Paiement ${type === 'expert' ? 'Prestataire' : 'Commission'} mis à jour.`, 'success');

            this.render(this.lastContainerId);
        } catch (e) {
            App.showNotification('Erreur lors de la mise à jour du paiement.', 'error');
        }
    },

    async fastSend(id) {
        const invoice = Storage.getInvoice(id);
        const client = Storage.getClient(invoice?.clientId);
        const user = Storage.getUser();

        if (!invoice || !client) return;

        // Préparer le mailto
        const subject = encodeURIComponent(`Facture ${invoice.number} - ${user?.company?.name || 'Prestation'}`);
        const body = encodeURIComponent(`Bonjour ${client.name},\n\nVeuillez trouver ci-joint la facture ${invoice.number} d'un montant de ${App.formatCurrency(invoice.total)}.\n\nCordialement,\n${user?.company?.name || 'Votre prestataire'}`);

        const mailtoUrl = `mailto:${client.email || ''}?subject=${subject}&body=${body}`;

        App.showNotification('Ouverture de votre messagerie... N\'oubliez pas de joindre le PDF téléchargé !', 'info');

        // Simuler le passage en mode "envoyé" immédiatement pour l'action-réaction
        await Storage.updateInvoice(id, { status: 'sent' });
        this.render(this.lastContainerId);

        setTimeout(() => {
            window.location.href = mailtoUrl;
        }, 1200);
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
                subject: `Rappel : Facture ${invoice.number} en attente - ${user?.company?.name || ''}`,
                body: `Bonjour ${client.name},\n\nSauf erreur de notre part, la facture ${invoice.number} du ${new Date(invoice.createdAt).toLocaleDateString()} d'un montant de ${App.formatCurrency(invoice.total)} reste impayée à ce jour.\n\nPouvez-vous me confirmer son statut ?\n\nBien cordialement,\n${user?.company?.name || ''}`
            },
            firm: {
                label: '2. Retard Confirmé',
                subject: `Urgent : Retard de paiement Facture ${invoice.number}`,
                body: `Bonjour ${client.name},\n\nLa facture ${invoice.number} (Échéance : ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Passée'}) est toujours en attente de règlement malgré notre précédente relance.\n\nJe vous remercie de procéder au virement des ${App.formatCurrency(invoice.total)} sans délai.\n\nCordialement,\n${user?.company?.name || ''}`
            },
            hard: {
                label: '3. Mise en Demeure',
                subject: `Mise en demeure : Facture ${invoice.number}`,
                body: `Madame, Monsieur,\n\nMalgré mes relances, la facture ${invoice.number} reste impayée.\nJe vous mets par la présente en demeure de régler la somme de ${App.formatCurrency(invoice.total)} sous 48h, faute de quoi je transmettrai le dossier au service recouvrement.\n\nDans l'attente de votre virement immédiat.\n\n${user?.company?.name || ''}`
            }
        };

        modal.innerHTML = `
            <div class="modal-content glass" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Assistant Relance Recouvrement</h3>
                    <button class="modal-close" onclick="Invoices.closeRelanceModal()"></button>
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
        if (!user?.company?.name || !user?.company?.address) {
            if (confirm('Vos informations entreprise sont incomplètes.\n\nVoulez-vous les compléter maintenant pour l\'export PDF ?')) {
                App.navigateTo('settings');
            }
            return;
        }

        const invoice = Storage.getInvoice(id);
        const client = Storage.getClient(invoice.clientId);
        const normalizedUser = Storage.getNormalizedUser();

        // Utiliser le module PDF si disponible
        if (typeof PDFGenerator !== 'undefined') {
            PDFGenerator.generateInvoice(invoice, client, normalizedUser);
        } else {
            App.showNotification('Module PDF en cours de chargement...', 'error');
        }
    },

    async duplicate(id) {
        if (typeof App !== 'undefined' && !App.enforceLimit('invoices')) return;

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

            await Storage.addInvoice(newInvoiceData);
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

    async delete(id) {
        if (confirm('Confirmer la suppression de cette facture ?')) {
            await Storage.deleteInvoice(id);
            App.showNotification('Facture supprimée.', 'success');
            this.render(this.lastContainerId);
        }
    },

    async togglePaymentStatus(id, type) {
        const invoice = Storage.getInvoice(id);
        if (!invoice) return;

        const field = type === 'expert' ? 'expert_paid_at' : 'platform_paid_at';
        const newValue = invoice[field] ? null : new Date().toISOString();

        try {
            await Storage.updateInvoice(id, { [field]: newValue });
            App.showNotification('Statut de paiement mis à jour.', 'success');
            
            // Auto-update global status if everything is paid
            const updatedInvoice = Storage.getInvoice(id);
            if (updatedInvoice.expert_paid_at && updatedInvoice.platform_paid_at && updatedInvoice.status !== 'paid') {
                await Storage.updateInvoice(id, { status: 'paid' });
            }

            this.render(this.lastContainerId);
        } catch (e) {
            App.showNotification('Erreur de mise à jour.', 'error');
        }
    },

    async markAsPaid(id) {
        const invoice = Storage.getInvoice(id);
        if (!invoice) return;

        const now = new Date().toISOString();
        try {
            await Storage.updateInvoice(id, {
                expert_paid_at: now,
                platform_paid_at: now,
                status: 'paid'
            });
            App.showNotification('Facture marquée comme entièrement payée.', 'success');
            this.render(this.lastContainerId);
        } catch (e) {
            App.showNotification('Erreur de mise à jour.', 'error');
        }
    },

    copyPublicLink(id) {
        const invoice = Storage.getInvoice(id);
        if (!invoice) return;
        const baseUrl = window.location.origin + window.location.pathname;
        const publicLink = `${baseUrl}#view-invoice=${invoice.id}`;

        navigator.clipboard.writeText(publicLink).then(() => {
            App.showNotification('Lien public copié.', 'success');
        }).catch(err => {
            prompt('Copiez ce lien :', publicLink);
        });
    },

    async renderPublicView(id, paymentStatus) {
        const container = document.getElementById('public-view-container') || document.getElementById('app-wrapper');
        if (!container) return;

        try {
            const data = await Storage.fetchPublicInvoice(id);
            if (!data) throw new Error('Document introuvable');

            const { invoice, client, provider } = data;

            App.enterPublicMode();

            container.innerHTML = `
                <div class="public-invoice-page glass" style="max-width: 900px; margin: 2rem auto; padding: 3rem; border-radius: 24px;">
                    <div class="public-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3rem;">
                        <div>
                            <h1 class="logo-text" style="font-size: 2rem; margin-bottom: 0.5rem;">FACTURE ${invoice.number}</h1>
                            <p class="text-muted">Émise le ${App.formatDate(invoice.createdAt)}</p>
                        </div>
                        <div style="text-align: right;">
                             <span class="status-badge status-${invoice.status}" style="font-size: 1rem; padding: 8px 16px;">${this.getStatusLabel(invoice.status)}</span>
                        </div>
                    </div>

                    <div class="public-actors" style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 3rem;">
                        <div>
                             <h4 style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 1rem;">Prestataire</h4>
                             <p><strong>${provider.company?.name || provider.email}</strong><br>${provider.company?.address || ''}</p>
                        </div>
                        <div>
                             <h4 style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 1rem;">Client</h4>
                             <p><strong>${client.name}</strong><br>${client.address || ''}</p>
                        </div>
                    </div>

                    <table class="data-table" style="margin-bottom: 2rem;">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th style="text-align: center;">Qté</th>
                                <th style="text-align: right;">Prix Unitaire</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.items.map(item => `
                                <tr>
                                    <td>${item.description}</td>
                                    <td style="text-align: center;">${item.quantity}</td>
                                    <td style="text-align: right;">${App.formatCurrency(item.unitPrice)}</td>
                                    <td style="text-align: right;">${App.formatCurrency(item.quantity * item.unitPrice)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div style="display: flex; justify-content: flex-end;">
                        <div style="width: 300px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span>Sous-total HT</span>
                                <span>${App.formatCurrency(invoice.subtotal)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span>${invoice.taxName || 'TVA'} (${invoice.taxRate}%)</span>
                                <span>${App.formatCurrency(invoice.tax)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.5rem; border-top: 1px solid var(--border); padding-top: 1rem; margin-top: 1rem; color: white;">
                                <span>TOTAL TTC</span>
                                <span>${App.formatCurrency(invoice.total)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="public-footer" style="margin-top: 4rem; padding-top: 2rem; border-top: 1px dashed var(--border); text-align: center; color: var(--text-muted); font-size: 0.9rem;">
                        Propulsé par SoloPrice Pro - L'outil de gestion des experts indépendants.
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div class="error-view">${err.message}</div>`;
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

    toggleActions(id) {
        const menu = document.getElementById(`invoice-actions-${id}`);
        if (!menu) return;

        const isActive = menu.classList.contains('active');
        document.querySelectorAll('.actions-menu.active').forEach(m => m.classList.remove('active'));

        if (!isActive) {
            menu.classList.add('active');
        }
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
