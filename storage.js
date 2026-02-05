// SoloPrice Pro - Storage Manager (Cloud-First)
// Gestion centralisée des données via Supabase API (No Local Storage Persistence)

const Storage = {
    // Clés pour le cache mémoire (ne persiste pas au refresh)
    KEYS: {
        USER: 'sp_user', // LocalStorage allowed only for minimal session info if needed, but primary is cache
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

    init() {
        console.log("☁️ Storage initialized in Cloud-First mode.");
        // Le token reste en localStorage pour l'auth
        const token = localStorage.getItem('sp_token');
        if (token) {
            // Déclencher le chargement initial si connecté
            // Note: C'est asynchrone, l'UI doit gérer le loading state via App
            this.fetchAllData();
        }
    },

    // --- Core API Methods ---

    async fetchAllData() {
        if (!Auth.isLoggedIn()) return;

        console.log("📥 Fetching all data from Supabase...");
        const tables = [
            this.KEYS.CLIENTS,
            this.KEYS.QUOTES,
            this.KEYS.INVOICES,
            this.KEYS.SERVICES,
            this.KEYS.LEADS,
            this.KEYS.EXPENSES,
            this.KEYS.REVENUES,
            this.KEYS.SETTINGS,
            this.KEYS.MARKETPLACE_MISSIONS,
            this.KEYS.MY_MISSIONS,
            this.KEYS.PROVIDERS
        ];

        try {
            // Fetch User Profile first
            const userRes = await fetch(`${Auth.apiBase}/api/auth/me`, {
                headers: this.getHeaders()
            });
            if (userRes.ok) {
                const userData = await userRes.json();
                this._cache[this.KEYS.USER] = userData.user;
                // Update UI User info immediately
                if (window.App && App.renderUserInfo) App.renderUserInfo();
            }

            // Fetch Tables in parallel
            const promises = tables.map(table =>
                fetch(`${Auth.apiBase}/api/data/${table}`, { headers: this.getHeaders() })
                    .then(r => r.ok ? r.json() : [])
                    .then(data => {
                        this._cache[table] = data;
                        return { table, count: data.length };
                    })
                    .catch(e => {
                        console.error(`Failed to fetch ${table}:`, e);
                        this._cache[table] = []; // Fallback empty
                        return { table, error: true };
                    })
            );

            await Promise.all(promises);
            console.log("✅ All data loaded from Supabase.");

            // Trigger UI refresh events if needed
            // dispatchEvent(new CustomEvent('sp-data-ready'));

        } catch (e) {
            console.error("❌ Fatal error fetching data:", e);
        }
    },

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('sp_token')}`
        };
    },

    // --- Generic Getters (Sync from Cache) ---
    // L'UI lit le cache. Si le cache est vide au démarrage, ça doit être géré par des loading states

    get(key) {
        // Return empty array by default to prevent crashes with .length or .map
        return this._cache[key] || [];
    },

    // --- Generic Setters (Async API Call + Cache Update) ---

    async set(table, data) {
        // En Cloud-First, "set" écrase souvent tout, mais pour l'API on préfère 
        // upsert unitaire. Si 'data' est un tableau complet, on le save.
        // ATTENTION: Cette méthode 'set' legacy écrasait tout le tableau local. 
        // Pour l'API, on va essayer de sauver ce qu'on nous donne.

        // Update Cache immediately (Optimistic UI)
        this._cache[table] = data;

        try {
            await fetch(`${Auth.apiBase}/api/data/${table}`, {
                method: 'POST', // Notre endpoint POST gère l'upsert
                headers: this.getHeaders(),
                body: JSON.stringify(data) // Le backend doit gérer un array ou un objet
            });
        } catch (e) {
            console.error(`Error syncing ${table}:`, e);
            // Revert cache if critical?
            // Pour l'instant on log juste l'erreur
        }
    },

    // --- Helpers (Legacy Adapter) ---

    getUser() {
        // Fallback to localStorage USER if cache empty (for initial loads) but verify strict mode
        // STRICT MODE: Only cache.
        return this._cache[this.KEYS.USER] || null;
    },

    async setUser(userData) {
        // Update Profile API
        // userData contains partial or full user object. We extract 'company' part usually.
        this._cache[this.KEYS.USER] = { ...this._cache[this.KEYS.USER], ...userData };

        try {
            // On envoie surtout les métadonnées (Company)
            const company = userData.company || userData.user_metadata?.company;
            if (company) {
                await fetch(`${Auth.apiBase}/api/auth/profile`, {
                    method: 'PUT',
                    headers: this.getHeaders(),
                    body: JSON.stringify({ company })
                });
            }
        } catch (e) {
            console.error("Error updating profile:", e);
        }
    },

    async updateUser(updates) {
        const currentUser = this.getUser() || {};
        const merged = { ...currentUser, ...updates };
        if (updates.company && currentUser.company) {
            merged.company = { ...currentUser.company, ...updates.company };
        }
        await this.setUser(merged);
        return merged;
    },

    // --- CRUD Wrappers (To be used by modules) ---

    async add(table, item) {
        // Optimistic
        if (!this._cache[table]) this._cache[table] = [];
        this._cache[table].push(item);

        try {
            const res = await fetch(`${Auth.apiBase}/api/data/${table}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(item)
            });
            if (!res.ok) throw new Error('API Error');
            return await res.json(); // Returns saved item
        } catch (e) {
            console.error(`Error adding to ${table}:`, e);
            // Rollback
            this._cache[table] = this._cache[table].filter(i => i.id !== item.id);
            throw e;
        }
    },

    async update(table, id, updates) {
        // Optimistic
        const list = this._cache[table] || [];
        const index = list.findIndex(i => i.id === id);
        let previous = null;

        if (index !== -1) {
            previous = { ...list[index] };
            list[index] = { ...list[index], ...updates };
            this._cache[table] = list; // Trigger UI reactivity if framework used, here just ref update
        }

        try {
            // On envoie l'objet complet mis à jour ou partiel ? POST upsert gère l'objet complet
            const item = list[index];
            const res = await fetch(`${Auth.apiBase}/api/data/${table}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(item)
            });
            return await res.json();
        } catch (e) {
            console.error(`Error updating ${table}:`, e);
            // Rollback
            if (previous) {
                list[index] = previous;
                this._cache[table] = list;
            }
        }
    },

    async delete(table, id) {
        // Optimistic
        const list = this._cache[table] || [];
        this._cache[table] = list.filter(i => i.id !== id);

        try {
            await fetch(`${Auth.apiBase}/api/data/${table}/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
        } catch (e) {
            console.error(`Error deleting from ${table}:`, e);
            // Rollback difficult without re-fetching or keeping logic
        }
    },

    // --- Specific Domain Methods (Bridging the gap) ---

    // CLIENTS
    getClients() { return this.get(this.KEYS.CLIENTS); },
    async addClient(client) {
        const c = { id: this.generateId(), ...client, createdAt: new Date().toISOString() };
        await this.add(this.KEYS.CLIENTS, c);
        return c;
    },
    async updateClient(id, updates) { return this.update(this.KEYS.CLIENTS, id, updates); },
    async deleteClient(id) { return this.delete(this.KEYS.CLIENTS, id); },

    // QUOTES
    getQuotes() { return this.get(this.KEYS.QUOTES); },
    async addQuote(quote) {
        // Logic for number generation needs to be cautious with async
        // For now, optimistic length based
        const settings = this.get(this.KEYS.SETTINGS) || {};
        const count = (this.getQuotes() || []).length + 1;

        const q = {
            id: this.generateId(),
            number: `${settings.quotePrefix || 'DEV-'}${String(count).padStart(4, '0')}`,
            ...quote,
            createdAt: new Date().toISOString(),
            status: quote.status || 'draft'
        };
        await this.add(this.KEYS.QUOTES, q);
        return q;
    },
    async updateQuote(id, updates) { return this.update(this.KEYS.QUOTES, id, updates); },
    async deleteQuote(id) { return this.delete(this.KEYS.QUOTES, id); },

    // INVOICES
    getInvoices() { return this.get(this.KEYS.INVOICES); },
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
        await this.add(this.KEYS.INVOICES, i);
        return i;
    },
    async updateInvoice(id, updates) { return this.update(this.KEYS.INVOICES, id, updates); },
    async deleteInvoice(id) { return this.delete(this.KEYS.INVOICES, id); },

    // LEADS
    getLeads() { return this.get(this.KEYS.LEADS); },
    async addLead(lead) {
        const l = { id: this.generateId(), ...lead, createdAt: new Date().toISOString(), status: lead.status || 'cold' };
        await this.add(this.KEYS.LEADS, l);
        return l;
    },
    async updateLead(id, updates) { return this.update(this.KEYS.LEADS, id, updates); },
    async deleteLead(id) { return this.delete(this.KEYS.LEADS, id); },

    // MARKETPLACE (New Cloud Methods)
    getPublicMissions() { return this.get(this.KEYS.MARKETPLACE_MISSIONS); },
    async addMission(mission) {
        // Mission logic often saves to MY_MISSIONS and MARKETPLACE_MISSIONS
        // Backend should probably handle this duplication or we send two requests.
        // For now, simpler: user 'saves' to my_missions table. Global radar reads all.
        // Let's assume we save to 'marketplace_missions' table which is public.
        await this.add(this.KEYS.MARKETPLACE_MISSIONS, mission);
        await this.add(this.KEYS.MY_MISSIONS, mission); // Keep track of mine separately or filter? API filtering is better but stick to plan.
    },

    // UTILS
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // SUBSCRIPTION (Helpers)
    isPro() {
        const user = this.getUser() || (typeof Auth !== 'undefined' ? Auth.getUser() : null);
        if (!user) return false;
        // Check local override or metadata
        if (user.user_metadata?.is_pro || user.is_pro) return true;
        return false;
    },

    getSubscriptionStatus() {
        // Simplified for this context
        return { isActive: this.isPro(), isLifetime: true };
    },

    getTier() {
        return this.isPro() ? 'expert' : 'standard';
    },

    async updateSettings(updates) {
        const settings = this.get(this.KEYS.SETTINGS) || {};
        const newSettings = { ...settings, ...updates };
        this._cache[this.KEYS.SETTINGS] = newSettings; // Optimistic

        try {
            await fetch(`${Auth.apiBase}/api/data/settings`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(newSettings)
            });
        } catch (e) {
            console.error('Failed to sync settings:', e);
        }
    },

    getStreak() {
        return 0; // Simplified for now
    },

    // EXPENSES
    getExpenses() { return this.get(this.KEYS.EXPENSES) || []; },
    async addExpense(expense) {
        const e = { id: this.generateId(), ...expense, createdAt: new Date().toISOString() };
        await this.add(this.KEYS.EXPENSES, e);
        return e;
    },
    async deleteExpense(id) { return this.delete(this.KEYS.EXPENSES, id); },

    // STATS
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
            monthlyRevenue,
            monthlyExpenses,
            netProfit: monthlyRevenue - monthlyExpenses,
            totalClients: clients.length,
            quotesCount: (this.getQuotes() || []).length,
            invoicesCount: invoices.length
        };
    }
};

// Auto-init
Storage.init();

