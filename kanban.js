// SoloPrice Pro - Kanban Module
// Handles visual business pipeline from leads to paid invoices

const Kanban = {
    render() {
        const container = document.getElementById('kanban-page');
        if (!container) return;

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
                        <span>🚀 PROSPECTS</span>
                        <span class="badge">${leads.length}</span>
                    </div>
                    <div class="kanban-cards">
                        ${leads.map(lead => this.renderLeadCard(lead)).join('')}
                    </div>
                </div>

                <!-- Column: Quotes (Draft/Sent) -->
                <div class="kanban-column">
                    <div class="kanban-column-header">
                        <span>📝 DEVIS ENVOYÉS</span>
                        <span class="badge">${quotes.filter(q => q.status !== 'accepted').length}</span>
                    </div>
                    <div class="kanban-cards">
                        ${quotes.filter(q => q.status !== 'accepted').map(quote => this.renderQuoteCard(quote)).join('')}
                    </div>
                </div>

                <!-- Column: In Progress / Invoices Sent -->
                <div class="kanban-column">
                    <div class="kanban-column-header">
                        <span>⚙️ EN COURS / FACTURÉ</span>
                        <span class="badge">${invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length}</span>
                    </div>
                    <div class="kanban-cards">
                        ${invoices.filter(i => i.status === 'sent' || i.status === 'overdue').map(invoice => this.renderInvoiceCard(invoice)).join('')}
                    </div>
                </div>

                <!-- Column: Paid (Real Net Cash) -->
                <div class="kanban-column">
                    <div class="kanban-column-header">
                        <span>💰 PAYÉS / NET</span>
                        <span class="badge">${invoices.filter(i => i.status === 'paid').length}</span>
                    </div>
                    <div class="kanban-cards">
                        ${invoices.filter(i => i.status === 'paid').map(invoice => this.renderPaidCard(invoice)).join('')}
                    </div>
                </div>
            </div>

            <style>
                .kanban-board {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                    align-items: flex-start;
                    margin-top: 2rem;
                }
                @media (max-width: 1024px) {
                    .kanban-board {
                        grid-template-columns: 1fr;
                    }
                }
                .kanban-column {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 16px;
                    padding: 1rem;
                    min-height: 500px;
                    border: 1px solid var(--border-color);
                }
                .kanban-column-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid var(--primary-glass);
                    margin-bottom: 1rem;
                    font-weight: bold;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                }
                .kanban-cards {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .kanban-card {
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 1rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                }
                .kanban-card:hover {
                    transform: translateY(-2px);
                    border-color: var(--primary);
                    background: rgba(99, 102, 241, 0.05);
                }
                .card-title {
                    font-weight: bold;
                    font-size: 0.95rem;
                    margin-bottom: 0.25rem;
                    display: block;
                }
                .card-subtitle {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    display: block;
                }
                .card-price {
                    margin-top: 0.75rem;
                    font-weight: 800;
                    color: var(--primary-light);
                    display: block;
                }
                .card-footer {
                    margin-top: 0.75rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.75rem;
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
