// SoloPrice Pro - Expenses Module
// Handles real expense tracking for net profit calculation (Qonto-style v2.0)

const Expenses = {
    getCategoryConfig(category) {
        const configs = {
            'Logiciels': { icon: '✨', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', label: i18n.t('expenses.cat.software') || 'Logiciels' },
            'Materiel': { icon: '💻', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: i18n.t('expenses.cat.hardware') || 'Materiel' },
            'Marketing': { icon: '🎯', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)', label: i18n.t('expenses.cat.marketing') || 'Marketing' },
            'Formation': { icon: '🧠', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: i18n.t('expenses.cat.training') || 'Formation' },
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
        const invoices = Storage.getInvoices() || [];

        // Collected (Paid)
        const totalCollected = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0);

        // Pending (Sent or Overdue)
        const totalPending = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + (i.total || 0), 0);

        const socialRate = (typeof TaxEngine !== 'undefined' && TaxEngine.getSocialRate) ? TaxEngine.getSocialRate() : 21.1;
        const provisionCharges = totalCollected * (socialRate / 100);
        const trueNet = totalCollected - provisionCharges - totalExpenses;

        container.innerHTML = `
            <div class="page-header" style="margin-bottom: 3rem; animation: fadeIn 0.8s ease-out;">
                <div>
                    <h1 class="page-title" style="font-size: 2.5rem; letter-spacing: -1px; font-weight: 900; background: linear-gradient(135deg, #fff 0%, #a5a5a5 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                        ${i18n.t('expenses.title') || 'Gestion du Cash-flow'}
                    </h1>
                    <p class="page-subtitle" style="color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem;">
                        ${i18n.t('expenses.subtitle') || 'Analysez votre rentabilité réelle et vos prévisions d\'encaissement.'}
                    </p>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button class="button-outline" onclick="App.exportPurchasesLedger()" style="border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03);">
                        <i class="fas fa-file-pdf" style="margin-right: 8px; opacity: 0.7;"></i> ${i18n.t('expenses.export') || 'Exporter'}
                    </button>
                    <button class="button-primary" onclick="Expenses.showAddForm()" style="border-radius: 10px; padding: 0.8rem 1.5rem; font-weight: 700; background: #fff; color: #000; border: none; box-shadow: 0 10px 20px rgba(255,255,255,0.1);">
                        <i class="fas fa-plus" style="margin-right: 8px;"></i> ${i18n.t('expenses.new') || 'Nouvelle dépense'}
                    </button>
                </div>
            </div>

            <!-- TREASURY SUMMARY (LINEAR/ATTIO STYLE) -->
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 3rem;">
                <div class="stat-card glass" style="border: 1px solid rgba(16, 185, 129, 0.2); padding: 1.8rem; background: linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%);">
                    <span class="stat-label" style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #10b981; letter-spacing: 1.5px; margin-bottom: 12px; display: block;">${i18n.t('expenses.gross_collected') || 'Encaissé Brut'}</span>
                    <div class="stat-value" style="font-size: 2.2rem; font-weight: 900; color: #fff;">${App.formatCurrency(totalCollected)}</div>
                    <div style="font-size: 0.8rem; color: #10b981; margin-top: 5px; font-weight: 600;">Factures payées</div>
                </div>

                <div class="stat-card glass" style="border: 1px solid rgba(59, 130, 246, 0.2); padding: 1.8rem; background: linear-gradient(180deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%);">
                    <span class="stat-label" style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #3b82f6; letter-spacing: 1.5px; margin-bottom: 12px; display: block;">CA en attente</span>
                    <div class="stat-value" style="font-size: 2.2rem; font-weight: 900; color: #fff;">${App.formatCurrency(totalPending)}</div>
                    <div style="font-size: 0.8rem; color: #3b82f6; margin-top: 5px; font-weight: 600;">Envoyé / En retard</div>
                </div>

                <div class="stat-card glass" style="border: 1px solid rgba(239, 68, 68, 0.2); padding: 1.8rem; background: linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%);">
                    <span class="stat-label" style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #ef4444; letter-spacing: 1.5px; margin-bottom: 12px; display: block;">${i18n.t('expenses.total_expenses') || 'Total Dépenses'}</span>
                    <div class="stat-value" style="font-size: 2.2rem; font-weight: 900; color: #fff;">- ${App.formatCurrency(totalExpenses)}</div>
                    <div style="font-size: 0.8rem; color: #ef4444; margin-top: 5px; font-weight: 600;">Dépenses réelles</div>
                </div>

                <div class="stat-card glass" style="border: 1px solid rgba(255, 255, 255, 0.1); padding: 1.8rem; background: radial-gradient(circle at top right, rgba(255,255,255,0.05), transparent);">
                    <span class="stat-label" style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #fff; letter-spacing: 1.5px; margin-bottom: 12px; display: block;">${i18n.t('expenses.real_net_profit') || 'Profit Net Réel'}</span>
                    <div class="stat-value" style="font-size: 2.2rem; font-weight: 900; color: #fff; text-shadow: 0 0 20px rgba(255,255,255,0.2);">${App.formatCurrency(trueNet)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">Après provisions (${socialRate}%)</div>
                </div>
            </div>

            <div id="expense-form-container" style="margin-bottom: 2rem;"></div>

            <div class="transaction-journal" style="animation: fadeInUp 1s ease-out;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; padding: 0 0.5rem;">
                    <div>
                        <h3 style="font-weight: 900; font-size: 1.4rem; letter-spacing: -0.5px;">${i18n.t('expenses.journal_title') || 'Journal des Flux'}</h3>
                        <p style="color: var(--text-muted); font-size: 0.85rem;">Historique détaillé de vos transactions sortantes</p>
                    </div>
                    <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; background: rgba(255,255,255,0.03); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
                        ${i18n.t('expenses.operations_count', { count: expenses.length }) || `${expenses.length} OPÉRATION(S)`}
                    </div>
                </div>

                <div class="glass-card" style="padding: 0; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.01);">
                    <table class="data-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <th style="padding: 1.2rem; color: var(--text-muted); font-size: 0.65rem; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Flux / Date</th>
                                <th style="padding: 1.2rem; color: var(--text-muted); font-size: 0.65rem; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Catégorie</th>
                                <th style="padding: 1.2rem; color: var(--text-muted); font-size: 0.65rem; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Projet lié</th>
                                <th style="padding: 1.2rem; color: var(--text-muted); font-size: 0.65rem; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; text-align: right;">Montant</th>
                                <th style="padding: 1.2rem; width: 50px;"></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expenses.length > 0 ? expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => {
            const cat = this.getCategoryConfig(e.category);
            return `
                                <tr class="glass-row" style="border-bottom: 1px solid rgba(255,255,255,0.02);">
                                    <td style="padding: 1.2rem;">
                                        <div style="display: flex; align-items: center; gap: 1.2rem;">
                                            <div style="width: 42px; height: 42px; background: ${cat.bg}; color: ${cat.color}; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; border: 1px solid rgba(255,255,255,0.03);">
                                                ${cat.icon}
                                            </div>
                                            <div>
                                                <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">${e.description}</div>
                                                <div style="font-size: 0.75rem; color: var(--text-muted); weight: 500;">${App.formatDate(e.date)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding: 1.2rem;">
                                        <span style="font-size: 0.8rem; font-weight: 600; color: ${cat.color}; background: ${cat.bg}; padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.03);">
                                            ${cat.label || e.category}
                                        </span>
                                    </td>
                                    <td style="padding: 1.2rem;">
                                        ${e.project_id ? `
                                            <div style="display: flex; align-items: center; gap: 8px; color: #3b82f6; font-size: 0.8rem; font-weight: 600;">
                                                <i class="fas fa-link" style="font-size: 0.7rem; opacity: 0.7;"></i> ${Storage.getQuote(e.project_id)?.number || 'Projet'}
                                            </div>
                                        ` : '<span style="color: var(--text-muted); font-size: 0.8rem; opacity: 0.3;">—</span>'}
                                    </td>
                                    <td style="padding: 1.2rem; text-align: right;">
                                        <div style="font-weight: 800; color: #fff; font-size: 1.1rem;">- ${App.formatCurrency(e.amount)}</div>
                                    </td>
                                    <td style="padding: 1.2rem; text-align: center;">
                                        <button class="btn-icon" onclick="Expenses.delete('${e.id}')" style="background: transparent; border: none; color: rgba(239, 68, 68, 0.4); cursor: pointer; transition: all 0.2s;">
                                            <i class="far fa-trash-alt"></i>
                                        </button>
                                    </td>
                                </tr>
                            `}).join('') : `
                                <tr>
                                    <td colspan="5" align="center" style="padding: 6rem 2rem;">
                                        <div style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.2;">🌊</div>
                                        <div style="font-weight: 800; font-size: 1.2rem; color: #fff; margin-bottom: 0.5rem;">${i18n.t('expenses.empty') || 'Aucun mouvement de trésorerie'}</div>
                                        <div style="font-size: 0.9rem; color: var(--text-muted); max-width: 300px;">${i18n.t('expenses.empty_hint') || 'Enregistrez vos achats pour calculer votre profit net réel.'}</div>
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>
                .glass-row { transition: background 0.2s ease; cursor: default; }
                .glass-row:hover { background: rgba(255,255,255,0.03) !important; }
                .glass-row:hover .btn-icon { color: #ef4444 !important; transform: scale(1.1); }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
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
