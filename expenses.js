// SoloPrice Pro - Expenses Module
// Handles real expense tracking for net profit calculation (Qonto-style v2.0)

const Expenses = {
    getCategoryConfig(category) {
        const configs = {
            'Logiciels': { icon: '💻', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
            'Materiel': { icon: '🏢', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
            'Marketing': { icon: '📣', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
            'Formation': { icon: '🎓', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
            'Frais de Projet': { icon: '🛠️', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
            'Autre': { icon: '📦', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)' }
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
                    <h1 class="page-title" style="font-size: 2.2rem; font-weight: 900;">Gestion du Cash-flow</h1>
                    <p class="page-subtitle" style="color: var(--text-muted);">Suivez vos dépenses et votre profit net en temps réel.</p>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button class="button-outline" onclick="App.exportPurchasesLedger()" style="border-radius: 12px; font-weight: 600;">
                        <i class="fas fa-file-pdf" style="margin-right: 8px;"></i> Exporter
                    </button>
                    <button class="button-primary" onclick="Expenses.showAddForm()" style="border-radius: 12px; font-weight: 700; background: var(--primary); border: none; box-shadow: 0 4px 12px var(--primary-glass);">
                        <i class="fas fa-plus" style="margin-right: 8px;"></i> Nouvelle dépense
                    </button>
                </div>
            </div>

            <!-- TREASURY SUMMARY (QONTO STYLE) -->
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
                <div class="stat-card glass" style="border-left: 4px solid #10b981; padding: 1.5rem;">
                    <span class="stat-label" style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px;">Encaissé Brut</span>
                    <div class="stat-value" style="font-size: 1.8rem; font-weight: 900; color: #10b981; margin-top: 8px;">+ ${App.formatCurrency(totalCollected)}</div>
                </div>
                <div class="stat-card glass" style="border-left: 4px solid #f59e0b; padding: 1.5rem;">
                    <span class="stat-label" style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px;">Provisions Sociales</span>
                    <div class="stat-value" style="font-size: 1.8rem; font-weight: 900; color: #f59e0b; margin-top: 8px;">- ${App.formatCurrency(provisionCharges)}</div>
                </div>
                <div class="stat-card glass" style="border-left: 4px solid #ef4444; padding: 1.5rem;">
                    <span class="stat-label" style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px;">Total Dépenses</span>
                    <div class="stat-value" style="font-size: 1.8rem; font-weight: 900; color: #ef4444; margin-top: 8px;">- ${App.formatCurrency(totalExpenses)}</div>
                </div>
                <div class="stat-card glass" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 95, 70, 0.1)); border: 1px solid var(--primary-glass); padding: 1.5rem;">
                    <span class="stat-label" style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--primary-light); letter-spacing: 1px;">Profit Net Réel</span>
                    <div class="stat-value" style="font-size: 1.8rem; font-weight: 900; color: white; margin-top: 8px;">${App.formatCurrency(trueNet)}</div>
                </div>
            </div>



            <div id="expense-form-container" style="margin-bottom: 2rem;"></div>

            <div class="glass-card transaction-journal" style="padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-light); animation: fadeInUp 0.6s ease-out;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="font-weight: 800; font-size: 1.1rem;">Journal des Transactions</h3>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">${expenses.length} opération(s)</div>
                </div>

                <table class="data-table" style="width: 100%; border-collapse: separate; border-spacing: 0 8px;">
                    <thead style="background: transparent;">
                        <tr>
                            <th style="padding: 1rem; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 800;">Opération</th>
                            <th style="padding: 1rem; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 800;">Catégorie</th>
                            <th style="padding: 1rem; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 800;">Projet</th>
                            <th style="padding: 1rem; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 800; text-align: right;">Montant</th>
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
                                        ${e.category}
                                    </span>
                                </td>
                                <td style="padding: 1.25rem;">
                                    ${e.projectId ? `
                                        <div style="display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 0.8rem;">
                                            <i class="fas fa-link" style="font-size: 0.7rem;"></i> ${Storage.getQuote(e.projectId)?.number || 'Projet'}
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
                                    <div style="font-weight: 600;">Aucune dépense détectée</div>
                                    <div style="font-size: 0.85rem;">Utilisez le bouton "Nouvelle dépense" pour commencer.</div>
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
                    <h3 style="font-weight: 800; font-size: 1.2rem; color: white;">Saisir une Transaction</h3>
                    <button class="btn-icon" onclick="document.getElementById('expense-form-container').innerHTML=''" style="color: var(--text-muted);">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <form onsubmit="Expenses.save(event)">
                    <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                        <div class="form-group">
                            <label class="form-label">Titre de l'opération</label>
                            <input type="text" name="description" class="form-input" placeholder="ex: LinkedIn Ads, WeWork..." required style="background: rgba(255,255,255,0.05);">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Montant (Brut)</label>
                            <div style="position: relative;">
                                <input type="number" name="amount" class="form-input" step="0.01" required style="padding-right: 3rem; background: rgba(255,255,255,0.05);">
                                <span style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-weight: 700;">€</span>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Catégorie</label>
                            <select name="category" class="form-input" style="background: rgba(255,255,255,0.05);">
                                <option value="Logiciels">💻 Logiciels / SaaS</option>
                                <option value="Materiel">🏢 Matériel / Bureau</option>
                                <option value="Marketing">📣 Marketing / Pub</option>
                                <option value="Formation">🎓 Formation</option>
                                <option value="Frais de Projet">🛠️ Frais de Projet</option>
                                <option value="Autre">📦 Autre</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Affectation (Projet)</label>
                            <select name="projectId" class="form-input" style="background: rgba(255,255,255,0.05);">
                                <option value="">Dépense de structure</option>
                                ${quotes.map(q => {
            const client = Storage.getClient(q.clientId);
            return `<option value="${q.id}">${q.number} - ${client?.name || 'Client'}</option>`;
        }).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date</label>
                            <input type="date" name="date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required style="background: rgba(255,255,255,0.05);">
                        </div>
                    </div>
                    <div class="form-actions" style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" class="button-secondary" onclick="document.getElementById('expense-form-container').innerHTML=''" style="border-radius: 10px;">Annuler</button>
                        <button type="submit" class="button-primary" style="padding: 0.75rem 2rem; border-radius: 10px; font-weight: 800;">Enregistrer</button>
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
            projectId: formData.get('projectId'),
            date: formData.get('date')
        };

        try {
            await Storage.addExpense(expense);
            App.showNotification('Opération enregistrée avec succès', 'success');
            document.getElementById('expense-form-container').innerHTML = '';
            this.render();
        } catch (err) {
            App.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    },

    async delete(id) {
        if (confirm('Supprimer définitivement cette transaction ?')) {
            try {
                await Storage.deleteExpense(id);
                this.render();
                App.showNotification('Transaction supprimée');
            } catch (err) {
                App.showNotification('Erreur lors de la suppression', 'error');
            }
        }
    }
};

window.Expenses = Expenses;
