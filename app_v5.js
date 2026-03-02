// SoloPrice Pro - Application Manager (v20260225_0100)
console.log('[APP] Version v20260225_0100 LOADED');

// --- ANALYTICS HELPER ---
const Analytics = {
    trackEvent(name, properties = {}) {
        console.log(` [TRACK] ${name}`, properties);
        if (window.clarity) {
            window.clarity("set", name, JSON.stringify(properties));
        }
    }
};

// --- CONFIGURATION GÉNÉRALE PAYPAL (INTERRUPTEUR) ---
const PAYPAL_CONFIG = {
    isLiveMode: true, // BASQUER À TRUE POUR ENCAISSER DU VRAI ARGENT

    sandbox: {
        clientId: "AUpGYEYVUGM5Q1MAKvkEd61kYWzQS5w42BkCjLx9_R7UAfSYpFcOOsCg_f8oClj-9aLTxXxJxBe74U7O",
        plans: {
            pro: "P-8KN785183W634412BNGM6LMQ",
            expert: "P-4M2114299U772554XNGM623I"
        }
    },

    live: {
        clientId: "AcBmagCWJpj_JUQpRivjdlrowAA48XOvpD_B022bRdhQqQzYIHR6LgAKLdFadgLKHUa4BPqpYwstW825",
        plans: {
            pro: "P-13N38598NB647223XNGNDJMY",
            expert: "P-19X023126K248324VNGNDKOQ"
        }
    }
};
const App = {
    currentPage: null, // null until first navigation — prevents the deduplication guard from skipping the initial render

    // Initialisation de l'application
    async init() {
        console.log(' [APP] Init started');

        // Safety timeout to hide loader if init hangs (e.g. slow network)
        const safetyTimer = setTimeout(() => {
            const loader = document.getElementById('app-loader');
            if (loader && loader.style.display !== 'none') {
                console.warn('️ [APP] Init took too long (>10s). Forcing loader hide.');
                this.hideLoader();
            }
        }, 10000);

        try {
            console.log(' [APP] Step 1: Core components');
            this.setupNavigation();
            this.migrateData();
            this.setupMobileOverlay();

            console.log(' [APP] Step 2: Session check');
            const isLoggedIn = (typeof Auth !== 'undefined') ? Auth.isLoggedIn() : false;
            const inApp = sessionStorage.getItem('sp_in_app') === 'true';
            const savedPage = localStorage.getItem('sp_last_page') || 'dashboard';

            console.log(' [APP] Current state:', { isLoggedIn, inApp, savedPage });

            if (isLoggedIn || inApp) {
                if (isLoggedIn) {
                    console.log(' [APP] Step 3: Syncing data...');
                    if (typeof Auth !== 'undefined' && Auth.refreshUser) {
                        try { await Auth.refreshUser(); } catch (e) { console.error('Refresh user failed', e); }
                    }
                    if (typeof Storage !== 'undefined' && Storage.init) {
                        await Storage.init();
                    }
                    console.log(' [APP] Data sync complete');
                }

                console.log(' [APP] Step 4: Entering app');
                this.enterApp(false, false);

                // Reset currentPage to null so the deduplication guard in navigateTo
                // does NOT skip the initial render (the page content would be empty otherwise).
                this.currentPage = null;

                const route = this.getPageFromHash();
                if (route) {
                    this.navigateTo(route.page, route.tab);
                } else {
                    const lastTab = localStorage.getItem(`sp_last_tab_${savedPage}`);
                    this.navigateTo(savedPage, lastTab);
                }
            } else {
                console.log(' [APP] Step 3: Showing landing');
                const landing = document.getElementById('landing-page');
                const appWrapper = document.getElementById('app-wrapper');
                if (landing) landing.style.display = 'block';
                if (appWrapper) appWrapper.style.display = 'none';
                this.updateLandingStats();
            }

            console.log(' [APP] Step 5: Post-init tasks');
            this.checkFreemiumLimits();
            this.renderUserInfo();
            this.loadPayPalSDK();
            this.handlePaymentReturn();
            if (window.Network && Network.init) Network.init();

            if (this.handleUrlHash()) {
                console.log(' [APP] Hash handled, stopping init.');
                clearTimeout(safetyTimer);
                this.hideLoader();
                return;
            }

        } catch (e) {
            console.error(' [APP] Critical Init Error:', e);
        } finally {
            console.log(' [APP] Init finished');
            clearTimeout(safetyTimer);
            this.hideLoader();
        }

        // Event listener pour fermeture de modales
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });
    },

    hideLoader() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    },

    enterApp(animate = true, autoNavigate = true) {
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
        if (autoNavigate) {
            this.navigateTo('dashboard');
        }
    },

    enterPublicMode() {
        console.log("️ Entering Public Mode (No Sidebar)");
        const sidebar = document.querySelector('.sidebar');
        const header = document.querySelector('.mobile-header');
        const banner = document.getElementById('freemium-banner');
        const main = document.querySelector('.main-content');

        if (sidebar) sidebar.style.display = 'none';
        if (header) header.style.display = 'none';
        if (banner) banner.style.display = 'none';
        if (main) {
            main.style.marginLeft = '0';
            main.style.width = '100%';
            main.style.padding = '0';
            main.style.maxWidth = '100vw';
        }
        document.body.classList.add('public-view');
    },

    updateLandingStats() {
        if (typeof Storage === 'undefined') return;

        const calculatorData = Storage.get('sp_calculator_data');
        const monthlyGoal = (calculatorData && calculatorData.monthlyRevenue) ? parseFloat(calculatorData.monthlyRevenue) : 5000;

        const quotes = Storage.getQuotes() || [];
        const pipelineValue = quotes.length > 0
            ? quotes.filter(q => q.status === 'sent').reduce((sum, q) => sum + (q.total || 0), 0)
            : 0;

        const valueEl = document.getElementById('landing-pipeline-value');
        const progressEl = document.getElementById('landing-pipeline-progress');

        if (valueEl) {
            valueEl.innerHTML = this.formatCurrency(monthlyGoal);
        }

        if (progressEl) {
            const percentage = Math.min((pipelineValue / monthlyGoal) * 100, 100);
            progressEl.style.width = percentage > 0 ? `${percentage}%` : '5%';
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
        // Redirection des alias vers les bons onglets du réseau
        if (page === 'clients') return this.navigateTo('network', 'clients');
        if (page === 'leads') return this.navigateTo('network', 'leads');

        // Prévenir les boucles infinies si on demande la même page et le même onglet
        const currentTab = args[0] || null;
        const lastTab = localStorage.getItem(`sp_last_tab_${page}`);
        if (this.currentPage === page && currentTab === lastTab && !this.forceRender) {
            console.log(`[NAV] Already on ${page} (tab: ${currentTab}). Skipping render.`);
            return;
        }

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
        const pageElement = document.getElementById(page);
        if (pageElement) {
            pageElement.classList.add('active');
            this.currentPage = page;
            localStorage.setItem('sp_last_page', page);

            // Update URL Hash without triggering hashchange
            this.updatingHashManually = true;
            let hash = `page=${page}`;
            if (args.length > 0 && typeof args[0] === 'string') {
                hash += `&tab=${args[0]}`;
                localStorage.setItem(`sp_last_tab_${page}`, args[0]);
            }
            window.location.hash = hash;
            setTimeout(() => this.updatingHashManually = false, 100);

            // Render specific page content with args
            this.renderPageContent(page, ...args);

            // Mettre à jour l'état actif de la navigation
            document.querySelectorAll('[data-nav]').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.nav === page || (page === 'network' && (link.dataset.nav === 'clients' || link.dataset.nav === 'leads'))) {
                    // Logic for active class on sidebar items
                    if (link.dataset.nav === page) link.classList.add('active');
                }
            });

            // Update mobile header
            this.updateMobileHeader(page);
        } else {
            console.error(`[NAV] Page element #${page} not found in DOM.`);
        }
    },

    getPageFromHash() {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const page = params.get('page');
        const tab = params.get('tab');

        if (page) {
            return { page, tab };
        }
        return null;
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

    renderPageContent(page, ...args) {
        console.log(` [APP] Rendering page: ${page}`, args);
        try {
            if (page === 'dashboard') {
                if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
                else console.warn('️ Dashboard module not ready');
            }
            if (page === 'quotes') {
                if (typeof Quotes !== 'undefined' && Quotes.render) Quotes.render('quotes-content', ...args);
                else console.warn('️ Quotes module not ready');
            }
            if (page === 'invoices') {
                if (typeof Invoices !== 'undefined') {
                    this.navigateTo('quotes'); // Redirect to Documents
                    setTimeout(() => { if (typeof Quotes !== 'undefined' && Quotes.switchTab) Quotes.switchTab('invoices'); }, 100);
                }
            }
            if (page === 'network') {
                if (typeof Network !== 'undefined' && Network.render) Network.render(...args);
                else console.warn('️ Network module not ready');
            }
            if (page === 'clients') {
                this.navigateTo('network', 'clients');
            }
            if (page === 'leads') {
                this.navigateTo('network', 'leads');
            }
            if (page === 'marketplace') {
                if (typeof Marketplace !== 'undefined' && Marketplace.render) {
                    this.checkFreemiumLimits(); // Refresh limits before rendering
                    try {
                        console.log(' [MARKETPLACE-ROOT] Rendering v4.0 (Lite)...');
                        Marketplace.render('marketplace-root', ...args);
                    } catch (err) {
                        console.error('Marketplace Render Error:', err);
                    }
                } else console.warn('️ Marketplace module not ready');
            }
            if (page === 'kanban') {
                if (typeof Kanban !== 'undefined' && Kanban.render) Kanban.render();
                else console.warn('️ Kanban module not ready');
            }
            if (page === 'scoper') {
                if (typeof Scoper !== 'undefined' && Scoper.render) Scoper.render();
                else console.warn('️ Scoper module not ready');
            }
            if (page === 'profile') {
                if (typeof Profile !== 'undefined' && Profile.render) Profile.render();
                else console.warn('️ Profile module not ready');
            }
            if (page === 'settings') {
                if (typeof Settings !== 'undefined' && Settings.render) Settings.render();
                else console.warn('️ Settings module not ready');
            }
            if (page === 'services') {
                this.navigateTo('settings', 'billing'); // Redirect to Settings with billing tab
            }
            if (page === 'admin') {
                const user = (typeof Storage !== 'undefined') ? Storage.getUser() : null;
                if (user && user.role === 'admin') {
                    if (this.refreshAdminData) this.refreshAdminData();
                } else {
                    if (this.showNotification) this.showNotification('Accès refusé', 'error');
                    this.navigateTo('dashboard');
                }
            }
        } catch (e) {
            console.error(` [APP] Error rendering page ${page}:`, e);
            if (this.showNotification) this.showNotification('Erreur d\'affichage', 'error');
        }
    },

    // LEGAL COMPLIANCE
    exportReceiptsLedger() {
        if (typeof PDFGenerator === 'undefined') return;
        const invoices = Storage.getInvoices();
        const user = Storage.getUser();
        PDFGenerator.generateReceiptsLedger(invoices, user);
        Analytics.trackEvent('export_receipts_ledger');
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
            console.log(" Migration SoloPrice Pro terminée avec succès !");
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
                    console.log(' Dummy missions cleared.');
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
            console.log(' Network providers unified.');
            // Clean up old keys
            localStorage.removeItem('sp_providers');
            localStorage.removeItem('sp_my_providers');
        }
    },

    // Vérification des limites selon le Tier (Standard, Pro, Expert)
    checkFreemiumLimits() {
        const user = Auth.getUser();
        const isPro = Storage.isPro();
        const tier = Storage.getTier();
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

        const marketplaceMissions = Storage.getPublicMissions() || [];
        const myUserId = user?.id;
        const monthlyMarketplaceCount = marketplaceMissions.filter(m => {
            const d = new Date(m.createdAt);
            // On compte les devis générés depuis le marketplace (ou missions répondues)
            // Pour l'instant, on va vérifier dans les devis si la note mentionne "Marketplace"
            return m.user_id === myUserId; // Mais ici on veut les réponses, pas les posts.
        }).length;

        // Plus précis : filter les devis qui viennent du marketplace
        const marketplaceQuotesCount = quotes.filter(q => {
            const d = new Date(q.createdAt);
            const isMarketplace = q.notes && (q.notes.includes('Radar DomTomConnect') || q.notes.includes('Radar Réseau SoloPrice'));
            return isMarketplace && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        // Banner visibility
        const banner = document.getElementById('freemium-banner');
        if (banner) banner.style.display = isPro ? 'none' : 'flex';

        return {
            tier: tier,
            canAddClient: isPro || clients.length < 1,
            canAddQuote: isPro || monthlyQuotesCount < 2,
            canAddInvoice: isPro || monthlyInvoicesCount < 2,
            canAddMarketplaceResponse: isPro || marketplaceQuotesCount < 1,
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

    getDailyFocus() {
        const items = [];
        const now = new Date();

        // 1. Relances Prioritaires
        const quotes = Storage.getQuotes();
        const dormantQuotes = quotes.filter(q => {
            if (q.status !== 'sent') return false;
            const lastAction = q.lastFollowUpAt || q.sentAt || q.createdAt;
            const daysSinceAction = (now - new Date(lastAction)) / (1000 * 60 * 60 * 24);
            return daysSinceAction > 3;
        });

        if (dormantQuotes.length > 0) {
            const totalDormant = dormantQuotes.reduce((sum, q) => sum + q.total, 0);
            items.push({
                id: 'relance',
                icon: '<i class="fas fa-hand-holding-usd"></i>',
                title: 'Relance Prioritaire',
                description: `${dormantQuotes.length} devis (${this.formatCurrency(totalDormant)}) attendent une relance.`,
                action: 'Relancer',
                nav: 'quotes',
                type: 'urgent'
            });
        }

        // 2. Missions Marketplace Fraîches
        const missions = Storage.getPublicMissions();
        const freshMissions = missions.filter(m => {
            const createdAt = m.createdAt || m.created_at;
            const days = (now - new Date(createdAt)) / (1000 * 60 * 60 * 24);
            return days < 2;
        });

        if (freshMissions.length > 0) {
            items.push({
                id: 'market',
                icon: '<i class="fas fa-bolt"></i>',
                title: 'Opportunités Fraîches',
                description: `${freshMissions.length} nouvelles missions publiées sur le réseau.`,
                action: 'Voir le Radar',
                nav: 'marketplace',
                type: 'info'
            });
        }

        // 3. Alerte Facture en retard
        const invoices = Storage.getInvoices();
        const overdue = invoices.filter(i => i.status === 'overdue' || (i.status === 'sent' && new Date(i.dueDate) < now));
        if (overdue.length > 0) {
            items.push({
                id: 'overdue',
                icon: '<i class="fas fa-exclamation-triangle"></i>',
                title: 'Impayé Détecté',
                description: `${overdue.length} facture(s) sont en retard. Récupérez votre cash.`,
                action: 'Voir Factures',
                nav: 'invoices',
                type: 'danger'
            });
        }

        // Si vide, une action positive
        if (items.length === 0) {
            items.push({
                id: 'prospect',
                icon: '<i class="fas fa-bullseye"></i>',
                title: 'Expansion Business',
                description: 'Tout est à jour. Et si vous ajoutiez 2 nouveaux prospects aujourd\'hui ?',
                action: 'Ajouter au Cercle',
                nav: 'network',
                type: 'success'
            });
        }

        return items.slice(0, 3);
    },

    isFeatureExpertGated(feature) {
        const tier = Storage.getTier();
        if (tier === 'expert') return false;

        const expertFeatures = ['expert_coaching'];
        return expertFeatures.includes(feature);
    },

    // Méthode centrale pour bloquer strictement une action si limite atteinte
    enforceLimit(feature) {
        const limits = this.checkFreemiumLimits();

        // 1. Gestion des clients
        if (feature === 'clients') {
            if (!limits.canAddClient) {
                this.showUpgradeModal('limit');
                return false; // Bloqué
            }
        }

        // 2. Gestion des devis
        if (feature === 'quotes') {
            if (!limits.canAddQuote) {
                this.showUpgradeModal('limit');
                return false; // Bloqué
            }
        }

        // 4. Gestion du Marketplace (Réponses aux missions)
        if (feature === 'marketplace_response') {
            if (!limits.canAddMarketplaceResponse) {
                this.showUpgradeModal('marketplace_limit');
                return false;
            }
        }

        return true; // Autorisé
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
                if (typeof Storage !== 'undefined') {
                    Storage.setUser(userData);
                    Storage.fetchAllData(true);
                }
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

        const isPro = Storage.isPro(); // Restore checking Pro status

        // Show Admin Nav if Role is Admin
        const adminNav = document.getElementById('nav-item-admin');
        if (adminNav) {
            if (user.role === 'admin') {
                adminNav.style.display = 'flex';
            } else {
                adminNav.style.display = 'none';
            }
        }

        // Sidebar Cleanup (v20260225_0100)
        // Scoper is now visible for all tiers (with PRO badge if gated)

        // Ensure "Marketplace" and "Pipeline" (Kanban) are visible
        const marketNav = document.querySelector('[data-nav="marketplace"]');
        const kanbanNav = document.querySelector('[data-nav="kanban"]');
        if (marketNav && marketNav.closest('.nav-item')) marketNav.closest('.nav-item').style.display = 'flex';
        if (kanbanNav && kanbanNav.closest('.nav-item')) kanbanNav.closest('.nav-item').style.display = 'flex';


        // Add "Subscription" shortcut in User Profile
        const infoContainer = document.getElementById('user-info-sidebar');
        if (infoContainer) {
            const tier = Storage.getTier();
            const isPro = Storage.isPro();
            const isExpert = tier === 'expert';

            infoContainer.innerHTML = `
                <div class="user-profile" style="cursor: pointer;">
                    <div class="user-avatar" onclick="App.navigateTo('profile')">${user.company?.name?.charAt(0) || user.email?.charAt(0) || 'U'}</div>
                    <div class="user-details">
                        <div onclick="App.navigateTo('profile')">
                            <span class="user-name">${user.company?.name || user.email}</span>
                            ${isExpert ? '<span class="user-status"><span class="expert-badge-small" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; margin-left: 5px;">EXPERT</span></span>' :
                    (isPro ? '<span class="user-status"><span class="pro-badge-small">PRO</span></span>' : '<span class="user-status text-muted" style="font-size:0.7rem;">Standard</span>')}
                        </div>
                        <div style="margin-top: 4px; font-size: 0.75rem;">
                             <a href="#" onclick="App.showUpgradeModal('limit'); return false;" style="color: var(--primary); text-decoration: none;">
                                ${isPro ? 'Gérer mon offre' : ' Passer PRO'}
                             </a>
                        </div>
                    </div>
                </div>
            `;
        }

        // Afficher les badges PRO dans la sidebar pour les fonctions limitées
        document.querySelectorAll('.nav-item').forEach(item => {
            const nav = item.dataset.nav;
            const proFeatures = ['kanban', 'scoper', 'expenses'];

            // Supprimer d'anciens badges pour éviter les doublons
            const oldBadge = item.querySelector('.pro-lock-badge');
            if (oldBadge) oldBadge.remove();

            if (!isPro && proFeatures.includes(nav)) {
                const badge = document.createElement('span');
                badge.className = 'pro-lock-badge';
                badge.innerHTML = '<i class="fas fa-crown"></i> PRO';
                badge.style.cssText = `
                    margin-left: auto;
                    font-size: 0.6rem;
                    font-weight: 900;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    letter-spacing: 0.5px;
                `;
                item.appendChild(badge);
            }
        });

        // Afficher le bouton de déconnexion
        const sidebarFooter = document.querySelector('.sidebar-footer');
        if (sidebarFooter) {
            sidebarFooter.style.display = 'block';
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
            marketplace_limit: 'Limite de réponse atteinte (1/mois). Passez PRO pour débloquer le Radar.',
            marketplace_automation: 'Automatisation réservée aux membres PRO.',
            pdf_download: 'Téléchargements illimités et logo personnalisé réservés aux membres PRO.'
        };

        const titleEl = modal.querySelector('.upgrade-title');
        const messageEl = modal.querySelector('.upgrade-message');

        if (titleEl) titleEl.textContent = 'Accès SoloPrice PRO';
        if (messageEl) messageEl.textContent = messages[reason] || messages.limit;

        // Force display flex to override any potential inline style 'none'
        modal.style.display = 'flex';
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        if (reason === 'success') {
            this.renderUpgradeStep('success');
        } else {
            this.renderUpgradeStep('comparison');
        }
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
                    <li><i class="fas fa-check-circle"></i> Marketplace : 1 réponse/mois</li>
                    <li><i class="fas fa-minus"></i> 1 Client Actif</li>
                    <li><i class="fas fa-minus"></i> 2 Devis par mois</li>
                </ul>
                <div class="card-select-btn">Rester en Standard</div>
            </div>

            <!-- Pro -->
            <div class="pricing-card-mini active pro" onclick="App.renderUpgradeStep('checkout', 'pro')">
                <div class="card-badge">PRODUCTION ILLIMITÉE</div>
                <div class="card-tier">SOLOPRICE PRO</div>
                <div class="card-price">15€<span>/mois</span></div>
                <div class="card-value-tag">Idéal pour produire sans limites</div>
                <ul class="card-features-mini">
                    <li><i class="fas fa-check-circle"></i> Devis/Factures <strong>Illimités</strong></li>
                    <li><i class="fas fa-check-circle"></i> Votre <strong>Logo</strong> sur PDF</li>
                    <li><i class="fas fa-check-circle"></i> Pipeline Kanban Complet</li>
                    <li><i class="fas fa-check-circle"></i> <strong>Zéro Limite</strong> sur les documents</li>
                </ul>
                <button class="card-select-btn pro">Passer Pro</button>
            </div>

            <!-- Expert -->
            <div class="pricing-card-mini active expert" onclick="App.renderUpgradeStep('checkout', 'expert')">
                <div class="card-badge" style="background: #10b981;">ACCÉLÉRATEUR BUSINESS</div>
                <div class="card-tier" style="color: #34d399;">PACK EXPERT</div>
                <div class="card-price">29€<span>/mois</span></div>
                <div class="card-value-tag">Le pack pour CHERCHER des clients</div>
                <ul class="card-features-mini">
                    <li><i class="fas fa-check-circle"></i> Tout du Pack Pro</li>
                    <li><i class="fas fa-check-circle"></i> <strong>Signature Électronique</strong> Sur Place</li>
                    <li><i class="fas fa-check-circle"></i> <strong>Assistant Relance</strong> (Recouvrement)</li>
                    <li><i class="fas fa-check-circle"></i> <strong>Coaching Rentabilité</strong> Avancé</li>
                </ul>
                <button class="card-select-btn expert" style="background: #10b981; color: white;">Devenir Expert</button>
            </div>
        `;
        } else if (step === 'checkout') {
            const tier = typeof data === 'string' ? data : data.tier;
            const method = 'paypal'; // Force PayPal uniquement
            const price = tier === 'pro' ? '15€' : '29€';

            if (tier === 'standard') { App.closeModal(); return; }

            titleEl.textContent = 'Activation Immédiate';
            container.innerHTML = `
            <div class="checkout-view" style="width: 100%; text-align: left; padding: 0.5rem;">
                <div class="checkout-summary" style="background: rgba(255,255,255,0.05); padding: 1.25rem; border-radius: 16px; margin-bottom: 2rem; border: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4 style="margin: 0; font-size: 1rem;">SoloPrice ${tier.toUpperCase()}</h4>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">Abonnement via PayPal</span>
                        </div>
                        <span style="font-size: 1.5rem; font-weight: 800; color: var(--primary-light);">${price}</span>
                    </div>
                </div>

                <div class="paypal-checkout-box">
                    <div id="paypal-live-badge" class="env-badge" style="display: none; margin-bottom: 1rem; background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.2); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; width: fit-content; margin-inline: auto;">
                        <i class="fas fa-check-circle"></i> MODE PRODUCTION (RÉEL)
                    </div>
                    <div id="paypal-button-container" class="paypal-button-mount">
                        <div class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: #0070ba;"></div>
                    </div>
                    <p class="paypal-info-text text-muted" style="text-align: center; margin-top: 1rem;">Validation instantanée après paiement</p>
                </div>
                
                <button class="button-outline full-width" onclick="App.renderUpgradeStep('comparison')" style="margin-top: 1.5rem; border: none; color: var(--text-muted); font-size: 0.9rem;">
                    <i class="fas fa-arrow-left"></i> Retour aux offres
                </button>
            </div>
        `;

            // Re-exécution du script PayPal en fonction du tier
            if (method === 'paypal') {
                const isLive = PAYPAL_CONFIG.isLiveMode;
                const config = isLive ? PAYPAL_CONFIG.live : PAYPAL_CONFIG.sandbox;

                console.log(` [PAYPAL] Mode: ${isLive ? 'LIVE' : 'SANDBOX'}`);

                // Afficher le badge Live si on est en prod
                setTimeout(() => {
                    const badge = document.getElementById('paypal-live-badge');
                    if (badge && isLive) badge.style.display = 'block';
                }, 100);

                const isSubscriptionMode = true;
                const containerId = '#paypal-button-container';

                const renderButtons = (retryCount = 0) => {
                    const container = document.querySelector(containerId);
                    if (!container) return;

                    if (!window.paypal) {
                        if (retryCount < 5) {
                            console.log(` [PAYPAL] SDK not ready, retrying (${retryCount + 1}/5)...`);
                            container.innerHTML = '<div style="text-align:center; padding:1rem;"><i class="fas fa-spinner fa-spin"></i> Initialisation PayPal...</div>';
                            setTimeout(() => renderButtons(retryCount + 1), 1000);
                            return;
                        }
                        console.error(' [PAYPAL] SDK NOT LOADED after 5s!');
                        container.innerHTML = '<p style="color:red; text-align:center; padding:1rem;">Erreur: Le service PayPal ne répond pas.<br><small>Désactivez votre bloqueur de pub.</small></p>';
                        return;
                    }

                    const planId = tier === 'expert' ? config.plans.expert : config.plans.pro;

                    console.log(` [PAYPAL] Rendering buttons for Plan: ${planId} (${isLive ? 'LIVE' : 'SANDBOX'})`);
                    container.innerHTML = '';

                    paypal.Buttons({
                        style: { shape: 'rect', color: 'gold', layout: 'vertical', label: 'subscribe' },
                        createSubscription: function (data, actions) {
                            return actions.subscription.create({
                                plan_id: planId
                            });
                        },
                        onApprove: async (data, actions) => {
                            App.showNotification(` Activation de votre accès ${tier.toUpperCase()} ${isLive ? '' : '(Sandbox)'}...`, 'success');
                            const user = Auth.getUser();

                            if (user) {
                                // 1. Appel Backend pour rendre l'activation permanente dans Supabase Auth
                                try {
                                    await fetch(`${Auth.apiBase}/api/payments/paypal-subscription`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            subscriptionID: data.subscriptionID,
                                            tier: tier,
                                            userId: user.id
                                        })
                                    });
                                } catch (e) {
                                    console.error('Backend Sync Error:', e);
                                }

                                // 2. Mise à jour locale pour un retour immédiat
                                if (typeof Storage !== 'undefined') {
                                    const prefix = isLive ? 'SUB-' : 'SANDBOX-SUB-';
                                    await Storage.activatePro(prefix + data.subscriptionID, tier);
                                }
                            }

                            setTimeout(() => window.location.reload(), 1500);
                        }
                    }).render(containerId);
                };

                renderButtons(0);
            }
        } else if (step === 'success') {
            titleEl.textContent = 'Félicitations !';
            container.innerHTML = `
                <div class="upgrade-success" style="text-align: center; padding: 2rem; width: 100%;">
                    <div class="success-icon" style="font-size: 4rem; margin-bottom: 1.5rem;"></div>
                    <h3 style="margin-bottom: 1rem; color: var(--primary-light);">Paiement Confirmé !</h3>
                    <p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 1rem; line-height: 1.5;">
                        Nous activons vos privilèges SoloPrice PRO.<br>
                        Veuillez patienter quelques instants...
                    </p>
                    <div style="display: flex; justify-content: center;">
                        <div class="loading-spinner"></div>
                    </div>
                </div>
            `;
        }
    },

    processCheckout(tier, method = 'card') {
        if (method === 'card') {
            const user = Storage.getUser();
            if (!user || !user.id) {
                App.showNotification('Veuillez vous connecter pour continuer.', 'error');
                return;
            }

            // Liens de paiement Stripe fournis par l'utilisateur
            const stripeLinks = {
                //pro: "https://buy.stripe.com/5kQ4gybhHcb29usaYt7Re01",
                pro: "https://buy.stripe.com/test_14A5kCa7v9Cb41g8h5gbm01",
                //expert: "https://buy.stripe.com/bJe6oG85v6QIfSQ3w17Re02",
                expert: "https://buy.stripe.com/test_7sY14m1AZ3dN55k68Xgbm02"
            };

            const link = stripeLinks[tier];
            if (link) {
                App.showNotification('Redirection vers Stripe sécurisé...', 'info');
                // On passe l'userId via client_reference_id pour que le webhook puisse activer le compte
                const finalUrl = `${link}?client_reference_id=${user.id}${user.email ? `&prefilled_email=${encodeURIComponent(user.email)}` : ''}`;
                window.location.href = finalUrl;
            } else {
                App.showNotification('Configuration du plan invalide.', 'error');
            }
        }
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
    closeModal(id = null) {
        if (id) {
            const modal = document.getElementById(id);
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
            }
        } else {
            document.querySelectorAll('.modal-overlay, .modal').forEach(modal => {
                modal.classList.remove('active');
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
            });
        }
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

        return `SPPRO-${randomSegment()}-${randomSegment()}-${randomSegment()}`;
    },

    // Notification système
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
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
            border-radius: 12px;
            font-weight: 600;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideInRight 0.5s ease, slideOutRight 0.5s ease 2.5s;
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    // Advanced Currency Configuration based on user country
    getCurrencyConfig() {
        // Fallbacks: default to France/EUR
        let countryCode = 'FR';
        let currency = 'EUR';
        let symbol = '€';
        let locale = 'fr-FR';
        let defaultRevenue = 5000;

        const user = (typeof Storage !== 'undefined') ? Storage.getUser() : null;
        let country = 'FR';

        if (user && (user.user_metadata?.country || user.company?.country)) {
            country = user.user_metadata?.country || user.company?.country;
        } else if (typeof document !== 'undefined') {
            // Fallback to language for guests (Mini-Simulator on landing page)
            let lang = 'fr';
            const match = document.cookie.match(/googtrans=\/[^\/]+\/([a-z]{2})/);
            if (match && match[1]) {
                lang = match[1];
            } else if (typeof navigator !== 'undefined' && navigator.language) {
                lang = navigator.language.split('-')[0];
            }

            if (lang === 'en') country = 'US';
            else if (lang === 'es') country = 'ES';
        }

        // Map countries to currencies (matches Profile.COUNTRIES)
        switch (country) {
            case 'CA': currency = 'CAD'; symbol = 'CAD$'; locale = 'en-CA'; defaultRevenue = 6000; break;
            case 'CH': currency = 'CHF'; symbol = 'CHF'; locale = 'fr-CH'; defaultRevenue = 8000; break;
            case 'US': currency = 'USD'; symbol = '$'; locale = 'en-US'; defaultRevenue = 6000; break;
            case 'GB': currency = 'GBP'; symbol = '£'; locale = 'en-GB'; defaultRevenue = 5000; break;
            case 'MA': currency = 'MAD'; symbol = 'MAD'; locale = 'fr-MA'; defaultRevenue = 20000; break; // ~2k EUR
            case 'SN': case 'CI': currency = 'XOF'; symbol = 'FCFA'; locale = 'fr-FR'; defaultRevenue = 1500000; break; // ~2k EUR
            case 'MG': currency = 'MGA'; symbol = 'Ar'; locale = 'fr-FR'; defaultRevenue = 5000000; break;
            case 'MU': currency = 'MUR'; symbol = 'Rs'; locale = 'en-MU'; defaultRevenue = 100000; break;
            // Euro countries + DOMTOM
            case 'FR': case 'BE': case 'LU': case 'DE': case 'ES': case 'IT':
            case 'RE': case 'GP': case 'MQ': case 'GF':
            default:
                currency = 'EUR'; symbol = '€'; locale = 'fr-FR'; defaultRevenue = 5000; break;
        }

        return { currency, symbol, locale, defaultRevenue };
    },

    // Formatage de devises internationalisé
    formatCurrency(amount, skipSymbol = false) {
        if (amount === undefined || amount === null || isNaN(amount)) amount = 0;

        // Convert string to number if needed
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

        const config = this.getCurrencyConfig();

        // Format the number consistently
        let formatted = Math.round(numAmount).toLocaleString(config.locale);

        if (skipSymbol) return formatted;

        // Some locales put the symbol before (en-US), some after (fr-FR). 
        // For consistency in our UI which often expects a specific layout, we'll manually append for now,
        // or let Intl.NumberFormat do it fully if we prefer. 
        // For now, retaining the old look but with dynamic symbol:
        return `${formatted} ${config.symbol}`;
    },

    // Formatage de dates
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    },

    // Calcul de total avec TVA
    calculateTotal(items, includeTax = true) {
        const settings = Storage.get(Storage.KEYS.SETTINGS) || { taxRate: 0 };
        const subtotal = items.reduce((sum, item) =>
            sum + (item.quantity * item.unitPrice), 0
        );

        if (!includeTax) return subtotal;

        const taxAmount = subtotal * (settings.taxRate / 100);
        return subtotal + taxAmount;
    },

    // Gestion du retour de paiement Stripe
    handlePaymentReturn() {
        if (this._isCheckingPayment) return;

        const urlParams = new URLSearchParams(window.location.search);
        const session_id = urlParams.get('session_id');
        const paymentStatus = urlParams.get('payment');
        const invoiceId = urlParams.get('invoiceId');

        // Retour d'achat SaaS (PRO)
        if (session_id) {
            this._isCheckingPayment = true;
            // Nettoyer l'URL
            window.history.replaceState({}, document.title, window.location.pathname);

            // Afficher un loader pendant la vérification
            this.showUpgradeModal('success');
            const successTitle = document.querySelector('.upgrade-success h3');
            const successText = document.querySelector('.upgrade-success p');
            if (successTitle) successTitle.textContent = 'Vérification du paiement...';

            // Polling pour vérifier si le webhook a fini de traiter
            let attempts = 0;
            const checkPayment = setInterval(async () => {
                attempts++;
                try {
                    // Rafraîchir la session Auth pour récupérer le tier à jour
                    if (Auth.refreshUser) await Auth.refreshUser();
                    await Storage.fetchAllData(true); // Force refetch
                    const tier = Storage.getTier();

                    if (tier === 'pro' || tier === 'expert' || attempts > 10) {
                        clearInterval(checkPayment);
                        this._isCheckingPayment = false;
                        if (tier !== 'free') {
                            if (successTitle) successTitle.textContent = 'Paiement confirmé !';
                            if (successText) successText.textContent = 'Votre compte a été promu avec succès. Profitez de vos nouvelles fonctionnalités.';
                            this.renderUserInfo();
                        } else {
                            if (successTitle) successTitle.textContent = 'Temps d\'attente dépassé';
                            if (successText) successText.textContent = 'Le paiement est en cours de traitement. Votre compte sera mis à jour dans quelques instants.';
                        }
                    }
                } catch (e) {
                    console.error('Check payment error:', e);
                }
            }, 2000);
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
    },

    // Gestion du reset password via hash URL ou navigation
    handleUrlHash() {
        const hash = window.location.hash.substring(1);
        if (!hash) return false;

        console.log(" Hash detected:", hash.substring(0, 20) + "...");

        // 1. Écouter les changements de hash pour la navigation SPA (si pas déjà fait)
        if (!this.hashListenerSetup) {
            window.addEventListener('hashchange', () => {
                if (this.updatingHashManually) return;
                const route = this.getPageFromHash();
                if (route && (route.page !== this.currentPage || route.tab)) {
                    this.navigateTo(route.page, route.tab);
                }
            });
            this.hashListenerSetup = true;
        }

        // 2. Cas spécifique : Vue publique d'un devis
        if (hash.startsWith('view-quote=')) {
            const fullPath = hash.split('=')[1];
            const [quoteId, queryString] = fullPath.split('?');
            const params = new URLSearchParams(queryString || '');
            const paymentStatus = params.get('payment');

            this.enterApp(false, false);
            this.enterPublicMode();

            // ACTIVER LA PAGE PARENTE (Indispensable pour la visibilité)
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const quotesPage = document.getElementById('quotes');
            if (quotesPage) quotesPage.classList.add('active');

            if (typeof Quotes !== 'undefined') {
                // Passer tous les paramètres pour gérer PayPal (orderId, etc.)
                Quotes.renderPublicView(quoteId, params);
            }
            return true;
        }

        if (hash.startsWith('page=')) return false;

        // 3. Cas spécifique : Récupération de mot de passe (Supabase)
        // Le hash peut contenir access_token directement ou via des params
        const params = new URLSearchParams(hash.replace(/#/g, '&'));
        const type = params.get('type');
        const accessToken = params.get('access_token');
        const error = params.get('error_description');

        if (error) {
            this.showNotification(decodeURIComponent(error), 'error');
            window.history.replaceState({}, document.title, window.location.pathname);
            return true;
        }

        if ((type === 'recovery' || hash.includes('type=recovery')) && accessToken) {
            console.log(' Mode Recovery détecté - Ouverture de la modale');
            sessionStorage.setItem('sp_recovery_token', accessToken);

            // Nettoyage de l'URL pour éviter les boucles
            window.history.replaceState({}, document.title, window.location.pathname);

            // On attend un court instant que le DOM soit prêt si on vient de charger la page
            setTimeout(() => this.showResetPasswordModal(), 500);
            return true;
        }

        return false;
    },

    showResetPasswordModal() {
        // Nettoyer toute trace de Supabase avant d'afficher la nôtre
        if (window.Auth && typeof window.Auth.hideSupabaseForms === 'function') {
            window.Auth.hideSupabaseForms();
        }

        let modal = document.getElementById('reset-password-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'reset-password-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3 class="auth-form-title gradient-text">Nouveau mot de passe</h3>
                    <p class="text-muted" style="margin-bottom: 1.5rem; font-size: 0.9rem;">
                        Définissez votre nouveau mot de passe sécurisé.
                    </p>
                    
                    <div class="form-group">
                        <label class="form-label" for="new-password-input">Nouveau mot de passe</label>
                        <input type="password" id="new-password-input" 
                               placeholder="Min. 6 caractères" 
                               class="modern-input"
                               required minlength="6">
                    </div>

                    <div id="reset-modal-error" class="auth-error"></div>

                    <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
                        <button id="btn-submit-reset" class="button-primary full-width">
                            Mettre à jour
                        </button>
                        <button onclick="App.closeModal('reset-password-modal')" class="button-outline full-width">
                            Annuler
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Gestionnaire de clic
            document.getElementById('btn-submit-reset').addEventListener('click', async () => {
                const password = document.getElementById('new-password-input').value;
                const errEl = document.getElementById('reset-modal-error');
                errEl.textContent = '';

                if (!password || password.length < 6) {
                    errEl.textContent = 'Le mot de passe doit faire 6 caractères min.';
                    return;
                }

                const token = sessionStorage.getItem('sp_recovery_token');
                if (!token) {
                    errEl.textContent = 'Session expirée. Recommencez la demande.';
                    return;
                }

                try {
                    const btn = document.getElementById('btn-submit-reset');
                    btn.disabled = true;
                    btn.textContent = 'Mise à jour...';

                    await Auth.updatePassword(token, password);

                    App.showNotification('Mot de passe mis à jour !', 'success');
                    sessionStorage.removeItem('sp_recovery_token');
                    App.closeModal('reset-password-modal');
                    if (typeof showAuthModal === 'function') showAuthModal('login');
                } catch (err) {
                    errEl.textContent = err.message || 'Erreur lors de la mise à jour.';
                    const btn = document.getElementById('btn-submit-reset');
                    btn.disabled = false;
                    btn.textContent = 'Mettre à jour';
                }
            });
        }

        modal.classList.add('active');
        modal.style.display = 'flex';
    },

    // --- ADMIN DASHBOARD ---
    async refreshAdminData() {
        const listBody = document.getElementById('admin-users-list');
        const statsTotal = document.getElementById('admin-total-users');
        const statsNew = document.getElementById('admin-new-users');
        const statsConfirmed = document.getElementById('admin-confirmed-users');

        if (listBody) listBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Chargement des données...</td></tr>';

        try {
            const token = localStorage.getItem('sp_token');
            const response = await fetch(`${Auth.apiBase}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || `Erreur API (${response.status})`);
            }

            const users = await response.json();
            this.adminUsersCache = users; // Cache for search

            // Stats
            if (statsTotal) statsTotal.textContent = users.length;

            const now = new Date();
            const last24h = users.filter(u => (now - new Date(u.created_at)) < 86400000).length;
            if (statsNew) statsNew.textContent = `+${last24h}`;

            const confirmed = users.filter(u => u.confirmed).length;
            if (statsConfirmed) statsConfirmed.textContent = `${confirmed} (${Math.round(confirmed / users.length * 100)}%)`;

            this.renderAdminTable(users);

        } catch (e) {
            console.error('Admin Data Error:', e);
            if (listBody) listBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; color:#ef4444; padding: 2rem;">
                        <div style="font-weight:bold; margin-bottom:0.5rem;"> Erreur de connexion au serveur</div>
                        <div style="font-size:0.9rem;">${e.message}</div>
                        <div style="font-size:0.8rem; margin-top:1rem; color:#888;">Le backend doit avoir la SUPABASE_SERVICE_ROLE_KEY</div>
                    </td>
                </tr>`;
        }
    },

    renderAdminTable(users) {
        const listBody = document.getElementById('admin-users-list');
        if (!listBody) return;

        if (users.length === 0) {
            listBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Aucun utilisateur trouvé.</td></tr>';
            return;
        }

        listBody.innerHTML = users.map(u => `
            <tr>
                <td>
                    <div style="font-weight:600;">${u.email}</div>
                    <div style="font-size:0.75rem; color: #666;">ID: ${u.id}</div>
                </td>
                <td>${new Date(u.created_at).toLocaleDateString()}</td>
                <td>${u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : 'Jamais'}</td>
                <td>
                    ${u.confirmed
                ? '<span style="color:SpringGreen; font-size:0.8rem;">● Vérifié</span>'
                : '<span style="color:orange; font-size:0.8rem;">○ En attente</span>'
            }
                </td>
            </tr>
        `).join('');
    },

    filterAdminUsers(query) {
        if (!this.adminUsersCache) return;
        const lowerQ = query.toLowerCase();
        const filtered = this.adminUsersCache.filter(u =>
            u.email.toLowerCase().includes(lowerQ) ||
            u.id.includes(lowerQ)
        );
        this.renderAdminTable(filtered);
    },

    async showSystemStatus() {
        try {
            const token = localStorage.getItem('sp_token');
            const res = await fetch(`${Auth.apiBase}/api/admin/system`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            alert(`Système: ${data.status}\nNode Env: ${data.node_env}\nUptime: ${Math.round(data.uptime)}s`);
        } catch (e) {
            alert('Erreur status système');
        }
    },

    // Charge dynamiquement le SDK PayPal selon le mode (Sandbox ou Live)
    loadPayPalSDK() {
        const config = PAYPAL_CONFIG.isLiveMode ? PAYPAL_CONFIG.live : PAYPAL_CONFIG.sandbox;

        // Éviter les doublons
        if (document.querySelector(`script[src*="paypal.com/sdk/js"]`)) {
            console.log(' [PAYPAL] SDK already present.');
            return;
        }

        console.log(` [PAYPAL] Loading SDK (${PAYPAL_CONFIG.isLiveMode ? 'LIVE' : 'SANDBOX'})...`);
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${config.clientId}&components=buttons&vault=true&intent=subscription&currency=EUR`;
        script.async = true;

        script.onload = () => console.log(' [PAYPAL] SDK Loaded dynamically.');
        script.onerror = () => {
            console.error(' [PAYPAL] SDK Load failed!');
            alert('Erreur critique: Le service PayPal ne peut pas charger. Vérifiez votre connexion ou désactivez votre bloqueur de pub.');
        };

        document.body.appendChild(script);
    }
};

window.App = App;

// Note: App.init() must be called explicitly from index.html after all modules have loaded.
