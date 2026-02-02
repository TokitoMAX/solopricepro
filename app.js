// SoloPrice Pro - Application Manager
// Gestion du routing et de la navigation SPA

const App = {
    currentPage: 'dashboard',

    // Initialisation de l'application
    init() {
        this.setupNavigation();
        this.migrateData();
        this.setupMobileOverlay();
        this.checkFreemiumLimits();
        this.renderProBadge();
        this.renderUserInfo();
        if (window.Network) Network.init();
        this.handlePaymentReturn();

        // Router / Landing Logic
        const savedPage = localStorage.getItem('sp_last_page') || 'dashboard';
        const isLoggedIn = Auth.isLoggedIn();
        const inApp = sessionStorage.getItem('sp_in_app') === 'true';

        if (isLoggedIn || inApp) {
            this.enterApp(false);
            if (isLoggedIn) Storage.fullSync();
            this.navigateTo(savedPage);
        } else {
            // Landing page by default if never entered
            const landing = document.getElementById('landing-page');
            const appWrapper = document.getElementById('app-wrapper');
            if (landing) landing.style.display = 'block';
            if (appWrapper) appWrapper.style.display = 'none';
            this.updateLandingStats();
        }

        // Event listener pour fermeture de modales
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });
    },

    enterApp(animate = true) {
        const landing = document.getElementById('landing-page');
        const appWrapper = document.getElementById('app-wrapper');

        if (landing) landing.style.display = 'none';
        if (appWrapper) {
            appWrapper.style.display = 'block';
            if (animate) {
                appWrapper.style.animation = 'fadeIn 0.5s ease';
            }
        }

        sessionStorage.setItem('sp_in_app', 'true');
        this.renderUserInfo();
        this.navigateTo('dashboard');
    },

    updateLandingStats() {
        if (typeof Storage === 'undefined') return;

        const calculatorData = Storage.get('sp_calculator_data');
        const monthlyGoal = calculatorData ? parseFloat(calculatorData.monthlyRevenue) : 5000;

        const quotes = Storage.getQuotes() || [];
        const pipelineValue = quotes
            .filter(q => q.status === 'sent')
            .reduce((sum, q) => sum + (q.total || 0), 0);

        const valueEl = document.getElementById('landing-pipeline-value');
        const progressEl = document.getElementById('landing-pipeline-progress');

        if (valueEl) valueEl.textContent = this.formatCurrency(monthlyGoal);
        if (progressEl) {
            // Sur la landing, on montre un état "objectif" inspirant
            const progress = pipelineValue > 0 ? Math.min(100, Math.round((pipelineValue / monthlyGoal) * 100)) : 75; // 75% par défaut pour le style si 0
            progressEl.style.width = `${progress}%`;
        }
    },

    setupMobileOverlay() {
        if (!document.querySelector('.sidebar-backdrop')) {
            const overlay = document.createElement('div');
            overlay.className = 'sidebar-backdrop';
            overlay.onclick = () => {
                this.toggleMobileMenu();
            };
            document.body.appendChild(overlay);
        }
    },

    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-backdrop');
        const toggle = document.getElementById('mobile-menu-toggle');

        sidebar.classList.toggle('active');
        toggle.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
    },

    // Configuration de la navigation
    setupNavigation() {
        document.querySelectorAll('[data-nav]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.nav;
                this.navigateTo(page);
            });
        });
    },

    // Navigation entre pages avec support d'arguments pour le rendu
    navigateTo(page, ...args) {
        // Fermer le menu mobile si ouvert
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-backdrop');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        const toggle = document.getElementById('mobile-menu-toggle');
        if (toggle) toggle.classList.remove('active');

        // Cacher toutes les pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // Afficher la page demandée
        const pageElement = document.getElementById(`${page}-page`);
        if (pageElement) {
            pageElement.classList.add('active');
            this.currentPage = page;

            // Render specific page content with args
            this.renderPageContent(page, ...args);

            // Mettre à jour l'état actif de la navigation
            document.querySelectorAll('[data-nav]').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.nav === page) {
                    link.classList.add('active');
                }
            });

            // Update mobile header
            this.updateMobileHeader(page);
        }
    },

    // Update mobile header title and home button visibility
    updateMobileHeader(page) {
        const titleMap = {
            dashboard: 'Tableau de Bord',
            scoper: 'Chiffrage Projet',
            quotes: 'Documents',
            network: 'Mon Cercle',
            marketplace: 'Marketplace',
            expenses: 'Dépenses',
            kanban: 'Pipeline Business',
            profile: 'Mon Profil',
            settings: 'Réglages'
        };

        const mobileTitle = document.getElementById('mobile-page-title');
        const homeBtn = document.getElementById('mobile-home-btn');

        if (mobileTitle) {
            mobileTitle.textContent = titleMap[page] || 'SoloPrice Pro';
        }

        // Show home button on all pages except dashboard
        if (homeBtn) {
            homeBtn.style.display = page === 'dashboard' ? 'none' : 'flex';
        }
    },

    // Nouveau helper pour le rendu des pages
    renderPageContent(page, ...args) {
        if (page === 'dashboard' && typeof Dashboard !== 'undefined') Dashboard.render();
        if (page === 'quotes' && typeof Quotes !== 'undefined') Quotes.render();
        if (page === 'invoices' && typeof Invoices !== 'undefined') {
            this.navigateTo('quotes'); // Redirect to Documents
            setTimeout(() => Quotes.switchTab('invoices'), 100);
        }
        if (page === 'network' && typeof Network !== 'undefined') Network.render(...args);
        if (page === 'clients' && typeof Clients !== 'undefined') {
            this.navigateTo('network', 'clients'); // Redirect to Cercle > Clients
        }
        if (page === 'leads' && typeof Leads !== 'undefined') {
            this.navigateTo('network', 'leads'); // Redirect to Cercle > Prospects
        }
        if (page === 'marketplace' && typeof Marketplace !== 'undefined') Marketplace.render('marketplace-content', ...args);
        if (page === 'expenses' && typeof Expenses !== 'undefined') Expenses.render();
        if (page === 'kanban' && typeof Kanban !== 'undefined') Kanban.render();
        if (page === 'scoper' && typeof Scoper !== 'undefined') Scoper.render();
        if (page === 'profile' && typeof Profile !== 'undefined') Profile.render();
        if (page === 'settings' && typeof Settings !== 'undefined') Settings.render();
        if (page === 'services' && typeof Services !== 'undefined') {
            this.navigateTo('settings', 'billing'); // Redirect to Settings with billing tab
        }
    },

    // Chargement du contenu de chaque page
    loadPage(page) {
        this.renderPageContent(page);
    },

    // Vérification des limites freemium
    // Migration de QuickPrice Pro vers SoloPrice Pro
    migrateData() {
        this.migrateNetworkData();
        const oldKeys = [
            'qp_user', 'qp_clients', 'qp_quotes', 'qp_invoices', 'qp_services',
            'qp_leads', 'qp_revenues', 'qp_expenses', 'qp_settings',
            'qp_tax_context', 'qp_calculator_data', 'qp_profit_profile',
            'qp_marketplace_missions', 'qp_my_missions', 'qp_my_providers',
            'qp_calculator_inputs', 'qp_draft_quote_item', 'qp_last_page',
            'qp_token'
        ];

        let migrated = false;
        oldKeys.forEach(oldKey => {
            const data = localStorage.getItem(oldKey);
            if (data) {
                const newKey = oldKey.replace('qp_', 'sp_');
                if (!localStorage.getItem(newKey)) {
                    localStorage.setItem(newKey, data);
                    migrated = true;
                }
            }
        });

        if (migrated) {
            console.log("🚀 Migration SoloPrice Pro terminée avec succès !");
        }
    },

    // Fusionner les anciennes clés de prestataires/partenaires en une seule
    migrateNetworkData() {
        // Cleanup dummy missions if they exist
        const missions = localStorage.getItem('sp_marketplace_missions');
        if (missions) {
            try {
                const parsed = JSON.parse(missions);
                // Si les missions contiennent les IDs factices, on vide tout pour repartir sur du propre
                if (parsed.some(m => ['m1', 'm2', 'm3'].includes(m.id))) {
                    localStorage.setItem('sp_marketplace_missions', '[]');
                    console.log('🧹 Dummy missions cleared.');
                }
            } catch (e) { console.error("Error clearing dummy missions:", e); }
        }

        const networkProviders = localStorage.getItem('sp_providers'); // from old network.js
        const marketplaceProviders = localStorage.getItem('sp_my_providers'); // from old marketplace.js
        const unifiedKey = 'sp_network_providers';

        if ((networkProviders || marketplaceProviders) && !localStorage.getItem(unifiedKey)) {
            let unified = [];
            if (networkProviders) {
                try {
                    unified = unified.concat(JSON.parse(networkProviders));
                } catch (e) { console.error("Migration error (sp_providers):", e); }
            }
            if (marketplaceProviders) {
                try {
                    const marketProvs = JSON.parse(marketplaceProviders);
                    marketProvs.forEach(p => {
                        if (!unified.find(u => u.name === p.name)) {
                            unified.push(p);
                        }
                    });
                } catch (e) { console.error("Migration error (sp_my_providers):", e); }
            }
            localStorage.setItem(unifiedKey, JSON.stringify(unified));
            console.log('🔗 Network providers unified.');
            // Clean up old keys
            localStorage.removeItem('sp_providers');
            localStorage.removeItem('sp_my_providers');
        }
    },

    // Vérification des limites selon le Tier (Standard, Pro, Expert)
    checkFreemiumLimits() {
        const user = Auth.getUser();
        const tier = Storage.getTier();
        const isPro = tier === 'pro' || tier === 'expert';
        const isExpert = tier === 'expert';

        const quotes = Storage.getQuotes();
        const invoices = Storage.getInvoices();
        const clients = Storage.getClients();

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyQuotesCount = quotes.filter(q => {
            const d = new Date(q.createdAt);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        const monthlyInvoicesCount = invoices.filter(i => {
            const d = new Date(i.createdAt);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        // Banner visibility
        const banner = document.getElementById('freemium-banner');
        if (banner) banner.style.display = isPro ? 'none' : 'flex';

        return {
            tier: tier,
            canAddClient: isPro || clients.length < 1,
            canAddQuote: isPro || monthlyQuotesCount < 2,
            canAddInvoice: isPro || monthlyInvoicesCount < 2,
            canExportPDF: isPro,
            canAutomateMarketplace: isPro,
            isExpert: isExpert,
            maxClients: isPro ? Infinity : 1,
            maxQuotes: isPro ? Infinity : 2,
            maxInvoices: isPro ? Infinity : 2
        };
    },

    isFeatureProGated(feature) {
        const tier = Storage.getTier();
        if (tier === 'pro' || tier === 'expert') return false;

        const proFeatures = ['kanban', 'coach', 'expenses'];
        return proFeatures.includes(feature);
    },

    isFeatureExpertGated(feature) {
        const tier = Storage.getTier();
        if (tier === 'expert') return false;

        const expertFeatures = ['expert_coaching', 'expert_directory'];
        return expertFeatures.includes(feature);
    },

    async syncUser() {
        try {
            if (!window.sbClient) return;
            const { data: { user }, error } = await window.sbClient.auth.getUser();

            if (user) {
                const userData = {
                    id: user.id,
                    email: user.email,
                    company: { name: user.user_metadata.company_name },
                    isPro: user.user_metadata.is_pro
                };
                Storage.setUser(userData);
                this.renderUserInfo();
            } else if (error) {
                // Session probablement expirée
                Auth.logout();
            }
        } catch (error) {
            console.error('Failed to sync user:', error);
        }
    },

    // Affichage des informations utilisateur dans la sidebar
    renderUserInfo() {
        const user = Auth.getUser();
        if (!user) return;

        const infoContainer = document.getElementById('user-info-sidebar');
        const isPro = Storage.isPro();
        if (infoContainer) {
            infoContainer.innerHTML = `
                <div class="user-profile" onclick="App.navigateTo('profile')" style="cursor: pointer;">
                    <div class="user-avatar">${user.company?.name?.charAt(0) || user.email?.charAt(0) || 'U'}</div>
                    <div class="user-details">
                        <span class="user-name">${user.company?.name || user.email} ${Storage.getStreak() > 0 ? '<span title="Série de jours actifs" style="cursor:help;">🔥 ' + Storage.getStreak() + '</span>' : ''}</span>
                        ${isPro ? '<span class="user-status"><span class="pro-badge-small">PRO</span></span>' : '<span class="user-status text-muted" style="font-size:0.7rem;">Version Standard</span>'}
                    </div>
                </div>
            `;
        }
    },

    // Affichage du badge PRO (legacy, used in other places maybe)
    renderProBadge() {
        const isPro = Storage.isPro();
        const badge = document.getElementById('pro-badge');
        if (badge) {
            badge.style.display = isPro ? 'inline-flex' : 'none';
        }
    },

    // Afficher le modal d'upgrade
    showUpgradeModal(reason = 'limit') {
        const modal = document.getElementById('upgrade-modal');
        if (!modal) return;

        const messages = {
            limit: 'Passez à la vitesse supérieure.',
            pdf: 'Logo personnalisé & exports illimités.',
            feature: 'Fonctionnalité réservée aux membres PRO.',
            scoper_limit: 'Analyse illimitée réservée aux membres PRO.',
            marketplace_automation: 'Automatisation réservée aux membres PRO.'
        };

        const titleEl = modal.querySelector('.upgrade-title');
        const messageEl = modal.querySelector('.upgrade-message');

        if (titleEl) titleEl.textContent = 'Accès SoloPrice PRO';
        if (messageEl) messageEl.textContent = messages[reason] || messages.limit;

        // Force display flex to override any potential inline style 'none'
        modal.style.display = 'flex';
        modal.classList.add('active');
        this.renderUpgradeStep('comparison');
    },

    renderUpgradeStep(step, data = {}) {
        const modal = document.getElementById('upgrade-modal');
        const container = modal.querySelector('.upgrade-comparison');
        const titleEl = modal.querySelector('.upgrade-title');

        if (step === 'comparison') {
            titleEl.textContent = 'Accès SoloPrice PRO';
            container.innerHTML = `
                <!-- Standard -->
                <div class="pricing-card-mini standard" onclick="App.closeModal()">
                    <div class="card-tier">STANDARD</div>
                    <div class="card-price">0€<span>/mois</span></div>
                    <ul class="card-features-mini">
                        <li><i class="fas fa-check-circle"></i> Marketplace Gratuite</li>
                        <li><i class="fas fa-minus"></i> 1 Client Actif</li>
                        <li><i class="fas fa-minus"></i> 2 Devis par mois</li>
                    </ul>
                    <div class="card-select-btn">Rester en Standard</div>
                </div>

                <!-- Pro -->
                <div class="pricing-card-mini active pro" onclick="App.renderUpgradeStep('checkout', 'pro')">
                    <div class="card-badge">CONSEILLÉ</div>
                    <div class="card-tier">SOLOPRICE PRO</div>
                    <div class="card-price">15€<span>/mois</span></div>
                    <div class="card-value-tag">Économisez 20€/mois</div>
                    <ul class="card-features-mini">
                        <li><i class="fas fa-check-circle"></i> Devis/Factures <strong>Illimités</strong></li>
                        <li><i class="fas fa-check-circle"></i> Votre <strong>Logo</strong> sur PDF</li>
                        <li><i class="fas fa-check-circle"></i> Pipeline Kanban Complet</li>
                        <li><i class="fas fa-check-circle"></i> Pilotage CA & Profit</li>
                    </ul>
                    <button class="card-select-btn pro">Passer Pro</button>
                </div>

                <!-- Expert -->
                <div class="pricing-card-mini active expert" onclick="App.renderUpgradeStep('checkout', 'expert')">
                    <div class="card-badge" style="background: #a855f7;">PREMIUM</div>
                    <div class="card-tier" style="color: #c084fc;">PACK EXPERT</div>
                    <div class="card-price">29€<span>/mois</span></div>
                    <div class="card-value-tag">Valeur Réelle 75€</div>
                    <ul class="card-features-mini">
                        <li><i class="fas fa-check-circle"></i> Tout du Pack Pro</li>
                        <li><i class="fas fa-check-circle"></i> <strong>Coaching IA</strong> Avancé</li>
                        <li><i class="fas fa-check-circle"></i> Visibilité Prioritaire</li>
                        <li><i class="fas fa-check-circle"></i> Badge Expert Vérifié</li>
                    </ul>
                    <button class="card-select-btn expert" style="background: #a855f7; color: white;">Devenir Expert</button>
                </div>
            `;
        } else if (step === 'checkout') {
            const tier = typeof data === 'string' ? data : data.tier;
            const method = data.method || 'card';
            const price = tier === 'pro' ? '15€' : '29€';

            if (tier === 'standard') { App.closeModal(); return; }

            titleEl.textContent = 'Paiement Sécurisé';
            container.innerHTML = `
                <div class="checkout-view" style="width: 100%; text-align: left; padding: 0.5rem;">
                    <div class="payment-methods" style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                        <div class="pay-method ${method === 'card' ? 'active' : ''}" onclick="App.renderUpgradeStep('checkout', {tier: '${tier}', method: 'card'})">
                            <i class="fab fa-cc-stripe"></i> Carte
                        </div>
                        <div class="pay-method ${method === 'paypal' ? 'active' : ''}" onclick="App.renderUpgradeStep('checkout', {tier: '${tier}', method: 'paypal'})">
                            <i class="fab fa-paypal"></i> PayPal
                        </div>
                    </div>

                    <div class="checkout-summary" style="background: rgba(255,255,255,0.05); padding: 1.25rem; border-radius: 16px; margin-bottom: 2rem; border: 1px solid var(--border);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin: 0; font-size: 1rem;">SoloPrice ${tier.toUpperCase()}</h4>
                                <span style="font-size: 0.8rem; color: var(--text-muted);">Paiement via ${method === 'card' ? 'Visa/Mastercard' : 'PayPal'}</span>
                            </div>
                            <span style="font-size: 1.5rem; font-weight: 800; color: var(--primary-light);">${price}</span>
                        </div>
                    </div>

                    ${method === 'card' ? `
                        <div class="form-group">
                            <label class="form-label" style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted);">Numéro de carte</label>
                            <input type="text" class="form-input checkout-input" placeholder="0000 0000 0000 0000" id="card-number">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <input type="text" class="form-input checkout-input" placeholder="MM/AA">
                            <input type="text" class="form-input checkout-input" placeholder="CVC">
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 1rem; background: rgba(99, 102, 241, 0.1); border-radius: 12px; margin-bottom:1.5rem;">
                            <i class="fab fa-paypal" style="font-size: 2rem; color: #0070ba; margin-bottom: 0.5rem; display: block;"></i>
                            <p style="font-size: 0.9rem;">Vous allez être redirigé vers l'interface sécurisée de PayPal.</p>
                        </div>
                    `}
                    
                    <button class="button-primary full-width" onclick="App.processCheckout('${tier}', '${method}')" style="margin-top: 1rem; padding: 1.2rem; font-size: 1rem; border-radius: 50px; background: var(--primary);">
                        ${method === 'card' ? 'Confirmer le paiement' : 'Payer avec PayPal'}
                    </button>
                    <button class="button-outline full-width" onclick="App.renderUpgradeStep('comparison')" style="margin-top: 1rem; border: none; color: var(--text-muted); font-size: 0.9rem;">
                        <i class="fas fa-arrow-left"></i> Retour aux offres
                    </button>
                </div>
            `;
        }
    },

    processCheckout(tier, method = 'card') {
        const modal = document.getElementById('upgrade-modal');
        const container = modal.querySelector('.upgrade-comparison');
        const titleEl = modal.querySelector('.upgrade-title');

        const msg = method === 'paypal' ? 'Redirection vers PayPal...' : 'Vérification de la carte...';
        App.showNotification(msg, 'info');

        // Modal Loading State
        titleEl.textContent = method === 'paypal' ? 'Liaison PayPal' : 'Sécurisation';
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem;">
                <div class="payment-loader" style="margin-bottom: 2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary);"></i>
                </div>
                <h3 style="margin-bottom: 1rem;">${method === 'paypal' ? 'Ouverture de la fenêtre sécurisée...' : 'Traitement de la transaction...'}</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem;">Ne fermez pas cette fenêtre.</p>
            </div>
        `;

        const delay = method === 'paypal' ? 3500 : 2500;

        setTimeout(() => {
            Storage.activatePro('SP-TRANS-' + Math.random().toString(36).substring(7).toUpperCase(), tier, 1);
            App.showNotification('Paiement réussi ! Pack ' + tier.toUpperCase() + ' activé.', 'success');

            // Success View
            titleEl.textContent = 'Bienvenue !';
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem 0;">
                    <div class="success-icon-wrapper" style="width: 80px; height: 80px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);">
                        <i class="fas fa-check" style="color: white; font-size: 2.5rem;"></i>
                    </div>
                    <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Abonnement Activé</h2>
                    <p style="color: var(--text-muted); margin-bottom: 2rem; line-height: 1.5;">Votre espace de travail est maintenant configuré en mode ${tier.toUpperCase()}. Profitez de l'illimité !</p>
                    <button class="button-primary" onclick="location.reload()" style="padding: 1rem 2.5rem; border-radius: 50px;">Accéder à mes outils</button>
                </div>
            `;
        }, delay);
    },

    // Afficher le modal d'activation de licence
    showLicenseModal() {
        const modal = document.getElementById('license-modal');
        if (modal) {
            modal.classList.add('active');
            const input = modal.querySelector('#license-key-input');
            if (input) input.value = '';
        }
    },

    // Fermer les modales
    closeModal() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
            modal.style.display = ''; // Clear inline style
        });
    },

    // Activer une licence
    activateLicense() {
        const input = document.getElementById('license-key-input');
        const licenseKey = input?.value.trim();

        if (!licenseKey) {
            this.showNotification('Veuillez entrer une clé de licence', 'error');
            return;
        }

        // Validation simple de la clé (format: SPPRO-XXXXX-XXXXX-XXXXX)
        const isValid = this.validateLicenseKey(licenseKey);

        if (isValid) {
            Storage.activatePro(licenseKey);
            this.closeModal();
            this.renderProBadge();
            this.checkFreemiumLimits();
            this.showNotification('Licence activée avec succès.', 'success');

            // Recharger la page actuelle
            this.loadPage(this.currentPage);
        } else {
            this.showNotification('Clé de licence invalide', 'error');
        }
    },

    // Validation de clé de licence
    validateLicenseKey(key) {
        // Format attendu: SPPRO-XXXXX-XXXXX-XXXXX
        const pattern = /^[A-Z]{2,5}PRO-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
        return pattern.test(key);
    },

    // Générer une clé de licence (pour admin/test)
    generateLicenseKey() {
        const randomSegment = () => {
            return Array.from({ length: 5 }, () =>
                'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
            ).join('');
        };

        return `SPPRO - ${randomSegment()} -${randomSegment()} -${randomSegment()} `;
    },

    // Notification système
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification - ${type} `;
        notification.textContent = message;

        notification.style.cssText = `
