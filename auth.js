// SoloPrice Pro - Authentication Module
console.log("auth.js loading...");

const Auth = {
    // Définir l'URL de base pour l'API
    // Si on est en local (localhost ou file://), on force le port 5050
    // Sinon (production), on utilise le chemin relatif
    apiBase: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
        ? 'http://localhost:5050'
        : '',

    init() {
        // Mode Backend Local - Initialisation standard
        console.log("Auth initialized. API Base:", this.apiBase);
        this.checkRecoveryMode();
    },

    checkRecoveryMode() {
        const hash = window.location.hash;
        if (hash && hash.includes('type=recovery') && hash.includes('access_token=')) {
            console.log("🔄 Recovery mode detected!");

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
        console.log('🔍 Attempting to hide Supabase forms...');

        // Function to hide forms and intercept events
        const hideForms = () => {
            const authModal = document.getElementById('auth-modal');
            let hiddenCount = 0;

            // Strategy 1: Only remove <form> elements that are NOT in our modal
            document.querySelectorAll('form').forEach(form => {
                if (authModal && authModal.contains(form)) {
                    // This is OUR form, keep it
                    console.log('✅ Keeping our form:', form.id);
                    return;
                }
                // Remove forms outside our modal
                console.log('🚫 Removing external form:', form);
                form.remove();
                hiddenCount++;
            });

            // Strategy 2: Intercept buttons with updateUserPassword onclick
            document.querySelectorAll('button').forEach(button => {
                const onclick = button.getAttribute('onclick');
                if (onclick && onclick.includes('updateUserPassword')) {
                    console.log('🚫 Found Supabase button, blocking:', button);
                    button.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🚫 Blocked Supabase button click');
                        return false;
                    };
                    button.remove();
                    hiddenCount++;
                }
            });

            console.log(`✅ Processed ${hiddenCount} Supabase element(s)`);
        };

        // Try immediately
        hideForms();

        // Try again after delays (Supabase might inject forms later)
        setTimeout(hideForms, 100);
        setTimeout(hideForms, 500);
        setTimeout(hideForms, 1000);

        // Watch for new elements being added
        const observer = new MutationObserver(() => {
            hideForms();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Stop observing after 5 seconds
        setTimeout(() => observer.disconnect(), 5000);
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
        if (!data.email || !data.password) {
            this.showError('Veuillez remplir tous les champs obligatoires');
            throw new Error('Champs manquants');
        }

        try {
            console.log('📤 Sending register request to:', `${this.apiBase}/api/auth/register`);
            console.log('📦 Request data:', { email: data.email, company: data.company });

            const response = await fetch(`${this.apiBase}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(fetchError => {
                console.error('🔥 Fetch itself failed:', fetchError);
                throw new Error(`Erreur réseau: ${fetchError.message}. Vérifiez votre connexion.`);
            });

            console.log('📥 Response status:', response.status);
            console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

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
                this.showSuccess(result.message || 'Inscription réussie ! Veuillez confirmer votre email.');
                if (typeof closeAllModals === 'function') closeAllModals();
                return result;
            }

            this.handleAuthSuccess(result);
            return result;
        } catch (error) {
            console.error('💥 Register error:', error);
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
            company: { name: user.user_metadata?.company_name || '' },
            isPro: user.user_metadata?.is_pro || false,
            token: session?.access_token
        };

        localStorage.setItem('sp_token', userData.token);
        localStorage.setItem('sp_user', JSON.stringify(userData));

        if (typeof Storage !== 'undefined') {
            Storage.setUser(userData);
            Storage.fullSync();
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
        return !!localStorage.getItem('sp_token');
    },

    getUser() {
        const user = localStorage.getItem('sp_user');
        return user ? JSON.parse(user) : null;
    }
};

// Exposer Auth globalement
window.Auth = Auth;

try {
    Auth.init();
    console.log("Auth initialized");
} catch (e) {
    console.error("Auth Init Error:", e);
}
