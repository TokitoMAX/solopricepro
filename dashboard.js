// SoloPrice Pro - Dashboard Module

const Dashboard = {
    render() {
        try {
            const container = document.getElementById('dashboard-content');
            if (!container) return;

            // --- DATA ACQUISITION & FALLBACKS ---
            const stats = (typeof Storage !== 'undefined' && Storage.getStats) ? Storage.getStats() : { monthlyRevenue: 0, totalClients: 0 };
            const calculatorData = (typeof Storage !== 'undefined' && Storage.get) ? Storage.get('sp_calculator_data') : null;
            const quotes = (typeof Storage !== 'undefined' && Storage.getQuotes) ? Storage.getQuotes() || [] : [];
            const invoices = (typeof Storage !== 'undefined' && Storage.getInvoices) ? Storage.getInvoices() || [] : [];
            const expenses = (typeof Storage !== 'undefined' && Storage.getExpenses) ? Storage.getExpenses() || [] : [];

            // --- CALCULATIONS ---
            const defaultRev = (typeof App !== 'undefined' && App.getCurrencyConfig) ? App.getCurrencyConfig().defaultRevenue : 5000;
            const monthlyGoal = (calculatorData && calculatorData.monthlyRevenue) ? parseFloat(calculatorData.monthlyRevenue) : defaultRev;
            const progress = monthlyGoal > 0 ? Math.min(100, Math.round((stats.monthlyRevenue / monthlyGoal) * 100)) : 0;
            const pipelineValue = quotes
                .filter(q => q.status === 'sent')
                .reduce((sum, q) => sum + (q.total || 0), 0);

            const recentQuotes = [...quotes]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5);

            const recentInvoices = [...invoices]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5);

            // Safe Tax Engine reference
            const taxCtx = (typeof TaxEngine !== 'undefined' && TaxEngine.getCurrent) ? TaxEngine.getCurrent() : { name: 'Standard', description: 'TVA 20%', vat: 20 };
            const socialRate = (typeof TaxEngine !== 'undefined' && TaxEngine.getSocialRate) ? TaxEngine.getSocialRate() : 21.1;

            // Treasury Calculations
            const invoicesPaid = invoices.filter(i => i.status === 'paid');
            const caEncaisse = invoicesPaid.reduce((sum, i) => sum + (i.total || 0), 0);
            const provisionCharges = caEncaisse * (socialRate / 100);
            const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
            const netReel = caEncaisse - provisionCharges - totalExpenses;
            const santeFinanciere = caEncaisse > 0 ? Math.round((netReel / caEncaisse) * 100) : 0;

            // Sub-components
            const onboardingHtml = (typeof Onboarding !== 'undefined' && Onboarding.renderWidget) ? Onboarding.renderWidget() : '';
            const coachHtml = (typeof Coach !== 'undefined' && typeof App !== 'undefined' && App.isFeatureProGated) ?
                (App.isFeatureProGated('coach') ? (typeof PremiumWall !== 'undefined' ? PremiumWall.renderTeaser('Coaching Stratégique', 'Obtenez des analyses automatiques sur votre cash dormant et vos objectifs de salairenet.', '') : '') : Coach.renderWidget()) : '';

            const dailyFocusItems = (typeof App !== 'undefined' && App.getDailyFocus) ? App.getDailyFocus() : [];

            // --- RENDER ---
            container.innerHTML = `
            <div class="dashboard-header" style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; animation: slideInTop 0.6s ease-out;">
                <div>
                    <h1 class="page-title" style="font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem;">Vue Stratégique</h1>
                    <p class="page-subtitle" style="font-size: 1.1rem; opacity: 0.8;">Analyse de votre performance business en temps réel</p>
                </div>
                <div class="dashboard-timer" style="font-size: 0.9rem; color: var(--text-muted); background: var(--bg-card); padding: 0.5rem 1rem; border-radius: 99px; border: 1px solid var(--border);">
                    <i class="far fa-clock"></i> <span id="current-time-display">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
            </div>

            ${onboardingHtml}

            <!-- Strategic Progress Banner -->
            ${(!calculatorData || !calculatorData.dailyRate) ? `
                <div class="glass-card" style="padding: 1.5rem; border-radius: 16px; background: linear-gradient(90deg, rgba(99, 102, 241, 0.1), transparent); border-left: 4px solid var(--primary); margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0; font-size: 1rem; color: var(--primary-light);">🎯 Étape manquante : Scellez votre TJM</h4>
                        <p style="margin: 5px 0 0; font-size: 0.85rem; color: var(--text-muted);">Définissez votre objectif pour activer l'analyse de rentabilité de vos devis.</p>
                    </div>
                    <button class="button-primary small" onclick="App.navigateTo('scoper')">Accéder au Scoper</button>
                </div>
            ` : ''}

            <!-- Focus du Jour -->
            <div class="focus-widget glass">
                <div class="section-header-inline" style="margin-bottom: 1.5rem;">
                    <h2 class="section-title-small" style="font-size: 0.9rem; color: var(--primary-light); letter-spacing: 1px;">MON FOCUS DU JOUR</h2>
                    <span class="badge" style="background: var(--primary-glass); color: var(--primary-light);">Top 3 Actions</span>
                </div>
                <div class="focus-list">
                    ${dailyFocusItems.map(item => `
                        <div class="focus-item" onclick="App.navigateTo('${item.nav}')">
                            <div class="focus-icon">${item.icon}</div>
                            <div class="focus-details">
                                <div style="font-weight: 700; font-size: 0.95rem; color: white; margin-bottom: 4px;">${item.title}</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.3;">${item.description}</div>
                                <button class="button-link small" style="margin-top: 8px; padding: 0; color: var(--primary-light); font-size: 0.75rem;">${item.action} →</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${coachHtml}

            <div class="stats-grid dashboard-stats">
                <!-- Goal Card -->
                <div class="stat-card goal-card">
                    <span class="stat-label" style="display: flex; justify-content: space-between; align-items: center;">
                        Objectif Mensuel 
                        <button class="button-link small" onclick="Dashboard.editGoal()" style="padding: 0; font-size: 0.8rem; color: var(--primary);" title="Modifier mon objectif">
                            <i class="fas fa-edit"></i>
                        </button>
                    </span>
                    <div class="stat-value">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(stats.monthlyRevenue) : stats.monthlyRevenue}</div>
                    <div class="stat-description" style="color: var(--text-muted); font-size: 0.85rem;">
                        Progrès: <strong>${progress}%</strong> sur ${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(monthlyGoal) : monthlyGoal}
                    </div>
                    <div class="progress-bar-container" style="height: 4px; background: var(--border); border-radius: 2px; margin-top: 0.5rem; overflow: hidden;">
                        <div class="progress-bar-fill" style="height: 100%; width: ${progress}%; background: var(--primary); box-shadow: 0 0 10px var(--primary-glass);"></div>
                    </div>
                </div>

                <!-- Pipeline Card -->
                <div class="stat-card pipeline-card">
                    <span class="stat-label">Volume de Devis (Objectif)</span>
                    <div class="stat-value" style="color: var(--primary-light);">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(pipelineValue) : pipelineValue}</div>
                    <div class="stat-description">${pipelineValue > 0 ? `${quotes.filter(q => q.status === 'sent').length} devis en attente` : 'Lancez votre prospection !'}</div>
                </div>

                <div class="stat-card">
                    <span class="stat-label">Cercle</span>
                    <div class="stat-value">${stats.totalClients}</div>
                    <div class="stat-description">Clients & Partenaires</div>
                </div>

                <!-- Strategic Context Card -->
                <div class="stat-card context-card" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(0, 0, 0, 0)); border-radius: 20px; border: 1px solid var(--primary-glass); transition: transform 0.3s ease;">
                    <span class="stat-label" style="text-transform: uppercase; letter-spacing: 1px; font-size: 0.75rem; font-weight: 700;">Zone / Fiscalité</span>
                    <div class="stat-value" style="font-size: 1.4rem; color: var(--secondary); margin: 0.5rem 0;">${taxCtx.name}</div>
                    <div class="stat-description" style="font-size: 0.8rem; margin-bottom: 1rem;">${taxCtx.description}</div>
                    <button class="button-primary small" style="width: 100%; font-size: 0.8rem; border-radius: 10px; background: var(--primary-glass); border: 1px solid var(--primary); color: var(--primary-light);" onclick="App.navigateTo('settings', 'billing')">
                        Modifier la stratégie
                    </button>
                </div>
            </div>

            <div class="dashboard-sections" style="margin-top: 2rem;">
                <div class="dashboard-section treasury-section glass" style="grid-column: 1 / -1; padding: 2rem; border-radius: 20px; background: linear-gradient(145deg, rgba(99, 102, 241, 0.05), rgba(0, 0, 0, 0)); border: 1px solid var(--primary-glass);">
                    <div class="section-header-inline">
                        <h2 class="section-title-small" style="color: var(--primary-light);">Pilotage de Profitabilité Nette</h2>
                        <span class="badge" style="background: var(--success); color: white;">Données Réelles</span>
                    </div>
                    
                    ${(typeof App !== 'undefined' && App.isFeatureProGated && App.isFeatureProGated('expenses')) ? `
                        <div style="margin-top: 1.5rem;">
                            ${(typeof PremiumWall !== 'undefined' && PremiumWall.renderTeaser) ? PremiumWall.renderTeaser('Profitabilité en Temps Réel', 'Suivez vos dépenses, vos charges sociales et votre salaire net réel automatiquement.', '') : ''}
                        </div>
                    ` : `
                    <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-top: 1.5rem;">
                        <div class="stat-item">
                            <span class="stat-label">CA Encaissé (Mois)</span>
                            <div class="stat-value" style="color: #10b981;">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(caEncaisse) : caEncaisse}</div>
                            <p class="stat-description">Vrai flux entrant</p>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Provision Charges (URSSAF)</span>
                            <div class="stat-value" style="color: #f59e0b;">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(provisionCharges) : provisionCharges}</div>
                            <p class="stat-description">À mettre de côté (${socialRate}%)</p>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Dépenses Réelles</span>
                            <div class="stat-value" style="color: #ef4444;">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(totalExpenses) : totalExpenses}</div>
                            <p class="stat-description">Coûts de fonctionnement</p>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Net Réel (Ton Salaire)</span>
                            <div class="stat-value" style="font-weight: 800; color: white;">
                                ${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(netReel) : netReel}
                            </div>
                            <p class="stat-description">Ce qui te reste vraiment</p>
                        </div>
                    </div>
                    
                    <div style="margin-top: 2rem; padding: 1.2rem; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2); display: flex; align-items: center; gap: 1rem;">
                        <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">
                            <strong>Santé Financière :</strong> Votre bénéfice net représente ${santeFinanciere}% de votre CA encaissé.
                        </p>
                    </div>
                    `}
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
                const client = (typeof Storage !== 'undefined' && Storage.getClient) ? Storage.getClient(quote.clientId) : null;
                return `
                                            <tr>
                                                <td><strong>${quote.number}</strong></td>
                                                <td>${client?.name || 'Client supprimé'}</td>
                                                <td>${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(quote.total) : quote.total}</td>
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
                const client = (typeof Storage !== 'undefined' && Storage.getClient) ? Storage.getClient(invoice.clientId) : null;
                return `
                                            <tr>
                                                <td><strong>${invoice.number}</strong></td>
                                                <td>${client?.name || 'Client supprimé'}</td>
                                                <td>${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(invoice.total) : invoice.total}</td>
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
        } catch (error) {
            console.error('❌ [DASHBOARD] Critical Render Error:', error);
            const container = document.getElementById('dashboard-content');
            if (container) {
                container.innerHTML = `
                    <div style="padding: 2rem; text-align: center; background: rgba(239, 68, 68, 0.1); border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.2); margin-top: 2rem;">
                        <h3 style="color: #ef4444; margin-bottom: 1rem;">Oups ! Un problème est survenu.</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">Nous n'avons pas pu charger votre "Vue Stratégique" correctement.</p>
                        <button class="button-primary" style="margin-top: 1.5rem;" onclick="window.location.reload()">Rafraîchir la page</button>
                    </div>
                `;
            }
        }
    },

    editGoal() {
        if (typeof Storage === 'undefined') return;

        const defaultRev = (typeof App !== 'undefined' && App.getCurrencyConfig) ? App.getCurrencyConfig().defaultRevenue : 5000;
        const calculatorData = Storage.get('sp_calculator_data') || { monthlyRevenue: defaultRev, workingDays: 15, hoursPerDay: 7, monthlyCharges: 500, taxRate: 22, sector: 'tech' };
        const currentGoal = calculatorData.monthlyRevenue || defaultRev;

        const newGoal = prompt("Définissez votre nouvel objectif de Chiffre d'Affaires(CA) mensuel (" + (typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€') + ") : ", currentGoal);
        if (newGoal !== null && newGoal.trim() !== '') {
            const parsedGoal = parseFloat(newGoal.replace(/[^0-9.,]/g, '').replace(',', '.'));

            if (!isNaN(parsedGoal) && parsedGoal > 0) {
                calculatorData.monthlyRevenue = parsedGoal;
                Storage.set('sp_calculator_data', calculatorData);

                if (typeof App !== 'undefined' && App.showNotification) {
                    App.showNotification("Objectif mis à jour avec succès !", 'success');
                }

                this.render(); // Re-render the dashboard immediately

                // Trigger background sync if the user is PRO and DB sync is available
                if (Storage.savePricingConfig) {
                    Storage.savePricingConfig().catch(e => console.log('Background sync skipped', e));
                }
            } else {
                if (typeof App !== 'undefined' && App.showNotification) {
                    App.showNotification("Montant invalide. L'objectif doit être un nombre supérieur à 0.", 'error');
                }
            }
        }
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
