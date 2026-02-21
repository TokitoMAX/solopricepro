/**
 * Storage Module for SoloPrice Pro (v4.3 Debug)
 * Handles data synchronization with Supabase and local cache.
 */

// Simple event bus for reactivity
const EventBus = {
    listeners: {},
    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    },
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
};

const Storage = {
    // Keys match Supabase table names (with sp_ prefix where applicable)
    KEYS: {
        CLIENTS: 'sp_clients',
        QUOTES: 'sp_quotes',
        INVOICES: 'sp_invoices',
        LEADS: 'sp_leads',
        SERVICES: 'sp_services',
        EXPENSES: 'sp_expenses',
        SETTINGS: 'sp_settings',
        CALCULATOR_DATA: 'sp_calculator_data',
        USER_PROFILE: 'sp_user_profile', // Cloud table for user profile
        MARKETPLACE_MISSIONS: 'sp_marketplace_missions',
        MARKETPLACE_APPLICATIONS: 'sp_marketplace_applications',
        MARKETPLACE_INVITATIONS: 'sp_marketplace_invitations',
        PROVIDERS: 'sp_network_providers',
        REVENUES: 'sp_revenues',
        MY_MISSIONS: 'sp_my_missions',
        CALCULATOR: 'sp_calculator_data' // Alias for compatibility with calculator.js
    },

    _cache: {},
    _initPromise: null,

    async init() {
        if (this._initPromise) return this._initPromise;

        this._initPromise = (async () => {
            console.log('☁️ Storage initialized in Cloud-First mode.');

            // Initial fetch of all critical data
            await this.fetchAllData();

            // Setup real-time subscription IF Supabase client is available globally and we are online
            // (Skipped for simplicity in this version, relying on polling/action-based refresh)

            return true;
        })();
        return this._initPromise;
    },

    // --- Core CRUD ---

    async fetchAllData() {
        if (!Auth.user) {
            console.log('🔒 Cannot fetch data: User not logged in.');
            return;
        }

        const tables = [
            this.KEYS.CLIENTS,
            this.KEYS.QUOTES,
            this.KEYS.INVOICES,
            this.KEYS.LEADS,
            this.KEYS.SERVICES,
            this.KEYS.EXPENSES,
            this.KEYS.SETTINGS,
            this.KEYS.CALCULATOR_DATA,
            this.KEYS.USER_PROFILE,
            this.KEYS.MARKETPLACE_MISSIONS, // Public data
            this.KEYS.MARKETPLACE_APPLICATIONS, // Generic fetch (Candidate view)
            this.KEYS.MARKETPLACE_INVITATIONS,   // Add Invitations Sync
            this.KEYS.PROVIDERS
        ];

        console.log('🔄 Syncing all tables from Supabase...');

        await Promise.all(tables.map(async (table) => {
            try {
                let endpoint = `${Auth.apiBase}/api/data/${table}`;
                if (table === this.KEYS.MARKETPLACE_INVITATIONS) {
                    endpoint = `${Auth.apiBase}/api/marketplace/invitations`;
                }

                const res = await fetch(endpoint, {
                    headers: { 'Authorization': `Bearer ${Auth.token}` }
                });

                if (res.ok) {
                    let data = await res.json();

                    // Singular tables normalization: [{ ... }] -> { ... }
                    const singularKeyList = [this.KEYS.SETTINGS, this.KEYS.CALCULATOR_DATA, this.KEYS.USER_PROFILE, 'sp_user_profile'];
                    if (singularKeyList.includes(table) && Array.isArray(data)) {
                        data = data.length > 0 ? data[0] : {};
                    }

                    this._cache[table] = data;
                    console.log(`📡 Table [${table}] synced: ${Array.isArray(data) ? data.length : '1'} item(s)`);
                } else if (res.status === 401 || res.status === 403) {
                    console.error(`🔒 Unauthorized access to [${table}]. Session might be expired.`);
                    // We only want to trigger this once per batch
                    if (!this._handlingAuthError) {
                        this._handlingAuthError = true;
                        Auth.handleExpiredSession();
                    }
                } else {
                    console.warn(`⚠️ Failed to sync [${table}]: ${res.status}`);
                    this._cache[table] = [];
                }
            } catch (err) {
                console.error(`❌ Network error fetching [${table}]`, err);
                this._cache[table] = []; // Fallback to empty
            }
        }));

        this._handlingAuthError = false;

        console.log('☁️ All data fetched from Supabase');
        EventBus.emit('storage:ready');
    },

    get(key) {
        // 1. Check if it's a known table in cache
        if (this._cache[key]) return this._cache[key];

        // 2. Check localStorage for transient data (drafts, settings, etc.)
        try {
            const local = localStorage.getItem(key);
            if (local) return JSON.parse(local);
        } catch (e) {
            console.warn(`Error reading ${key} from localStorage`, e);
        }

        // 3. Default fallback
        if (key === this.KEYS.SETTINGS) return {};
        // Default fallback for tables
        return [];
    },

    set(key, value) {
        // 1. Update cache
        this._cache[key] = value;

        // 2. Persist to localStorage if it looks like transient data (not a huge table)
        // or specifically requested keys like drafts
        const transientKeys = ['sp_draft_quote_item', 'sp_draft_quote_items', 'sp_user_cache'];
        if (transientKeys.includes(key) || key.startsWith('sp_draft_')) {
            try {
                if (value === null) {
                    localStorage.removeItem(key);
                } else {
                    localStorage.setItem(key, JSON.stringify(value));
                }
            } catch (e) {
                console.warn(`Error persisting ${key} to localStorage`, e);
            }
        }
    },

    async add(key, item) {
        try {
            console.log(`[STORAGE] Syncing entry to ${key}...`);
            console.dir(item);

            const res = await fetch(`${Auth.apiBase}/api/data/${key}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.token}`
                },
                body: JSON.stringify(item)
            });

            const responseData = await res.json();

            if (!res.ok) {
                console.error(`[STORAGE] Sync Error [v:legacy]:`, responseData);

                // Check for Schema Cache Error and trigger generic alert if needed
                if (responseData.message && responseData.message.includes("schema cache")) {
                    console.error("[SERVER-INFO] !!-FAST-SYNC-ACTIVE-RESTART-SERVER-!!");
                }

                throw new Error(responseData.message || `Failed to add to ${key}`);
            }

            console.log(`[STORAGE] ${key} synced successfully.`, responseData);

            // Optimistic update or refetch?
            // For now, let's just push to cache if we got the data back
            if (responseData.data && responseData.data.length > 0) {
                if (!this._cache[key]) this._cache[key] = [];
                this._cache[key].push(responseData.data[0]);
                EventBus.emit('data:updated', { key, action: 'add', item: responseData.data[0] });
                return responseData.data[0];
            }

            // Fallback if backend didn't return data (should not happen with select())
            return item;

        } catch (err) {
            console.error(`[STORAGE] Transaction failed for ${key}:`, err);
            throw err;
        }
    },

    async update(key, id, updates) {
        try {
            // Optimistic update
            const list = this._cache[key] || [];
            const index = list.findIndex(i => i.id === id);
            if (index !== -1) {
                list[index] = { ...list[index], ...updates };
                this._cache[key] = [...list]; // Trigger reactivity if needed
                EventBus.emit('data:updated', { key, action: 'update', id, updates });
            }

            // Sync
            await fetch(`${Auth.apiBase}/api/data/${key}`, {
                method: 'POST', // We use UPSERT methodology in backend usually, or duplicate logic
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.token}`
                },
                body: JSON.stringify({ id, ...updates }) // Ensure ID is present
            });

            // Ideally we re-fetch or handle response, but for MVP optimization we assume success
            return list[index];

        } catch (err) {
            console.error(`[STORAGE] Update failed for ${key}:`, err);
            // Revert optimistic update? (Advanced)
        }
    },

    async delete(key, id) {
        try {
            // Optimistic
            const list = this._cache[key] || [];
            this._cache[key] = list.filter(i => i.id !== id);
            EventBus.emit('data:updated', { key, action: 'delete', id });

            // Sync
            await fetch(`${Auth.apiBase}/api/data/${key}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${Auth.token}` }
            });

        } catch (err) {
            console.error(`[STORAGE] Delete failed for ${key}:`, err);
        }
    },

    // Helper: Upload logo to Supabase Storage
    async uploadLogo(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', `logos/${Date.now()}_${file.name}`); // Unique path

        try {
            const res = await fetch(`${Auth.apiBase}/api/data/storage/upload/logos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Auth.token}`
                },
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            return data.publicUrl; // Return only the string URL as expected by profile.js
        } catch (err) {
            console.error('Logo upload error:', err);
            throw err;
        }
    },

    // --- Domain Specific Helpers ---

    getClients() { return this.get(this.KEYS.CLIENTS); },
    async addClient(client) {
        // Generate ID if not present (backend handles it usually but for optimistic UI)
        const c = { id: this.generateId(), ...client, createdAt: new Date().toISOString() };
        return this.add(this.KEYS.CLIENTS, c);
    },
    async updateClient(id, updates) { return this.update(this.KEYS.CLIENTS, id, updates); },
    async deleteClient(id) { return this.delete(this.KEYS.CLIENTS, id); },
    getClient(id) { return (this._cache[this.KEYS.CLIENTS] || []).find(c => c.id === id); },

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

    // Services (Catalogue)
    getServices() { return this.get(this.KEYS.SERVICES) || []; },
    getService(id) { return (this._cache[this.KEYS.SERVICES] || []).find(s => s.id === id); },
    async addService(service) {
        const item = { id: this.generateId(), ...service, createdAt: new Date().toISOString() };
        return this.add(this.KEYS.SERVICES, item);
    },
    async updateService(id, updates) { return this.update(this.KEYS.SERVICES, id, updates); },
    async deleteService(id) { return this.delete(this.KEYS.SERVICES, id); },

    // Marketplace & Network
    getPublicMissions() { return this.get(this.KEYS.MARKETPLACE_MISSIONS); },
    async addMission(mission) {
        // Normalisation pour correspondre au schéma (on peut stocker l'urgence/zone car Supabase l'accepte si on ajoute les colonnes)
        return this.add(this.KEYS.MARKETPLACE_MISSIONS, mission);
    },
    async updateMission(id, updates) {
        return this.update(this.KEYS.MARKETPLACE_MISSIONS, id, updates);
    },
    async deleteMission(id) { return this.delete(this.KEYS.MARKETPLACE_MISSIONS, id); },

    // Applications (Centralized Flow)
    async addApplication(application) {
        return this.add('sp_marketplace_applications', application);
    },

    async getInbox() {
        try {
            console.log('[STORAGE] Fetching Inbox...');
            const res = await fetch(`${Auth.apiBase}/api/marketplace/inbox`, {
                headers: { 'Authorization': `Bearer ${Auth.token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch inbox: ' + res.status);
            const data = await res.json();
            console.log('[STORAGE] Inbox data:', data);
            return data;
        } catch (err) {
            console.error('[STORAGE] Inbox Fetch Error:', err);
            return [];
        }
    },

    // Get missions owned by specific user (Client-side filtering helper)
    getMyMissions(userId) {
        const all = this.getPublicMissions() || [];
        if (!userId) return [];

        console.log(`[STORAGE] Filtering my missions for user: ${userId}`);
        // Ensure type safety (String comparison)
        const myMissions = all.filter(m => String(m.user_id) === String(userId));
        console.log(`[STORAGE] Found ${myMissions.length} missions out of ${all.length}`);
        return myMissions;
    },

    getNetworkProviders() { return this.get(this.KEYS.PROVIDERS); },
    async addProvider(provider) { return this.add(this.KEYS.PROVIDERS, provider); },
    async deleteProvider(id) { return this.delete(this.KEYS.PROVIDERS, id); },

    async updateSettings(updates) {
        const settings = this.get(this.KEYS.SETTINGS) || {};
        const newSettings = { ...settings, ...updates };
        this._cache[this.KEYS.SETTINGS] = newSettings;
        try {
            console.log('[STORAGE] Updating settings', newSettings);
            const res = await fetch(`${Auth.apiBase}/api/data/${this.KEYS.SETTINGS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.token}`
                },
                body: JSON.stringify(newSettings)
            });
        } catch (e) {
            console.error(e);
        }
    },
    getSettings() { return this._cache[this.KEYS.SETTINGS] || {}; },

    getCalculatorData() { return this.get(this.KEYS.CALCULATOR_DATA) || {}; },
    async saveCalculatorData(data) {
        this._cache[this.KEYS.CALCULATOR_DATA] = data;
        return this.add(this.KEYS.CALCULATOR_DATA, data); // Upsert handles it
    },
    async updateCalculator(data) {
        return this.saveCalculatorData(data);
    },

    calculateStats() {
        // ... (existing logic)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const revenues = this.getInvoices()
            .filter(i => (i.expert_paid_at || i.status === 'paid') && new Date(i.createdAt).getMonth() === currentMonth)
            .reduce((sum, i) => sum + (parseFloat(i.itemsSubtotal || i.subtotal) || 0), 0);

        const expenses = this.getExpenses()
            .filter(e => new Date(e.date).getMonth() === currentMonth)
            .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        return {
            revenue: revenues,
            expenses: expenses,
            profit: revenues - expenses,
            margin: revenues > 0 ? ((revenues - expenses) / revenues) * 100 : 0
        };
    },

    checkUserTier() {
        const clients = this.getClients().length;
        // Simple logic for now
        return {
            plan: 'standard',
            canAddClient: clients < 1, // Limit for free tier
            limitReached: clients >= 1
        };
    },

    // Restoration of missing methods for app.js compatibility
    getTier() {
        // 1. Priorité à l'admin (insensible à la casse)
        if (typeof Auth !== 'undefined' && Auth.user && Auth.user.email && Auth.user.email.toLowerCase() === 'domtomconnect@gmail.com') {
            return 'expert';
        }

        // 2. Vérifier les métadonnées auth (source de vérité du backend)
        if (typeof Auth !== 'undefined' && Auth.user && Auth.user.user_metadata) {
            if (Auth.user.user_metadata.tier) return Auth.user.user_metadata.tier;
            if (Auth.user.user_metadata.is_pro) return 'pro';
        }

        // 3. Fallback sur les settings
        const settings = this.getSettings();
        return settings.plan || 'free';
    },

    isPro() {
        const tier = this.getTier();
        return tier === 'pro' || tier === 'expert' || tier === 'growth' || tier === 'scale';
    },

    async activatePro(licenseKey, tier = 'pro') {
        console.log(`🚀 Activating [${tier.toUpperCase()}] via ${licenseKey}...`);

        // 1. Update settings local cache
        const settings = this.getSettings();
        settings.plan = tier;
        settings.licenseKey = licenseKey;
        await this.updateSettings({ plan: tier, licenseKey: licenseKey });

        // 2. Update user metadata if possible
        if (typeof Auth !== 'undefined' && Auth.user) {
            Auth.user.is_pro = true;
            Auth.user.user_metadata = {
                ...Auth.user.user_metadata,
                is_pro: true,
                tier: tier
            };
            localStorage.setItem('sp_user', JSON.stringify(Auth.user));
        }

        // 3. Emit event for UI update
        EventBus.emit('data:updated', { key: this.KEYS.SETTINGS, action: 'update' });

        console.log('✅ Activation complete.');
    },

    isExpert() {
        return this.getTier() === 'expert';
    },

    getSubscriptionStatus() {
        const isPro = this.isPro();
        return {
            isPro,
            isLifetime: false,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            daysLeft: 30
        };
    },

    async updateUser(updates) {
        // Prepare new profile state
        let profile = { ...(this._cache[this.KEYS.USER_PROFILE] || {}) };

        if (updates.company) {
            profile = { ...profile, ...updates.company };
        } else {
            profile = { ...profile, ...updates };
        }

        // Apply locally first
        this.setUser(profile);

        // Persist to Supabase
        if (typeof Auth !== 'undefined' && Auth.user) {
            const payload = updates.company || updates;
            try {
                const res = await fetch(`${Auth.apiBase}/api/data/${this.KEYS.USER_PROFILE}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Auth.token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Erreur lors de la synchronisation avec le serveur.');
                }

                console.log('✅ Profile synced with server.');
            } catch (e) {
                console.error('❌ Backend sync failed:', e);
                throw e; // Propagate to caller (profile.js) so it shows the error
            }
        }
    },

    // --- Legacy / Compatibility Helpers ---

    getUser() {
        const authUser = (typeof Auth !== 'undefined' ? Auth.user : null);
        const dbProfile = this._cache[this.KEYS.USER_PROFILE];

        if (dbProfile && authUser) {
            return {
                ...authUser,
                ...dbProfile,
                company: dbProfile // This is correct because dbProfile is the flattened company info
            };
        }

        // Fallback to local storage cache if available
        if (!dbProfile) {
            const cached = localStorage.getItem('sp_user_cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                return { ...authUser, ...parsed, company: parsed };
            }
        }

        return dbProfile || authUser;
    },

    getUserCompany() {
        const user = this.getUser();
        if (!user) return {};
        // If user is from DB, it already has the fields or is the company object
        // If user is from Auth only, look in metadata
        return user.company || user.user_metadata?.company || (user.name ? user : {});
    },

    getNormalizedUser() {
        const user = this.getUser();
        if (!user) return null;
        return {
            ...user,
            company: this.getUserCompany(),
            isPro: this.isPro(),
            tier: this.getTier()
        };
    },

    setUser(user) {
        this._cache[this.KEYS.USER_PROFILE] = user;
        // In a real app, we might persist this to localStorage or DB
        localStorage.setItem('sp_user_cache', JSON.stringify(user));
    },

    getStreak() {
        // Simple streak calculation stub
        return 1; // Todo: Implement real streak logic based on daily login/activity
    },

    getStats() {
        // Aggregated stats for Dashboard
        const quotes = this.getQuotes();
        const invoices = this.getInvoices();
        const clients = this.getClients();
        const expenses = this.getExpenses();

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyRevenue = invoices
            .filter(i => (i.expert_paid_at || i.status === 'paid') && new Date(i.createdAt).getMonth() === currentMonth && new Date(i.createdAt).getFullYear() === currentYear)
            .reduce((sum, i) => sum + (parseFloat(i.itemsSubtotal || i.subtotal) || 0), 0);

        const totalRevenue = invoices
            .filter(i => (i.expert_paid_at || i.status === 'paid'))
            .reduce((sum, i) => sum + (parseFloat(i.itemsSubtotal || i.subtotal) || 0), 0);

        return {
            monthlyRevenue,
            totalRevenue,
            totalClients: clients.length,
            activeQuotes: quotes.filter(q => q.status === 'sent' || q.status === 'draft').length
        };
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

window.Storage = Storage;

// Auto-init removed. App.init() is now responsible for initializing Storage after Auth verification.
