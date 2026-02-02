// SoloPrice Pro - Dashboard Module

const Dashboard = {
    render() {
        const container = document.getElementById('dashboard-content');
        if (!container) return;

        const stats = Storage.getStats();
        // Récupérer l'objectif (sauvegardé par le calculateur ou par défaut)
        const calculatorData = Storage.get('sp_calculator_data');
        const monthlyGoal = calculatorData ? parseFloat(calculatorData.monthlyRevenue) : 5000;

        // Calcul du progrès
        const progress = Math.min(100, Math.round((stats.monthlyRevenue / monthlyGoal) * 100));

        // Calcul du pipeline (devis envoyés)
        const quotes = Storage.getQuotes();
        const pipelineValue = quotes
            .filter(q => q.status === 'sent')
            .reduce((sum, q) => sum + (q.total || 0), 0);

        const recentQuotes = Storage.getQuotes()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        const recentInvoices = Storage.getInvoices()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        container.innerHTML = `
            <div class="dashboard-header">
                <h1 class="page-title">Tableau de Bord</h1>
                <p class="page-subtitle">Vue d'ensemble de votre activité</p>
            </div>

            <div class="stats-grid dashboard-stats">
                <!-- Goal Card -->
                <div class="stat-card goal-card">
                    <span class="stat-label">Objectif Mensuel</span>
                    <div class="stat-value">${App.formatCurrency(stats.monthlyRevenue)}</div>
                    <div class="stat-description" style="color: var(--text-muted); font-size: 0.85rem;">
                        Progrès: <strong>${progress}%</strong> sur ${App.formatCurrency(monthlyGoal)}
                    </div>
                    <div class="progress-bar-container" style="height: 4px; background: var(--border); border-radius: 2px; margin-top: 0.5rem; overflow: hidden;">
                        <div class="progress-bar-fill" style="height: 100%; width: ${progress}%; background: var(--primary); box-shadow: 0 0 10px var(--primary-glass);"></div>
                    </div>
                </div>

                <!-- Pipeline Card -->
                <div class="stat-card pipeline-card">
                    <span class="stat-label">Volume de Devis (Objectif)</span>
                    <div class="stat-value" style="color: var(--primary-light);">${App.formatCurrency(pipelineValue)}</div>
                    <div class="stat-description">${pipelineValue > 0 ? `${quotes.filter(q => q.status === 'sent').length} devis en attente` : 'Lancez votre prospection !'}</div>
                </div>

                <div class="stat-card">
                    <span class="stat-label">Cercle</span>
                    <div class="stat-value">${stats.totalClients}</div>
                    <div class="stat-description">Clients & Partenaires</div>
                </div>

                <!-- Strategic Context Card -->
                <div class="stat-card context-card">
                    <span class="stat-label">Zone / Fiscalité</span>
                    <div class="stat-value" style="font-size: 1.2rem; color: var(--secondary);">${typeof TaxEngine !== 'undefined' ? TaxEngine.getCurrent().name : 'Standard'}</div>
                    <div class="stat-description" style="font-size: 0.8rem;">${typeof TaxEngine !== 'undefined' ? TaxEngine.getCurrent().description : 'TVA 20%'}</div>
                    <button class="button-secondary small" style="margin-top: auto; padding: 0.4rem; font-size: 0.8rem;" onclick="App.navigateTo('settings', 'billing')">
                        Changer de Zone
                    </button>
                </div>
            </div>

            <!-- Dashboard Row: Treasury & Flow -->
            <div class="dashboard-sections" style="margin-top: 2rem;">
                <div class="dashboard-section treasury-section glass" style="grid-column: 1 / -1; padding: 2rem; border-radius: 20px; background: linear-gradient(145deg, rgba(99, 102, 241, 0.05), rgba(0, 0, 0, 0)); border: 1px solid var(--primary-glass);">
                    <div class="section-header-inline">
                        <h2 class="section-title-small" style="color: var(--primary-light);">Pilotage de Profitabilité Nette</h2>
                        <span class="badge" style="background: var(--success); color: white;">Données Réelles</span>
                    </div>
                    
                    <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-top: 1.5rem;">
                        <div class="stat-item">
                            <span class="stat-label">CA Encaissé (Mois)</span>
                            <div class="stat-value" style="color: #10b981;">${App.formatCurrency(Storage.getInvoices().filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0))}</div>
                            <p class="stat-description">Vrai flux entrant</p>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Provision Charges (URSSAF)</span>
                            <div class="stat-value" style="color: #f59e0b;">${App.formatCurrency(Storage.getInvoices().filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0) * (TaxEngine.getSocialRate() / 100))}</div>
                            <p class="stat-description">À mettre de côté (${TaxEngine.getSocialRate()}%)</p>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Dépenses Réelles</span>
                            <div class="stat-value" style="color: #ef4444;">${App.formatCurrency(Storage.getExpenses().reduce((sum, e) => sum + e.amount, 0))}</div>
                            <p class="stat-description">Coûts de fonctionnement</p>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Net Réel (Ton Salaire)</span>
                            <div class="stat-value" style="font-weight: 800; color: white;">
                                ${App.formatCurrency(
            Storage.getInvoices().filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0) -
            (Storage.getInvoices().filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0) * (TaxEngine.getSocialRate() / 100)) -
            Storage.getExpenses().reduce((sum, e) => sum + e.amount, 0)
        )}
                            </div>
                            <p class="stat-description">Ce qui te reste vraiment</p>
                        </div>
                    </div>
                    
                    <div style="margin-top: 2rem; padding: 1.2rem; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2); display: flex; align-items: center; gap: 1rem;">
                        <div style="font-size: 1.5rem;">✅</div>
                        <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">
                            <strong>Santé Financière :</strong> Votre bénéfice net représente ${Math.round(((Storage.getInvoices().filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0) - (Storage.getInvoices().filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0) * (TaxEngine.getSocialRate() / 100)) - Storage.getExpenses().reduce((sum, e) => sum + e.amount, 0)) / (Storage.getInvoices().filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0) || 1)) * 100)}% de votre CA encaissé.
                        </p>
                    </div>
                </div>
            </div>

            <div class="dashboard-sections">
                <div class="dashboard-section">
                    <div class="section-header-inline">
                        <h2 class="section-title-small">Derniers Devis</h2>
                        <a href="#" data-nav="quotes" class="link-button">Voir tout</a>
                    </div>
                    
                    ${recentQuotes.length > 0 ? `
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Numéro</th>
                                        <th>Client</th>
                                        <th>Montant</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${recentQuotes.map(quote => {
            const client = Storage.getClient(quote.clientId);
            return `
                                            <tr>
                                                <td><strong>${quote.number}</strong></td>
                                                <td>${client?.name || 'Client supprimé'}</td>
                                                <td>${App.formatCurrency(quote.total)}</td>
                                                <td><span class="status-badge status-${quote.status}">${this.getStatusLabel(quote.status)}</span></td>
                                            </tr>
                                        `;
        }).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="empty-state">
                            <p>Aucun devis enregistré</p>
                            <button class="button-primary" onclick="App.navigateTo('quotes');">Créer mon premier devis</button>
                        </div>
                    `}
                </div>

                <div class="dashboard-section">
                    <div class="section-header-inline">
                        <h2 class="section-title-small">Dernières Factures</h2>
                        <a href="#" data-nav="invoices" class="link-button">Voir tout →</a>
                    </div>
                    
                    ${recentInvoices.length > 0 ? `
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Numéro</th>
                                        <th>Client</th>
                                        <th>Montant</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${recentInvoices.map(invoice => {
            const client = Storage.getClient(invoice.clientId);
            return `
                                            <tr>
                                                <td><strong>${invoice.number}</strong></td>
                                                <td>${client?.name || 'Client supprimé'}</td>
                                                <td>${App.formatCurrency(invoice.total)}</td>
                                                <td><span class="status-badge status-${invoice.status}">${this.getStatusLabel(invoice.status)}</span></td>
                                            </tr>
                                        `;
        }).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="empty-state">
                            <p>Aucune facture enregistrée</p>
                            <button class="button-primary" onclick="App.navigateTo('quotes');">Gérer mes factures</button>
                        </div>
                    `}
                </div>

                <div class="dashboard-section">
                    <h2 class="section-title-small">Démarrer une action</h2>
                    <div class="quick-actions">
                        <button class="action-card" onclick="App.navigateTo('scoper');" style="background: var(--gradient-1); color: white;">
                             <span class="action-icon" style="font-size: 2rem; margin-bottom: 0.5rem;"></span>
                            <span class="action-label" style="font-weight: 700;">Chiffrage Projet</span>
                        </button>
                        <button class="action-card" onclick="App.navigateTo('network');">
                             <span class="action-icon"></span>
                            <span class="action-label">Ajouter au Cercle</span>
                        </button>
                        <button class="action-card" onclick="App.navigateTo('quotes');">
                             <span class="action-icon"></span>
                            <span class="action-label">Voir Documents</span>
                        </button>
                        <button class="action-card" onclick="App.navigateTo('settings')">
                             <span class="action-icon"></span>
                            <span class="action-label">Réglages</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Réactiver les event listeners si besoin (géré par App)
    },

    getStatusLabel(status) {
        const labels = {
            draft: 'Brouillon',
            sent: 'Envoyée',
            paid: 'Payée',
            overdue: 'En retard',
            accepted: 'Accepté',
            refused: 'Refusé'
        };
        return labels[status] || status;
    }
};
