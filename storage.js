// SoloPrice Pro - Storage Manager
// Gestion centralisée des données avec localStorage

const Storage = {
    // Clés de stockage
    KEYS: {
        USER: 'sp_user',
        CLIENTS: 'sp_clients',
        QUOTES: 'sp_quotes',
        INVOICES: 'sp_invoices',
        SERVICES: 'sp_services',
        LEADS: 'sp_leads', // New Key
        REVENUES: 'sp_revenues',
        EXPENSES: 'sp_expenses',
        SETTINGS: 'sp_settings',
        CALCULATOR: 'sp_calculator_data'
    },

    // Initialisation
    init() {
        // L'init par défaut reste pour les données globales ou de base
        if (!this.getRaw(this.KEYS.SETTINGS)) {
            this.set(this.KEYS.SETTINGS, {
                currency: '€',
                taxRate: 20,
                invoicePrefix: 'FACT-',
                quotePrefix: 'DEV-',
                theme: 'dark'
            });
        }
    },

    // Méthodes génériques avec isolation par utilisateur
    getUserPrefix() {
        const user = this.getRaw(this.KEYS.USER);
        return user?.id ? `u${user.id}_` : '';
    },

    getRaw(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error reading from storage:', e);
            return null;
        }
    },

    get(key) {
        const prefix = this.getUserPrefix();
        return this.getRaw(prefix + key);
    },

    set(key, value, skipSync = false) {
        try {
            const prefix = this.getUserPrefix();
            localStorage.setItem(prefix + key, JSON.stringify(value));

            // Sync with backend if logged in and not explicitly skipped
            if (!skipSync && Auth.isLoggedIn()) {
                this.syncToCloud(key, value);
            }

            return true;
        } catch (e) {
            console.error('Error writing to storage:', e);
            return false;
        }
    },

    // Méthodes de synchronisation Cloud
    async syncToCloud(key, value) {
        const tableMap = {
            [this.KEYS.CLIENTS]: 'clients',
            [this.KEYS.QUOTES]: 'quotes',
            [this.KEYS.INVOICES]: 'invoices',
            [this.KEYS.SERVICES]: 'services',
            [this.KEYS.LEADS]: 'leads',
            [this.KEYS.REVENUES]: 'revenues',
            [this.KEYS.EXPENSES]: 'expenses',
            [this.KEYS.SETTINGS]: 'settings',
            'sp_network_providers': 'network_providers'
        };

        const table = tableMap[key];
        if (!table) return;

        try {
            const token = localStorage.getItem('sp_token');
            if (!token) return;

            console.log(`☁️ Syncing ${table} to cloud...`);
            await fetch(`${Auth.apiBase}/api/data/${table}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(value)
            });
        } catch (e) {
            console.error(`Sync error for ${table}:`, e);
        }
    },

    async fullSync() {
        if (!Auth.isLoggedIn()) return;

        const tables = [
            { key: this.KEYS.CLIENTS, table: 'clients' },
            { key: this.KEYS.QUOTES, table: 'quotes' },
            { key: this.KEYS.INVOICES, table: 'invoices' },
            { key: this.KEYS.SERVICES, table: 'services' },
            { key: this.KEYS.LEADS, table: 'leads' },
            { key: this.KEYS.REVENUES, table: 'revenues' },
            { key: this.KEYS.EXPENSES, table: 'expenses' },
            { key: this.KEYS.SETTINGS, table: 'settings' },
            { key: 'sp_network_providers', table: 'network_providers' }
        ];

        try {
            const token = localStorage.getItem('sp_token');
            for (const item of tables) {
                console.log(`📥 Pulling ${item.table} from cloud...`);
                const response = await fetch(`${Auth.apiBase}/api/data/${item.table}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const remoteData = await response.json();
                    if (remoteData && remoteData.length > 0) {
                        // Pour les tableaux, on fusionne ou remplace le local
                        // Pour l'instant, priorité au cloud si présent à l'init
                        this.set(item.key, remoteData, true); // true = skipSync to avoid loop
                    }
                }
            }
            console.log("✅ Synchronisation terminée.");
        } catch (e) {
            console.error("Full sync failed:", e);
        }
    },

    // Méthodes utilisateur
    getUser() {
        return this.getRaw(this.KEYS.USER);
    },

    setUser(userData) {
        if (!userData) return;
        localStorage.setItem(this.KEYS.USER, JSON.stringify(userData));
        try {
            this.initUserData();
        } catch (e) {
            console.error('Data initialization failed:', e);
        }
    },

    updateUser(updates) {
        let user = this.getUser();
        if (!user) {
            // Force create a basic user if missing for testing
            user = { id: 'temp_user', email: 'test@example.com', company: {} };
        }
        const updatedUser = { ...user, ...updates };
        // Deep merge company if it's an object update
        if (updates.company && user.company) {
            updatedUser.company = { ...user.company, ...updates.company };
        }
        this.setUser(updatedUser);
        return updatedUser;
    },

    initUserData() {
        // Initialiser les collections vides pour cet utilisateur
        ['CLIENTS', 'QUOTES', 'INVOICES', 'SERVICES', 'REVENUES', 'EXPENSES', 'LEADS'].forEach(key => {
            if (!this.get(this.KEYS[key])) {
                this.set(this.KEYS[key], []);
            }
        });

        // Initialize Settings for this user if not present
        if (!this.get(this.KEYS.SETTINGS)) {
            const defaultSettings = this.getRaw(this.KEYS.SETTINGS) || {
                currency: '€',
                taxRate: 22,
                invoicePrefix: 'FACT-',
                quotePrefix: 'DEV-',
                theme: 'dark'
            };
            this.set(this.KEYS.SETTINGS, defaultSettings);
        }
    },

    isPro() {
        const user = this.getUser();
        return user?.isPro === true;
    },

    getSubscriptionStatus() {
        const user = this.getUser();
        if (!user || !user.isPro) return { isActive: false };

        const expiry = user.subscriptionEnd ? new Date(user.subscriptionEnd) : null;
        if (!expiry) return { isActive: true, isLifetime: true };

        const now = new Date();
        const diff = expiry - now;
        const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

        return {
            isActive: daysLeft > 0,
            daysLeft: Math.max(0, daysLeft),
            expiryDate: expiry.toISOString(),
            isExpired: daysLeft <= 0
        };
    },

    activatePro(licenseKey, months = 1) {
        const user = this.getUser();
        const now = new Date();
        const expiry = new Date(now.setMonth(now.getMonth() + months));

        this.setUser({
            ...user,
            isPro: true,
            licenseKey: licenseKey,
            activatedAt: new Date().toISOString(),
            subscriptionEnd: expiry.toISOString()
        });
    },

    // Méthodes clients
    getClients() {
        return this.get(this.KEYS.CLIENTS) || [];
    },

    getClient(id) {
        return this.getClients().find(c => c.id === id);
    },

    addClient(client) {
        const clients = this.getClients();
        const newClient = {
            id: this.generateId(),
            ...client,
            createdAt: new Date().toISOString()
        };
        clients.push(newClient);
        this.set(this.KEYS.CLIENTS, clients);
        return newClient;
    },

    updateClient(id, updates) {
        const clients = this.getClients();
        const index = clients.findIndex(c => c.id === id);
        if (index !== -1) {
            clients[index] = { ...clients[index], ...updates };
            this.set(this.KEYS.CLIENTS, clients);
            return clients[index];
        }
        return null;
    },

    deleteClient(id) {
        const clients = this.getClients().filter(c => c.id !== id);
        this.set(this.KEYS.CLIENTS, clients);
        this.deleteRemote(this.KEYS.CLIENTS, id);
    },

    async deleteRemote(key, id) {
        if (!Auth.isLoggedIn()) return;
        const tableMap = {
            [this.KEYS.CLIENTS]: 'clients',
            [this.KEYS.QUOTES]: 'quotes',
            [this.KEYS.INVOICES]: 'invoices',
            [this.KEYS.SERVICES]: 'services',
            [this.KEYS.LEADS]: 'leads'
        };
        const table = tableMap[key];
        if (!table) return;

        try {
            const token = localStorage.getItem('sp_token');
            await fetch(`${Auth.apiBase}/api/data/${table}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {
            console.error("Remote delete error:", e);
        }
    },

    // Méthodes devis
    getQuotes() {
        return this.get(this.KEYS.QUOTES) || [];
    },

    getQuote(id) {
        return this.getQuotes().find(q => q.id === id);
    },

    addQuote(quote) {
        const quotes = this.getQuotes();
        const settings = this.get(this.KEYS.SETTINGS);
        const number = quotes.length + 1;

        const newQuote = {
            id: this.generateId(),
            number: `${settings.quotePrefix}${String(number).padStart(4, '0')}`,
            ...quote,
            createdAt: new Date().toISOString(),
            status: quote.status || 'draft'
        };
        quotes.push(newQuote);
        this.set(this.KEYS.QUOTES, quotes);
        return newQuote;
    },

    updateQuote(id, updates) {
        const quotes = this.getQuotes();
        const index = quotes.findIndex(q => q.id === id);
        if (index !== -1) {
            quotes[index] = { ...quotes[index], ...updates };
            this.set(this.KEYS.QUOTES, quotes);
            return quotes[index];
        }
        return null;
    },

    deleteQuote(id) {
        const quotes = this.getQuotes().filter(q => q.id !== id);
        this.set(this.KEYS.QUOTES, quotes);
        this.deleteRemote(this.KEYS.QUOTES, id);
    },

    // Méthodes factures
    getInvoices() {
        return this.get(this.KEYS.INVOICES) || [];
    },

    getInvoice(id) {
        return this.getInvoices().find(i => i.id === id);
    },

    addInvoice(invoice) {
        const invoices = this.getInvoices();
        const settings = this.get(this.KEYS.SETTINGS);
        const number = invoices.length + 1;

        const newInvoice = {
            id: this.generateId(),
            number: `${settings.invoicePrefix}${String(number).padStart(4, '0')}`,
            ...invoice,
            createdAt: new Date().toISOString(),
            status: invoice.status || 'draft'
        };
        invoices.push(newInvoice);
        this.set(this.KEYS.INVOICES, invoices);
        return newInvoice;
    },

    updateInvoice(id, updates) {
        const invoices = this.getInvoices();
        const index = invoices.findIndex(i => i.id === id);
        if (index !== -1) {
            invoices[index] = { ...invoices[index], ...updates };
            this.set(this.KEYS.INVOICES, invoices);
            return invoices[index];
        }
        return null;
    },

    deleteInvoice(id) {
        const invoices = this.getInvoices().filter(i => i.id !== id);
        this.set(this.KEYS.INVOICES, invoices);
        this.deleteRemote(this.KEYS.INVOICES, id);
    },

    // Méthodes Service Catalog
    getServices() {
        return this.get(this.KEYS.SERVICES) || [];
    },

    addService(service) {
        const services = this.getServices();
        const newService = {
            id: this.generateId(),
            ...service,
            createdAt: new Date().toISOString()
        };
        services.push(newService);
        this.set(this.KEYS.SERVICES, services);
        return newService;
    },

    deleteService(id) {
        const services = this.getServices().filter(s => s.id !== id);
        this.set(this.KEYS.SERVICES, services);
        this.deleteRemote(this.KEYS.SERVICES, id);
    },

    // Méthodes Radar à Prospects (Leads)
    getLeads() {
        return this.get(this.KEYS.LEADS) || [];
    },

    addLead(lead) {
        const leads = this.getLeads();
        const newLead = {
            id: this.generateId(),
            ...lead,
            status: lead.status || 'cold', // 'cold', 'warm', 'won'
            createdAt: new Date().toISOString()
        };
        leads.push(newLead);
        this.set(this.KEYS.LEADS, leads);
        return newLead;
    },

    updateLead(id, updates) {
        const leads = this.getLeads();
        const index = leads.findIndex(l => l.id === id);
        if (index !== -1) {
            leads[index] = { ...leads[index], ...updates };
            this.set(this.KEYS.LEADS, leads);
            return leads[index];
        }
        return null;
    },

    deleteLead(id) {
        const leads = this.getLeads().filter(l => l.id !== id);
        this.set(this.KEYS.LEADS, leads);
        this.deleteRemote(this.KEYS.LEADS, id);
    },

    // Méthodes Dépenses
    getExpenses() {
        return this.get(this.KEYS.EXPENSES) || [];
    },

    addExpense(expense) {
        const expenses = this.getExpenses();
        const newExpense = {
            id: 'exp-' + Date.now(),
            ...expense,
            createdAt: new Date().toISOString()
        };
        expenses.push(newExpense);
        this.set(this.KEYS.EXPENSES, expenses);
        return newExpense;
    },

    deleteExpense(id) {
        const expenses = this.getExpenses().filter(e => e.id !== id);
        this.set(this.KEYS.EXPENSES, expenses);
        this.deleteRemote(this.KEYS.EXPENSES, id);
    },

    // Statistiques
    getStats() {
        const invoices = this.getInvoices();
        const quotes = this.getQuotes();
        const clients = this.getClients();

        // CA du mois en cours
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyRevenue = invoices
            .filter(i => {
                const date = new Date(i.createdAt);
                return i.status === 'paid' &&
                    date.getMonth() === currentMonth &&
                    date.getFullYear() === currentYear;
            })
            .reduce((sum, i) => sum + (i.total || 0), 0);

        // Factures impayées
        const unpaidInvoices = invoices.filter(i =>
            i.status === 'sent' || i.status === 'overdue'
        );
        const unpaidAmount = unpaidInvoices.reduce((sum, i) => sum + (i.total || 0), 0);

        return {
            totalClients: clients.length,
            totalQuotes: quotes.length,
            totalInvoices: invoices.length,
            monthlyRevenue,
            unpaidAmount,
            unpaidCount: unpaidInvoices.length
        };
    },

    // Utilitaires
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Export/Import
    exportAll() {
        const data = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            user: this.get(this.KEYS.USER),
            settings: this.get(this.KEYS.SETTINGS),
            clients: this.get(this.KEYS.CLIENTS),
            quotes: this.get(this.KEYS.QUOTES),
            invoices: this.get(this.KEYS.INVOICES),
            revenues: this.get(this.KEYS.REVENUES),
            expenses: this.get(this.KEYS.EXPENSES)
        };
        return JSON.stringify(data, null, 2);
    },

    importAll(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            // Validation basique
            if (!data.version) throw new Error('Invalid data format');

            // Import
            Object.keys(this.KEYS).forEach(key => {
                const dataKey = key.toLowerCase();
                if (data[dataKey]) {
                    this.set(this.KEYS[key], data[dataKey]);
                }
            });

            return true;
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    },

    // Reset complet (pour debug)
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        this.init();
    }
};

// Auto-initialisation
Storage.init();
