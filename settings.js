// SoloPrice Pro - Settings Module
// Handles technical settings, taxes, and data management

const Settings = {
    render(activeTabId = 'billing') {
        const container = document.getElementById('settings-content');
        if (!container) return;

        const settings = Storage.get(Storage.KEYS.SETTINGS);

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">${i18n.t('settings.title') || 'Stratégie & Réglages'}</h1>
                <p class="page-subtitle">${i18n.t('settings.subtitle') || 'Définissez votre modèle économique global. Ces bases servent par défaut à l\'Estimateur et vos Devis.'}</p>
            </div>
 
            <div class="settings-tabs" style="display: flex; gap: 0.5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                <button class="settings-tab ${activeTabId === 'billing' ? 'active' : ''}" onclick="Settings.switchTab('billing')">${i18n.t('settings.tab.billing') || 'Paramètres Devis'}</button>
                <button class="settings-tab ${activeTabId === 'subscription' ? 'active' : ''}" onclick="Settings.switchTab('subscription')">${i18n.t('settings.tab.subscription') || 'Abonnement'}</button>
                <button class="settings-tab ${activeTabId === 'data' ? 'active' : ''}" onclick="Settings.switchTab('data')">${i18n.t('settings.tab.data') || 'Données & Backup'}</button>
            </div>
 
            <div class="settings-content-wrapper">

                <!-- Tab: Billing -->
                <div id="settings-tab-billing" class="settings-tab-content ${activeTabId === 'billing' ? 'active' : ''}">
                    <div class="settings-section">
                        <h2 class="section-title-small">${i18n.t('settings.section.tax') || 'Régime Fiscal & Localisation'}</h2>
                        <p class="section-subtitle">${i18n.t('settings.tax_hint') || 'Configurez votre zone pour l\'application automatique des taxes (DOM-TOM & France).'}</p>
                        <div id="settings-tax-selector-container" style="margin: 1.5rem 0;">
                            <!-- TaxEngine will render here -->
                        </div>

                        <h2 class="section-title-small" style="margin-top: 2rem;">${i18n.t('settings.section.status') || 'Statut Professionnel (Auto-Entrepreneur)'}</h2>
                        <p class="section-subtitle">${i18n.t('settings.status_hint') || 'Utilisé pour calculer vos cotisations sociales réelles et votre bénéfice net.'}</p>
                        <div class="form-group" style="margin-top: 1rem;">
                            <select name="socialStatus" class="form-input" id="settings-social-status" onchange="Settings.saveSocialStatus(this.value)">
                                <option value="SERVICE" ${settings.socialStatus === 'SERVICE' ? 'selected' : ''}>${i18n.t('settings.status.service') || 'Prestation de Services (AE : 21.1%)'}</option>
                                <option value="VENTE" ${settings.socialStatus === 'VENTE' ? 'selected' : ''}>${i18n.t('settings.status.sale') || 'Achat / Vente (AE : 12.3%)'}</option>
                                <option value="CIPAV" ${settings.socialStatus === 'CIPAV' ? 'selected' : ''}>${i18n.t('settings.status.liberal') || 'Libéral réglementé (CIPAV : 23.2%)'}</option>
                                <option value="EXEMPT" ${settings.socialStatus === 'EXEMPT' ? 'selected' : ''}>${i18n.t('settings.status.exempt') || 'Exonéré / Autre'}</option>
                            </select>
                        </div>
                        
                        <h2 class="section-title-small" style="margin-top: 2rem;">${i18n.t('settings.section.prefixes') || 'Préfixes de Documents'}</h2>
                        <form id="billing-settings-form" onsubmit="Settings.saveBillingSettings(event)">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">${i18n.t('settings.label.tax_rate') || 'Taux TVA par défaut (%)'}</label>
                                    <input type="number" name="taxRate" class="form-input" value="${settings.taxRate || 0}" step="0.1">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">${i18n.t('settings.label.validity') || 'Validité Devis (Jours)'}</label>
                                    <input type="number" name="quoteValidityDays" class="form-input" value="${settings.quoteValidityDays || 30}" min="1">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">${i18n.t('settings.label.prefix_quote') || 'Préfixe Devis'}</label>
                                    <input type="text" name="quotePrefix" class="form-input" value="${settings.quotePrefix || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">${i18n.t('settings.label.prefix_invoice') || 'Préfixe Factures'}</label>
                                    <input type="text" name="invoicePrefix" class="form-input" value="${settings.invoicePrefix || ''}">
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="button-primary">${i18n.t('settings.btn.save_prefs') || 'Enregistrer les préférences'}</button>
                            </div>
                        </form>
                    </div>
                </div>

                <div id="settings-tab-subscription" class="settings-tab-content ${activeTabId === 'subscription' ? 'active' : ''}">
                    <div class="settings-section">
                        <h2 class="section-title-small">${i18n.t('settings.section.offer') || 'Votre Offre SoloPrice Pro'}</h2>
                        <div id="subscription-info-container" style="margin-top: 1.5rem;">
                            <!-- Dynamically filled -->
                        </div>
                        <div style="margin-top: 1.5rem; padding: 1.25rem; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border);">
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0 0 0.75rem;">${i18n.t('settings.sync_hint') || 'Si votre abonnement n\'est pas correctement reflété (après un paiement PayPal), synchronisez-le manuellement.'}</p>
                            <button class="button-secondary small" onclick="Settings.restoreSubscription()">
                                <i class="fas fa-sync-alt"></i> ${i18n.t('settings.btn.sync') || 'Restaurer / Synchroniser mon abonnement'}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Data Tab -->
                <div id="settings-tab-data" class="settings-tab-content ${activeTabId === 'data' ? 'active' : ''}">
                    <div class="settings-section">
                        <h2 class="section-title-small">${i18n.t('settings.section.export_accounting') || 'Export Comptable (Expert)'}</h2>
                        <p class="section-subtitle">${i18n.t('settings.export_accounting_hint') || 'Générez un fichier CSV compatible avec tous les logiciels comptables (Sage, Ciel, Excel).'}</p>
                        
                        <div class="glass" style="margin-top: 1rem; padding: 1.5rem; border: 1px solid var(--border); border-radius: 8px;">
                            <div style="display: flex; gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                                <div>
                                    <h3 style="font-size: 1rem; margin: 0 0 0.5rem 0; color: var(--white);">${i18n.t('settings.label.sales_journal') || 'Journal des Ventes (CSV)'}</h3>
                                    <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">${i18n.t('settings.sales_journal_hint') || 'Toutes vos factures et avoirs de l\'année en cours.'}</p>
                                </div>
                                <button class="button-primary" onclick="Settings.exportAccounting()" ${Storage.getTier() === 'expert' ? '' : 'disabled style="opacity:0.6; cursor:not-allowed;"'}>
                                    ${Storage.getTier() === 'expert' ? (i18n.t('settings.btn.download_export') || ' Télécharger l\'export') : i18n.t('settings.expert_only') || ' Réservé Expert'}
                                </button>
                            </div>
                        </div>

                        <h2 class="section-title-small" style="margin-top: 2.5rem;">${i18n.t('settings.section.backup') || 'Sauvegarde & Sécurité'}</h2>
                        <p class="section-subtitle">${i18n.t('settings.backup_hint') || 'Vos données sont stockées localement. Exportez-les régulièrement pour ne pas les perdre.'}</p>
                    </div>

                    <!-- DANGER ZONE -->
                    <div class="settings-section" style="border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 1.5rem; margin-top: 2rem; background: rgba(239,68,68,0.03);">
                        <h2 class="section-title-small" style="color: #ef4444;"><i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>${i18n.t('settings.section.danger') || 'Zone Danger'}</h2>
                        <p class="section-subtitle">${i18n.t('settings.danger_hint') || 'Ces actions sont irréversibles. Procédez avec précaution.'}</p>

                        <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border-radius: 8px; background: rgba(255,255,255,0.02); border: 1px solid var(--border);">
                                <div>
                                    <strong style="font-size: 0.9rem;">${i18n.t('settings.btn.delete_account') || 'Supprimer mon compte'}</strong>
                                    <p style="margin: 2px 0 0; font-size: 0.8rem; color: var(--text-muted);">${i18n.t('settings.delete_account_hint') || 'Supprime définitivement votre compte et toutes vos données (clients, devis, factures...).'}</p>
                                </div>
                                <button class="button-outline small" onclick="Settings.deleteAccount()" style="border-color: #ef4444; color: #ef4444; flex-shrink: 0; margin-left: 1rem;">
                                    <i class="fas fa-trash-alt"></i> ${i18n.t('settings.btn.delete_account') || 'Supprimer mon compte'}
                                </button>
                            </div>
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
                App.showNotification(i18n.t('settings.notify.tax_zone', { name: ctx.name }) || `Zone ${ctx.name} appliquée.`, 'info');
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
            App.showNotification(i18n.t('settings.notify.saved') || 'Paramètres enregistrés', 'success');
        } catch (err) {
            App.showNotification(i18n.t('settings.notify.sync_error') || 'Erreur de synchronisation', 'error');
        }
    },

    async saveSocialStatus(value) {
        try {
            await Storage.updateSettings({ socialStatus: value });
            App.showNotification(i18n.t('settings.notify.status_updated') || 'Statut professionnel mis à jour', 'info');
        } catch (err) {
            App.showNotification(i18n.t('settings.notify.save_error') || 'Erreur de sauvegarde', 'error');
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
        App.showNotification(i18n.t('settings.notify.exported') || 'Données exportées', 'success');
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
                    App.showNotification(i18n.t('settings.notify.imported') || 'Données importées', 'success');
                    window.location.reload();
                } else {
                    App.showNotification(i18n.t('settings.notify.import_error') || 'Erreur lors de l\'import', 'error');
                }
            } catch (e) {
                App.showNotification(i18n.t('settings.notify.invalid_file') || 'Fichier invalide', 'error');
            }
        };
        reader.readAsText(file);
    },

    resetData() {
        if (confirm(i18n.t('settings.confirm.reset') || 'Attention : réinitialisation totale. Continuer ?')) {
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
                    <div style="font-size: 2rem; margin-bottom: 1rem;"></div>
                    <h3 style="margin-bottom: 0.5rem;">${i18n.t('settings.standard.title') || 'Vous utilisez la version Standard (Gratuite)'}</h3>
                    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">${i18n.t('settings.standard.hint') || 'Passez à PRO ou EXPERT pour débloquer l\'illimité et le coaching IA.'}</p>
                    <button class="button-primary" onclick="App.showUpgradeModal()">${i18n.t('settings.btn.view_offers') || 'Voir les offres'}</button>
                </div>
            `;
        } else {
            const isCanceled = user.subscriptionCanceled;
            container.innerHTML = `
                <div class="glass active-subscription" style="padding: 2rem; border-radius: 16px; border: 1px solid var(--primary-glass); background: var(--primary-glass);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <div>
                            <span class="badge" style="background: var(--primary); color: white; margin-bottom: 0.5rem; display: inline-block;">${i18n.t('settings.pack.title', { tier: tier.toUpperCase() }) || `PACK ${tier.toUpperCase()}`}</span>
                            <h3 style="margin: 0;">${i18n.t('settings.sub.active') || 'Abonnement Actif'}</h3>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.2rem; font-weight: 800;">${status.daysLeft} ${i18n.t('settings.sub.days') || 'jours'}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${i18n.t('settings.sub.remaining') || 'restants'}</div>
                        </div>
                    </div>

                    <div style="margin-bottom: 2rem; font-size: 0.9rem;">
                        <p style="margin: 0.25rem 0;"><i class="fas fa-calendar-check" style="margin-right: 8px;"></i> ${i18n.t('settings.sub.renewal') || 'Prochain renouvellement :'} <strong>${new Date(status.expiryDate).toLocaleDateString()}</strong></p>
                        ${isCanceled ?
                    `<p style="color: #ef4444; margin-top: 1rem; font-weight: 600;"><i class="fas fa-exclamation-triangle"></i> ${i18n.t('settings.sub.canceled_hint') || 'Votre abonnement est résilié et prendra fin à la date indiquée.'}</p>` :
                    `<p style="color: var(--text-muted); font-size: 0.8rem;">${i18n.t('settings.sub.auto_hint') || 'Votre abonnement sera automatiquement renouvelé mensuellement.'}</p>`
                }
                    </div>

                    <div style="display: flex; gap: 1rem;">
                        ${!isCanceled ?
                    `<button class="button-outline small" onclick="Settings.confirmCancelSubscription()" style="border-color: #ef4444; color: #ef4444;" title="Arrêter le renouvellement automatique tout en gardant vos accès jusqu'à la fin du mois">${i18n.t('settings.btn.cancel_sub') || 'Résilier l\'abonnement'}</button>` :
                    `<button class="button-primary small" onclick="App.showUpgradeModal()">${i18n.t('settings.btn.reactivate') || 'Réactiver / Changer d\'offre'}</button>`
                }
                    </div>
                </div>
            `;
        }
    },

    async confirmCancelSubscription() {
        if (confirm(i18n.t('settings.confirm.cancel_sub') || "Êtes-vous sûr de vouloir résilier votre abonnement ? Vous conserverez vos accès PRO jusqu'à la fin de la période en cours.")) {
            const success = await Storage.cancelSubscription();
            if (success) {
                App.showNotification(i18n.t('settings.notify.sub_canceled') || 'Abonnement résilié avec succès.', 'success');
                this.updateSubscriptionUI();
            }
        }
    },

    async restoreSubscription() {
        App.showNotification(i18n.t('settings.notify.syncing') || 'Synchronisation en cours...', 'info');
        try {
            const res = await fetch(`${Auth.apiBase}/api/auth/restore-subscription`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${Auth.token}` }
            });
            const data = await res.json();
            if (!res.ok) {
                App.showNotification(data.message || (i18n.t('settings.notify.not_found') || 'Aucun abonnement payant trouvé.'), 'error');
                return;
            }
            App.showNotification(`✅ ${data.message}`, 'success');
            // Refresh session to get updated metadata
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            App.showNotification(i18n.t('settings.notify.server_error') || 'Erreur de connexion au serveur.', 'error');
        }
    },

    async deleteAccount() {
        // First confirmation
        if (!confirm(i18n.t('settings.confirm.delete_account') || '⚠️ ATTENTION : Cette action est IRRÉVERSIBLE.\n\nToutes vos données (clients, devis, factures, partenaires...) seront définitivement supprimées.\n\nÊtes-vous absolument certain(e) ?')) return;

        // Second confirmation with email input
        const user = Auth.getUser();
        const userEmail = user?.email || '';
        const typed = prompt(`${i18n.t('settings.prompt.email') || 'Pour confirmer, saisissez votre adresse email :'} \n${userEmail}`);
        if (!typed || typed.trim().toLowerCase() !== userEmail.toLowerCase()) {
            App.showNotification(i18n.t('settings.notify.email_wrong') || 'Email incorrect. Suppression annulée.', 'error');
            return;
        }

        App.showNotification(i18n.t('settings.notify.deleting') || 'Suppression en cours...', 'info');
        try {
            const res = await fetch(`${Auth.apiBase}/api/auth/delete-account`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${Auth.token}` }
            });
            const data = await res.json();
            if (!res.ok) {
                App.showNotification(data.message || (i18n.t('settings.error.delete_account') || 'Erreur lors de la suppression.'), 'error');
                return;
            }
            App.showNotification(i18n.t('settings.notify.deleted') || 'Compte supprimé. Redirection...', 'success');
            // Clear local session and redirect
            Auth.logout();
        } catch (err) {
            App.showNotification(i18n.t('settings.notify.server_error') || 'Erreur de connexion au serveur.', 'error');
        }
    },

    exportAccounting() {
        if (Storage.getTier() !== 'expert') {
            App.showUpgradeModal('feature');
            return;
        }

        const invoices = Storage.getInvoices().filter(i => i.status !== 'draft');
        if (invoices.length === 0) {
            App.showNotification(i18n.t('settings.notify.no_invoices') || 'Aucune facture validée à exporter.', 'info');
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

        App.showNotification(i18n.t('settings.notify.export_success') || 'Export comptable (CSV) téléchargé !', 'success');
    }
};

window.Settings = Settings;
