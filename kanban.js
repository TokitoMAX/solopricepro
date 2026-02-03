// SoloPrice Pro - Kanban Module
// Handles visual business pipeline from leads to paid invoices

const Kanban = {
    render() {
        const container = document.getElementById('kanban-page');
        if (!container) return;

        if (App.isFeatureProGated('kanban')) {
            container.innerHTML = PremiumWall.renderPageWall('Pipeline Kanban');
            return;
        }

        const leads = Storage.getLeads();
        const quotes = Storage.getQuotes();
        const invoices = Storage.getInvoices();

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Pipeline Business</h1>
                    <p class="page-subtitle">Visualisez et pilotez votre flux de travail en temps réel.</p>
                </div>
            </div>

            <div class="kanban-board">
                <!-- Column: Leads -->
                <div class="kanban-column">
                    <div class="kanban-column-header">
                        <span>PROSPECTS</span>
                        <span class="badge">${leads.length}</span>
                    </div>
                    <div class="kanban-cards">
                        ${leads.length > 0 ? leads.map(lead => this.renderLeadCard(lead)).join('') : '<div class="kanban-empty-info">Aucun prospect</div>'}
                    </div>
                </div>

                <!-- Column: Quotes (Draft/Sent) -->
                <div class="kanban-column">
                    <div class="kanban-column-header">
                        <span>DEVIS ENVOYÉS</span>
                        <span class="badge">${quotes.filter(q => q.status !== 'accepted').length}</span>
                    </div>
                    <div class="kanban-cards">
                        ${quotes.filter(q => q.status !== 'accepted').length > 0 ? quotes.filter(q => q.status !== 'accepted').map(quote => this.renderQuoteCard(quote)).join('') : '<div class="kanban-empty-info">Aucun devis envoyé</div>'}
                    </div>
                </div>

                <!-- Column: In Progress / Invoices Sent -->
                <div class="kanban-column">
                    <div class="kanban-column-header">
                        <span>EN COURS / FACTURÉ</span>
                        <span class="badge">${invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length}</span>
                    </div>
                    <div class="kanban-cards">
                        ${invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length > 0 ? invoices.filter(i => i.status === 'sent' || i.status === 'overdue').map(invoice => this.renderInvoiceCard(invoice)).join('') : '<div class="kanban-empty-info">Aucune facture en cours</div>'}
                    </div>
                </div>

                <!-- Column: Paid (Real Net Cash) -->
                <div class="kanban-column">
                    <div class="kanban-column-header">
                        <span>PAYÉS / NET</span>
                        <span class="badge">${invoices.filter(i => i.status === 'paid').length}</span>
                    </div>
                    <div class="kanban-cards">
                        ${invoices.filter(i => i.status === 'paid').length > 0 ? invoices.filter(i => i.status === 'paid').map(invoice => this.renderPaidCard(invoice)).join('') : '<div class="kanban-empty-info">Aucun paiement encaissé</div>'}
                    </div>
                </div>
            </div>

            <style>
                .kanban-board {
                    display: grid;
                    grid-template-columns: repeat(4, 300px);
                    gap: 1.25rem;
                    align-items: flex-start;
                    margin-top: 2rem;
                    overflow-x: auto;
                    padding: 0.5rem 0.5rem 2.5rem;
                    cursor: grab;
                }
                .kanban-board:active { cursor: grabbing; }
                
                @media (max-width: 1024px) {
                    .kanban-board {
                        grid-template-columns: repeat(4, 280px);
                        margin-left: -1rem;
                        margin-right: -1rem;
                        padding-left: 1rem;
                        padding-right: 1rem;
                    }
                }
                .kanban-column {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    padding: 1.25rem;
                    min-height: 600px;
                    border: 1px solid var(--border);
                    transition: all 0.3s ease;
                }
                
                /* Colonnes Colorées */
                .kanban-column:nth-child(1) { border-top: 4px solid #3b82f6; } /* Blue - Leads */
                .kanban-column:nth-child(2) { border-top: 4px solid #f59e0b; } /* Orange - Quotes */
                .kanban-column:nth-child(3) { border-top: 4px solid #10b981; } /* Green - Invoiced */
                .kanban-column:nth-child(4) { border-top: 4px solid #a855f7; } /* Purple - Paid */

                .kanban-column-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 1.25rem;
                    border-bottom: 1px solid var(--border);
                    margin-bottom: 1.5rem;
                }
                .kanban-column-header span:first-child {
                    font-weight: 800;
                    font-size: 0.75rem;
                    letter-spacing: 1.5px;
                    color: var(--text-muted);
                    text-transform: uppercase;
                }
                .kanban-column-header .badge {
                    background: var(--border);
                    color: var(--text-light);
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 800;
                }
                .kanban-cards {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }
                .kanban-card {
                    background: #0a0a0a;
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 1.25rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                }
                .kanban-card:hover {
                    transform: translateY(-4px) scale(1.02);
                    border-color: var(--primary);
                    background: rgba(16, 185, 129, 0.05);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.4), 0 0 15px rgba(16, 185, 129, 0.1);
                }
                .card-title {
                    font-weight: 700;
                    font-size: 1rem;
                    margin-bottom: 0.4rem;
                    display: block;
                    color: var(--white);
                }
                .card-subtitle {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    display: block;
                    margin-bottom: 0.5rem;
                }
                .card-price {
                    margin-top: 1rem;
                    font-size: 1.2rem;
                    font-weight: 800;
                    color: var(--primary-light);
                    display: block;
                }
                .card-footer {
                    margin-top: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid var(--border);
                    padding-top: 0.8rem;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                .card-footer .badge {
                    padding: 3px 8px;
                    border-radius: 6px;
                    font-weight: 700;
                    font-size: 0.65rem;
                    color: white;
                }
                .kanban-empty-info {
                    text-align: center;
                    color: var(--text-muted);
                    font-size: 0.8rem;
                    padding: 2rem 1rem;
                    border: 1px dashed var(--border);
                    border-radius: 12px;
                    opacity: 0.5;
                }
            </style>
        `;
    },

    renderLeadCard(lead) {
        return `
            <div class="kanban-card" onclick="App.navigateTo('network', 'leads')">
                <span class="card-title">${lead.name}</span>
                <span class="card-subtitle">${lead.activity || 'Nouveau prospect'}</span>
                <div class="card-footer">
                    <span>${App.formatDate(lead.createdAt)}</span>
                    <span class="badge" style="background: #3b82f6;">Lead</span>
                </div>
            </div>
        `;
    },

    renderQuoteCard(quote) {
        const client = Storage.getClient(quote.clientId);
        return `
            <div class="kanban-card" onclick="App.navigateTo('quotes')">
                <span class="card-title">${client?.name || 'Client inconnu'}</span>
                <span class="card-subtitle">${quote.number}</span>
                <span class="card-price">${App.formatCurrency(quote.total || 0)}</span>
                <div class="card-footer">
                    <span>${App.formatDate(quote.createdAt)}</span>
                    <span class="badge" style="background: #f59e0b;">Devis</span>
                </div>
            </div>
        `;
    },

    renderInvoiceCard(invoice) {
        const client = Storage.getClient(invoice.clientId);
        const isOverdue = invoice.status === 'overdue';
        return `
            <div class="kanban-card" onclick="App.navigateTo('invoices')">
                <span class="card-title">${client?.name || 'Client inconnu'}</span>
                <span class="card-subtitle">${invoice.number}</span>
                <span class="card-price">${App.formatCurrency(invoice.total || 0)}</span>
                <div class="card-footer">
                    <span>${App.formatDate(invoice.createdAt)}</span>
                    <span class="badge" style="background: ${isOverdue ? '#ef4444' : '#10b981'};">Facturé</span>
                </div>
            </div>
        `;
    },

    renderPaidCard(invoice) {
        const client = Storage.getClient(invoice.clientId);
        const netAmount = invoice.total * (1 - (TaxEngine.getSocialRate() / 100));
        return `
            <div class="kanban-card" onclick="App.navigateTo('invoices')">
                <span class="card-title">${client?.name || 'Client inconnu'}</span>
                <span class="card-subtitle">${invoice.number}</span>
                <span class="card-price" style="color: #10b981;">+ ${App.formatCurrency(invoice.total)}</span>
                <div class="card-footer">
                    <span style="color: var(--text-muted);">Net : ${App.formatCurrency(netAmount)}</span>
                    <span class="badge" style="background: #10b981;">Payé</span>
                </div>
            </div>
        `;
    }
};

window.Kanban = Kanban;
