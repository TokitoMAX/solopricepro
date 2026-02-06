// SoloPrice Pro - Storage Manager (Cloud-First)
// Gestion centralisée des données via Supabase API (No Local Storage Persistence)

const Storage = {
    // Clés pour le cache mémoire (ne persiste pas au refresh)
    KEYS: {
        USER: 'sp_user',
        CLIENTS: 'clients',
        QUOTES: 'quotes',
        INVOICES: 'invoices',
        SERVICES: 'services',
        LEADS: 'leads',
        REVENUES: 'revenues',
        EXPENSES: 'expenses',
        SETTINGS: 'settings',
        CALCULATOR: 'calculator_data',
        MARKETPLACE_MISSIONS: 'marketplace_missions',
        MY_MISSIONS: 'my_missions',
        PROVIDERS: 'network_providers'
    },

    // Cache mémoire
    _cache: {},

    // Channel pour la synchronisation multi-onglets
    _syncChannel: new BroadcastChannel('sp_sync_channel'),

    init() {
        console.log("☁️ Storage initialized in Cloud-First mode.");
        this.setupSyncListener();

        // Le token reste en localStorage pour l'auth
        const token = localStorage.getItem('sp_token');
        if (token) {
            this.fetchAllData();
        }
    },

    setupSyncListener() {
        this._syncChannel.onmessage = (event) => {
            console.log('🔄 Sync notice received from another tab:', event.data);
            if (event.data === 'refresh') {
                this.fetchAllData(true); // true = force re-render
            }
        };
    },

    broadcastSync() {
        this._syncChannel.postMessage('refresh');
    },

    // --- Core API Methods ---

    async fetchAllData(triggerRender = false) {
        if (!Auth.isLoggedIn()) return;

        const tables = [
            this.KEYS.CLIENTS, this.KEYS.QUOTES, this.KEYS.INVOICES,
            this.KEYS.SERVICES, this.KEYS.LEADS, this.KEYS.EXPENSES,
            this.KEYS.SETTINGS, this.KEYS.CALCULATOR,
            this.KEYS.MARKETPLACE_MISSIONS, this.KEYS.PROVIDERS,
            this.KEYS.REVENUES, this.KEYS.MY_MISSIONS
        ];

        try {
            // Fetch User Profile first
            const profileRes = await fetch(`${Auth.apiBase}/api/auth/me`, {
                headers: this.getHeaders()
            });
            if (profileRes.ok) {
                const userData = await profileRes.json();
                this.setUser(userData.user);
            }

            // Fetch all tables
            for (const table of tables) {
                const res = await fetch(`${Auth.apiBase}/api/data/${table}`, {
                    headers: this.getHeaders()
                });
                if (res.ok) {
                    const data = await res.json();
                    if ((table === this.KEYS.SETTINGS || table === this.KEYS.CALCULATOR) && Array.isArray(data)) {
                        this._cache[table] = data[0] || {};
                    } else {
                        this._cache[table] = data;
                    }
                }
            }
            console.log('☁️ All data fetched from Supabase');

            if (triggerRender && typeof App !== 'undefined' && App.currentPage) {
                App.navigateTo(App.currentPage);
            }
        } catch (e) {
            console.error('Error fetching data:', e);
        }
    },

    getHeaders() {
        const token = localStorage.getItem('sp_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    },

    get(key) {
        return this._cache[key] || [];
    },

    async set(table, data) {
        this._cache[table] = data;
        return data;
    },

    // --- Helpers ---

    getUser() {
        return this._cache[this.KEYS.USER] || null;
    },

    async setUser(userData) {
        if (!userData) return;
        const user = userData;
        const normalizedUser = {
            ...user,
            ...(user.user_metadata || {}),
            company: user.user_metadata?.company || user.company || { name: user.user_metadata?.company_name || '' },
            isPro: user.user_metadata?.is_pro || user.is_pro || false
        };

        this._cache[this.KEYS.USER] = normalizedUser;
        if (typeof App !== 'undefined' && App.renderUserInfo) App.renderUserInfo();
    },

    async updateUser(updates) {
        const currentUser = this.getUser() || {};
        const merged = { ...currentUser, ...updates };
        if (updates.company && currentUser.company) {
            merged.company = { ...currentUser.company, ...updates.company };
        }
        await this.setUser(merged);

        try {
            const company = merged.company;
            if (company && company.name) {
                await fetch(`${Auth.apiBase}/api/auth/profile`, {
                    method: 'PUT',
                    headers: this.getHeaders(),
                    body: JSON.stringify({ company })
                });
            }
        } catch (e) {
            console.error("Error updating profile:", e);
        }
        return merged;
    },

    // --- CRUD Core ---

    async add(table, item) {
        const id = item.id || this.generateId();
        // Force retrieval from cache or localStorage fallback to ensure user_id
        let user = this.getUser();
        if (!user) {
            const stored = localStorage.getItem('sp_user');
            if (stored) user = JSON.parse(stored);
        }

        const payload = {
            ...item,
            id,
            user_id: user?.id
        };

        // Don't add to cache yet if we want true sync, or add and replace
        if (!Array.isArray(this._cache[table])) this._cache[table] = [];
        this._cache[table].push(payload);

        try {
            console.log(`[STORAGE] Syncing entry to ${table}...`);
            console.table(payload);
            const res = await fetch(`${Auth.apiBase}/api/data/${table}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                this._cache[table] = this._cache[table].filter(i => i.id !== id);
                console.error(`[STORAGE] Sync Error [v:${errorData.v || 'legacy'}]:`, errorData);
                if (errorData.DEBUG_MARKER) console.warn(`[SERVER-INFO] ${errorData.DEBUG_MARKER}`);

                // Construct a detailed error message
                let msg = errorData.message || `Erreur API ${res.status}`;
                if (errorData.error && errorData.error.message) msg = errorData.error.message;
                if (errorData.hint) msg += ` (Conseil: ${errorData.hint})`;

                throw new Error(msg);
            }

            const savedItems = await res.json();
            const confirmedItem = Array.isArray(savedItems) ? savedItems[0] : savedItems;

            // Re-sync local cache with real DB object (with ids, timestamps etc)
            this._cache[table] = this._cache[table].map(i => i.id === id ? confirmedItem : i);

            console.log(`[STORAGE] ${table} synced successfully.`);
            this.broadcastSync();
            return confirmedItem;
        } catch (e) {
            this._cache[table] = (this._cache[table] || []).filter(i => i.id !== id);
            console.error(`[STORAGE] Transaction failed for ${table}:`, e);
            throw e;
        }
    },

    async update(table, id, updates) {
        if (!this._cache[table]) return;

        let updatedItem = null;
        if (table === this.KEYS.SETTINGS || table === this.KEYS.CALCULATOR) {
            this._cache[table] = { ...this._cache[table], ...updates };
            updatedItem = this._cache[table];
        } else {
            const index = this._cache[table].findIndex(item => item.id === id);
            if (index !== -1) {
                this._cache[table][index] = { ...this._cache[table][index], ...updates };
                updatedItem = this._cache[table][index];
            }
        }

        try {
            console.log(`[STORAGE] UPDATE ${table} ${id}`, updates);
            const res = await fetch(`${Auth.apiBase}/api/data/${table}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ ...updates, id })
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Erreur API ${res.status}`);
            }
            this.broadcastSync();
            return updatedItem;
        } catch (e) {
            console.error(`Error updating ${table}:`, e);
            throw e;
        }
    },

    async delete(table, id) {
        const list = this._cache[table] || [];
        this._cache[table] = list.filter(i => i.id !== id);

        try {
            const res = await fetch(`${Auth.apiBase}/api/data/${table}/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Erreur API ${res.status}`);
            }
            this.broadcastSync();
        } catch (e) {
            console.error(`Error deleting from ${table}:`, e);
        }
    },

    // --- Domain Wrappers ---

    getClients() { return this.get(this.KEYS.CLIENTS); },
    getClient(id) { return (this._cache[this.KEYS.CLIENTS] || []).find(c => c.id === id); },
    async addClient(client) {
        const cleanClient = {
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
            company: client.company || '',
            siret: client.siret || '',
            notes: client.notes || '',
            defaultServiceIds: client.defaultServiceIds || []
        };
        return this.add(this.KEYS.CLIENTS, cleanClient);
    },
    async updateClient(id, updates) {
        const cleanUpdates = {};
        const allowed = ['name', 'email', 'phone', 'address', 'company', 'siret', 'notes', 'defaultServiceIds'];
        allowed.forEach(k => { if (updates[k] !== undefined) cleanUpdates[k] = updates[k]; });
        return this.update(this.KEYS.CLIENTS, id, cleanUpdates);
    },
    async deleteClient(id) { return this.delete(this.KEYS.CLIENTS, id); },

    getServices() { return this.get(this.KEYS.SERVICES); },
    getService(id) { return (this._cache[this.KEYS.SERVICES] || []).find(s => s.id === id); },
    async addService(service) { return this.add(this.KEYS.SERVICES, service); },
    async updateService(id, updates) { return this.update(this.KEYS.SERVICES, id, updates); },
    async deleteService(id) { return this.delete(this.KEYS.SERVICES, id); },

    getQuotes() { return this.get(this.KEYS.QUOTES); },
    getQuote(id) { return (this._cache[this.KEYS.QUOTES] || []).find(q => q.id === id || q.number === id); },
    async addQuote(quote) {
        const settings = this.get(this.KEYS.SETTINGS) || {};
        const count = (this.getQuotes() || []).length + 1;
        const q = {
            id: this.generateId(),
            number: `${settings.quotePrefix || 'DEV-'}${String(count).padStart(4, '0')}`,
            ...quote,
            createdAt: new Date().toISOString(),
            status: quote.status || 'draft'
        };
        return this.add(this.KEYS.QUOTES, q);
    },
    async updateQuote(id, updates) { return this.update(this.KEYS.QUOTES, id, updates); },
    async deleteQuote(id) { return this.delete(this.KEYS.QUOTES, id); },

    getInvoices() { return this.get(this.KEYS.INVOICES); },
    getInvoice(id) { return (this._cache[this.KEYS.INVOICES] || []).find(i => i.id === id || i.number === id); },
    async addInvoice(invoice) {
        const settings = this.get(this.KEYS.SETTINGS) || {};
        const count = (this.getInvoices() || []).length + 1;
        const i = {
            id: this.generateId(),
            number: `${settings.invoicePrefix || 'FACT-'}${String(count).padStart(4, '0')}`,
            ...invoice,
            createdAt: new Date().toISOString(),
            status: invoice.status || 'draft'
        };
        return this.add(this.KEYS.INVOICES, i);
    },
    async updateInvoice(id, updates) { return this.update(this.KEYS.INVOICES, id, updates); },
    async deleteInvoice(id) { return this.delete(this.KEYS.INVOICES, id); },

    getLeads() { return this.get(this.KEYS.LEADS); },
    async addLead(lead) {
        const l = { id: this.generateId(), ...lead, createdAt: new Date().toISOString(), status: lead.status || 'cold' };
        return this.add(this.KEYS.LEADS, l);
    },
    async updateLead(id, updates) { return this.update(this.KEYS.LEADS, id, updates); },
    async deleteLead(id) { return this.delete(this.KEYS.LEADS, id); },

    getExpenses() { return this.get(this.KEYS.EXPENSES); },
    async addExpense(expense) { return this.add(this.KEYS.EXPENSES, expense); },
    async deleteExpense(id) { return this.delete(this.KEYS.EXPENSES, id); },

    // Marketplace & Network
    getPublicMissions() { return this.get(this.KEYS.MARKETPLACE_MISSIONS); },
    async addMission(mission) {
        // Normalisation pour correspondre au schéma (on peut stocker l'urgence/zone car Supabase l'accepte si on ajoute les colonnes)
        return this.add(this.KEYS.MARKETPLACE_MISSIONS, mission);
    },
    async deleteMission(id) { return this.delete(this.KEYS.MARKETPLACE_MISSIONS, id); },

    getNetworkProviders() { return this.get(this.KEYS.PROVIDERS); },
    async addProvider(provider) { return this.add(this.KEYS.PROVIDERS, provider); },
    async deleteProvider(id) { return this.delete(this.KEYS.PROVIDERS, id); },

    async updateSettings(updates) {
        const settings = this.get(this.KEYS.SETTINGS) || {};
        const newSettings = { ...settings, ...updates };
        this._cache[this.KEYS.SETTINGS] = newSettings;
        try {
            console.log('[STORAGE] Updating settings', newSettings);
            const res = await fetch(`${Auth.apiBase}/api/data/settings`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(newSettings)
            });
            if (res.ok) this.broadcastSync();
            return newSettings;
        } catch (e) {
            console.error('Failed to sync settings:', e);
            throw e;
        }
    },

    async updateCalculator(updates) {
        const current = this.get(this.KEYS.CALCULATOR) || {};
        const newData = { ...current, ...updates };
        this._cache[this.KEYS.CALCULATOR] = newData;
        try {
            console.log('[STORAGE] Updating calculator', newData);
            const res = await fetch(`${Auth.apiBase}/api/data/calculator_data`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(newData)
            });
            if (res.ok) this.broadcastSync();
            return newData;
        } catch (e) {
            console.error('Failed to sync calculator:', e);
            throw e;
        }
    },

    getStats() {
        const invoices = this.getInvoices() || [];
        const clients = this.getClients() || [];
        const expenses = this.getExpenses() || [];
        const now = new Date();
        const monthlyRevenue = invoices
            .filter(i => {
                const d = new Date(i.createdAt);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && i.status === 'paid';
            })
            .reduce((sum, i) => sum + (i.total || 0), 0);
        const monthlyExpenses = expenses
            .filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            })
            .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        return {
            monthlyRevenue, monthlyExpenses,
            netProfit: monthlyRevenue - monthlyExpenses,
            totalClients: clients.length,
            quotesCount: (this.getQuotes() || []).length,
            invoicesCount: invoices.length
        };
    },

    isPro() {
        const user = this.getUser();
        return !!(user && (user.user_metadata?.is_pro || user.is_pro));
    },

    getTier() {
        return this.isPro() ? 'expert' : 'standard';
    },

    getStreak() {
        return 0;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

// Auto-init
Storage.init();
