// SoloPrice Pro - Expenses Module
// Handles real expense tracking for net profit calculation

const Expenses = {
    render() {
        const container = document.getElementById('expenses-page');
        if (!container) return;

        const expenses = Storage.getExpenses() || [];
        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Gestion des Dépenses</h1>
                    <p class="page-subtitle">Suivez vos coûts réels pour calculer votre bénéfice net.</p>
                </div>
                <button class="button-primary" onclick="Expenses.showAddForm()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Ajouter une dépense
                </button>
            </div>

            <div class="stats-grid" style="margin-bottom: 2rem;">
                <div class="stat-card">
                    <span class="stat-label">Total Dépenses (Mois)</span>
                    <div class="stat-value" style="color: #ef4444;">${App.formatCurrency(totalExpenses)}</div>
                </div>
            </div>

            <div id="expense-form-container"></div>

            <div class="glass-card" style="padding: 0;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Catégorie</th>
                            <th>Montant</th>
                            <th align="right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expenses.length > 0 ? expenses.map(e => `
                            <tr>
                                <td>${App.formatDate(e.date)}</td>
                                <td><strong>${e.description}</strong></td>
                                <td><span class="badge" style="background: rgba(99, 102, 241, 0.1); color: var(--primary-light);">${e.category}</span></td>
                                <td style="color: #ef4444;">-${App.formatCurrency(e.amount)}</td>
                                <td align="right">
                                    <button class="btn-icon btn-danger" onclick="Expenses.delete('${e.id}')">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="5" align="center" style="padding: 3rem; color: var(--text-muted);">
                                    Aucune dépense enregistrée.
                                </td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    },

    showAddForm() {
        const container = document.getElementById('expense-form-container');
        container.innerHTML = `
            <div class="glass-card mb-2" style="padding: 1.5rem; animation: slideDown 0.3s ease;">
                <form onsubmit="Expenses.save(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <input type="text" name="description" class="form-input" placeholder="ex: Abonnement Adobe, Loyer..." required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Montant (EUR)</label>
                            <input type="number" name="amount" class="form-input" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Catégorie</label>
                            <select name="category" class="form-input">
                                <option value="Logiciels">Logiciels / SaaS</option>
                                <option value="Materiel">Matériel / Bureau</option>
                                <option value="Marketing">Marketing / Pub</option>
                                <option value="Formation">Formation</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date</label>
                            <input type="date" name="date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                    </div>
                    <div class="form-actions" style="margin-top: 1rem;">
                        <button type="submit" class="button-primary">Enregistrer</button>
                        <button type="button" class="button-secondary" onclick="document.getElementById('expense-form-container').innerHTML=''">Annuler</button>
                    </div>
                </form>
            </div>
        `;
    },

    save(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const expense = {
            id: 'exp-' + Date.now(),
            description: formData.get('description'),
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            date: formData.get('date')
        };

        Storage.addExpense(expense);
        App.showNotification('Dépense enregistrée', 'success');
        this.render();
    },

    delete(id) {
        if (confirm('Supprimer cette dépense ?')) {
            Storage.deleteExpense(id);
            this.render();
        }
    }
};

window.Expenses = Expenses;
