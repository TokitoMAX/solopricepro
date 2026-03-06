// SoloPrice Pro - Kanban Module
// Handles visual business pipeline from leads to paid invoices

const Kanban = {
    render() {
        const container = document.getElementById('kanban-content');
        if (!container) return;

        if (App.isFeatureProGated('kanban')) {
            container.innerHTML = PremiumWall.renderPageWall('Pipeline Kanban');
            return;
        }

        const leads = Storage.getLeads();
        const quotes = Storage.getQuotes();
        const invoices = Storage.getInvoices();
        const expenses = Storage.getExpenses() || [];

        // --- TRUE NET CASH CALCULATION ---
        const paidInvoices = invoices.filter(i => i.status === 'paid');
        const totalCollected = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

        let urssafRate = typeof TaxEngine !== 'undefined' ? TaxEngine.getSocialRate() : parseFloat(Storage.get('sp_tax_rate_social') || 21.2);
        const urssafProvision = totalCollected * (urssafRate / 100);
        const trueNetCash = totalCollected - totalExpenses - urssafProvision;

        container.innerHTML = `
            <div class="page-header" style="margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%;">
                    <div>
                        <h1 class="page-title" style="font-size: 2.5rem; font-weight: 900; letter-spacing: -1.5px;">Trésorerie <span class="gradient-text">Réelle</span></h1>
                        <p class="page-subtitle" style="font-size: 1.1rem; opacity: 0.7;">Votre centre de commandement financier. Zéro fiction.</p>
                    </div>
                </div>
            </div>

            <!-- ULTRA-PREMIUM PILOTAGE COCKPIT -->
            <div class="cockpit-unified glass-premium" style="margin-bottom: 3rem; padding: 2rem; border-radius: 24px; border: 1px solid var(--glass-border-light); position: relative; overflow: hidden; background: rgba(255,255,255,0.01);">
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 1px; background: linear-gradient(90deg, transparent, var(--primary-light), transparent); opacity: 0.3;"></div>
                
                <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 2rem; align-items: center;">
                    
                    <!-- Main Metric -->
                    <div style="padding-right: 2rem; border-right: 1px solid rgba(255,255,255,0.05);">
                        <div style="font-size: 0.75rem; color: var(--primary-light); text-transform: uppercase; font-weight: 800; letter-spacing: 2px; margin-bottom: 0.5rem;">
                            <i class="fas fa-vault" style="margin-right: 8px;"></i> TRÉSORERIE NETTE
                        </div>
                        <div style="font-size: 3rem; font-weight: 900; color: #fff; line-height: 1; letter-spacing: -1px;">
                            ${App.formatCurrency(trueNetCash)}
                        </div>
                        <div style="margin-top: 0.75rem; font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                            <span style="display: inline-block; width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981;"></span>
                            Disponible immédiatement
                        </div>
                    </div>

                    <!-- Secondary Metrics -->
                    <div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-bottom: 0.4rem;">Encaissé (Brut)</div>
                        <div style="font-size: 1.5rem; font-weight: 800; color: #fff;">${App.formatCurrency(totalCollected)}</div>
                    </div>

                    <div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-bottom: 0.4rem;">Provision URSSAF</div>
                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--warning);">${App.formatCurrency(urssafProvision)}</div>
                    </div>

                    <div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-bottom: 0.4rem;">Dépenses / Frais</div>
                        <div style="font-size: 1.5rem; font-weight: 800; color: #ef4444;">${App.formatCurrency(totalExpenses)}</div>
                    </div>
                </div>
            </div>

            <div class="kanban-wrapper">
                <div class="kanban-board">
                    <!-- Column: Leads -->
                    <div class="kanban-column">
                        <div class="kanban-column-header">
                            <div class="title-group">
                                <i class="fas fa-bullseye" style="color: #3b82f6;"></i>
                                <span>PROSPECTS</span>
                            </div>
                            <span class="badge">${leads.length}</span>
                        </div>
                        <div class="kanban-cards">
                            ${leads.length > 0 ? leads.map(lead => this.renderLeadCard(lead)).join('') : '<div class="kanban-empty-info">Aucun prospect</div>'}
                        </div>
                    </div>

                    <!-- Column: Quotes -->
                    <div class="kanban-column">
                        <div class="kanban-column-header">
                            <div class="title-group">
                                <i class="fas fa-file-invoice" style="color: #f59e0b;"></i>
                                <span>DEVIS ENVOYÉS</span>
                            </div>
                            <span class="badge">${quotes.filter(q => q.status !== 'accepted').length}</span>
                        </div>
                        <div class="kanban-cards">
                            ${quotes.filter(q => q.status !== 'accepted').length > 0 ? quotes.filter(q => q.status !== 'accepted').map(quote => this.renderQuoteCard(quote)).join('') : '<div class="kanban-empty-info">Aucun devis envoyé</div>'}
                        </div>
                    </div>

                    <!-- Column: Invoiced -->
                    <div class="kanban-column">
                        <div class="kanban-column-header">
                            <div class="title-group">
                                <i class="fas fa-hourglass-half" style="color: #10b981;"></i>
                                <span>À RÉCUPÉRER</span>
                            </div>
                            <span class="badge">${invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length}</span>
                        </div>
                        <div class="kanban-cards">
                            ${invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length > 0 ? invoices.filter(i => i.status === 'sent' || i.status === 'overdue').map(invoice => this.renderInvoiceCard(invoice)).join('') : '<div class="kanban-empty-info">Aucune facture en attente</div>'}
                        </div>
                    </div>

                    <!-- Column: Paid -->
                    <div class="kanban-column focus-column">
                        <div class="kanban-column-header">
                            <div class="title-group">
                                <i class="fas fa-circle-check" style="color: #a855f7;"></i>
                                <span>ENCAISSÉ</span>
                            </div>
                            <span class="badge">${invoices.filter(i => i.status === 'paid').length}</span>
                        </div>
                        <div class="kanban-cards">
                            ${invoices.filter(i => i.status === 'paid').length > 0 ? invoices.filter(i => i.status === 'paid').map(invoice => this.renderPaidCard(invoice)).join('') : '<div class="kanban-empty-info">Aucun encaissement réel</div>'}
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .kanban-wrapper {
                    margin-left: -2rem;
                    margin-right: -2rem;
                    padding-left: 2rem;
                    padding-right: 2rem;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }
                .kanban-board {
                    display: grid;
                    grid-template-columns: repeat(4, 320px);
                    gap: 1.5rem;
                    padding-bottom: 3rem;
                    min-width: 100%;
                }
                .kanban-column {
                    background: rgba(255, 255, 255, 0.015);
                    border: 1px solid var(--border);
                    border-radius: 20px;
                    padding: 1.5rem;
                    min-height: 70vh;
                    display: flex;
                    flex-direction: column;
                }
                .kanban-column.focus-column {
                    background: rgba(168, 85, 247, 0.02);
                    border-color: rgba(168, 85, 247, 0.1);
                }
                .kanban-column-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                }
                .kanban-column-header .title-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .kanban-column-header .title-group i { font-size: 0.9rem; }
                .kanban-column-header .title-group span {
                    font-weight: 800;
                    font-size: 0.75rem;
                    letter-spacing: 1px;
                    color: var(--text-muted);
                }
                .kanban-column-header .badge {
                    background: rgba(255,255,255,0.05);
                    color: var(--text-muted);
                    padding: 2px 8px;
                    border-radius: 8px;
                    font-size: 0.7rem;
                    font-weight: 700;
                }
                .kanban-cards {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .kanban-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 1.25rem;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.2s ease;
                }
                .kanban-card:hover {
                    border-color: var(--primary-light);
                    background: rgba(255,255,255,0.03);
                    box-shadow: var(--shadow-md);
                }
                .card-title {
                    font-weight: 700;
                    font-size: 0.95rem;
                    margin-bottom: 0.3rem;
                    color: #fff;
                    display: block;
                }
                .card-subtitle {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    display: block;
                }
                .card-amount {
                    margin-top: 1rem;
                    font-size: 1.1rem;
                    font-weight: 800;
                    color: #fff;
                }
                .card-footer {
                    margin-top: 1rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid rgba(255,255,255,0.03);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
            </style>
        `;

        // Wait for DOM then init interaction
        setTimeout(() => App.init3DTilt(), 50);
    },

    renderLeadCard(lead) {
        const escapedName = lead.name.replace(/'/g, "\\'").replace(/"/g, '\\"');
        return `
            <div class="kanban-card tilt-card" onclick="Kanban.showLeadDetail('${escapedName}')">
                <div class="tilt-glare-wrapper"><div class="tilt-glare"></div></div>
                <span class="card-title">${lead.name}</span>
                <span class="card-subtitle">${lead.activity || 'Nouveau prospect'}</span>
                <div class="card-footer">
                    <span>${App.formatDate(lead.createdAt)}</span>
                    <span class="badge" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2);">Lead</span>
                </div>
            </div>
        `;
    },

    renderQuoteCard(quote) {
        const client = Storage.getClient(quote.clientId);
        const name = client?.name || 'Client inconnu';
        const escapedName = name.replace(/'/g, "\\'").replace(/"/g, '\\"');
        return `
            <div class="kanban-card tilt-card" onclick="Kanban.showQuoteDetail('${quote.id}')">
                <div class="tilt-glare-wrapper"><div class="tilt-glare"></div></div>
                <span class="card-title">${name}</span>
                <span class="card-subtitle">${quote.number}</span>
                <div class="card-amount">${App.formatCurrency(quote.total || 0)}</div>
                <div class="card-footer">
                    <span>${App.formatDate(quote.createdAt)}</span>
                    <span class="badge" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2);">Devis</span>
                </div>
            </div>
        `;
    },

    renderInvoiceCard(invoice) {
        const client = Storage.getClient(invoice.clientId);
        const name = client?.name || 'Client inconnu';
        const isOverdue = invoice.status === 'overdue';
        const color = isOverdue ? '#ef4444' : '#10b981';
        return `
            <div class="kanban-card tilt-card" onclick="Kanban.showInvoiceDetail('${invoice.id}')">
                <div class="tilt-glare-wrapper"><div class="tilt-glare"></div></div>
                <span class="card-title">${name}</span>
                <span class="card-subtitle">${invoice.number}</span>
                <div class="card-amount">${App.formatCurrency(invoice.total || 0)}</div>
                <div class="card-footer">
                    <span>${App.formatDate(invoice.createdAt)}</span>
                    <span class="badge" style="background: ${isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: ${color}; border: 1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'};">Facturé</span>
                </div>
            </div>
        `;
    },

    renderPaidCard(invoice) {
        const client = Storage.getClient(invoice.clientId);
        const name = client?.name || 'Client inconnu';
        return `
            <div class="kanban-card tilt-card" onclick="Kanban.showInvoiceDetail('${invoice.id}')">
                <div class="tilt-glare-wrapper"><div class="tilt-glare"></div></div>
                <span class="card-title">${name}</span>
                <span class="card-subtitle">${invoice.number}</span>
                <div class="card-amount" style="color: #a855f7;">+ ${App.formatCurrency(invoice.total)}</div>
                <div class="card-footer">
                    <span>${App.formatDate(invoice.createdAt)}</span>
                    <span class="badge" style="background: rgba(168, 85, 247, 0.1); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.2);">Payé</span>
                </div>
            </div>
        `;
    },

    // --- SIDE PANEL LOADERS ---
    showLeadDetail(name) {
        const lead = Storage.getLeads().find(l => l.name === name);
        if (!lead) return;
        const html = `
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div class="glass-card" style="padding: 1.5rem; border-left: 4px solid #3b82f6;">
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; margin-bottom: 5px;">Activité / Source</div>
                    <div style="font-size: 1.1rem; font-weight: 600;">${lead.activity || 'Non spécifié'}</div>
                </div>
                <div style="padding: 0 0.5rem;">
                    <p style="color: var(--text-muted); line-height: 1.6;">Prospect identifié le ${App.formatDate(lead.createdAt)}. Prêt pour une conversion en devis.</p>
                    <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                        <button class="button-primary" onclick="App.navigateTo('network', 'leads'); App.hideSidePanel()" style="flex: 1;">Voir sa fiche complète</button>
                    </div>
                </div>
            </div>
        `;
        App.showSidePanel(lead.name, html);
    },

    showQuoteDetail(quoteId) {
        const quote = Storage.getQuote(quoteId);
        if (!quote) return;
        const client = Storage.getClient(quote.clientId);
        const html = `
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div class="glass-card" style="padding: 1.5rem; border-left: 4px solid #f59e0b;">
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; margin-bottom: 5px;">Montant du Devis</div>
                    <div style="font-size: 1.8rem; font-weight: 900; color: #fff;">${App.formatCurrency(quote.total || 0)}</div>
                </div>
                <div style="padding: 0 0.5rem;">
                    <div style="margin-bottom: 1.5rem;">
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px;">Numéro</div>
                        <div style="font-weight: 600;">${quote.number}</div>
                    </div>
                    <div style="margin-bottom: 1.5rem;">
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px;">Statut Actuel</div>
                        <div style="font-weight: 600;">${quote.status.toUpperCase()}</div>
                    </div>
                    <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 0.75rem;">
                        <button class="button-primary" onclick="App.navigateTo('quotes'); App.hideSidePanel()">Aller au document</button>
                        <button class="button-outline" onclick="App.hideSidePanel()">Fermer</button>
                    </div>
                </div>
            </div>
        `;
        App.showSidePanel(client?.name || 'Détails du Devis', html);
    },

    showInvoiceDetail(invoiceId) {
        const invoice = Storage.getInvoice(invoiceId);
        if (!invoice) return;
        const client = Storage.getClient(invoice.clientId);
        const isOverdue = invoice.status === 'overdue';
        const color = isOverdue ? '#ef4444' : '#10b981';
        const html = `
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div class="glass-card" style="padding: 1.5rem; border-left: 4px solid ${color};">
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; margin-bottom: 5px;">Montant Facturé</div>
                    <div style="font-size: 1.8rem; font-weight: 900; color: #fff;">${App.formatCurrency(invoice.total || 0)}</div>
                </div>
                <div style="padding: 0 0.5rem;">
                    <div style="margin-bottom: 1.5rem;">
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px;">Facture n°</div>
                        <div style="font-weight: 600;">${invoice.number}</div>
                    </div>
                    ${isOverdue ? `
                    <div style="margin-bottom: 1.5rem; color: var(--danger)">
                        <i class="fas fa-calendar-exclamation" style="margin-right: 8px;"></i>
                        En retard de paiement depuis le ${App.formatDate(invoice.createdAt)}
                    </div>` : `
                    <div style="margin-bottom: 1.5rem; color: #10b981">
                        <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
                        Facture émise le ${App.formatDate(invoice.createdAt)}
                    </div>`}
                    <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 0.75rem;">
                        <button class="button-primary" onclick="App.navigateTo('invoices'); App.hideSidePanel()">Gérer la facture</button>
                        <button class="button-outline" onclick="App.hideSidePanel()">Fermer</button>
                    </div>
                </div>
            </div>
        `;
        App.showSidePanel(client?.name || 'Détails Facture', html);
    }

};

window.Kanban = Kanban;