position: fixed;
top: 20px;
right: 20px;
background: ${type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' :
                    'linear-gradient(135deg, #111827, #000000)'
            };
color: white;
padding: 1rem 1.5rem;
border - radius: 12px;
font - weight: 600;
box - shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
z - index: 10000;
animation: slideInRight 0.5s ease, slideOutRight 0.5s ease 2.5s;
max - width: 400px;
`;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    // Formatage de devises
    formatCurrency(amount) {
        const settings = Storage.get(Storage.KEYS.SETTINGS);
        return `${Math.round(amount).toLocaleString('fr-FR')} ${settings.currency} `;
    },

    // Formatage de dates
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    },

    // Calcul de total avec TVA
    calculateTotal(items, includeTax = true) {
        const settings = Storage.get(Storage.KEYS.SETTINGS);
        const subtotal = items.reduce((sum, item) =>
            sum + (item.quantity * item.unitPrice), 0
        );

        if (!includeTax) return subtotal;

        const taxAmount = subtotal * (settings.taxRate / 100);
        return subtotal + taxAmount;
    },

    handlePaymentReturn() {
        const params = new URLSearchParams(window.location.search);
        const session_id = params.get('session');
        const paymentStatus = params.get('payment');
        const invoiceId = params.get('invoiceId');

        // Retour d'achat SaaS (PRO)
        if (session_id) {
            this.showNotification('Paiement réussi ! Bienvenue dans la version PRO.', 'success');
            // On force un sync utilisateur pour obtenir le nouveau tag isPro
            this.syncUser();
            // Nettoyer l'URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        // Retour de paiement facture client
        else if (paymentStatus === 'success' && invoiceId) {
            const invoice = Storage.getInvoice(invoiceId);
            if (invoice && invoice.status !== 'paid') {
                Storage.updateInvoice(invoiceId, { status: 'paid' });
                this.showNotification(`Paiement réussi pour la facture ${invoice.number} !`, 'success');
                // Nettoyer l'URL sans recharger
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);

                // Si on était sur la page des factures, on rafraîchit
                if (typeof Invoices !== 'undefined' && this.currentPage === 'quotes') {
                    Invoices.render();
                }
            }
        } else if (paymentStatus === 'cancel') {
            this.showNotification('Paiement annulé.', 'info');
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }
};

window.App = App;

// Auto-démarrage quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            App.init();
            console.log("App initialized");
        } catch (e) {
            console.error("App Init Error:", e);
        }
    });
} else {
    try {
        App.init();
    } catch (e) {
        console.error("App Init Error:", e);
    }
}
