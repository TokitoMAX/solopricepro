/**
 * Storage Module for SoloPrice Pro (v4.3)
 * Handles data synchronization with Supabase and local cache.
 */

// Log conditionnel — actif seulement si localStorage.getItem('sp_debug') === '1'
const _log = (...args) => { if (localStorage.getItem('sp_debug') === '1') console.log(...args); };

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
        JOURNAL: 'sp_journal',
        CALCULATOR: 'sp_calculator_data' // Alias for compatibility with calculator.js
    },

    _cache: {},
    _initPromise: null,

    async init() {
        if (this._initPromise) return this._initPromise;

        this._initPromise = (async () => {
            console.log('[STORAGE] Initialization in Cloud-First mode.');

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
            console.log('[AUTH] Cannot fetch data: User not logged in.');
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
            this.KEYS.PROVIDERS,
            this.KEYS.REVENUES,
            this.KEYS.JOURNAL
        ];

        console.log('[STORAGE] Syncing all tables from Supabase...');

        await Promise.all(tables.map(async (table) => {
            try {
                let endpoint = `${Auth.apiBase}/api/data/${table}`;
                if (table === this.KEYS.MARKETPLACE_INVITATIONS) {
                    endpoint = `${Auth.apiBase}/api/marketplace/invitations`;
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

                const res = await fetch(endpoint, {
                    headers: { 'Authorization': `Bearer ${Auth.token}` },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    let data = await res.json();

                    // Singular tables normalization: [{ ... }] -> { ... }
                    const singularKeyList = [this.KEYS.SETTINGS, this.KEYS.CALCULATOR_DATA, this.KEYS.USER_PROFILE, 'sp_user_profile', this.KEYS.JOURNAL];
                    if (singularKeyList.includes(table) && Array.isArray(data)) {
                        data = data.length > 0 ? data[0] : {};
                    }

                    this._cache[table] = data;
                    console.log(` Table [${table}] synced: ${Array.isArray(data) ? data.length : '1'} item(s)`);
                } else if (res.status === 401 || res.status === 403) {
                    console.error(` Unauthorized access to [${table}]. Session might be expired.`);
                    // We only want to trigger this once per batch
                    if (!this._handlingAuthError) {
                        this._handlingAuthError = true;
                        Auth.handleExpiredSession();
                    }
                } else {
                    console.warn(`️ Failed to sync [${table}]: ${res.status}`);
                    this._cache[table] = [];
                }
            } catch (err) {
                console.error(` Network error fetching [${table}]`, err);
                this._cache[table] = []; // Fallback to empty
            }
        }));

        this._handlingAuthError = false;

        console.log('️ All data fetched from Supabase');
        EventBus.emit('storage:ready');
    },

    get(key) {
        // 1. Check cache
        const cached = this._cache[key];

        // Handle primitive values (numbers, strings, booleans) — Object.keys() doesn't work on these
        if (cached !== undefined && cached !== null && typeof cached !== 'object') {
            return cached;
        }

        // Handle arrays and objects
        if (cached && (Array.isArray(cached) ? cached.length > 0 : Object.keys(cached).length > 0)) {
            return cached;
        }

        // 2. Check localStorage ONLY for authorized ephemeral/UI keys
        const authorizedLocalKeys = [
            'sp_token', 'sp_user', 'sp_lang', 'sp_in_app', 'sp_last_page', 
            'sp_user_cache', 'sp_scoper_current_step', 'sp_debug'
        ];
        
        // Dynamic tab keys are also authorized
        const isAuthorized = authorizedLocalKeys.includes(key) || key.startsWith('sp_last_tab_');

        if (isAuthorized) {
            try {
                const local = localStorage.getItem(key);
                if (local) return JSON.parse(local);
            } catch (e) {
                console.warn(`Error reading ${key} from localStorage`, e);
            }
        }

        // 3. Default fallback
        if (key === this.KEYS.SETTINGS) return {};
        if (key === this.KEYS.JOURNAL) return { mood: 'motivated', entries: [] };
        if (key === this.KEYS.CALCULATOR_DATA) return { monthlyRevenue: 5000, workingDays: 20 };
        // Default fallback for tables
        return [];
    },

    set(key, value) {
        // 1. Update cache
        this._cache[key] = value;

        // 2. Persist to localStorage ONLY for authorized ephemeral/UI keys
        const authorizedLocalKeys = [
            'sp_token', 'sp_user', 'sp_lang', 'sp_in_app', 'sp_last_page', 
            'sp_user_cache', 'sp_scoper_current_step', 'sp_debug',
            'sp_draft_quote_item' // Ephemeral draft allowed
        ];
        
        const isAuthorized = authorizedLocalKeys.includes(key) || key.startsWith('sp_last_tab_');

        if (isAuthorized) {
            try {
                if (value === null) {
                    localStorage.removeItem(key);
                } else {
                    localStorage.setItem(key, JSON.stringify(value));
                }
            } catch (e) {
                console.warn(`Error persisting ${key} to localStorage`, e);
            }
        } else {
            // Ensure business data is NOT in localStorage
            // If it was there (e.g. from old version), we might want to clean it up, 
            // but for now we just don't write it.
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
        formData.append('path', `logos/${Date.now()}_${file.name}`);

        try {
            const res = await fetch(`${Auth.apiBase}/api/data/storage/upload/logos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${Auth.token}` },
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            return data.publicUrl;
        } catch (err) {
            console.error('Logo upload error:', err);
            throw err;
        }
    },

    // Helper: Upload avatar to Supabase Storage
    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('file', file);
        const ext = file.name.split('.').pop();
        formData.append('path', `avatars/${Auth.user.id}_profile.${ext}`);

        try {
            const res = await fetch(`${Auth.apiBase}/api/data/storage/upload/avatars`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${Auth.token}` },
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            return data.publicUrl;
        } catch (err) {
            console.error('Avatar upload error:', err);
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
        // Left for backward compatibility, but always allowed now via app_v5.js checkFreemiumLimits
        return {
            plan: this.getTier(),
            canAddClient: true,
            limitReached: false
        };
    },

    // Restoration of missing methods for app.js compatibility
    getTier() {
        const tier = this._calculateTier();
        console.log(`️ [STORAGE] Current Tier calculated: ${tier}`);
        return tier;
    },
    _calculateTier() {
        if (typeof Auth === 'undefined' || !Auth.user) return 'free';

        const user = Auth.user;
        const isAdminEmail = user.email && user.email.toLowerCase() === 'domtomconnect@gmail.com';
        const isAdminRole = user.role === 'admin' || user.user_metadata?.role === 'admin';

        if (isAdminEmail || isAdminRole) return 'expert';

        // Single Source of Truth: The JWT Auth Metadata
        if (user.user_metadata) {
            if (user.user_metadata.tier) return user.user_metadata.tier;
            if (user.user_metadata.is_pro === true || user.user_metadata.is_pro === 'true') return 'pro';
        }

        return 'free';
    },

    isPro() {
        const tier = this.getTier();
        return tier === 'pro' || tier === 'expert' || tier === 'growth' || tier === 'scale';
    },

    async activatePro(licenseKey, tier = 'pro') {
        console.log(` Activating [${tier.toUpperCase()}] via ${licenseKey}...`);

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

        console.log(' Activation complete.');
    },

    isExpert() {
        return this.getTier() === 'expert';
    },

    async cancelSubscription() {
        if (typeof Auth === 'undefined' || !Auth.user) return false;

        try {
            console.log(' Requesting subscription cancellation...');

            // 1. Sync with Backend
            const res = await fetch(`${Auth.apiBase}/api/payments/paypal-cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: Auth.user.id })
            });

            if (!res.ok) throw new Error('Cancellation failed');

            // 2. Update local state
            Auth.user.subscriptionCanceled = true;
            Auth.user.user_metadata = {
                ...Auth.user.user_metadata,
                subscription_canceled: true
            };
            localStorage.setItem('sp_user', JSON.stringify(Auth.user));

            return true;
        } catch (err) {
            console.error('Cancellation Error:', err);
            return false;
        }
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

        if (typeof Auth === 'undefined' || !Auth.user) return;

        const rawPayload = updates.company || updates;

        // Strip fields that don't exist as columns in sp_user_profile
        // (e.g. 'country' is stored in user_metadata instead)
        const { country: _country, ...payload } = rawPayload;
        const country = _country || '';

        // 1. Sync company/profile data to sp_user_profile table
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

            console.log(' Profile synced with server.');
        } catch (e) {
            console.error(' Backend sync failed:', e);
            throw e;
        }

        // 2. Also update first_name/last_name + country in Supabase Auth user_metadata
        const firstName = updates.first_name || '';
        const lastName = updates.last_name || '';
        if (firstName || lastName || country) {
            try {
                await fetch(`${Auth.apiBase}/api/auth/update-metadata`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Auth.token}`
                    },
                    body: JSON.stringify({ first_name: firstName, last_name: lastName, country })
                });
                // Update local auth cache so profile re-renders correctly
                if (Auth.user.user_metadata) {
                    Auth.user.user_metadata.first_name = firstName;
                    Auth.user.user_metadata.last_name = lastName;
                    Auth.user.user_metadata.full_name = `${firstName} ${lastName}`.trim();
                    Auth.user.user_metadata.country = country;
                } else {
                    Auth.user.user_metadata = { first_name: firstName, last_name: lastName, country };
                }
                localStorage.setItem('sp_user', JSON.stringify(Auth.user));
                console.log(' Auth metadata + country updated.');
            } catch (e) {
                console.warn('️ Metadata update failed (non-blocking):', e.message);
            }
        }
    },

    async saveJournal(data) {
        if (!Auth.user) return;

        // Ensure user_id and id are preserved for proper UPSERT
        const cached = this._cache[this.KEYS.JOURNAL] || {};
        const journalToSave = {
            ...cached,
            ...data,
            user_id: Auth.user.id
        };

        this.set(this.KEYS.JOURNAL, journalToSave);
        return this.add(this.KEYS.JOURNAL, journalToSave);
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
        // Calcul réel de la streak basé sur les entrées du journal de bord
        try {
            const journal = this.get(this.KEYS.JOURNAL) || [];
            if (!journal.length) return 0;

            // Trier les entrées par date décroissante
            const sortedDates = journal
                .map(e => new Date(e.date || e.createdAt || e.created_at).toDateString())
                .filter(d => d !== 'Invalid Date');

            // Dédupliquer les dates
            const uniqueDates = [...new Set(sortedDates)]
                .map(d => new Date(d))
                .sort((a, b) => b - a); // Plus récent en premier

            if (!uniqueDates.length) return 0;

            // Vérifier si aujourd'hui ou hier est inclus (streak active)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const mostRecent = new Date(uniqueDates[0]);
            mostRecent.setHours(0, 0, 0, 0);

            // Si la dernière entrée est plus ancienne qu'hier → streak brisée
            if (mostRecent < yesterday) return 0;

            // Compter les jours consécutifs
            let streak = 1;
            for (let i = 1; i < uniqueDates.length; i++) {
                const prev = new Date(uniqueDates[i - 1]);
                const curr = new Date(uniqueDates[i]);
                prev.setHours(0, 0, 0, 0);
                curr.setHours(0, 0, 0, 0);
                const diff = (prev - curr) / (1000 * 60 * 60 * 24);
                if (diff === 1) {
                    streak++;
                } else {
                    break; // Rupture de la streak
                }
            }
            return streak;
        } catch (e) {
            return 0;
        }
    },

    getSubscriptionStatus() {
        // Retourne les vraies informations d'abonnement depuis les métadonnées utilisateur
        try {
            const user = this.getUser();
            const meta = user?.user_metadata || {};
            const tier = this.getTier();
            const isPro = this.isPro();

            if (!isPro || tier === 'free' || tier === 'standard') {
                return { active: false, tier: 'standard', daysLeft: 0, expiryDate: null };
            }

            // Lire la date d'expiration stockée lors de l'activation PayPal
            const expiryStr = meta.subscriptionExpiry || meta.subscription_expiry || null;
            const activatedAt = meta.subscription_activated_at || meta.subscriptionActivatedAt || null;

            if (expiryStr) {
                const expiryDate = new Date(expiryStr);
                const now = new Date();
                const daysLeft = Math.max(0, Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)));
                return {
                    active: daysLeft > 0,
                    tier,
                    daysLeft,
                    expiryDate: expiryDate.toISOString(),
                    subscriptionId: meta.subscription_id || null
                };
            }

            // Fallback : si pas de date d'expiration stockée mais abonnement actif (anciens comptes)
            // On estime 30 jours depuis l'activation
            if (activatedAt) {
                const expiryDate = new Date(new Date(activatedAt).getTime() + 30 * 24 * 60 * 60 * 1000);
                const now = new Date();
                const daysLeft = Math.max(0, Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)));
                return {
                    active: daysLeft > 0,
                    tier,
                    daysLeft,
                    expiryDate: expiryDate.toISOString(),
                    subscriptionId: meta.subscription_id || null
                };
            }

            // Dernier fallback pour les comptes pro sans dates enregistrées
            return { active: true, tier, daysLeft: null, expiryDate: null, subscriptionId: meta.subscription_id || null };
        } catch (e) {
            return { active: false, tier: 'standard', daysLeft: 0, expiryDate: null };
        }
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
window.EventBus = EventBus;

// Auto-init removed. App.init() is now responsible for initializing Storage after Auth verification.
