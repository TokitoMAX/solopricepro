// SoloPrice Pro - Expenses Module
// Handles real expense tracking for net profit calculation (Qonto-style v2.0)

const Expenses = {
    getCategoryConfig(category) {
        const configs = {
            'Logiciels': { icon: '💻', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', label: i18n.t('expenses.cat.software') || 'Logiciels' },
            'Materiel': { icon: '🏢', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: i18n.t('expenses.cat.hardware') || 'Materiel' },
            'Marketing': { icon: '📣', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)', label: i18n.t('expenses.cat.marketing') || 'Marketing' },
            'Formation': { icon: '🎓', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: i18n.t('expenses.cat.training') || 'Formation' },
            'Frais de Projet': { icon: '🛠️', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', label: i18n.t('expenses.cat.project') || 'Frais de Projet' },
            'Autre': { icon: '📦', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)', label: i18n.t('expenses.cat.other') || 'Autre' }
        };
        return configs[category] || configs['Autre'];
    },

    render() {
        const container = document.getElementById('expenses-content');
        if (!container) return;

        const expenses = Storage.getExpenses() || [];
        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

        // Treasury Context
        const leads = (typeof Storage !== 'undefined' && typeof Storage.getLeads === 'function') ? Storage.getLeads() : [];
        const quotes = (typeof Storage !== 'undefined' && typeof Storage.getQuotes === 'function') ? Storage.getQuotes() : [];
        const invoices = Storage.getInvoices() || [];
        const totalCollected = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0);
        const socialRate = (typeof TaxEngine !== 'undefined' && TaxEngine.getSocialRate) ? TaxEngine.getSocialRate() : 21.1;
        const provisionCharges = totalCollected * (socialRate / 100);
        const trueNet = totalCollected - provisionCharges - totalExpenses;

        container.innerHTML = `
            <div class="page-header" style="margin-bottom: 2.5rem; animation: slideInTop 0.5s ease-out;">
                <div>
                    <h1 class="page-title" style="font-size: 2.2rem; font-weight: 900;">${i18n.t('expenses.title') || 'Gestion du Cash-flow'}</h1>
                    <p class="page-subtitle" style="color: var(--text-muted);">${i18n.t('expenses.subtitle') || 'Suivez vos dépenses et votre profit net en temps réel.'}</p>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button class="button-outline" onclick="App.exportPurchasesLedger()" style="border-radius: 12px; font-weight: 600;">
                        <i class="fas fa-file-pdf" style="margin-right: 8px;"></i> ${i18n.t('expenses.export') || 'Exporter'}
                    </button>
                    <button class="button-primary" onclick="Expenses.showAddForm()" style="border-radius: 12px; font-weight: 700; background: var(--primary); border: none; box-shadow: 0 4px 12px var(--primary-glass);">
                        <i class="fas fa-plus" style="margin-right: 8px;"></i> ${i18n.t('expenses.new') || 'Nouvelle dépense'}
                    </button>
                </div>
            </div>

            <!-- TREASURY SUMMARY (QONTO STYLE) -->
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
                <div class="stat-card glass" style="border-left: 4px solid #10b981; padding: 1.5rem;">
                    <span class="stat-label" style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px;">${i18n.t('expenses.gross_collected') || 'Encaissé Brut'}</span>
                    <div class="stat-value" style="font-size: 1.8rem; font-weight: 900; color: #10b981; margin-top: 8px;">+ ${App.formatCurrency(totalCollected)}</div>
                </div>
                <div class="stat-card glass" style="border-left: 4px solid #f59e0b; padding: 1.5rem;">
                    <span class="stat-label" style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px;">${i18n.t('expenses.social_provisions') || 'Provisions Sociales'}</span>
                    <div class="stat-value" style="font-size: 1.8rem; font-weight: 900; color: #f59e0b; margin-top: 8px;">- ${App.formatCurrency(provisionCharges)}</div>
                </div>
                <div class="stat-card glass" style="border-left: 4px solid #ef4444; padding: 1.5rem;">
                    <span class="stat-label" style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px;">${i18n.t('expenses.total_expenses') || 'Total Dépenses'}</span>
                    <div class="stat-value" style="font-size: 1.8rem; font-weight: 900; color: #ef4444; margin-top: 8px;">- ${App.formatCurrency(totalExpenses)}</div>
                </div>
                <div class="stat-card glass" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 95, 70, 0.1)); border: 1px solid var(--primary-glass); padding: 1.5rem;">
                    <span class="stat-label" style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--primary-light); letter-spacing: 1px;">${i18n.t('expenses.real_net_profit') || 'Profit Net Réel'}</span>
                    <div class="stat-value" style="font-size: 1.8rem; font-weight: 900; color: white; margin-top: 8px;">${App.formatCurrency(trueNet)}</div>
                </div>
            </div>



            <div id="expense-form-container" style="margin-bottom: 2rem;"></div>

            <div class="glass-card transaction-journal" style="padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-light); animation: fadeInUp 0.6s ease-out;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="font-weight: 800; font-size: 1.1rem;">${i18n.t('expenses.journal_title') || 'Journal des Transactions'}</h3>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">${i18n.t('expenses.operations_count', { count: expenses.length }) || `${expenses.length} opération(s)`}</div>
                </div>

                <table class="data-table" style="width: 100%; border-collapse: separate; border-spacing: 0 8px;">
                    <thead style="background: transparent;">
                        <tr>
                            <th style="padding: 1rem; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 800;">${i18n.t('expenses.header.operation') || 'Opération'}</th>
                            <th style="padding: 1rem; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 800;">${i18n.t('expenses.header.category') || 'Catégorie'}</th>
                            <th style="padding: 1rem; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 800;">${i18n.t('expenses.header.project') || 'Projet'}</th>
                            <th style="padding: 1rem; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 800; text-align: right;">${i18n.t('expenses.header.amount') || 'Montant'}</th>
                            <th style="padding: 1rem; text-align: right;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expenses.length > 0 ? expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => {
            const cat = this.getCategoryConfig(e.category);
            return `
                            <tr class="glass-row" style="transition: all 0.2s ease;">
                                <td style="padding: 1.25rem; border-radius: 12px 0 0 12px;">
                                    <div style="display: flex; align-items: center; gap: 1rem;">
                                        <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                            ${cat.icon}
                                        </div>
                                        <div>
                                            <div style="font-weight: 700; color: white;">${e.description}</div>
                                            <div style="font-size: 0.75rem; color: var(--text-muted);">${App.formatDate(e.date)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style="padding: 1.25rem;">
                                    <span class="badge" style="background: ${cat.bg}; color: ${cat.color}; border: 1px solid rgba(255,255,255,0.05); font-weight: 700; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem;">
                                        ${cat.label || e.category}
                                    </span>
                                </td>
                                <td style="padding: 1.25rem;">
                                    ${e.projectId ? `
                                        <div style="display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 0.8rem;">
                                            <i class="fas fa-link" style="font-size: 0.7rem;"></i> ${Storage.getQuote(e.projectId)?.number || i18n.t('expenses.header.project') || 'Projet'}
                                        </div>
                                    ` : '<span style="color: var(--text-muted); font-size: 0.8rem; opacity: 0.5;">—</span>'}
                                </td>
                                <td style="padding: 1.25rem; text-align: right;">
                                    <div style="font-weight: 800; color: #ef4444; font-size: 1.05rem;">-${App.formatCurrency(e.amount)}</div>
                                </td>
                                <td style="padding: 1.25rem; text-align: right; border-radius: 0 12px 12px 0;">
                                    <button class="btn-icon" onclick="Expenses.delete('${e.id}')" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; transition: color 0.2s;">
                                        <i class="far fa-trash-alt"></i>
                                    </button>
                                </td>
                            </tr>
                        `}).join('') : `
                            <tr>
                                <td colspan="5" align="center" style="padding: 4rem; color: var(--text-muted); background: rgba(0,0,0,0.1); border-radius: 16px;">
                                    <div style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;">🧘</div>
                                    <div style="font-weight: 600;">${i18n.t('expenses.empty') || 'Aucune dépense détectée'}</div>
                                    <div style="font-size: 0.85rem;">${i18n.t('expenses.empty_hint') || 'Utilisez le bouton "Nouvelle dépense" pour commencer.'}</div>
                                </td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>

            <style>
                .glass-row:hover {
                    background: rgba(255,255,255,0.03) !important;
                    transform: translateX(4px);
                }
                .data-table th { border: none !important; }
                .data-table td { border: none !important; }
                .glass-row { background: rgba(255,255,255,0.01); }

                /* Styles pour le Pipeline Kanban intégré */
                .kanban-board {
            <style>
                .glass-row:hover {
                    background: rgba(255,255,255,0.03) !important;
                    transform: translateX(4px);
                }
                .data-table th { border: none !important; }
                .data-table td { border: none !important; }
                .glass-row { background: rgba(255,255,255,0.01); }
            </style>
        `;
    },

    showAddForm() {
        const container = document.getElementById('expense-form-container');
        const quotes = Storage.getQuotes() || [];

        container.innerHTML = `
            <div class="glass-card" style="padding: 2rem; border: 1px solid var(--primary-glass); margin-bottom: 2rem; animation: slideDown 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3 style="font-weight: 800; font-size: 1.2rem; color: white;">${i18n.t('expenses.add_title') || 'Saisir une Transaction'}</h3>
                    <button class="btn-icon" onclick="document.getElementById('expense-form-container').innerHTML=''" style="color: var(--text-muted);">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <form onsubmit="Expenses.save(event)">
                    <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                        <div class="form-group">
                            <label class="form-label">${i18n.t('expenses.label.description') || 'Titre de l\'opération'}</label>
                            <input type="text" name="description" class="form-input" placeholder="${i18n.t('expenses.placeholder.description') || 'ex: LinkedIn Ads, WeWork...'}" required style="background: rgba(255,255,255,0.05);">
                        </div>
                        <div class="form-group">
                            <label class="form-label">${i18n.t('expenses.label.amount') || 'Montant (Brut)'}</label>
                            <div style="position: relative;">
                                <input type="number" name="amount" class="form-input" step="0.01" required style="padding-right: 3rem; background: rgba(255,255,255,0.05);">
                                <span style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-weight: 700;">${typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€'}</span>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">${i18n.t('expenses.label.category') || 'Catégorie'}</label>
                            <select name="category" class="form-input" style="background: rgba(255,255,255,0.05);">
                                <option value="Logiciels">💻 ${i18n.t('expenses.cat.software') || 'Logiciels / SaaS'}</option>
                                <option value="Materiel">🏢 ${i18n.t('expenses.cat.hardware') || 'Matériel / Bureau'}</option>
                                <option value="Marketing">📣 ${i18n.t('expenses.cat.marketing') || 'Marketing / Pub'}</option>
                                <option value="Formation">🎓 ${i18n.t('expenses.cat.training') || 'Formation'}</option>
                                <option value="Frais de Projet">🛠️ ${i18n.t('expenses.cat.project') || 'Frais de Projet'}</option>
                                <option value="Autre">📦 ${i18n.t('expenses.cat.other') || 'Autre'}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">${i18n.t('expenses.label.project') || 'Affectation (Projet)'}</label>
                            <select name="project_id" class="form-input" style="background: rgba(255,255,255,0.05);">
                                <option value="">${i18n.t('expenses.project.structure') || 'Dépense de structure'}</option>
                                ${quotes.map(q => {
            const client = Storage.getClient(q.clientId);
            return `<option value="${q.id}">${q.number} - ${client?.name || 'Client'}</option>`;
        }).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">${i18n.t('expenses.label.date') || 'Date'}</label>
                            <input type="date" name="date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required style="background: rgba(255,255,255,0.05);">
                        </div>
                    </div>
                    <div class="form-actions" style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" class="button-secondary" onclick="document.getElementById('expense-form-container').innerHTML=''" style="border-radius: 10px;">${i18n.t('btn.cancel') || 'Annuler'}</button>
                        <button type="submit" class="button-primary" style="padding: 0.75rem 2rem; border-radius: 10px; font-weight: 800;">${i18n.t('btn.save') || 'Enregistrer'}</button>
                    </div>
                </form>
            </div>
        `;
    },

    async save(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const expense = {
            id: 'exp-' + Date.now(),
            description: formData.get('description'),
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            project_id: formData.get('project_id') || null,
            date: formData.get('date')
        };

        try {
            await Storage.addExpense(expense);
            App.showNotification(i18n.t('expenses.notify.saved') || 'Opération enregistrée avec succès', 'success');
            document.getElementById('expense-form-container').innerHTML = '';
            this.render();
        } catch (err) {
            App.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    },

    async delete(id) {
        if (confirm(i18n.t('expenses.confirm.delete') || 'Supprimer définitivement cette transaction ?')) {
            try {
                await Storage.deleteExpense(id);
                this.render();
                App.showNotification(i18n.t('expenses.notify.deleted') || 'Transaction supprimée');
            } catch (err) {
                App.showNotification(i18n.t('error.delete_failed') || 'Erreur lors de la suppression', 'error');
            }
        }
    }
};

window.Expenses = Expenses;
