// SoloPrice Pro - Settings Module
// Handles technical settings, taxes, and data management

const Settings = {
    render(activeTabId = 'tariffs') {
        const container = document.getElementById('settings-content');
        if (!container) return;

        const settings = Storage.get(Storage.KEYS.SETTINGS);

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Stratégie & Réglages</h1>
                <p class="page-subtitle">Définissez votre modèle économique global. Ces bases servent par défaut à l'Estimateur et vos Devis.</p>
            </div>
 
            <div class="settings-tabs" style="display: flex; gap: 0.5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                <button class="settings-tab ${activeTabId === 'tariffs' ? 'active' : ''}" onclick="Settings.switchTab('tariffs')">Stratégie de Revenus</button>
                <button class="settings-tab ${activeTabId === 'billing' ? 'active' : ''}" onclick="Settings.switchTab('billing')">Paramètres Devis</button>
                <button class="settings-tab ${activeTabId === 'data' ? 'active' : ''}" onclick="Settings.switchTab('data')">Données & Backup</button>
            </div>
 
            <div class="settings-content-wrapper">
                <!-- Tab: Tariffs (Combined TJM + Services) -->
                <div id="settings-tab-tariffs" class="settings-tab-content ${activeTabId === 'tariffs' ? 'active' : ''}">
                    <!-- Combined Section 1: TJM -->
                    <div class="settings-section glass-card" style="padding: 1.5rem; margin-bottom: 2rem;">
                        <h2 class="section-title-small">1. Stratégie de Taux (TJM)</h2>
                        <p class="section-subtitle">Définissez votre objectif de revenu pour calculer votre tarif de base.</p>
                        <div id="calculator-embed-container" style="margin-top: 1.5rem;">
                            <!-- Calculator UI will render here -->
                        </div>
                    </div>

                    <!-- Combined Section 2: Services -->
                    <div class="settings-section glass-card" style="padding: 1.5rem;">
                        <h2 class="section-title-small">2. Bibliothèque Métier (Catalogue)</h2>
                        <p class="section-subtitle">Gérez vos prestations récurrentes pour les importer en un clic dans vos estimations et devis.</p>
                        <div id="settings-services-container">
                            ${typeof Services !== 'undefined' && Storage.getServices().length > 0 ?
                `<div class="page-actions" style="margin: 1.5rem 0;">
                                    <button class="button-primary small" onclick="Services.showAddForm()">
                                        Ajouter une prestation
                                    </button>
                                </div>
                                <div id="service-form-container"></div>
                                <div class="services-settings-list">
                                    ${Services.renderGroupedServices(Storage.getServices())}
                                </div>` : `
                                <div class="empty-state" style="padding: 2rem; text-align: center;">
                                    <p class="text-sm text-muted">Votre catalogue est vide.</p>
                                    <button class="button-primary small" onclick="Services.showAddForm()" style="margin-top: 1rem;">Créer un service</button>
                                    <div id="service-form-container"></div>
                                </div>
                                `}
                        </div>
                    </div>
                </div>

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

                <!-- Tab: Data -->
                <div id="settings-tab-data" class="settings-tab-content ${activeTabId === 'data' ? 'active' : ''}">
                    <div class="settings-section">
                        <h2 class="section-title-small">Sauvegarde & Sécurité</h2>
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

        if (typeof TaxEngine !== 'undefined') {
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

        if (tabId === 'tariffs' && typeof renderCalculatorUI === 'function') {
            document.getElementById('calculator-embed-container').innerHTML = '';
            renderCalculatorUI('calculator-embed-container');
        }
    },

    saveBillingSettings(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const settingsData = {
            taxRate: parseFloat(formData.get('taxRate')),
            invoicePrefix: formData.get('invoicePrefix'),
            quotePrefix: formData.get('quotePrefix'),
            quoteValidityDays: parseInt(formData.get('quoteValidityDays')) || 30
        };
        Storage.set(Storage.KEYS.SETTINGS, {
            ...Storage.get(Storage.KEYS.SETTINGS),
            ...settingsData
        });
        App.showNotification('Paramètres enregistrés', 'success');
    },

    saveSocialStatus(value) {
        Storage.set(Storage.KEYS.SETTINGS, {
            ...Storage.get(Storage.KEYS.SETTINGS),
            socialStatus: value
        });
        App.showNotification('Statut professionnel mis à jour', 'info');
        // Rafraîchir le Dashboard si on y retourne
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
    }
};

window.Settings = Settings;
