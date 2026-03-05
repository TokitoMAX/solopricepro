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
            const currentNet = caEncaisse - provisionCharges - totalExpenses;

            // Prediction Logic (Qonto Style)
            const conversionRate = 0.25; // 25% conversion estimation
            const projectedRevenue = caEncaisse + (pipelineValue * conversionRate);
            const projectedCharges = projectedRevenue * (socialRate / 100);
            const projectedNet = projectedRevenue - projectedCharges - totalExpenses;

            const santeFinanciere = caEncaisse > 0 ? Math.round((currentNet / caEncaisse) * 100) : 0;

            // Sub-components
            const onboardingHtml = (typeof Onboarding !== 'undefined' && Onboarding.renderWidget) ? Onboarding.renderWidget() : '';
            const coachHtml = (typeof Coach !== 'undefined' && typeof App !== 'undefined' && App.isFeatureProGated) ?
                (App.isFeatureProGated('coach') ? (typeof PremiumWall !== 'undefined' ? PremiumWall.renderTeaser('Coaching Stratégique', 'Obtenez des analyses automatiques sur votre cash dormant et vos objectifs de salairenet.', '') : '') : Coach.renderWidget()) : '';

            const dailyFocusItems = (typeof App !== 'undefined' && App.getDailyFocus) ? App.getDailyFocus() : [];

            // --- RENDER ---
            container.innerHTML = `
            <div class="dashboard-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; animation: slideInTop 0.6s ease-out;">
                <div>
                    <h1 class="logo-text" style="font-size: 2.8rem; margin-bottom: 0.25rem;">Control Tower</h1>
                    <p class="page-subtitle" style="font-size: 1.1rem; color: var(--text-muted); font-weight: 500;">Pilotez votre profitabilité en haute définition</p>
                </div>
                <div class="dashboard-timer glass" style="font-size: 0.95rem; font-weight: 600; padding: 0.75rem 1.5rem; border-radius: 99px;">
                    <i class="far fa-calendar-alt" style="margin-right: 8px; color: var(--primary);"></i> <span id="current-time-display">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
            </div>

            ${onboardingHtml}

            <!-- COCKPIT CARD (QONTO INSPIRED) -->
            <div class="cockpit-card glass" style="grid-column: 1 / -1; padding: 2.5rem; border-radius: var(--radius-lg); margin-bottom: 3rem; position: relative; overflow: hidden; background: linear-gradient(145deg, rgba(16, 185, 129, 0.05), rgba(6, 95, 70, 0.05)); border: 1px solid var(--glass-border);">
                <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: radial-gradient(circle, var(--primary-glass) 0%, transparent 70%); pointer-events: none;"></div>
                
                <div class="cockpit-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2.5rem;">
                    <!-- Solde Net Actuel -->
                    <div class="cockpit-item">
                        <span style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 12px;">Salaire Net Encaissé</span>
                        <div style="font-size: 3rem; font-weight: 900; letter-spacing: -1.5px; color: var(--white);">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(currentNet) : currentNet}</div>
                        <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
                            <span class="badge" style="background: var(--success); color: white; border-radius: 6px; font-size: 0.75rem; padding: 4px 8px;">Vrai Net</span>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">Mois en cours</span>
                        </div>
                    </div>

                    <!-- Projection Fin de Mois -->
                    <div class="cockpit-item" style="border-left: 1px solid var(--border); padding-left: 2.5rem;">
                        <span style="font-size: 0.8rem; font-weight: 800; color: var(--primary-light); text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 12px;">Projection Fin de Mois</span>
                        <div style="font-size: 3rem; font-weight: 900; letter-spacing: -1.5px; color: var(--primary-light); opacity: 0.9;">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(projectedNet) : projectedNet}</div>
                        <div style="margin-top: 10px; display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 0.85rem; color: var(--text-muted);">Est. via pipeline (${conversionRate * 100}%)</span>
                            <div style="flex: 1; height: 4px; background: var(--border); border-radius: 2px; max-width: 100px;">
                                <div style="height: 100%; width: 75%; background: var(--primary); border-radius: 2px; box-shadow: 0 0 10px var(--primary-glass);"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 2.5rem; padding-top: 2rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; gap: 2rem;">
                        <div>
                            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 4px;">CA Total</span>
                            <span style="font-weight: 700;">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(stats.monthlyRevenue) : stats.monthlyRevenue}</span>
                        </div>
                        <div>
                            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 4px;">TVA + Social</span>
                            <span style="font-weight: 700; color: var(--warning);">-${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(provisionCharges) : provisionCharges}</span>
                        </div>
                        <div>
                            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 4px;">Dépenses</span>
                            <span style="font-weight: 700; color: var(--danger);">-${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(totalExpenses) : totalExpenses}</span>
                        </div>
                    </div>
                    <button class="button-outline" onclick="App.navigateTo('expenses')" style="border-radius: 12px; font-size: 0.85rem; padding: 0.6rem 1.2rem;">
                        Détails Trésorerie <i class="fas fa-arrow-right" style="margin-left: 8px; font-size: 0.8rem;"></i>
                    </button>
                </div>
            </div>

            <!-- Strategic Context Grid -->
            <div class="stats-grid dashboard-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
                <!-- Goal Card -->
                <div class="stat-card glass">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                        <div>
                            <span class="stat-label" style="font-weight: 800; font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Objectif Mensuel</span>
                            <div style="font-size: 1.8rem; font-weight: 900; margin-top: 4px;">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(monthlyGoal) : monthlyGoal}</div>
                        </div>
                        <button class="button-outline small" onclick="Dashboard.editGoal()" style="padding: 0.4rem; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                            <i class="fas fa-pen" style="font-size: 0.7rem;"></i>
                        </button>
                    </div>
                    <div style="margin-bottom: 8px; display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-muted);">Atteint: <strong>${progress}%</strong></span>
                        <span style="color: var(--primary-light); font-weight: 700;">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(stats.monthlyRevenue) : stats.monthlyRevenue}</span>
                    </div>
                    <div class="progress-bar-container" style="height: 6px; background: var(--border); border-radius: 3px; overflow: hidden;">
                        <div class="progress-bar-fill" style="height: 100%; width: ${progress}%; background: var(--gradient-1); box-shadow: 0 0 15px var(--primary-glass);"></div>
                    </div>
                </div>

                <!-- Pipeline Context -->
                <div class="stat-card glass">
                    <span class="stat-label" style="font-weight: 800; font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Pipeline en Attente</span>
                    <div style="font-size: 1.8rem; font-weight: 900; margin-top: 4px; color: var(--primary-light);">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(pipelineValue) : pipelineValue}</div>
                    <div style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-file-invoice-dollar" style="color: var(--primary);"></i>
                        ${quotes.filter(q => q.status === 'sent').length} devis envoyés
                    </div>
                </div>

                <!-- Sector/Tax -->
                <div class="stat-card glass" style="border-bottom: 3px solid var(--secondary);">
                    <span class="stat-label" style="font-weight: 800; font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Réglages Stratégiques</span>
                    <div style="font-size: 1.25rem; font-weight: 800; margin-top: 8px; color: var(--white);">${taxCtx.name}</div>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Charge Sociale : ${socialRate}%</p>
                    <button class="button-link" onclick="App.navigateTo('settings', 'billing')" style="margin-top: 12px; font-size: 0.8rem; padding: 0; color: var(--primary-light);">Optimiser ma fiscalité →</button>
                </div>
            </div>

            <div class="dashboard-sections" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 2rem;">
                
                <!-- Focus & Coaching row -->
                <div style="grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <!-- Focus du Jour -->
                    <div class="focus-widget glass" style="padding: 2rem; border-radius: var(--radius-md);">
                        <div class="section-header-inline" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
                            <h2 class="section-title-small" style="font-weight: 800; letter-spacing: 1px; color: var(--white); text-transform: uppercase; font-size: 0.9rem;">🎯 Focus du Jour</h2>
                            <span class="badge" style="background: var(--primary-glass); color: var(--primary-light); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">Top 3 PRIORITÉS</span>
                        </div>
                        <div class="focus-list" style="display: grid; gap: 1rem;">
                            ${dailyFocusItems.map(item => `
                                <div class="focus-item glass" onclick="App.navigateTo('${item.nav}')" style="padding: 1rem; border-radius: 12px; display: flex; gap: 1rem; align-items: center; cursor: pointer; border: 1px solid var(--border-light);">
                                    <div class="focus-icon" style="font-size: 1.5rem; width: 48px; height: 48px; background: var(--bg-card); display: flex; align-items: center; justify-content: center; border-radius: 10px;">${item.icon}</div>
                                    <div class="focus-details" style="flex: 1;">
                                        <div style="font-weight: 800; font-size: 0.95rem; color: white;">${item.title}</div>
                                        <div style="font-size: 0.8rem; color: var(--text-muted);">${item.description}</div>
                                    </div>
                                    <div style="font-size: 0.8rem; color: var(--primary-light);"><i class="fas fa-chevron-right"></i></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    ${coachHtml}
                </div>

                <!-- Dernières Actions & Documents -->
                <div class="dashboard-section glass" style="padding: 2rem; border-radius: var(--radius-md);">
                    <div class="section-header-inline" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h2 class="section-title-small" style="font-weight: 800; font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase;">📄 Flux Documents</h2>
                        <a href="#" onclick="App.navigateTo('quotes')" class="button-link" style="color: var(--primary-light); font-size: 0.8rem;">Tout voir →</a>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${[...recentQuotes, ...recentInvoices]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 6)
                    .map(doc => {
                        const client = (typeof Storage !== 'undefined' && Storage.getClient) ? Storage.getClient(doc.clientId) : null;
                        const isInvoice = doc.number.includes('FACT') || doc.type === 'invoice';
                        return `
                                <div class="doc-row glass" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-light);">
                                    <div style="display: flex; align-items: center; gap: 1rem;">
                                        <div style="width: 40px; height: 40px; border-radius: 10px; background: ${isInvoice ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0, 209, 255, 0.1)'}; display: flex; align-items: center; justify-content: center; color: ${isInvoice ? 'var(--secondary)' : 'var(--primary)'};">
                                            <i class="fas ${isInvoice ? 'fa-file-invoice' : 'fa-file-signature'}"></i>
                                        </div>
                                        <div>
                                            <div style="font-weight: 700; font-size: 0.9rem;">${doc.number}</div>
                                            <div style="font-size: 0.75rem; color: var(--text-muted);">${client?.name || 'Client'}</div>
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 800; font-size: 0.95rem;">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(doc.total) : doc.total}</div>
                                        <div style="font-size: 0.7rem;"><span class="status-badge status-${doc.status}" style="padding: 2px 6px; border-radius: 4px; font-size: 0.65rem;">${this.getStatusLabel(doc.status)}</span></div>
                                    </div>
                                </div>
                            `;
                    }).join('')}
                    </div>

                    ${(recentQuotes.length === 0 && recentInvoices.length === 0) ? `
                        <div class="empty-state" style="text-align: center; padding: 2rem;">
                            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Aucun document émis ce mois-ci.</p>
                            <button class="cta-button" onclick="App.navigateTo('quotes')" style="padding: 0.8rem 1.5rem; font-size: 0.9rem;">Créer un Devis</button>
                        </div>
                    ` : ''}
                </div>

                <!-- Quick Actions Block -->
                <div class="dashboard-section glass" style="padding: 2rem; border-radius: var(--radius-md);">
                    <h2 class="section-title-small" style="font-weight: 800; font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 2rem;">🚀 Actions Rapides</h2>
                    <div class="quick-actions" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <button class="action-card glass" onclick="App.navigateTo('scoper');" style="padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; gap: 1rem; background: var(--gradient-1); color: white; border: none;">
                            <i class="fas fa-magic" style="font-size: 1.5rem;"></i>
                            <span style="font-weight: 800; font-size: 0.9rem;">Calculer TJM</span>
                        </button>
                        <button class="action-card glass" onclick="App.navigateTo('network');" style="padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                            <i class="fas fa-users" style="font-size: 1.5rem; color: var(--primary);"></i>
                            <span style="font-weight: 700; font-size: 0.9rem;">Cercle</span>
                        </button>
                        <button class="action-card glass" onclick="App.navigateTo('marketplace');" style="padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                            <i class="fas fa-store" style="font-size: 1.5rem; color: var(--secondary);"></i>
                            <span style="font-weight: 700; font-size: 0.9rem;">Offres</span>
                        </button>
                        <button class="action-card glass" onclick="App.navigateTo('settings')" style="padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                            <i class="fas fa-cog" style="font-size: 1.5rem; color: var(--text-muted);"></i>
                            <span style="font-weight: 700; font-size: 0.9rem;">Configuration</span>
                        </button>
                    </div>
                    
                    <div style="margin-top: 2rem; padding: 1.5rem; border-radius: 12px; background: rgba(0, 209, 255, 0.05); border: 1px dotted var(--primary-glass); text-align: center;">
                        <p style="font-size: 0.8rem; color: var(--primary-light); margin: 0;">
                            <i class="fas fa-info-circle"></i> Besoin d'aide pour votre closing ?<br>
                            <a href="#" onclick="App.navigateTo('scoper')" style="color: white; font-weight: 700; text-decoration: none;">Voir le Coach de Vente →</a>
                        </p>
                    </div>
                </div>
            </div>
        `;
        } catch (error) {
            console.error(' [DASHBOARD] Critical Render Error:', error);
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
