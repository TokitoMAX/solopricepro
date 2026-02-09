// SoloPrice Pro - Settings Module
// Handles technical settings, taxes, and data management

const Settings = {
    render(activeTabId = 'billing') {
        const container = document.getElementById('settings-content');
        if (!container) return;

        const settings = Storage.get(Storage.KEYS.SETTINGS);

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Stratégie & Réglages</h1>
                <p class="page-subtitle">Définissez votre modèle économique global. Ces bases servent par défaut à l'Estimateur et vos Devis.</p>
            </div>
 
            <div class="settings-tabs" style="display: flex; gap: 0.5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                <button class="settings-tab ${activeTabId === 'billing' ? 'active' : ''}" onclick="Settings.switchTab('billing')">Paramètres Devis</button>
                <button class="settings-tab ${activeTabId === 'subscription' ? 'active' : ''}" onclick="Settings.switchTab('subscription')">Abonnement</button>
                <button class="settings-tab ${activeTabId === 'data' ? 'active' : ''}" onclick="Settings.switchTab('data')">Données & Backup</button>
            </div>
 
            <div class="settings-content-wrapper">

                <!-- Tab: Billing -->
                <div id="settings-tab-billing" class="settings-tab-content ${activeTabId === 'billing' ? 'active' : ''}">
                    <div class="settings-section">
                        <h2 class="section-title-small">Régime Fiscal & Localisation</h2>
                        <p class="section-subtitle">Configurez votre zone pour l'application automatique des taxes (DOM-TOM & France).</p>
                        <div id="settings-tax-selector-container" style="margin: 1.5rem 0;">
                            <!-- TaxEngine will render here -->
                        </div>

                        <h2 class="section-title-small" style="margin-top: 2rem;">Statut Professionnel (Auto-Entrepreneur)</h2>
                        <p class="section-subtitle">Utilisé pour calculer vos cotisations sociales réelles et votre bénéfice net.</p>
                        <div class="form-group" style="margin-top: 1rem;">
                            <select name="socialStatus" class="form-input" id="settings-social-status" onchange="Settings.saveSocialStatus(this.value)">
                                <option value="SERVICE" ${settings.socialStatus === 'SERVICE' ? 'selected' : ''}>Prestation de Services (AE : 21.1%)</option>
                                <option value="VENTE" ${settings.socialStatus === 'VENTE' ? 'selected' : ''}>Achat / Vente (AE : 12.3%)</option>
                                <option value="CIPAV" ${settings.socialStatus === 'CIPAV' ? 'selected' : ''}>Libéral réglementé (CIPAV : 23.2%)</option>
                                <option value="EXEMPT" ${settings.socialStatus === 'EXEMPT' ? 'selected' : ''}>Exonéré / Autre</option>
                            </select>
                        </div>
                        
                        <h2 class="section-title-small" style="margin-top: 2rem;">Préfixes de Documents</h2>
                        <form id="billing-settings-form" onsubmit="Settings.saveBillingSettings(event)">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">Taux TVA par défaut (%)</label>
                                    <input type="number" name="taxRate" class="form-input" value="${settings.taxRate}" step="0.1">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Validité Devis (Jours)</label>
                                    <input type="number" name="quoteValidityDays" class="form-input" value="${settings.quoteValidityDays || 30}" min="1">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Préfixe Devis</label>
                                    <input type="text" name="quotePrefix" class="form-input" value="${settings.quotePrefix}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Préfixe Factures</label>
                                    <input type="text" name="invoicePrefix" class="form-input" value="${settings.invoicePrefix}">
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="button-primary">Enregistrer les préférences</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Tab: Subscription -->
                <div id="settings-tab-subscription" class="settings-tab-content ${activeTabId === 'subscription' ? 'active' : ''}">
                    <div class="settings-section">
                        <h2 class="section-title-small">Votre Offre SoloPrice Pro</h2>
                        <div id="subscription-info-container" style="margin-top: 1.5rem;">
                            <!-- Dynamically filled -->
                        </div>
                    </div>
                </div>

                <!-- Data Tab -->
                <div id="settings-tab-data" class="settings-tab-content ${activeTabId === 'data' ? 'active' : ''}">
                    <div class="settings-section">
                        <h2 class="section-title-small">Export Comptable (Expert)</h2>
                        <p class="section-subtitle">Générez un fichier CSV compatible avec tous les logiciels comptables (Sage, Ciel, Excel).</p>
                        
                        <div class="glass" style="margin-top: 1rem; padding: 1.5rem; border: 1px solid var(--border); border-radius: 8px;">
                            <div style="display: flex; gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                                <div>
                                    <h3 style="font-size: 1rem; margin: 0 0 0.5rem 0; color: var(--white);">Journal des Ventes (CSV)</h3>
                                    <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">Toutes vos factures et avoirs de l'année en cours.</p>
                                </div>
                                <button class="button-primary" onclick="Settings.exportAccounting()" ${Storage.getTier() === 'expert' ? '' : 'disabled style="opacity:0.6; cursor:not-allowed;"'}>
                                    ${Storage.getTier() === 'expert' ? '📥 Télécharger l\'export' : '🔒 Réservé Expert'}
                                </button>
                            </div>
                        </div>

                        <h2 class="section-title-small" style="margin-top: 2.5rem;">Sauvegarde & Sécurité</h2>
                        <p class="section-subtitle">Vos données sont stockées localement. Exportez-les régulièrement pour ne pas les perdre.</p>
                        <div class="data-actions" style="display: flex; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap;">
                            <button class="button-secondary" onclick="Settings.exportData()">Exporter un Backup (.json)</button>
                            <button class="button-secondary" onclick="Settings.importData()">Importer un Backup</button>
                            <input type="file" id="import-file-input" style="display: none" onchange="Settings.handleImportFile(event)">
                            <button class="button-danger" onclick="Settings.resetData()">Réinitialiser tout</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.updateSubscriptionUI();
        if (typeof Legal !== 'undefined') Legal.render('legal-content');

        if (typeof TaxEngine !== 'undefined') {
            // Force re-init to sync with current Storage state
            TaxEngine.init();

            TaxEngine.renderSelector('settings-tax-selector-container', (ctxId) => {
                const ctx = TaxEngine.contexts[ctxId];
                if (!ctx) return;
                const vatInput = document.querySelector('input[name="taxRate"]');
                if (vatInput) vatInput.value = ctx.vat;
                const quoteInput = document.querySelector('input[name="quotePrefix"]');
                const invInput = document.querySelector('input[name="invoicePrefix"]');
                if (quoteInput && (quoteInput.value === 'DEV-' || /^[A-Z]{2,3}-DEV-$/.test(quoteInput.value))) {
                    quoteInput.value = ctx.code === 'FR' ? 'DEV-' : `${ctx.code}-DEV-`;
                }
                if (invInput && (invInput.value === 'FACT-' || /^[A-Z]{2,3}-FACT-$/.test(invInput.value))) {
                    invInput.value = ctx.code === 'FR' ? 'FACT-' : `${ctx.code}-FACT-`;
                }
                App.showNotification(`Zone ${ctx.name} appliquée.`, 'info');
            });
        }
    },

    switchTab(tabId) {
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));

        const activeTab = document.querySelector(`.settings-tab[onclick*="${tabId}"]`);
        if (activeTab) activeTab.classList.add('active');

        const activeContent = document.getElementById(`settings-tab-${tabId}`);
        if (activeContent) activeContent.classList.add('active');

        if (tabId === 'billing' && typeof TaxEngine !== 'undefined') {
            // Optionnel: rafraîchir le sélecteur de taxes si besoin
        }
    },

    async saveBillingSettings(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const settingsData = {
            taxRate: parseFloat(formData.get('taxRate')),
            invoicePrefix: formData.get('invoicePrefix'),
            quotePrefix: formData.get('quotePrefix'),
            quoteValidityDays: parseInt(formData.get('quoteValidityDays')) || 30
        };
        try {
            await Storage.updateSettings(settingsData);
            App.showNotification('Paramètres enregistrés', 'success');
        } catch (err) {
            App.showNotification('Erreur de synchronisation', 'error');
        }
    },

    async saveSocialStatus(value) {
        try {
            await Storage.updateSettings({ socialStatus: value });
            App.showNotification('Statut professionnel mis à jour', 'info');
        } catch (err) {
            App.showNotification('Erreur de sauvegarde', 'error');
        }
    },

    exportData() {
        const data = Storage.exportAll();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `soloprice-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        App.showNotification('Données exportées', 'success');
    },

    importData() {
        document.getElementById('import-file-input').click();
    },

    handleImportFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const success = Storage.importAll(event.target.result);
                if (success) {
                    App.showNotification('Données importées', 'success');
                    window.location.reload();
                } else {
                    App.showNotification('Erreur lors de l\'import', 'error');
                }
            } catch (e) {
                App.showNotification('Fichier invalide', 'error');
            }
        };
        reader.readAsText(file);
    },

    resetData() {
        if (confirm('Attention : réinitialisation totale. Continuer ?')) {
            Storage.clearAll();
            window.location.reload();
        }
    },

    updateSubscriptionUI() {
        const container = document.getElementById('subscription-info-container');
        if (!container) return;

        const tier = Storage.getTier();
        const user = Storage.getUser();
        const status = Storage.getSubscriptionStatus();

        if (tier === 'standard') {
            container.innerHTML = `
                <div class="glass" style="padding: 2rem; border-radius: 16px; border: 1px dashed var(--border); text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">🌱</div>
                    <h3 style="margin-bottom: 0.5rem;">Vous utilisez la version Standard (Gratuite)</h3>
                    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Passez à PRO ou EXPERT pour débloquer l'illimité et le coaching IA.</p>
                    <button class="button-primary" onclick="App.showUpgradeModal()">Voir les offres</button>
                </div>
            `;
        } else {
            const isCanceled = user.subscriptionCanceled;
            container.innerHTML = `
                <div class="glass active-subscription" style="padding: 2rem; border-radius: 16px; border: 1px solid var(--primary-glass); background: var(--primary-glass);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <div>
                            <span class="badge" style="background: var(--primary); color: white; margin-bottom: 0.5rem; display: inline-block;">PACK ${tier.toUpperCase()}</span>
                            <h3 style="margin: 0;">Abonnement Actif</h3>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.2rem; font-weight: 800;">${status.daysLeft} jours</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">restants</div>
                        </div>
                    </div>

                    <div style="margin-bottom: 2rem; font-size: 0.9rem;">
                        <p style="margin: 0.25rem 0;"><i class="fas fa-calendar-check" style="margin-right: 8px;"></i> Prochain renouvellement : <strong>${new Date(status.expiryDate).toLocaleDateString()}</strong></p>
                        ${isCanceled ?
                    '<p style="color: #ef4444; margin-top: 1rem; font-weight: 600;"><i class="fas fa-exclamation-triangle"></i> Votre abonnement est résilié et prendra fin à la date indiquée.</p>' :
                    '<p style="color: var(--text-muted); font-size: 0.8rem;">Votre abonnement sera automatiquement renouvelé mensuellement.</p>'
                }
                    </div>

                    <div style="display: flex; gap: 1rem;">
                        ${!isCanceled ?
                    '<button class="button-outline small" onclick="Settings.confirmCancelSubscription()" style="border-color: #ef4444; color: #ef4444;">Résilier l\'abonnement</button>' :
                    '<button class="button-primary small" onclick="App.showUpgradeModal()">Réactiver / Changer d\'offre</button>'
                }
                    </div>
                </div>
            `;
        }
    },

    confirmCancelSubscription() {
        if (confirm("Êtes-vous sûr de vouloir résilier votre abonnement ? Vous conserverez vos accès PRO jusqu'à la fin de la période en cours.")) {
            if (Storage.cancelSubscription()) {
                App.showNotification('Abonnement résilié avec succès.', 'success');
                this.updateSubscriptionUI();
            }
        }
    },

    exportAccounting() {
        if (Storage.getTier() !== 'expert') {
            App.showUpgradeModal('feature');
            return;
        }

        const invoices = Storage.getInvoices().filter(i => i.status !== 'draft');
        if (invoices.length === 0) {
            App.showNotification('Aucune facture validée à exporter.', 'info');
            return;
        }

        let csvContent = "Date Facture;Numéro;Client;Montant HT;TVA;Montant TTC;Statut\n";

        invoices.forEach(inv => {
            const date = new Date(inv.date).toLocaleDateString('fr-FR');
            const clientName = inv.clientName || 'Client Inconnu';
            const ht = inv.totalHT.toFixed(2).replace('.', ',');
            const tva = (inv.totalTTC - inv.totalHT).toFixed(2).replace('.', ',');
            const ttc = inv.totalTTC.toFixed(2).replace('.', ',');
            const status = inv.status.toUpperCase();
            const cleanClient = clientName.replace(/;/g, ',');

            csvContent += `${date};${inv.number};${cleanClient};${ht};${tva};${ttc};${status}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `SoloPrice_Export_Comptable_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        App.showNotification('Export comptable (CSV) téléchargé !', 'success');
    }
};

window.Settings = Settings;
