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

            <!-- BENTO GRID -->
            <div class="bento-grid" style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 1.5rem; margin-bottom: 3rem;">
                
                <!-- BENTO: Finance Cockpit (Span 8) -->
                <div class="bento-item glass" style="grid-column: span 8; padding: 2.5rem; border-radius: 24px; position: relative; overflow: hidden; background: var(--bg-glass-heavy); backdrop-filter: var(--bg-glass-blur); border: 1px solid var(--glass-border-light); display: flex; flex-direction: column;">
                    <div style="position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; background: radial-gradient(circle, var(--primary-glass) 0%, transparent 70%); pointer-events: none; opacity: 0.5;"></div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
                        <div>
                            <span style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">Salaire Net Encaissé</span>
                            <div style="font-size: 3.5rem; font-weight: 900; letter-spacing: -2px; color: var(--white); line-height: 1;">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(currentNet) : currentNet}</div>
                            <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px;">
                                <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: var(--primary-light); border-radius: 8px; font-weight: 700; font-size: 0.75rem; padding: 6px 10px;">Vrai Net</span>
                                <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">Mois en cours</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 0.8rem; font-weight: 800; color: var(--primary-light); text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">Projection Fin de Mois</span>
                            <div style="font-size: 2rem; font-weight: 800; letter-spacing: -1px; color: var(--primary-light); opacity: 0.9;">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(projectedNet) : projectedNet}</div>
                            <div style="margin-top: 8px; font-size: 0.8rem; color: var(--text-muted);">Est. via pipeline (${conversionRate * 100}%)</div>
                        </div>
                    </div>

                    <div style="margin-top: auto; padding-top: 2rem; border-top: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; gap: 2.5rem;">
                            <div>
                                <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 4px; font-weight: 600;">CA Total</span>
                                <span style="font-weight: 700; font-size: 1.1rem; color: white;">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(stats.monthlyRevenue) : stats.monthlyRevenue}</span>
                            </div>
                            <div>
                                <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 4px; font-weight: 600;">TVA + Social</span>
                                <span style="font-weight: 700; font-size: 1.1rem; color: #f59e0b;">-${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(provisionCharges) : provisionCharges}</span>
                            </div>
                            <div>
                                <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 4px; font-weight: 600;">Dépenses</span>
                                <span style="font-weight: 700; font-size: 1.1rem; color: #ef4444;">-${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(totalExpenses) : totalExpenses}</span>
                            </div>
                        </div>
                        <button class="button-outline" onclick="App.navigateTo('expenses')" style="border-radius: 14px; font-size: 0.85rem; padding: 0.8rem 1.4rem; border-color: var(--glass-border-light); background: rgba(255,255,255,0.02); color: white; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.08)';" onmouseout="this.style.background='rgba(255,255,255,0.02)';">
                            Trésorerie <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>
                        </button>
                    </div>
                </div>

                <!-- BENTO: AI Coach (Span 4) -->
                <div class="bento-item" style="grid-column: span 4; display: flex; flex-direction: column;">
                    ${coachHtml}
                </div>

                <!-- BENTO: Pipeline (Span 4) -->
                <div class="bento-item glass" style="grid-column: span 4; padding: 2rem; border-radius: 24px; background: var(--bg-glass-heavy); border: 1px solid var(--glass-border-light);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(99, 102, 241, 0.1); color: #6366f1; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                            <i class="fas fa-filter"></i>
                        </div>
                        <span class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-muted); padding: 4px 10px; border-radius: 8px; font-weight: 600;">${quotes.filter(q => q.status === 'sent').length} devis</span>
                    </div>
                    <div>
                        <span style="font-size: 0.85rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Pipeline en Attente</span>
                        <div style="font-size: 2.2rem; font-weight: 900; margin-top: 8px; color: white;">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(pipelineValue) : pipelineValue}</div>
                    </div>
                </div>

                <!-- BENTO: Goal (Span 4) -->
                <div class="bento-item glass" style="grid-column: span 4; padding: 2rem; border-radius: 24px; background: var(--bg-glass-heavy); border: 1px solid var(--glass-border-light); position: relative; overflow: hidden;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                            <i class="fas fa-bullseye"></i>
                        </div>
                        <button class="button-ghost small" onclick="Dashboard.editGoal()" style="border-radius: 50%; width: 36px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); color: white; cursor: pointer; transition: all 0.2s ease; border: none;" onmouseover="this.style.background='rgba(255,255,255,0.1)';" onmouseout="this.style.background='rgba(255,255,255,0.05)';">
                            <i class="fas fa-pen" style="font-size: 0.8rem;"></i>
                        </button>
                    </div>
                    <div>
                        <span style="font-size: 0.85rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Objectif Mensuel</span>
                        <div style="font-size: 2.2rem; font-weight: 900; margin-top: 8px; color: white;">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(monthlyGoal) : monthlyGoal}</div>
                    </div>
                    <div style="margin-top: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px; font-weight: 600;">
                            <span style="color: var(--primary-light);">${progress}%</span>
                            <span style="color: var(--text-muted);">Reste: ${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(Math.max(0, monthlyGoal - stats.monthlyRevenue)) : (monthlyGoal - stats.monthlyRevenue)}</span>
                        </div>
                        <div style="height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;">
                            <div style="height: 100%; width: ${progress}%; background: var(--gradient-premium); border-radius: 4px; box-shadow: 0 0 10px var(--primary-glass);"></div>
                        </div>
                    </div>
                </div>

                <!-- BENTO: Quick Actions (Span 4) -->
                <div class="bento-item glass" style="grid-column: span 4; padding: 2rem; border-radius: 24px; background: var(--bg-glass-heavy); border: 1px solid var(--glass-border-light); display: flex; flex-direction: column;">
                    <span style="font-size: 0.85rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 1.5rem; display: block;">Actions Rapides</span>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; flex: 1;">
                        <button onclick="App.navigateTo('scoper');" style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border-light); border-radius: 16px; padding: 1rem; color: white; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;" onmouseover="this.style.background='rgba(16, 185, 129, 0.1)'; this.style.borderColor='var(--primary)';" onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='var(--glass-border-light)';">
                            <i class="fas fa-magic" style="font-size: 1.2rem; color: var(--primary-light);"></i> Scoper
                        </button>
                        <button onclick="App.navigateTo('quotes');" style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border-light); border-radius: 16px; padding: 1rem; color: white; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;" onmouseover="this.style.background='rgba(99, 102, 241, 0.1)'; this.style.borderColor='#6366f1';" onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='var(--glass-border-light)';">
                            <i class="fas fa-file-invoice" style="font-size: 1.2rem; color: #6366f1;"></i> Devis
                        </button>
                        <button onclick="App.navigateTo('network');" style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border-light); border-radius: 16px; padding: 1rem; color: white; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;" onmouseover="this.style.background='rgba(245, 158, 11, 0.1)'; this.style.borderColor='#f59e0b';" onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='var(--glass-border-light)';">
                            <i class="fas fa-users" style="font-size: 1.2rem; color: #f59e0b;"></i> Cercle
                        </button>
                        <button onclick="App.navigateTo('settings');" style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border-light); border-radius: 16px; padding: 1rem; color: white; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(255,255,255,0.2)';" onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='var(--glass-border-light)';">
                            <i class="fas fa-cog" style="font-size: 1.2rem; color: var(--text-muted);"></i> Réglages
                        </button>
                    </div>
                </div>

                <!-- BENTO: Recent Docs (Span 12 -> full width at bottom) -->
                <div class="bento-item glass" style="grid-column: span 12; padding: 2.5rem; border-radius: 24px; background: var(--bg-glass-heavy); border: 1px solid var(--glass-border-light);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h2 style="font-size: 1.1rem; font-weight: 800; color: white; margin: 0;">Flux de Documents Récents</h2>
                        <button class="button-ghost small" onclick="App.navigateTo('quotes')" style="color: var(--primary-light); background: transparent; border: none; font-weight: 600; cursor: pointer;">Tout voir →</button>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
                        ${[...recentQuotes, ...recentInvoices]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 4)
                    .map(doc => {
                        const client = (typeof Storage !== 'undefined' && Storage.getClient) ? Storage.getClient(doc.clientId) : null;
                        const isInvoice = doc.number.includes('FACT') || doc.type === 'invoice';
                        return `
                                <div class="doc-card" style="padding: 1.5rem; border-radius: 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border-light); transition: all 0.2s ease; cursor: pointer;" onmouseover="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='rgba(255,255,255,0.02)'; this.style.transform='translateY(0)';">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                                        <div style="width: 40px; height: 40px; border-radius: 10px; background: ${isInvoice ? 'rgba(6, 95, 70, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; display: flex; align-items: center; justify-content: center; color: ${isInvoice ? 'var(--secondary)' : 'var(--primary)'}; font-size: 1.1rem;">
                                            <i class="fas ${isInvoice ? 'fa-file-invoice' : 'fa-file-signature'}"></i>
                                        </div>
                                        <span class="status-badge status-${doc.status}" style="padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;">${this.getStatusLabel(doc.status)}</span>
                                    </div>
                                    <div>
                                        <div style="font-weight: 800; font-size: 1.2rem; color: white; margin-bottom: 4px;">${(typeof App !== 'undefined' && App.formatCurrency) ? App.formatCurrency(doc.total) : doc.total}</div>
                                        <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-muted);">${doc.number}</div>
                                        <div style="font-size: 0.8rem; color: var(--text-muted); opacity: 0.7;">${client?.name || 'Client'}</div>
                                    </div>
                                </div>
                            `;
                    }).join('')}
                    </div>

                    ${(recentQuotes.length === 0 && recentInvoices.length === 0) ? `
                        <div class="empty-state" style="text-align: center; padding: 3rem;">
                            <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">📄</div>
                            <p style="color: var(--text-muted); font-size: 1rem; margin-bottom: 1.5rem;">Aucun document émis ce mois-ci.</p>
                            <button class="cta-button" onclick="App.navigateTo('quotes')" style="padding: 0.8rem 2rem; font-size: 0.95rem; border-radius: 12px; border: none; cursor: pointer; background: var(--gradient-premium); color: white; font-weight: 600;">Créer mon premier devis</button>
                        </div>
                    ` : ''}
                </div>
            </div>

            <style>
                @media (max-width: 1024px) {
                    .bento-grid { display: flex !important; flex-direction: column !important; }
                    .bento-item { width: 100% !important; }
                }
            </style>
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
