// SoloPrice Pro - Authentication Module
console.log("[AUTH] Module loading...");

const Auth = {
    // Définir l'URL de base pour l'API
    // Si on est en local (localhost ou file://), on force le port 5050
    // Sinon (production), on utilise le chemin relatif
    apiBase: (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'file:' ||
        /^192\.168\./.test(window.location.hostname))
        ? `http://${window.location.hostname}:5050`
        : '',

    token: localStorage.getItem('sp_token') || null,
    user: localStorage.getItem('sp_user') ? JSON.parse(localStorage.getItem('sp_user')) : null,

    init() {
        // Mode Backend Local - Initialisation standard
        console.log("Auth initialized. API Base:", this.apiBase);
        // this.checkRecoveryMode(); // Géré par app.js pour une meilleure UI
    },

    checkRecoveryMode() {
        const hash = window.location.hash;
        if (hash && hash.includes('type=recovery') && hash.includes('access_token=')) {
            console.log("[RECOVERY] Recovery mode detected!");

            // Wait for DOM to be ready just in case
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.openResetModal());
            } else {
                this.openResetModal();
            }
        }
    },

    openResetModal() {
        // Hide any Supabase-injected forms
        this.hideSupabaseForms();

        if (typeof showAuthModal === 'function') {
            showAuthModal('reset'); // Match the form ID 'auth-form-reset'
        }
    },

    hideSupabaseForms() {
        console.log('[CLEANUP] Attempting to hide Supabase internal forms...');

        const cleanup = () => {
            const authModal = document.getElementById('auth-modal');
            if (!authModal) return;

            // On ne cible que les formulaires qui ne sont PAS dans notre modal
            document.querySelectorAll('form').forEach(form => {
                if (!authModal.contains(form)) {
                    form.style.display = 'none';
                    console.log('[SUPABASE] Native form hidden');
                }
            });

            // On cherche aussi les boutons de reset par défaut de Supabase par leur texte ou leur action
            document.querySelectorAll('button').forEach(btn => {
                const hasResetText = btn.textContent.toLowerCase().includes('password');
                const hasResetAction = btn.onclick?.toString().includes('updateUserPassword');

                if ((hasResetText || hasResetAction) && !authModal.contains(btn)) {
                    btn.style.display = 'none';
                    console.log('[SUPABASE] Native button hidden');
                }
            });
        };

        // On lance le nettoyage plusieurs fois pour attraper les injections retardées
        cleanup();
        setTimeout(cleanup, 500);
        setTimeout(cleanup, 2000);
    },

    async forgotPassword(email) {
        try {
            const response = await fetch(`${this.apiBase}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            return await response.json();
        } catch (error) {
            console.error("Forgot Password Error:", error);
            throw error;
        }
    },

    async updatePassword(accessToken, password) {
        try {
            const response = await fetch(`${this.apiBase}/api/auth/update-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erreur lors de la mise à jour');
            }

            return result;
        } catch (error) {
            console.error("Update Password Error:", error);
            throw error;
        }
    },

    async register(data) {
        if (!data.email || !data.password || !data.company_name) {
            this.showError('Veuillez remplir tous les champs obligatoires');
            throw new Error('Champs manquants');
        }

        // Strict Validation
        if (data.company_name.length < 3) {
            this.showError('Le nom de l\'entreprise doit contenir au moins 3 caractères.');
            throw new Error('Validation: Nom d\'entreprise trop court');
        }

        // Anti-spam / dummy data simple (ex: aaa, 111)
        if (/^([a-zA-Z0-9])\1{2,}$/.test(data.company_name.trim())) {
            this.showError('Veuillez entrer un vrai nom pour votre entreprise.');
            throw new Error('Validation: Nom d\'entreprise invalide');
        }

        try {
            console.log('[AUTH] Sending register request to:', `${this.apiBase}/api/auth/register`);
            console.log('[AUTH] Data payload:', { email: data.email, company_name: data.company_name });
            const response = await fetch(`${this.apiBase}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(fetchError => {
                console.error('[AUTH] Fetch failed:', fetchError);
                throw new Error(`Erreur réseau: ${fetchError.message}. Vérifiez votre connexion.`);
            });

            console.log('[AUTH] Response status:', response.status);

            const contentType = response.headers.get("content-type");
            let result;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                result = await response.json();
            } else {
                const text = await response.text();
                console.error("Non-JSON response received:", { status: response.status, body: text });
                throw new Error(`Erreur serveur (${response.status}): Réponse invalide.`);
            }

            if (!response.ok) {
                console.error("API error response:", result);
                let errorMsg = result.message || `Erreur (${response.status})`;
                if (response.status === 503) errorMsg = "Le service d'authentification est actuellement indisponible.";
                throw new Error(errorMsg);
            }

            if (result.requiresConfirmation || (result.user && !result.session)) {
                this.showSuccess(result.message || 'Inscription réussie ! Veuillez confirmer votre email (vérifiez vos spams).');
                if (typeof closeAllModals === 'function') closeAllModals();
                return result;
            }

            this.handleAuthSuccess(result);
            return result;
        } catch (error) {
            console.error('[AUTH] Register error:', error);
            this.showError(error.message);
            throw error;
        }
    },

    async login(email, password) {
        if (!email || !password) {
            this.showError('Veuillez remplir tous les champs');
            throw new Error('Champs manquants');
        }

        try {
            const response = await fetch(`${this.apiBase}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const contentType = response.headers.get("content-type");
            let result;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                result = await response.json();
            } else {
                const text = await response.text();
                console.error("Non-JSON response received:", { status: response.status, body: text });
                throw new Error(`Erreur serveur (${response.status}): Réponse invalide.`);
            }

            if (!response.ok) {
                console.error("API error response:", result);
                let errorMsg = result.message || `Erreur (${response.status})`;
                if (response.status === 503) errorMsg = "Le service d'authentification est actuellement indisponible. Réessayez plus tard.";
                if (response.status === 404) errorMsg = "Route d'authentification introuvable. Vérifiez le déploiement.";
                throw new Error(errorMsg);
            }

            this.handleAuthSuccess(result);
            return result;
        } catch (error) {
            this.showError(error.message);
            throw error;
        }
    },

    showError(message) {
        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification(message, 'error');
        } else {
            alert("Erreur: " + message);
        }
    },

    showSuccess(message) {
        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification(message, 'success');
        } else {
            console.log("Success:", message);
        }
    },

    async refreshUser() {
        if (!this.token) return null;
        try {
            console.log("📡 Refreshing user session...");
            const response = await fetch(`${this.apiBase}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    // Update user metadata but keep the existing session token
                    const updatedUser = {
                        ...this.user,
                        email: data.user.email,
                        user_metadata: data.user.user_metadata,
                        isPro: !!(data.user.user_metadata?.is_pro || data.user.is_pro)
                    };

                    this.user = updatedUser;
                    localStorage.setItem('sp_user', JSON.stringify(updatedUser));

                    if (typeof Storage !== 'undefined') {
                        Storage.setUser(updatedUser);
                    }

                    console.log("✅ User session refreshed. Email:", updatedUser.email, "Tier:", updatedUser.user_metadata?.tier || 'standard');
                    return updatedUser;
                }
            }
            return null;
        } catch (error) {
            console.error("Failed to refresh user:", error);
            return null;
        }
    },

    handleAuthSuccess(authData) {
        const user = authData.user;
        const session = authData.session;

        if (!user || !session) {
            console.log("Auth success but no user/session (waiting for confirmation?)");
            return;
        }

        const userData = {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata,
            company: user.user_metadata?.company || { name: user.user_metadata?.company_name || '' },
            isPro: !!(user.user_metadata?.is_pro || user.is_pro),
            token: session?.access_token
        };

        this.token = userData.token;
        this.user = userData;

        localStorage.setItem('sp_token', userData.token);
        localStorage.setItem('sp_user', JSON.stringify(userData));

        if (typeof Storage !== 'undefined') {
            Storage.setUser(userData);
            Storage.fetchAllData();
        }

        this.showSuccess('Bienvenue, ' + (userData.company.name || userData.email) + ' !');

        if (typeof closeAllModals === 'function') closeAllModals();

        if (typeof App !== 'undefined' && App.enterApp) {
            App.enterApp();
        } else {
            window.location.reload();
        }
    },

    logout() {
        if (window.sbClient) window.sbClient.auth.signOut();
        localStorage.removeItem('sp_token');
        localStorage.removeItem('sp_user');
        sessionStorage.removeItem('sp_in_app');

        App.showNotification('Déconnexion réussie.', 'info');
        window.location.reload();
    },

    isLoggedIn() {
        const token = localStorage.getItem('sp_token');
        const user = localStorage.getItem('sp_user');
        return !!(token && user);
    },

    getUser() {
        const user = localStorage.getItem('sp_user');
        return user ? JSON.parse(user) : null;
    },

    handleExpiredSession() {
        console.warn('🔐 Session expired or invalid. Clearing tokens...');
        localStorage.removeItem('sp_token');
        localStorage.removeItem('sp_user');
        sessionStorage.removeItem('sp_in_app'); // CRITICAL: Stop reload loop
        this.token = null;
        this.user = null;

        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification('Votre session a expiré. Veuillez vous reconnecter.', 'warning');
        }

        // Return to landing after a short delay
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
};

// Global Fetch Interceptor for Auth Errors
(function () {
    const originalFetch = window.fetch;
    let isHandlingError = false;

    window.fetch = async function () {
        try {
            const response = await originalFetch.apply(this, arguments);

            // If we get a 401 or 403, and it's NOT a login/register attempt
            const url = arguments[0];
            const isAuthEndpoint = typeof url === 'string' && (url.includes('/api/auth/login') || url.includes('/api/auth/register'));

            if ((response.status === 401 || response.status === 403) && !isAuthEndpoint) {
                if (!isHandlingError && typeof Auth !== 'undefined' && Auth.handleExpiredSession) {
                    isHandlingError = true;
                    Auth.handleExpiredSession();
                }
            }

            return response;
        } catch (error) {
            throw error;
        }
    };
})();

// Exposer Auth globalement
window.Auth = Auth;

try {
    Auth.init();
    console.log("Auth initialized");
} catch (e) {
    console.error("Auth Init Error:", e);
}
