// SoloPrice Pro - Quotes Module

const Quotes = {
    editingId: null,
    currentItems: [],
    lastContainerId: 'quotes-content',

    init() {
        console.log('Quotes module initialized');
    },


    render(containerId = 'quotes-content', tabId) {
        this.lastContainerId = containerId;
        const container = document.getElementById(containerId);
        if (!container) return;

        // Fallback intelligent
        if (!tabId) tabId = this.activeTab || localStorage.getItem('sp_last_tab_quotes') || 'quotes';
        this.activeTab = tabId;

        const quotes = Storage.getQuotes();
        const limits = App.checkFreemiumLimits();

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">${i18n.t('quotes.title')}</h1>
                <p class="page-subtitle">${i18n.t('quotes.subtitle')}</p>
            </div>

            <div class="settings-tabs">
                <button class="settings-tab" data-tab-id="quotes" onclick="Quotes.switchTab('quotes')">${i18n.t('quotes.tab.quotes')}</button>
                <button class="settings-tab" data-tab-id="invoices" onclick="Quotes.switchTab('invoices')">${i18n.t('quotes.tab.invoices')}</button>
                <button class="settings-tab" data-tab-id="payments" onclick="Quotes.switchTab('payments')">${i18n.t('payments.tab.tracking') || 'Paiements'}</button>
            </div>

            <div id="documents-dynamic-content" style="margin-top: 2rem;">
                <!-- Rempli par switchTab -->
            </div>
        `;

        this.switchTab(tabId || 'quotes');
    },

    switchTab(tabId) {
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.settings-tab[data-tab-id="${tabId}"]`);
        if (activeTab) activeTab.classList.add('active');

        // Logic only if we are on the quotes page
        if (App.currentPage === 'quotes') {
            // Avoid redundant hash updates if already there
            const route = App.getPageFromHash();
            if (!route || route.tab !== tabId) {
                App.navigateTo('quotes', tabId);
            }
        }

        const container = document.getElementById('documents-dynamic-content');
        if (!container) return;

        if (tabId === 'quotes') {
            this.renderQuotes(container);
        } else if (tabId === 'invoices') {
            container.innerHTML = '<div id="invoices-embedded-container"></div>';
            if (typeof Invoices !== 'undefined') {
                Invoices.render('invoices-embedded-container');
            }
        } else if (tabId === 'payments') {
            container.innerHTML = '<div id="payments-embedded-container"></div>';
            if (typeof Invoices !== 'undefined') {
                Invoices.renderPaymentTracker('payments-embedded-container');
            }
        }
    },

    renderQuotes(container) {
        const quotes = Storage.getQuotes();
        const limits = App.checkFreemiumLimits();
        const isPro = Storage.isPro();

        container.innerHTML = `
            <div class="section-header-inline">
                <h3 class="section-title-small">${i18n.t('quotes.count').replace('{count}', quotes.length)}</h3>
                <button class="button-primary small" onclick="Quotes.showAddForm()" ${!limits.canAddQuote ? 'disabled' : ''}>
                    ${i18n.t('quotes.btn.new')}
                </button>
            </div>

            <div id="quote-form-container"></div>

            ${quotes.length > 0 ? `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>${i18n.t('quotes.table.number')}</th>
                                <th>${i18n.t('quotes.table.client')}</th>
                                <th>${i18n.t('quotes.table.date')}</th>
                                <th>${i18n.t('quotes.table.amount')}</th>
                                <th>${i18n.t('quotes.table.status')}</th>
                                <th>${i18n.t('quotes.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${quotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(quote => {
            const client = Storage.getClient(quote.clientId);
            return `
                                    <tr>
                                        <td data-label="${i18n.t('quotes.table.number')}"><strong>${quote.number}</strong></td>
                                        <td data-label="${i18n.t('quotes.table.client')}">${client?.name || i18n.t('quotes.client_deleted')}</td>
                                        <td data-label="${i18n.t('quotes.table.date')}">${App.formatDate(quote.createdAt)}</td>
                                        <td data-label="${i18n.t('quotes.table.amount')}">${App.formatCurrency(quote.total)}</td>
                                        <td data-label="${i18n.t('quotes.table.status')}">
                                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                                <span class="status-badge status-${quote.status}">${this.getStatusLabel(quote.status)}</span>
                                                ${(quote.status === 'accepted' || quote.status === 'paid') ? `
                                                    <div style="display: flex; gap: 4px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase;">
                                                        <span title="Part Prestataire" style="padding: 2px 4px; border-radius: 4px; background: ${quote.expert_paid_at ? 'var(--primary-glass)' : 'rgba(255,255,255,0.05)'}; color: ${quote.expert_paid_at ? 'var(--primary-light)' : 'var(--text-muted)'}; border: 1px solid ${quote.expert_paid_at ? 'var(--primary-light)' : 'var(--border)'};">P</span>
                                                        <span title="Commission Plateforme" style="padding: 2px 4px; border-radius: 4px; background: ${quote.platform_paid_at ? 'var(--primary-glass)' : 'rgba(255,255,255,0.05)'}; color: ${quote.platform_paid_at ? 'var(--primary-light)' : 'var(--text-muted)'}; border: 1px solid ${quote.platform_paid_at ? 'var(--primary-light)' : 'var(--border)'};">C</span>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        </td>
                                        <td data-label="${i18n.t('quotes.table.actions')}" class="actions-cell">
                                            <div class="table-actions-dropdown">
                                                <button class="button-secondary small action-trigger" onclick="event.stopPropagation(); Quotes.toggleActions('${quote.id}')">
                                                    ${i18n.t('quotes.btn.actions')} <i class="fas fa-chevron-down" style="font-size: 0.7rem; margin-left: 5px;"></i>
                                                </button>
                                                <div id="actions-${quote.id}" class="actions-menu glass">
                                                    <div class="menu-section">
                                                        <label>${i18n.t('quotes.menu.essential')}</label>
                                                        <button onclick="Quotes.edit('${quote.id}')"><i class="fas fa-edit"></i> ${i18n.t('quotes.menu.edit')}</button>
                                                        <button onclick="Quotes.downloadPDF('${quote.id}')"><i class="fas fa-file-pdf"></i> ${i18n.t('quotes.menu.pdf')}</button>
                                                        <button onclick="Quotes.fastSend('${quote.id}')"><i class="fas fa-paper-plane"></i> ${i18n.t('quotes.menu.send')}</button>
                                                        <button onclick="Quotes.copyPublicLink('${quote.id}')" style="color: #3b82f6;"><i class="fas fa-link"></i> ${i18n.t('quotes.menu.link')}</button>
                                                    </div>
                                                    
                                                    <div class="menu-section">
                                                        <label>${i18n.t('quotes.menu.flow')}</label>
                                                        <button onclick="Quotes.openSignatureModal('${quote.id}')" style="color: #a855f7;"><i class="fas fa-pen-nib"></i> ${i18n.t('quotes.menu.sign')}</button>
                                                        <button class="${quote.status === 'accepted' ? 'text-success' : ''}" onclick="Quotes.convertToInvoice('${quote.id}')">
                                                            <i class="fas fa-file-invoice-dollar"></i> ${i18n.t('quotes.menu.invoice')}
                                                        </button>
                                                        <button onclick="Quotes.changeStatus('${quote.id}')"><i class="fas fa-sync-alt"></i> ${i18n.t('quotes.menu.status')}</button>
                                                    </div>

                                                    <div class="menu-section">
                                                        <label>${i18n.t('quotes.menu.misc')}</label>
                                                        <button onclick="Quotes.duplicate('${quote.id}')"><i class="fas fa-copy"></i> ${i18n.t('quotes.menu.duplicate')}</button>
                                                        <button onclick="Quotes.delete('${quote.id}')" class="text-danger"><i class="fas fa-trash-alt"></i> ${i18n.t('quotes.menu.delete')}</button>
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
                    <p>${i18n.t('quotes.empty.text')}</p>
                    <button class="button-primary" onclick="Quotes.showAddForm()">${i18n.t('quotes.empty.btn')}</button>
                </div>
            `}
        `;
    },

    async duplicate(id) {
        if (typeof App !== 'undefined' && !App.enforceLimit('quotes')) return;

        const quote = Storage.getQuote(id);
        if (!quote) return;

        if (confirm(i18n.t('quotes.confirm.duplicate'))) {
            const newQuoteData = {
                clientId: quote.clientId,
                status: 'draft',
                items: JSON.parse(JSON.stringify(quote.items)), // Deep copy
                subtotal: quote.subtotal,
                tax: quote.tax,
                total: quote.total
            };

            await Storage.addQuote(newQuoteData);
            App.showNotification(i18n.t('quotes.notify.duplicated'), 'success');
            this.render();
        }
    },

    showAddForm(preselectedClientId = null) {
        // Bloquage strict via App.enforceLimit
        if (typeof App !== 'undefined' && !App.enforceLimit('quotes')) {
            return;
        }

        const clients = Storage.getClients();

        // Si aucun client n'existe, on redirige vers l'ajout de client
        if (clients.length === 0) {
            if (confirm(i18n.t('quotes.confirm.create_client'))) {
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
            App.showNotification(i18n.t('quotes.notify.scoper_imported'), 'success');
        } else if (draftItem) {
            this.currentItems = [draftItem];
            Storage.set('sp_draft_quote_item', null);
            App.showNotification(i18n.t('quotes.notify.calc_imported'), 'success');
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
                    <h3>${quote ? i18n.t('quotes.form.edit') : i18n.t('quotes.form.new')}</h3>
                    <button class="btn-close" onclick="Quotes.hideForm()"></button>
                </div>

                <div class="compliance-checklist info-box" style="background: rgba(var(--primary-rgb), 0.05); border: 1px dashed var(--primary); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.8rem; cursor: pointer;" onclick="this.querySelector('.checklist-details').style.display = this.querySelector('.checklist-details').style.display === 'none' ? 'grid' : 'none'">
                    <strong style="display: flex; justify-content: space-between; align-items: center; color: var(--primary-light);">
                        <span><i class="fas fa-certificate"></i> ${i18n.t('quotes.form.compliance.title')}</span>
                        <i class="fas fa-chevron-down" style="font-size: 0.7rem;"></i>
                    </strong>
                    <div class="checklist-details" style="display: none; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px;">
                        <div style="display: flex; align-items: center; gap: 8px;"><i class="fas fa-check-circle" style="color: var(--primary);"></i> ${i18n.t('quotes.form.compliance.siret')}</div>
                        <div style="display: flex; align-items: center; gap: 8px;"><i class="fas fa-check-circle" style="color: var(--primary);"></i> ${i18n.t('quotes.form.compliance.tax')}</div>
                        <div style="display: flex; align-items: center; gap: 8px;"><i class="fas fa-check-circle" style="color: var(--primary);"></i> ${i18n.t('quotes.form.compliance.contacts')}</div>
                        <div style="display: flex; align-items: center; gap: 8px;"><i class="fas fa-check-circle" style="color: var(--primary);"></i> ${i18n.t('quotes.form.compliance.cgv')}</div>
                    </div>
                </div>

                <form id="quote-form" onsubmit="Quotes.save(event)">
                    <div class="form-grid">
                        <div class="form-group full-width">
                            <label class="form-label">${i18n.t('quotes.form.placeholder.title')}</label>
                            <input type="text" name="title" class="form-input" placeholder="${i18n.t('quotes.form.placeholder.title')}" value="${quote?.title || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">${i18n.t('quotes.table.client')}</label>
                            <div style="display: flex; gap: 10px;">
                                <select name="clientId" id="quote-client-select" class="form-input" required style="flex: 1;">
                                    <option value="">${i18n.t('quotes.form.placeholder.select_client')}</option>
                                    ${clients.map(c => `
                                        <option value="${c.id}" ${(quote?.clientId === c.id || preselectedClientId === c.id) ? 'selected' : ''}>
                                            ${c.name}
                                        </option>
                                    `).join('')}
                                </select>
                                <button type="button" class="button-secondary" onclick="Quotes.openQuickClientAdd()" title="${i18n.t('quotes.btn.add_client')}">
                                    <i class="fas fa-user-plus"></i>
                                </button>
                            </div>
                        </div>

                        <div class="form-group full-width">
                            <button type="button" class="button-outline small" onclick="document.getElementById('advanced-quote-options').style.display = document.getElementById('advanced-quote-options').style.display === 'none' ? 'grid' : 'none'" style="width: 100%; justify-content: center; gap: 8px;">
                                <i class="fas fa-cog"></i> ${i18n.t('quotes.btn.advanced')}
                            </button>
                        </div>

                        <div id="advanced-quote-options" style="display: none; grid-column: span 2; grid-template-columns: 1fr 1fr; gap: 20px; padding: 15px; background: rgba(255,255,255,0.02); border-radius: 8px; margin-top: -10px;">
                            <div class="form-group">
                                <label class="form-label">${i18n.t('quotes.table.status')}</label>
                                <select name="status" class="form-input">
                                    <option value="draft" ${quote?.status === 'draft' ? 'selected' : ''}>${i18n.t('status.draft')}</option>
                                    <option value="sent" ${quote?.status === 'sent' ? 'selected' : ''}>${i18n.t('status.sent')}</option>
                                    <option value="accepted" ${quote?.status === 'accepted' ? 'selected' : ''}>${i18n.t('status.accepted')}</option>
                                    <option value="refused" ${quote?.status === 'refused' ? 'selected' : ''}>${i18n.t('status.refused')}</option>
                                </select>
                            </div>
                            <div class="form-group" id="quote-tax-selector-container">
                                <!-- TaxEngine will render here -->
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <div class="section-header-inline">
                            <h4>${i18n.t('quotes.form.section.items')}</h4>
                            <button type="button" class="button-secondary" onclick="Quotes.addItem()">
                                ${i18n.t('quotes.btn.add_line')}
                            </button>
                        </div>

                        <div id="items-container">
                            ${items.map((item, index) => this.renderItemRow(item, index)).join('')}
                        </div>

                        <div id="margin-guard-container" style="margin-top: 1.5rem;"></div>

                        <div class="invoice-totals" style="border-top: 2px solid var(--border); padding-top: 1.5rem;">
                            <div class="total-row">
                                <span style="opacity: 0.8;">${i18n.t('pdf.total.items')}:</span>
                                <span id="subtotal-display">0 ${typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€'}</span>
                            </div>
                            <div class="total-row" style="color: var(--primary-light);">
                                <span style="font-weight: 600;">${i18n.t('pdf.total.service')} (15%):</span>
                                <span id="margin-display">0 ${typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€'}</span>
                            </div>
                            <div class="total-row" style="border-top: 1px solid var(--border); margin-top: 0.5rem; padding-top: 0.5rem;">
                                <span style="font-weight: 700;">${i18n.t('pdf.total.subtotal')}:</span>
                                <span id="final-subtotal-display" style="font-weight: 700;">0 ${typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€'}</span>
                            </div>
                            <div class="total-row">
                                <span id="tax-label-display">${typeof TaxEngine !== 'undefined' ? TaxEngine.getCurrent().taxName : 'TVA'} (${settings.taxRate}%) :</span>
                                <span id="tax-display">0 ${typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€'}</span>
                            </div>
                            <div class="total-row total" style="background: var(--primary-glass); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                                <span style="font-size: 1.2rem; font-weight: 800;">${i18n.t('pdf.total.ttc')}:</span>
                                <span id="total-display" style="font-size: 1.2rem; font-weight: 800; color: var(--primary-light);">0 ${typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€'}</span>
                            </div>
                            <div class="total-row tax-context-info">
                                <span id="tax-info-display" class="text-xs text-muted"></span>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="button-secondary" onclick="Quotes.hideForm()">${i18n.t('btn.cancel')}</button>
                        <button type="submit" class="button-primary">${i18n.t('btn.save')}</button>
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
                           placeholder="${i18n.t('quotes.form.placeholder.item_desc')}" 
                           class="form-input" 
                           list="quote-services-list"
                           value="${item.description || ''}"
                           oninput="Quotes.handleServiceSelect(this, ${index})"
                           required>
                </div>
                <div class="item-field item-quantity">
                    <input type="number" 
                           name="items[${index}][quantity]" 
                           placeholder="${i18n.t('pdf.table.qty')}" 
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
                           placeholder="${i18n.t('pdf.table.unit_price')}" 
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
                        ${i18n.t('btn.delete')}
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
        let itemsSubtotal = 0;

        form.querySelectorAll('.item-row').forEach(row => {
            const qty = parseFloat(row.querySelector('[name*="[quantity]"]')?.value) || 0;
            const price = parseFloat(row.querySelector('[name*="[unitPrice]"]')?.value) || 0;
            const itemTotal = qty * price;

            const display = row.querySelector('.item-total-display');
            if (display) display.textContent = App.formatCurrency(itemTotal);

            itemsSubtotal += itemTotal;
        });

        // Calcul de la Marge de Service (Style Marketplace)
        const SERVICE_MARGIN_RATE = 0.15;
        const margin = itemsSubtotal * SERVICE_MARGIN_RATE;
        const finalSubtotal = itemsSubtotal + margin;

        let tax = finalSubtotal * (settings.taxRate / 100);
        let total = finalSubtotal + tax;
        let taxLabel = `${typeof TaxEngine !== 'undefined' ? TaxEngine.getCurrent().taxName : 'TVA'} (${settings.taxRate}%) :`;

        if (typeof TaxEngine !== 'undefined') {
            const taxResult = TaxEngine.calculate(finalSubtotal);
            tax = taxResult.vat;
            total = taxResult.ttc;
            taxLabel = `${TaxEngine.getCurrent().taxName} (${TaxEngine.getCurrent().vat}%) :`;
            const taxInfo = document.getElementById('tax-info-display');
            if (taxInfo) taxInfo.textContent = TaxEngine.getCurrent().description;
        }

        // Update UI
        const subtotalEl = document.getElementById('subtotal-display');
        const marginEl = document.getElementById('margin-display');
        const finalSubtotalEl = document.getElementById('final-subtotal-display');
        const taxLabelEl = document.getElementById('tax-label-display');
        const taxEl = document.getElementById('tax-display');
        const totalEl = document.getElementById('total-display');

        if (subtotalEl) subtotalEl.textContent = App.formatCurrency(itemsSubtotal);
        if (marginEl) marginEl.textContent = App.formatCurrency(margin);
        if (finalSubtotalEl) finalSubtotalEl.textContent = App.formatCurrency(finalSubtotal);
        if (taxLabelEl) taxLabelEl.textContent = taxLabel;
        if (taxEl) taxEl.textContent = App.formatCurrency(tax);
        if (totalEl) totalEl.textContent = App.formatCurrency(total);

        this.renderMarginGuard(itemsSubtotal);
    },

    renderMarginGuard(subtotal) {
        const container = document.getElementById('margin-guard-container');
        if (!container) return;

        const calcData = Storage.get('sp_calculator_data') || { dailyRate: 400 };
        const targetTJM = calcData.dailyRate || 400;

        const health = Math.min(100, (subtotal / targetTJM) * 100);
        let color = '#ef4444'; // Red
        let label = i18n.t('quotes.margin.critical');

        if (health > 80) { color = '#10b981'; label = i18n.t('quotes.margin.success'); }
        else if (health > 50) { color = '#fbbf24'; label = i18n.t('quotes.margin.warning'); }

        container.innerHTML = `
            <div style="background: var(--bg-card); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 600;">
                    <span style="color: var(--text-secondary);">${i18n.t('quotes.margin.title')}</span>
                    <span style="color: ${color};">${label}</span>
                </div>
                <div style="height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                    <div style="width: ${health}%; height: 100%; background: ${color}; transition: width 0.3s ease;"></div>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">${i18n.t('quotes.margin.description').replace('{tjm}', App.formatCurrency(targetTJM))}</p>
            </div>
        `;
    },

    async save(e) {
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

        const itemsSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

        // Marge de Service (15%)
        const SERVICE_MARGIN_RATE = 0.15;
        const margin = itemsSubtotal * SERVICE_MARGIN_RATE;
        const finalSubtotal = itemsSubtotal + margin;

        const settings = Storage.get(Storage.KEYS.SETTINGS);
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

        const quoteData = {
            clientId: formData.get('clientId'),
            title: formData.get('title'),
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
                await Storage.updateQuote(this.editingId, quoteData);
                App.showNotification('Devis modifié avec succès.', 'success');
            } else {
                await Storage.addQuote(quoteData);
                App.showNotification('Devis créé avec succès.', 'success');
            }
            this.hideForm();
            this.render(this.lastContainerId);
        } catch (err) {
            console.error(err);
            App.showNotification('Erreur de sauvegarde.', 'error');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    },

    // Convertir un devis en facture
    async convertToInvoice(id) {
        if (typeof App !== 'undefined' && !App.enforceLimit('invoices')) return;

        const quote = Storage.getQuote(id);
        if (!quote) return;

        if (quote.status !== 'accepted') {
            App.showNotification('Le devis doit être SIGNÉ ou ACCEPTÉ avant d\'être facturé.', 'error');
            return;
        }

        if (!confirm('Félicitations pour la signature ! Voulez-vous générer la facture officielle maintenant ?\n\n(L\'IBAN prestataire sera alors visible sur le PDF pour le paiement)')) {
            return;
        }

        const invoiceData = {
            clientId: quote.clientId,
            status: 'draft',
            items: quote.items,
            itemsSubtotal: quote.itemsSubtotal || quote.subtotal,
            margin: quote.margin || 0,
            subtotal: quote.subtotal,
            tax: quote.tax,
            total: quote.total,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        try {
            await Storage.addInvoice(invoiceData);
            App.showNotification(i18n.t('quotes.notify.invoice_generated'), 'success');
            App.navigateTo('invoices');
        } catch (e) {
            App.showNotification(i18n.t('quotes.notify.convert_error'), 'error');
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
    },

    async changeStatus(id) {
        const quote = Storage.getQuote(id);
        if (!quote) return;

        const statuses = [
            { value: 'draft', label: i18n.t('quotes.status.draft') },
            { value: 'sent', label: i18n.t('quotes.status.sent') },
            { value: 'accepted', label: i18n.t('quotes.status.accepted') },
            { value: 'refused', label: i18n.t('quotes.status.refused') }
        ];

        const currentIndex = statuses.findIndex(s => s.value === quote.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        const nextStatus = statuses[nextIndex].value;

        await Storage.updateQuote(id, { status: nextStatus });
        App.showNotification(i18n.t('quotes.notify.status_updated', { status: statuses[nextIndex].label }), 'success');
        this.render(this.lastContainerId);
    },

    async togglePaymentStatus(id, type) {
        const quote = Storage.getQuote(id);
        if (!quote) return;

        const field = type === 'expert' ? 'expert_paid_at' : 'platform_paid_at';
        const newValue = quote[field] ? null : new Date().toISOString();

        try {
            await Storage.updateQuote(id, { [field]: newValue });
            App.showNotification(i18n.t('quotes.notify.payment_updated', { type: type === 'expert' ? i18n.t('quotes.payment_type.expert') : i18n.t('quotes.payment_type.commission') }), 'success');

            // Si les deux sont payés, on peut suggérer de passer en status 'paid' global
            if (field === 'expert_paid_at' && newValue && !quote.platform_paid_at) {
                App.showNotification(i18n.t('quotes.notify.commission_reminder'), 'info');
            }

            this.render(this.lastContainerId);
        } catch (e) {
            App.showNotification(i18n.t('quotes.notify.payment_update_error'), 'error');
        }
    },

    downloadPDF(id) {
        const user = Storage.getUser();
        const company = Storage.getUserCompany();

        if (!company.name || !company.address) {
            if (confirm(i18n.t('quotes.confirm.incomplete_company_info'))) {
                App.navigateTo('profile');
            }
            return;
        }

        const quote = Storage.getQuote(id);
        const client = Storage.getClient(quote.clientId);
        const normalizedUser = Storage.getNormalizedUser();

        if (typeof PDFGenerator !== 'undefined' && PDFGenerator.generateQuote) {
            PDFGenerator.generateQuote(quote, client, normalizedUser);
        } else {
            App.showNotification(i18n.t('quotes.notify.pdf_module_unavailable'), 'warning');
        }
    },

    previewQuote(id) {
        const quote = Storage.getQuote(id);
        const client = Storage.getClient(quote.clientId);
        const normalizedUser = Storage.getNormalizedUser();

        if (typeof PDFGenerator !== 'undefined' && PDFGenerator.generateQuote) {
            PDFGenerator.generateQuote(quote, client, normalizedUser, true);
            App.showNotification(i18n.t('quotes.notify.preview_opening'), 'info');
        } else {
            App.showNotification(i18n.t('quotes.notify.pdf_module_unavailable'), 'info');
        }
    },

    async fastSend(id) {
        const quote = Storage.getQuote(id);
        const client = Storage.getClient(quote?.clientId);
        const user = Storage.getUser();

        if (!quote || !client) return;

        // Générer le lien de signature public
        const baseUrl = window.location.origin + window.location.pathname;
        const publicLink = `${baseUrl}#view-quote=${quote.id}`;

        // Préparer le mailto
        const subject = encodeURIComponent(i18n.t('quotes.email.subject', { number: quote.number, companyName: user?.company?.name || i18n.t('quotes.email.default_company_name') }));
        const body = encodeURIComponent(i18n.t('quotes.email.body', { clientName: client.name, quoteNumber: quote.number, total: App.formatCurrency(quote.total), publicLink: publicLink, companyName: user?.company?.name || i18n.t('quotes.email.default_company_name') }));

        const mailtoUrl = `mailto:${client.email || ''}?subject=${subject}&body=${body}`;

        App.showNotification(i18n.t('quotes.notify.mailto_opening'), 'info');

        // Simuler le passage en mode "envoyé" immédiatement
        await Storage.updateQuote(id, { status: 'sent' });
        this.render(this.lastContainerId);

        setTimeout(() => {
            window.location.href = mailtoUrl;
        }, 1200);
    },

    copyPublicLink(id) {
        const quote = Storage.getQuote(id);
        if (!quote) return;
        const baseUrl = window.location.origin + window.location.pathname;
        const publicLink = `${baseUrl}#view-quote=${quote.id}`;

        navigator.clipboard.writeText(publicLink).then(() => {
            App.showNotification(i18n.t('quotes.notify.link_copied'), 'success');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            prompt(i18n.t('quotes.notify.copy_failed_fallback'), publicLink);
        });
    },

    // --- Signature Module (Expert Feature) ---

    openSignatureModal(id, isPublic = false) {
        this.isPublicSign = isPublic;
        const quote = isPublic ? this.publicQuoteData?.quote : Storage.getQuote(id);
        if (!quote) return;

        // Création dynamique de la modale
        let modal = document.getElementById('signature-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'signature-modal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-content glass" style="max-width: 500px; text-align: center;">
                <div class="modal-header">
                    <h3>${isPublic ? i18n.t('quotes.public.btn_sign') : i18n.t('quotes.signature.title')}</h3>
                    <button class="modal-close" onclick="Quotes.closeSignatureModal()"></button>
                </div>
                <div class="modal-body" style="padding: 1rem 0;">
                    <p style="margin-bottom: 1rem;">${isPublic ? i18n.t('quotes.signature.instruction_public') : i18n.t('quotes.signature.instruction_expert')}</p>
                    <div style="border: 2px dashed var(--primary); background: #fff; border-radius: 8px; cursor: crosshair;">
                        <canvas id="signature-pad" width="400" height="200" style="width: 100%; touch-action: none;"></canvas>
                    </div>
                    
                    ${!isPublic ? `
                        <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px dashed var(--border-color);">
                            <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 1rem;">${i18n.t('quotes.signature.already_signed')}</p>
                            <button class="button-outline full-width" onclick="Quotes.markAsSignedManually('${id}')">
                                <i class="fas fa-check-double"></i> ${i18n.t('quotes.btn.manual_sign')}
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer" style="justify-content: center; gap: 1rem;">
                    <button class="button-outline small" onclick="Quotes.clearSignature()">${i18n.t('quotes.btn.clear')}</button>
                    <button class="button-primary" onclick="Quotes.saveSignature('${id}')">${i18n.t('quotes.btn.validate_sign')}</button>
                </div>
            </div>
        `;

        this.initCanvas();
    },

    closeSignatureModal() {
        const modal = document.getElementById('signature-modal');
        if (modal) modal.remove();
    },

    initCanvas() {
        const canvas = document.getElementById('signature-pad');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        // Mouse Events
        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            [lastX, lastY] = [e.offsetX, e.offsetY];
        });
        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();
            [lastX, lastY] = [e.offsetX, e.offsetY];
        });
        canvas.addEventListener('mouseup', () => isDrawing = false);
        canvas.addEventListener('mouseout', () => isDrawing = false);

        // Touch Events
        canvas.addEventListener('touchstart', (e) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            lastX = e.touches[0].clientX - rect.left;
            lastY = e.touches[0].clientY - rect.top;
            e.preventDefault();
        });
        canvas.addEventListener('touchmove', (e) => {
            if (!isDrawing) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const y = e.touches[0].clientY - rect.top;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();
            [lastX, lastY] = [x, y];
            e.preventDefault();
        });
        canvas.addEventListener('touchend', () => isDrawing = false);
    },

    clearSignature() {
        const canvas = document.getElementById('signature-pad');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    },

    async saveSignature(id) {
        const canvas = document.getElementById('signature-pad');
        if (!canvas) return;

        // Vérifier si la signature est vide (tous les pixels sont transparents)
        const ctx = canvas.getContext('2d');
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let isBlank = true;
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] !== 0) { // On vérifie l'alpha (transparence)
                isBlank = false;
                break;
            }
        }

        if (isBlank) {
            App.showNotification(i18n.t('quotes.signature.blank'), 'warning');
            return;
        }

        const dataUrl = canvas.toDataURL('image/png');

        try {
            // Afficher un état de chargement sur le bouton
            const btn = document.querySelector('#signature-modal .button-primary');
            const originalText = btn ? btn.innerHTML : i18n.t('quotes.btn.validate_sign');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${i18n.t('quotes.notify.signing')}...`;
            }

            if (this.isPublicSign) {
                // Appel API public (service layer)
                if (typeof QuoteService === 'undefined') {
                    throw new Error(i18n.t('quotes.notify.service_not_ready'));
                }

                console.log(`[QUOTES] Signing public quote: ${id}`);
                await QuoteService.signPublicQuote(id, dataUrl);

                App.showNotification(i18n.t('quotes.notify.sign_success'), 'success');
                this.closeSignatureModal();
                this.renderPublicView(id);
            } else {
                // Mode expert interne
                const quote = Storage.getQuote(id);
                if (quote) {
                    quote.signature = dataUrl;
                    quote.accepted_at = new Date().toISOString();
                    quote.status = 'accepted';

                    await Storage.updateQuote(quote.id || id, quote);
                    App.showNotification(i18n.t('quotes.notify.sign_success'), 'success');
                    this.closeSignatureModal();
                    this.render(this.lastContainerId);
                    this.showPaymentInstructions(quote.id || id);
                }
            }
        } catch (err) {
            console.error('[SIGNATURE-ERROR]', err);
            // Restaurer le bouton en cas d'erreur
            const btn = document.querySelector('#signature-modal .button-primary');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = i18n.t('quotes.btn.validate_sign');
            }
            App.showNotification(err.message || i18n.t('quotes.notify.sign_error'), 'error');
        }
    },

    async markAsSignedManually(id) {
        if (!confirm(i18n.t('quotes.confirm.manual_sign'))) return;

        try {
            const quote = Storage.getQuote(id);
            if (quote) {
                quote.status = 'accepted';
                quote.accepted_at = new Date().toISOString();
                quote.manual_validation = true;

                await Storage.updateQuote(id, quote);
                App.showNotification(i18n.t('quotes.notify.manual_success'), 'success');
                this.closeSignatureModal();
                this.render(this.lastContainerId);
            }
        } catch (err) {
            App.showNotification(i18n.t('quotes.notify.manual_error'), 'error');
        }
    },

    async payExpert(id) {
        console.log(`[QUOTES] Initializing EXPERT payment for quote: ${id}`);
        if (typeof App !== 'undefined' && App.showLoader) App.showLoader();

        try {
            const approvalUrl = await QuoteService.createExpertPaymentOrder(id);
            window.location.href = approvalUrl;
        } catch (err) {
            console.error('[QUOTES] Expert payment error:', err);
            if (typeof App !== 'undefined' && App.hideLoader) App.hideLoader();
            App.showNotification(err.message, 'error');
        }
    },

    async payPlatform(id) {
        console.log(`[QUOTES] Initializing PLATFORM payment for quote: ${id}`);
        if (typeof App !== 'undefined' && App.showLoader) App.showLoader();

        try {
            const approvalUrl = await QuoteService.createPlatformPaymentOrder(id);
            window.location.href = approvalUrl;
        } catch (err) {
            console.error('[QUOTES] Platform payment error:', err);
            if (typeof App !== 'undefined' && App.hideLoader) App.hideLoader();
            App.showNotification(err.message, 'error');
        }
    },

    copyPublicLink(id) {
        const quote = Storage.getQuote(id);
        if (!quote) return;
        const baseUrl = window.location.origin + window.location.pathname;
        const publicLink = `${baseUrl}#view-quote=${quote.id}`;

        navigator.clipboard.writeText(publicLink).then(() => {
            App.showNotification(i18n.t('quotes.notify.link_copied'), 'success');
        }).catch(err => {
            prompt(i18n.t('quotes.prompt.copy_link'), publicLink);
        });
    },

    async renderPublicView(id, params) {
        console.log(`[QUOTES] Starting renderPublicView for ID: ${id}`);
        const container = document.getElementById(this.lastContainerId || 'quotes-content');
        if (!container) {
            console.error('[QUOTES] Target container not found for public view');
            return;
        }

        // Extraire le statut de paiement des paramètres (soit URLSearchParams, soit string legacy)
        let paymentStatus = null;
        let paypalOrderId = null;
        let paymentType = null;

        if (params instanceof URLSearchParams) {
            paymentStatus = params.get('payment');
            paypalOrderId = params.get('paypal_order_id');
            paymentType = params.get('type');
        } else if (params) {
            paymentStatus = params;
        }

        container.innerHTML = '<div class="loader-spinner" style="margin: 5rem auto;"></div>';

        try {
            // --- GESTION DES CAPTURES PAYPAL ---
            if (paypalOrderId) {
                container.innerHTML = `
                    <div style="text-align: center; margin: 5rem 0;">
                        <div class="loader-spinner" style="margin-bottom: 2rem;"></div>
                        <h2 class="gradient-text">${i18n.t('quotes.public.securing_payment', { type: paymentType === 'expert' ? i18n.t('quotes.payment_type.expert') : i18n.t('quotes.payment_type.commission') })}...</h2>
                        <p class="text-muted">${i18n.t('quotes.public.confirming_paypal')}</p>
                    </div>
                `;

                try {
                    await QuoteService.capturePaypalQuote(paypalOrderId);

                    paymentStatus = 'success';
                    App.showNotification(paymentType === 'expert' ? i18n.t('quotes.notify.payment_expert_validated') : i18n.t('quotes.notify.payment_soloprice_validated'), 'success');
                } catch (capErr) {
                    console.error('Capture Error:', capErr);
                    paymentStatus = 'error';
                    App.showNotification(capErr.message, 'error');
                }
            }

            // --- GESTION LEGACY STRIPE ---
            if (paymentStatus === 'success' && !paypalOrderId) {
                container.innerHTML = `
                    <div style="text-align: center; margin: 5rem 0;">
                        <div class="loader-spinner" style="margin-bottom: 2rem;"></div>
                        <h2 class="gradient-text">${i18n.t('quotes.public.verifying_payment')}...</h2>
                        <p class="text-muted">${i18n.t('quotes.public.confirming_partner')}</p>
                    </div>
                `;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            console.log('[QUOTES] Fetching public quote data...');
            const data = await QuoteService.getPublicQuote(id);
            console.log('[QUOTES] Public data received:', data);

            if (!data || !data.quote) {
                throw new Error(i18n.t('quotes.error.data_not_found'));
            }

            this.publicQuoteData = data;
            const { quote, provider, client } = data;

            if (!provider) console.warn('[QUOTES] Provider data missing');
            if (!client) console.warn('[QUOTES] Client data missing');

            // Si le devis est déjà payé en base, on force paymentStatus à success même si pas dans l'URL
            const actualStatus = quote.status === 'paid' ? 'success' : paymentStatus;

            // Notification de paiement
            let paymentNotification = '';
            if (actualStatus === 'success') {
                paymentNotification = `
                    <div class="glass-notification" style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; color: #10b981; margin-bottom: 2rem; padding: 1.5rem; border-radius: 20px; text-align: center;">
                        <i class="fas fa-check-circle" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
                        <span style="font-weight: 700;">${i18n.t('quotes.public.payment_confirmed')}!</span><br>
                        ${i18n.t('quotes.public.payment_success_desc')}
                    </div>
                `;
            } else if (actualStatus === 'cancel') {
                paymentNotification = `
                    <div class="glass-notification" style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #ef4444; margin-bottom: 2rem; padding: 1.5rem; border-radius: 20px; text-align: center;">
                        <i class="fas fa-exclamation-circle" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
                        <span style="font-weight: 700;">${i18n.t('quotes.public.payment_cancelled')}</span><br>
                        ${i18n.t('quotes.public.payment_cancelled_desc')}
                    </div>
                `;
            }

            const isLogged = Auth.user && Auth.token;
            const isOwner = isLogged && quote.user_id === Auth.user.id;

            container.innerHTML = `
                <div class="public-quote-wrapper force-light-mode">
                    ${isLogged ? `
                        <div class="glass-notification" style="background: ${isOwner ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)'}; border: 1px solid ${isOwner ? '#f59e0b' : 'var(--primary)'}; margin-bottom: 2rem; padding: 1rem; border-radius: 16px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 0.9rem;">
                                <i class="fas ${isOwner ? 'fa-user-shield' : 'fa-user-circle'}" style="color: ${isOwner ? '#f59e0b' : 'var(--primary)'}; margin-right: 8px;"></i>
                                ${isOwner ? `<strong>${i18n.t('quotes.public.preview_mode')}:</strong> ${i18n.t('quotes.public.preview_desc')}` : `${i18n.t('quotes.public.logged_as')} <strong>${Auth.user.email}</strong>`}
                            </div>
                            <button class="button-outline small" onclick="window.location.href='/'">${i18n.t('quotes.public.my_dashboard')}</button>
                        </div>
                    ` : ''}

                    ${paymentNotification}
                    <div class="quote-document glass">
                        <header class="public-header">
                            <div class="provider-brand">
                                ${provider?.logo ? `<img src="${provider.logo}" alt="Logo" style="max-height: 60px; margin-bottom: 1rem; display: block;">` : ''}
                                <h2 style="margin:0; font-size: 1.2rem;">${provider?.company_name || 'Prestataire'}</h2>
                                <p class="text-xs text-muted" style="margin:0;">${provider?.email || ''}</p>
                            </div>
                            <div class="quote-meta" style="text-align: right;">
                                <div class="status-badge-large" style="background: ${quote.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)'}; color: ${quote.status === 'paid' ? '#10b981' : '#3b82f6'};">
                                    ${this.getStatusLabel(quote.status)}
                                </div>
                                <h1 style="margin: 0.5rem 0 0; font-size: 1.5rem;">${i18n.t('pdf.quote.title')} ${quote.number}</h1>
                                <p class="text-sm text-muted">${i18n.t('quotes.public.issued_on')} ${App.formatDate(quote.createdAt)}</p>
                            </div>
                        </header>

                        <div class="client-info-box">
                            <label>${i18n.t('quotes.public.recipient')}:</label>
                            <h3>${client.name}</h3>
                            <p>${client.email || ''}</p>
                        </div>

                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>${i18n.t('pdf.table.designation')}</th>
                                    <th style="text-align: center;">${i18n.t('pdf.table.qty')}</th>
                                    <th style="text-align: right;">${i18n.t('pdf.table.unit_price')}</th>
                                    <th style="text-align: right;">${i18n.t('pdf.table.total_ht')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(quote.items || []).map(item => {
                const itemTotal = (item.quantity || 1) * (item.unitPrice || 0);
                return `
                                        <tr>
                                            <td data-label="${i18n.t('pdf.table.designation')}">${item.description}</td>
                                            <td data-label="${i18n.t('pdf.table.qty')}" style="text-align: center;">${item.quantity || 1}</td>
                                            <td data-label="${i18n.t('pdf.table.unit_price')}" style="text-align: right;">${App.formatCurrency(item.unitPrice || 0)}</td>
                                            <td data-label="${i18n.t('pdf.table.total_ht')}" style="text-align: right;">${App.formatCurrency(itemTotal)}</td>
                                        </tr>
                                    `;
            }).join('')}
                            </tbody>
                        </table>

                        <div class="quote-totals">
                            <div class="total-row"><span>${i18n.t('pdf.total.items')}</span> <span>${App.formatCurrency(quote.itemsSubtotal || 0)}</span></div>
                            <div class="total-row" style="color: var(--primary-light);">
                                <span>${i18n.t('pdf.total.service')} <small style="display:block; font-size: 0.7rem; color: var(--text-muted);">${i18n.t('quotes.public.service_tag')}</small></span> 
                                <span>${App.formatCurrency(quote.margin || 0)}</span>
                            </div>
                            ${quote.tax > 0 ? `<div class="total-row"><span>${typeof TaxEngine !== 'undefined' ? TaxEngine.getCurrent().taxName : 'TVA'}</span> <span>${App.formatCurrency(quote.tax)}</span></div>` : ''}
                            <div class="total-row large"><span>${i18n.t('pdf.total.ttc')}</span> <span>${App.formatCurrency(quote.total)}</span></div>
                        </div>

                        <div class="public-actions-wrapper">
                            ${quote.signature ? `
                                <div class="status-alert success-glass">
                                    <i class="fas fa-check-circle"></i> ${i18n.t('quotes.public.signed_on', { date: App.formatDate(quote.accepted_at || quote.createdAt) })}
                                </div>
                            ` : ''}

                            <div class="public-actions-stack">
                                ${!quote.signature ? `
                                    ${isOwner ? `
                                        <div class="status-alert info-glass" style="margin-bottom: 1rem; text-align: center;">
                                            <i class="fas fa-info-circle"></i> ${i18n.t('quotes.public.provider_cannot_sign_desc')}
                                            <br><small>${i18n.t('quotes.public.sign_offline_hint')}</small>
                                        </div>
                                        <button class="button-primary big-action disabled" style="opacity: 0.6; cursor: not-allowed;" onclick="App.showNotification(i18n.t('quotes.notify.client_only_sign'), 'info')">
                                            <i class="fas fa-pen-nib"></i> 1. ${i18n.t('quotes.public.btn_sign')}
                                        </button>
                                    ` : `
                                        <button class="button-primary big-action" onclick="Quotes.openSignatureModal('${quote.id}', true)">
                                            <i class="fas fa-pen-nib"></i> 1. ${i18n.t('quotes.public.btn_sign')}
                                        </button>
                                    `}
                                ` : ''}

                                <div class="dual-payment-container" style="display: flex; flex-direction: column; gap: 1rem;">
                                    <!-- Protection Info Card -->
                                    <div class="protection-info-card" style="background: rgba(59, 130, 246, 0.05); border: 1px dashed rgba(59, 130, 246, 0.3); padding: 1rem; border-radius: 12px; margin-bottom: 0.5rem;">
                                        <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                                            <div style="background: var(--primary); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);">
                                                <i class="fas fa-shield-alt" style="font-size: 0.9rem;"></i>
                                            </div>
                                            <div>
                                                <h4 style="margin: 0; font-size: 0.9rem; color: var(--primary-light);">${i18n.t('quotes.public.protection_title')}</h4>
                                                <p style="margin: 4px 0 0 0; font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">
                                                    ${i18n.t('quotes.public.protection_desc')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Expert Payment -->
                                    ${!quote.expert_paid_at ? `
                                        <div class="payment-action-group">
                                            <button class="button-success big-action ${!provider.paypal_email ? 'disabled' : ''}" 
                                                onclick="${provider.paypal_email ? `Quotes.payExpert('${quote.id}')` : `App.showNotification(i18n.t('quotes.notify.paypal_not_config'), 'warning')`}"
                                                style="${!provider.paypal_email ? 'opacity: 0.5; cursor: not-allowed; filter: grayscale(1);' : ''}">
                                                <i class="fab fa-paypal"></i> ${quote.signature ? `2. ${i18n.t('quotes.public.btn_pay_expert')}` : i18n.t('quotes.public.btn_pay_expert')}
                                            </button>
                                            ${!provider.paypal_email ? `
                                                <p class="text-xs text-muted" style="text-align: center; margin-top: -0.25rem; color: #f59e0b;">
                                                    <i class="fas fa-exclamation-triangle"></i> ${i18n.t('quotes.public.account_not_ready')}
                                                </p>
                                            ` : ''}
                                        </div>
                                    ` : `
                                        <div class="status-alert success-glass" style="margin-bottom: 0;">
                                            <i class="fas fa-check-double"></i> ${i18n.t('quotes.public.expert_paid_done')}
                                        </div>
                                    `}

                                    <!-- Platform Protection -->
                                    ${!quote.platform_paid_at ? `
                                        <button class="button-success big-action" style="background: rgba(59, 130, 246, 0.2); color: #3b82f6; border-color: rgba(59, 130, 246, 0.3);" onclick="Quotes.payPlatform('${quote.id}')">
                                            <i class="fas fa-shield-alt"></i> ${quote.signature ? `3. ${i18n.t('quotes.public.btn_pay_platform')}` : i18n.t('quotes.public.btn_pay_platform')}
                                        </button>
                                    ` : `
                                        <div class="status-alert info-glass" style="margin-bottom: 0;">
                                            <i class="fas fa-shield-check"></i> ${i18n.t('quotes.public.protection_active')}
                                        </div>
                                    `}
                                </div>
                            </div>
                            
                            ${!quote.signature || quote.status !== 'paid' ? `
                                <p class="action-caption">
                                    <i class="fas fa-lock"></i> ${i18n.t('quotes.public.secure_payment')}<br>
                                    <span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-top: 5px;">*${i18n.t('quotes.public.receipt_notice')}</span>
                                </p>
                            ` : ''}
                        </div>

                        ${quote.signature ? `
                            <div class="signature-display-area">
                                <h4>Signature du client</h4>
                                <div class="signature-img-wrapper">
                                    <img src="${quote.signature}" alt="Signature">
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <footer class="public-footer">
                        Propulsé par SoloPrice Pro - L'outil de chiffrage des experts.
                    </footer>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `
                <div class="error-view glass" style="margin: 5rem 2rem; padding: 3rem; text-align: center; border-radius: 30px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--warning); margin-bottom: 1.5rem;"></i>
                    <h2 class="gradient-text">${i18n.t('quotes.public.error_title')}</h2>
                    <p style="font-size: 1.1rem; opacity: 0.8; margin-bottom: 2rem;">${err.message}</p>
                    <button class="button-primary" onclick="window.location.href='/'">${i18n.t('quotes.public.btn_return_home')}</button>
                </div>
            `;
        }
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

    async delete(id) {
        if (confirm('Confirmer la suppression de ce devis ?')) {
            await Storage.deleteQuote(id);
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
            draft: i18n.t('status.draft'),
            sent: i18n.t('status.sent'),
            accepted: i18n.t('status.accepted'),
            refused: i18n.t('status.refused'),
            paid: i18n.t('status.paid')
        };
        return labels[status] || status;
    },

    showPaymentInstructions(id) {
        const quote = Storage.getQuote(id);
        const user = Storage.getNormalizedUser();
        if (!quote || !user) return;

        const expertAmount = (quote.itemsSubtotal || 0) * (1 + (quote.tax / (quote.subtotal || 1)));
        const platformAmount = (quote.margin || 0) * (1 + (quote.tax / (quote.subtotal || 1)));

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'payment-instructions-modal';
        modal.innerHTML = `
            <div class="modal-content glass" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>${i18n.t('quotes.payment.title')}</h3>
                    <button class="modal-close" onclick="document.getElementById('payment-instructions-modal').remove(); Quotes.render();"></button>
                </div>
                <div class="modal-body" style="padding: 1.5rem 0;">
                    <p style="margin-bottom: 1.5rem; text-align: center;">${i18n.t('quotes.payment.subtitle')}</p>
                    
                    <div style="background: var(--bg-sidebar); border: 1px solid var(--primary-glass); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;">
                        <h4 style="color: var(--primary-light); margin-bottom: 0.5rem;">${i18n.t('quotes.payment.total_to_pay')} : ${App.formatCurrency(expertAmount + platformAmount)}</h4>
                        <p style="font-size: 0.85rem; line-height: 1.4;">
                            ${i18n.t('quotes.payment.description')}
                        </p>
                    </div>

                    <div class="info-box" style="margin-top: 1.5rem; font-size: 0.75rem; background: rgba(var(--primary-rgb), 0.05); border: 1px dashed var(--primary); padding: 10px; border-radius: 8px;">
                        <i class="fas fa-shield-alt"></i> <strong>${i18n.t('quotes.payment.secure_title')} :</strong> ${i18n.t('quotes.payment.secure_desc')}
                    </div>
                </div>
                <div class="modal-footer" style="justify-content: center; gap: 1rem;">
                    <button class="button-outline" onclick="document.getElementById('payment-instructions-modal').remove(); Quotes.downloadPDF('${id}'); Quotes.render();">${i18n.t('quotes.payment.btn_pdf')}</button>
                    <button class="button-primary" onclick="document.getElementById('payment-instructions-modal').remove(); Quotes.render();">${i18n.t('quotes.payment.btn_return')}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    toggleActions(id) {
        // Close all other menus first
        document.querySelectorAll('.actions-menu').forEach(m => {
            if (m.id !== `actions-${id}`) m.classList.remove('active');
        });

        const menu = document.getElementById(`actions-${id}`);
        if (!menu) {
            console.error(`[QUOTES] Actions menu not found for ID: ${id}`);
            return;
        }

        menu.classList.toggle('active');

        // Logic to close when clicking outside
        if (menu.classList.contains('active')) {
            const closeHandler = (e) => {
                if (!menu.contains(e.target) && !e.target.closest('.action-trigger')) {
                    menu.classList.remove('active');
                    document.removeEventListener('click', closeHandler);
                }
            };
            // Use a capture listener or a small timeout to ensure we don't catch the current click
            setTimeout(() => document.addEventListener('click', closeHandler), 10);
        }
    }
};
