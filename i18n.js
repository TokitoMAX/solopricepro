/**
 * SoloPrice Pro — i18n Translation System
 * Supports: fr (Français), en (English), es (Español)
 * Usage: i18n.t('key') or i18n.apply() to translate the whole page
 */

const i18n = {

    TRANSLATIONS: {
        fr: {
            // — Landing nav —
            'nav.login': 'Connexion',
            'nav.signup': 'Essai Gratuit',
            // — Hero section —
            'hero.title': 'Dominez votre <br><span class="gradient-text">Rentabilité d\'Expert</span>',
            'hero.subtitle': 'L\'outil de chiffrage haute-performance qui pense comme un chef d\'entreprise.<br>Ne laissez plus aucun euro dormir. Prenez le contrôle total.',
            'hero.cta': 'Accéder à l\'Expérience PRO',
            'hero.note': 'Précision Millimétrée. Impact Immédiat.',
            // — Auth modal —
            'auth.tab.login': 'Connexion',
            'auth.tab.register': 'Inscription',
            'auth.login.title': 'Bon de retour !',
            'auth.login.email': 'Email professionnel',
            'auth.login.password': 'Mot de passe',
            'auth.login.forgot': 'Mot de passe oublié ?',
            'auth.login.submit': 'Se Connecter',
            'auth.register.title': 'Créez votre compte',
            'auth.register.firstname': 'Prénom',
            'auth.register.lastname': 'Nom',
            'auth.register.company': 'Nom de votre entreprise',
            'auth.register.company.optional': '(Optionnel)',
            'auth.register.country': 'Pays d\'activité *',
            'auth.register.country.placeholder': 'Sélectionnez votre zone d\'activité...',
            'auth.register.email': 'Email professionnel',
            'auth.register.password': 'Mot de passe',
            'auth.register.password.hint': 'Au moins 6 caractères',
            'auth.register.submit': 'S\'inscrire',
            'auth.forgot.title': 'Récupération',
            'auth.forgot.subtitle': 'Entrez votre email pour recevoir un lien de réinitialisation.',
            'auth.forgot.email': 'Email',
            'auth.forgot.submit': 'Envoyer le lien',
            'auth.forgot.back': 'Retour à la connexion',
            'auth.reset.title': 'Nouveau mot de passe',
            'auth.reset.password': 'Nouveau mot de passe',
            'auth.reset.hint': 'Min. 6 caractères',
            'auth.reset.submit': 'Mettre à jour',
            // — Country groups in register form —
            'country.group.france': 'France & Europe',
            'country.group.domtom': 'Antilles & Outre-Mer',
            'country.group.africa': 'Afrique & Océan Indien',
            'country.group.americas': 'Amériques',
            'country.group.caribbean': 'Caraïbes & Petites Îles',
            'country.group.pacific': 'Pacifique',
            'country.group.other': 'International',
            // — Country messages —
            'country.msg.domtom': '🌴 Connectons la diaspora et propulsons l\'entrepreneuriat local !',
            'country.msg.other': '⭐ Concentrez-vous sur l\'ultra-croissance et l\'optimisation de votre cash-flow.',
            // — Simulator —
            'sim.title': 'Simulez votre <span class="gradient-text">Liberté</span>',
            'sim.subtitle': 'Combien devriez-vous facturer pour obtenir le salaire net de vos rêves ? Notre simulateur calqué sur la fiscalité réelle vous donne la réponse en 3 secondes. <strong>Repartez avec votre Roadmap PDF d\'Expert offerte.</strong>',
            'sim.label.net': 'Objectif Salaire Net Mensuel',
            'sim.label.days': 'Jours travaillés par mois',
            'sim.btn': 'Calculer mon TJM cible',
            'sim.result.msg': 'Votre TJM recommandé pour réussir :',
            'sim.result.hint': '(Inclut charges sociales & frais de fonctionnement)',
            // — Pricing —
            'pricing.title': 'Choisissez votre <span class="gradient-text">Puissance</span>',
            'pricing.subtitle': 'Un investissement rentable dès votre premier devis.',
            'pricing.standard.name': 'Standard',
            'pricing.standard.price': '0€',
            'pricing.standard.period': '/mois',
            'pricing.pro.name': 'Pack PRO',
            'pricing.pro.price': '15€',
            'pricing.pro.badge': 'Production Illimitée',
            'pricing.pro.market': 'Zéro limite opérationnelle',
            'pricing.expert.name': 'Pack EXPERT',
            'pricing.expert.price': '29€',
            'pricing.expert.market': 'Accélérateur de Croissance',
            'pricing.btn.free': 'Commencer Gratuitement',
            'pricing.btn.pro': 'Débloquer l\'Illimité',
            'pricing.btn.expert': 'Activer la Croissance',
            // — Features —
            'feat.tjm': 'Calculateur <strong>TJM Stratégique</strong>',
            'feat.quotes': '<strong>Documents & Devis</strong>',
            'feat.marketplace': '<strong>Missions Disponibles</strong> (Marketplace)',
            'feat.circle': '<strong>Le Cercle</strong> — Clients & Partenaires',
            'feat.signature': '<strong>Signature Électronique</strong> Client',
            'feat.pipeline': 'Pipeline Cash-flow & Trésorerie Nette',
            'feat.scoper': 'Chiffrage Projet (Scoper)',
            'feat.strategy': 'Stratégie & Closing',
            'feat.everything.standard': 'Tout du plan Standard',
            'feat.unlimited': '<strong>Clients & Devis</strong> Illimités',
            'feat.kanban': '<strong>Pipeline Kanban</strong> (Prospects → Encaissé)',
            'feat.netcash': '<strong>Trésorerie Nette Réelle</strong> (Brut − Charges)',
            'feat.expenses': '<strong>Dépenses & Charges</strong> — Registre complet',
            'feat.logo': 'PDF Factures avec <strong>votre Logo</strong>',
            'feat.support': 'Support Prioritaire',
            'feat.everything.pro': 'Tout du Pack PRO',
            'feat.journal': '<strong>Journal de Bord</strong>',
            'feat.expert.rank': '<strong>Profil Expert</strong> mis en avant',
            // — Footer & Banner —
            'footer.tagline': 'Le copilote des indépendants, partout dans le monde.',
            'footer.powered': 'PROPULSÉ par Le Réseau SoloPrice',
            'banner.freemium': 'Version Gratuite - Passez à PRO pour débloquer toutes les fonctionnalités',
            'banner.upgrade': 'Upgrade',
            // — Sidebar navigation —
            'nav.dashboard': 'Vue Stratégique',
            'nav.cashflow': 'Gestion du Cash-flow',
            'nav.clients': 'Mes Clients',
            'nav.quotes': 'Documents & Devis',
            'nav.strategy': 'Stratégie & Chiffrage',
            'nav.missions': 'Missions Disponibles',
            'nav.network': 'Mon Cercle',
            'nav.journal': 'Journal de Bord',
            'nav.profile': 'Mon Profil',
            'nav.settings': 'Réglages',
            'nav.logout': 'Déconnexion',
            // — Sidebar groups —
            'nav.group.pilotage': 'Pilotage',
            'nav.group.commerce': 'Commerce',
            'nav.group.reseau': 'Réseau',
            // — Common actions —
            'btn.save': 'Enregistrer',
            'btn.cancel': 'Annuler',
            'btn.add': 'Ajouter',
            'btn.delete': 'Supprimer',
            'btn.edit': 'Modifier',
            'btn.close': 'Fermer',
            'btn.upgrade': 'Passer PRO',
            // — Notifications & Errors —
            'notify.register.success': 'Inscription réussie ! Connexion...',
            'error.fill_all': 'Veuillez remplir tous les champs.',
            'error.fill_required': 'Veuillez remplir votre nom, prénom, email, mot de passe et pays.',
            'error.login_failed': 'Erreur de connexion.',
            'error.register_failed': 'Erreur d\'inscription.',
            'error.forgot_sent': 'Lien envoyé !',
            'error.forgot_failed': 'Erreur de récupération.',
            'error.reset_success': 'Mot de passe mis à jour !',
            'error.reset_failed': 'Erreur de mise à jour.',
            'error.token_missing': 'Token manquant ou expiré. Recommencez la demande.',
            'error.password_too_short': 'Le mot de passe doit faire 6 caractères min.',
            'error.enter_email': 'Veuillez entrer votre email.',
            'notify.access_denied': 'Accès refusé',
            'notify.render_error': 'Erreur d\'affichage',
        },

        en: {
            // — Landing nav —
            'nav.login': 'Sign In',
            'nav.signup': 'Free Trial',
            // — Hero section —
            'hero.title': 'Master your <br><span class="gradient-text">Expert Profitability</span>',
            'hero.subtitle': 'The high-performance pricing tool that thinks like a business leader.<br>Stop leaving money on the table. Take full control.',
            'hero.cta': 'Access the PRO Experience',
            'hero.note': 'Precision Engineered. Immediate Impact.',
            'hero.card.title': 'SoloPrice Goal',
            'hero.card.label': 'Net Monthly Salary',
            'hero.card.progress': 'Real-time progress based on your quotes and invoices.',
            // — Simulator —
            'sim.title': 'Simulate your <span class="gradient-text">Freedom</span>',
            'sim.subtitle': 'How much should you bill to get the net salary of your dreams? Our simulator based on real taxation gives you the answer in 3 seconds. <strong>Leave with your free Expert PDF Roadmap.</strong>',
            'sim.label.net': 'Target Net Monthly Salary',
            'sim.label.days': 'Days worked per month',
            'sim.btn': 'Calculate my target TJM',
            'sim.result.msg': 'Your recommended TJM to succeed:',
            'sim.result.hint': '(Includes social charges & operating costs)',
            // — Pricing —
            'pricing.title': 'Choose your <span class="gradient-text">Power</span>',
            'pricing.subtitle': 'A profitable investment from your very first quote.',
            'pricing.standard.name': 'Standard',
            'pricing.standard.price': '0€',
            'pricing.standard.period': '/month',
            'pricing.pro.name': 'PRO Pack',
            'pricing.pro.badge': 'Unlimited Production',
            'pricing.pro.market': 'Zero operational limits',
            'pricing.pro.price': '15€',
            'pricing.expert.name': 'EXPERT Pack',
            'pricing.expert.market': 'Growth Accelerator',
            'pricing.expert.price': '29€',
            'pricing.btn.free': 'Start for Free',
            'pricing.btn.pro': 'Unlock Unlimited',
            'pricing.btn.expert': 'Activate Growth',
            // — Features —
            'feat.tjm': '<i class="fas fa-check"></i> Strategic <strong>TJM Calculator</strong>',
            'feat.quotes': '<i class="fas fa-check"></i> <strong>Documents & Quotes</strong>',
            'feat.marketplace': '<i class="fas fa-check"></i> <strong>Available Missions</strong> (Marketplace)',
            'feat.circle': '<i class="fas fa-check"></i> <strong>The Circle</strong> — Clients & Partners',
            'feat.signature': '<i class="fas fa-check"></i> Client <strong>Electronic Signature</strong>',
            'feat.pipeline': '<i class="fas fa-times"></i> Cash-flow & Net Treasury Pipeline',
            'feat.scoper': '<i class="fas fa-check"></i> Project Scoping + Risk Premium',
            'feat.strategy': '<i class="fas fa-check"></i> <strong>Strategy & Closing</strong>',
            'feat.everything.standard': '<i class="fas fa-check"></i> Everything in Standard',
            'feat.everything.pro': '<i class="fas fa-check"></i> Everything in PRO',
            'feat.unlimited': '<i class="fas fa-check"></i> Unlimited <strong>Clients & Quotes</strong>',
            'feat.kanban': '<i class="fas fa-check"></i> <strong>Kanban Pipeline</strong> (Prospect → Paid)',
            'feat.netcash': '<i class="fas fa-check"></i> <strong>Real Net Cash</strong> (Gross − Charges)',
            'feat.expenses': '<i class="fas fa-check"></i> <strong>Expenses & Charges</strong> — Full log',
            'feat.logo': '<i class="fas fa-check"></i> PDF Invoices with <strong>your Logo</strong>',
            'feat.support': '<i class="fas fa-check"></i> Priority Support',
            'feat.journal': '<i class="fas fa-check"></i> <strong>Daily Success Log</strong>',
            'feat.expert.rank': '<i class="fas fa-check"></i> Featured <strong>Expert Profile</strong>',
            // — Footer —
            'footer.powered': 'POWERED by SoloPrice Network',
            'footer.tagline': '&copy; 2026 SoloPrice Pro. The co-pilot for independents, anywhere in the world.',
            // — Freemium banner —
            'banner.freemium': 'Free Version - Upgrade to PRO to unlock all features',
            'banner.upgrade': 'Upgrade',
            // — Auth modal —
            'auth.tab.login': 'Sign In',
            'auth.tab.register': 'Sign Up',
            'auth.login.title': 'Welcome back!',
            'auth.login.email': 'Professional email',
            'auth.login.password': 'Password',
            'auth.login.forgot': 'Forgot password?',
            'auth.login.submit': 'Sign In',
            'auth.register.title': 'Create your account',
            'auth.register.firstname': 'First name',
            'auth.register.lastname': 'Last name',
            'auth.register.company': 'Company name',
            'auth.register.company.optional': '(Optional)',
            'auth.register.country': 'Country of activity *',
            'auth.register.country.placeholder': 'Select your region...',
            'auth.register.email': 'Professional email',
            'auth.register.password': 'Password',
            'auth.register.password.hint': 'At least 6 characters',
            'auth.register.submit': 'Sign Up',
            'auth.forgot.title': 'Password Recovery',
            'auth.forgot.subtitle': 'Enter your email to receive a reset link.',
            'auth.forgot.email': 'Email',
            'auth.forgot.submit': 'Send Reset Link',
            'auth.forgot.back': 'Back to sign in',
            'auth.reset.title': 'New password',
            'auth.reset.password': 'New password',
            'auth.reset.hint': 'Min. 6 characters',
            'auth.reset.submit': 'Update password',
            // — Country groups —
            'country.group.france': 'France & Europe',
            'country.group.domtom': 'French Overseas Territories',
            'country.group.africa': 'Africa & Indian Ocean',
            'country.group.americas': 'Americas',
            'country.group.caribbean': 'Caribbean & Islands',
            'country.group.pacific': 'Pacific',
            'country.group.other': 'International',
            'country.msg.domtom': '🌴 Connecting the diaspora and boosting local entrepreneurship!',
            'country.msg.other': '⭐ Focus on ultra-growth and cash-flow optimization.',
            // — Sidebar —
            'nav.dashboard': 'Strategic Overview',
            'nav.cashflow': 'Cash Flow Management',
            'nav.clients': 'My Clients',
            'nav.quotes': 'Documents & Quotes',
            'nav.strategy': 'Strategy & Pricing',
            'nav.missions': 'Available Missions',
            'nav.network': 'My Circle',
            'nav.journal': 'Daily Log',
            'nav.profile': 'My Profile',
            'nav.settings': 'Settings',
            'nav.logout': 'Sign Out',
            'nav.group.pilotage': 'Piloting',
            'nav.group.commerce': 'Commerce',
            'nav.group.reseau': 'Network',
            // — Common —
            'btn.save': 'Save',
            'btn.cancel': 'Cancel',
            'btn.add': 'Add',
            'btn.delete': 'Delete',
            'btn.edit': 'Edit',
            'btn.close': 'Close',
            'btn.upgrade': 'Go PRO',
            // — Notifications & Errors —
            'notify.register.success': 'Registration successful! Signing in...',
            'error.fill_all': 'Please fill in all fields.',
            'error.fill_required': 'Please fill in your name, email, password, and country.',
            'error.login_failed': 'Login failed.',
            'error.register_failed': 'Registration failed.',
            'error.forgot_sent': 'Reset link sent!',
            'error.forgot_failed': 'Recovery failed.',
            'error.reset_success': 'Password updated!',
            'error.reset_failed': 'Update failed.',
            'error.token_missing': 'Token missing or expired. Please try again.',
            'error.password_too_short': 'Password must be at least 6 characters.',
            'error.enter_email': 'Please enter your email.',
            'notify.access_denied': 'Access denied',
            'notify.render_error': 'Display error',
        },

        es: {
            // — Landing nav —
            'nav.login': 'Iniciar sesión',
            'nav.signup': 'Prueba Gratuita',
            // — Hero section —
            'hero.title': 'Domina tu <br><span class="gradient-text">Rentabilidad de Experto</span>',
            'hero.subtitle': 'La herramienta de cotización de alto rendimiento que piensa como un empresario.<br>No dejes que ningún euro duerma. Toma el control total.',
            'hero.cta': 'Acceder a la Experiencia PRO',
            'hero.note': 'Precisión Milimétrica. Impacto Inmediato.',
            'hero.card.title': 'Objetivo SoloPrice',
            'hero.card.label': 'Salario Neto Mensual',
            'hero.card.progress': 'Progreso en tiempo real basado en tus presupuestos y facturas.',
            // — Simulator —
            'sim.title': 'Simula tu <span class="gradient-text">Libertad</span>',
            'sim.subtitle': '¿Cuánto deberías facturar para obtener el salario neto de tus sueños? Nuestro simulador basado en la fiscalidad real te da la respuesta en 3 segundos. <strong>Llévate tu Roadmap PDF de Experto gratis.</strong>',
            'sim.label.net': 'Objetivo Salario Neto Mensual',
            'sim.label.days': 'Días trabajados por mes',
            'sim.btn': 'Calcular mi TJM objetivo',
            'sim.result.msg': 'Tu TJM recomendado para tener éxito:',
            'sim.result.hint': '(Incluye cargas sociales y gastos de funcionamiento)',
            // — Pricing —
            'pricing.title': 'Elige tu <span class="gradient-text">Potencia</span>',
            'pricing.subtitle': 'Una inversión rentable desde tu primer presupuesto.',
            'pricing.standard.name': 'Estándar',
            'pricing.standard.price': '0€',
            'pricing.standard.period': '/mes',
            'pricing.pro.name': 'Pack PRO',
            'pricing.pro.badge': 'Producción Ilimitada',
            'pricing.pro.market': 'Cero límites operativos',
            'pricing.pro.price': '15€',
            'pricing.expert.name': 'Pack EXPERT',
            'pricing.expert.market': 'Acelerador de Crecimiento',
            'pricing.expert.price': '29€',
            'pricing.btn.free': 'Empezar Gratis',
            'pricing.btn.pro': 'Desbloquear Ilimitado',
            'pricing.btn.expert': 'Activar Crecimiento',
            // — Features —
            'feat.tjm': '<i class="fas fa-check"></i> Calculadora de <strong>TJM Estratégico</strong>',
            'feat.quotes': '<i class="fas fa-check"></i> <strong>Documentos y Presupuestos</strong>',
            'feat.marketplace': '<i class="fas fa-check"></i> <strong>Misiones Disponibles</strong> (Marketplace)',
            'feat.circle': '<i class="fas fa-check"></i> <strong>El Círculo</strong> — Clientes y Socios',
            'feat.signature': '<i class="fas fa-check"></i> <strong>Firma Electrónica</strong> de Cliente',
            'feat.pipeline': '<i class="fas fa-times"></i> Pipeline de Cash-flow y Tesorería Neta',
            'feat.scoper': '<i class="fas fa-check"></i> Valoración de Proyecto + Prima de Riesgo',
            'feat.strategy': '<i class="fas fa-check"></i> <strong>Estrategia y Cierre</strong>',
            'feat.everything.standard': '<i class="fas fa-check"></i> Todo lo del plan Estándar',
            'feat.everything.pro': '<i class="fas fa-check"></i> Todo lo del Pack PRO',
            'feat.unlimited': '<i class="fas fa-check"></i> <strong>Clientes y Presupuestos</strong> Ilimitados',
            'feat.kanban': '<i class="fas fa-check"></i> <strong>Pipeline Kanban</strong> (Prospectos → Cobrado)',
            'feat.netcash': '<i class="fas fa-check"></i> <strong>Caja Neta Real</strong> (Bruto − Cargas)',
            'feat.expenses': '<i class="fas fa-check"></i> <strong>Gastos y Cargas</strong> — Registro completo',
            'feat.logo': '<i class="fas fa-check"></i> PDF de Facturas con <strong>tu Logo</strong>',
            'feat.support': 'Soporte Prioritario',
            'feat.journal': '<i class="fas fa-check"></i> <strong>Diario de Éxitos</strong>',
            'feat.expert.rank': '<i class="fas fa-check"></i> <strong>Perfil de Experto</strong> Destacado',
            // — Footer —
            'footer.powered': 'IMPULSADO por SoloPrice Network',
            'footer.tagline': '&copy; 2026 SoloPrice Pro. El copiloto de los independientes en todo el mundo.',
            // — Freemium banner —
            'banner.freemium': 'Versión Gratuita - Pásate a PRO para desbloquear todas las funciones',
            'banner.upgrade': 'Mejorar',
            // — Auth modal —
            'auth.tab.login': 'Iniciar sesión',
            'auth.tab.register': 'Registrarse',
            'auth.login.title': '¡Bienvenido de vuelta!',
            'auth.login.email': 'Email profesional',
            'auth.login.password': 'Contraseña',
            'auth.login.forgot': '¿Olvidaste tu contraseña?',
            'auth.login.submit': 'Iniciar sesión',
            'auth.register.title': 'Crea tu cuenta',
            'auth.register.firstname': 'Nombre',
            'auth.register.lastname': 'Apellido',
            'auth.register.company': 'Nombre de empresa',
            'auth.register.company.optional': '(Opcional)',
            'auth.register.country': 'País de actividad *',
            'auth.register.country.placeholder': 'Selecciona tu región...',
            'auth.register.email': 'Email profesional',
            'auth.register.password': 'Contraseña',
            'auth.register.password.hint': 'Al menos 6 caracteres',
            'auth.register.submit': 'Registrarse',
            'auth.forgot.title': 'Recuperar contraseña',
            'auth.forgot.subtitle': 'Introduce tu email para recibir un enlace de recuperación.',
            'auth.forgot.email': 'Email',
            'auth.forgot.submit': 'Enviar enlace',
            'auth.forgot.back': 'Volver al inicio de sesión',
            'auth.reset.title': 'Nueva contraseña',
            'auth.reset.password': 'Nueva contraseña',
            'auth.reset.hint': 'Mín. 6 caracteres',
            'auth.reset.submit': 'Actualizar contraseña',
            // — Country groups —
            'country.group.france': 'Francia & Europa',
            'country.group.domtom': 'Territorios de Ultramar',
            'country.group.africa': 'África & Océano Índico',
            'country.group.americas': 'Américas',
            'country.group.caribbean': 'Caribe & Islas',
            'country.group.pacific': 'Pacífico',
            'country.group.other': 'Internacional',
            'country.msg.domtom': '🌴 ¡Conectando la diáspora e impulsando el emprendimiento local!',
            'country.msg.other': '⭐ Enfócate en el ultra-crecimiento y la optimización de tu flujo de caja.',
            // — Sidebar —
            'nav.dashboard': 'Vista Estratégica',
            'nav.cashflow': 'Gestión de Cashflow',
            'nav.clients': 'Mis Clientes',
            'nav.quotes': 'Documentos & Presupuestos',
            'nav.strategy': 'Estrategia & Precio',
            'nav.missions': 'Misiones Disponibles',
            'nav.network': 'Mi Círculo',
            'nav.journal': 'Diario de Trabajo',
            'nav.profile': 'Mi Perfil',
            'nav.settings': 'Configuración',
            'nav.logout': 'Cerrar sesión',
            'nav.group.pilotage': 'Pilotaje',
            'nav.group.commerce': 'Comercio',
            'nav.group.reseau': 'Red',
            // — Common —
            'btn.save': 'Guardar',
            'btn.cancel': 'Cancelar',
            'btn.add': 'Agregar',
            'btn.delete': 'Eliminar',
            'btn.edit': 'Editar',
            'btn.close': 'Cerrar',
            'btn.upgrade': 'Ir a PRO',
            // — Notifications & Errors —
            'notify.register.success': '¡Registro exitoso! Iniciando sesión...',
            'error.fill_all': 'Por favor, completa todos los campos.',
            'error.fill_required': 'Por favor, completa tu nombre, email, contraseña y país.',
            'error.login_failed': 'Error al iniciar sesión.',
            'error.register_failed': 'Error al registrarse.',
            'error.forgot_sent': '¡Enlace enviado!',
            'error.forgot_failed': 'Error de recuperación.',
            'error.reset_success': '¡Contraseña actualizada!',
            'error.reset_failed': 'Error al actualizar.',
            'error.token_missing': 'Token faltante o expirado. Por favor, inténtalo de nuevo.',
            'error.password_too_short': 'La contraseña debe tener al menos 6 caracteres.',
            'error.enter_email': 'Por favor, introduce tu correo electrónico.',
            'notify.access_denied': 'Acceso denegado',
            'notify.render_error': 'Error de visualización',
        }
    },

    LANG_MAP: {
        // English primary
        'US': 'en', 'GB': 'en', 'IE': 'en', 'CA': 'en', 'ZA': 'en', 'NG': 'en', 'GH': 'en',
        'IN': 'en', 'SG': 'en', 'AE': 'en', 'OTHER': 'en', 'JM': 'en', 'TT': 'en', 'BB': 'en',
        'LC': 'en', 'VC': 'en', 'GD': 'en', 'DM': 'en', 'AG': 'en', 'KN': 'en',
        'FJ': 'en', 'SB': 'en', 'VU': 'en', 'TO': 'en', 'WS': 'en', 'MV': 'en',
        // Spanish primary
        'ES': 'es', 'MX': 'es', 'CO': 'es', 'AR': 'es', 'CL': 'es', 'CU': 'es', 'DO': 'es',
        'PR': 'es',
        // French primary (default if not in map is handled by init or fr fallback)
    },

    // Current language
    lang: 'fr',

    init() {
        // Priority: 1) sp_lang localStorage, 2) navigator.language
        const stored = localStorage.getItem('sp_lang');
        if (stored && this.TRANSLATIONS[stored]) {
            this.lang = stored;
        } else {
            const nav = (navigator.language || 'fr').split('-')[0];
            if (this.TRANSLATIONS[nav]) this.lang = nav;
        }
        // Apply the language to <html lang>
        document.documentElement.lang = this.lang;
        // Apply translations
        this.apply();
    },

    // Get a translation key
    t(key) {
        return (this.TRANSLATIONS[this.lang] || this.TRANSLATIONS.fr)[key]
            || this.TRANSLATIONS.fr[key]
            || key;
    },

    // Apply all data-i18n attributes in the DOM
    apply() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const attr = el.getAttribute('data-i18n-attr'); // e.g. 'placeholder'
            const val = this.t(key);
            if (attr) {
                el.setAttribute(attr, val);
            } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = val;
            } else {
                el.innerHTML = val;
            }
        });

        // Update <html lang>
        document.documentElement.lang = this.lang;

        // Populate the register country dropdown dynamically
        this.buildRegisterCountryDropdown();

        // Update the language selector dropdown to reflect current lang
        const sel = document.querySelector('.custom-lang-selector select');
        if (sel) sel.value = this.lang;

        // Also update sidebar nav items if they exist
        this.applyToSidebar();
    },

    // Change language + save + re-apply
    setLang(lang) {
        if (!this.TRANSLATIONS[lang]) return;
        this.lang = lang;
        localStorage.setItem('sp_lang', lang);
        this.apply();

        // Also update sidebar nav items if they exist
        this.applyToSidebar();
    },

    // Build the country dropdown in the register form dynamically
    buildRegisterCountryDropdown() {
        const sel = document.getElementById('auth-register-country');
        if (!sel) return;

        // Get Profile.COUNTRIES if available
        const countries = (typeof Profile !== 'undefined') ? Profile.COUNTRIES : null;
        if (!countries) return;

        const t = (k) => this.t(k);
        const groups = [
            {
                key: 'country.group.france',
                codes: ['FR', 'BE', 'CH', 'LU', 'DE', 'NL', 'IT', 'PT', 'IE', 'ES', 'CA']
            },
            {
                key: 'country.group.domtom',
                codes: ['RE', 'GP', 'MQ', 'GF', 'YT', 'PM', 'MF', 'BL', 'WF', 'NC', 'PF']
            },
            {
                key: 'country.group.africa',
                codes: ['MA', 'DZ', 'TN', 'SN', 'CI', 'CM', 'CD', 'GA', 'MG', 'MU', 'KM', 'SC', 'CV', 'ST', 'NG', 'GH', 'ZA']
            },
            {
                key: 'country.group.americas',
                codes: ['US', 'MX', 'CO', 'BR', 'AR', 'CL', 'GY', 'HT']
            },
            {
                key: 'country.group.caribbean',
                codes: ['JM', 'TT', 'BB', 'LC', 'VC', 'GD', 'DM', 'AG', 'KN', 'CU', 'DO', 'PR']
            },
            {
                key: 'country.group.pacific',
                codes: ['FJ', 'SB', 'VU', 'TO', 'WS', 'MV']
            },
            {
                key: 'country.group.other',
                codes: ['AE', 'SG', 'IN', 'LB', 'OTHER_ISLAND', 'OTHER']
            }
        ];

        const currentVal = sel.value;
        sel.innerHTML = `<option value="" disabled selected>${t('auth.register.country.placeholder')}</option>`;

        // DOM-TOM country codes for the message
        const domtomCodes = ['RE', 'GP', 'MQ', 'GF', 'YT', 'PM', 'MF', 'BL', 'WF', 'NC', 'PF', 'SN', 'CI', 'MG', 'MA', 'MU'];

        groups.forEach(group => {
            const og = document.createElement('optgroup');
            og.label = t(group.key);
            group.codes.forEach(code => {
                const country = countries.find(c => c.code === code);
                if (!country) return;
                const opt = document.createElement('option');
                opt.value = code;
                opt.textContent = country.label;
                if (code === currentVal) opt.selected = true;
                og.appendChild(opt);
            });
            if (og.children.length > 0) sel.appendChild(og);
        });

        // Reattach the change handler
        sel.onchange = function () {
            const val = this.value;
            const msg = document.getElementById('auth-country-message');
            if (!msg) return;
            const isDomTom = domtomCodes.includes(val);
            msg.innerHTML = isDomTom
                ? i18n.t('country.msg.domtom')
                : i18n.t('country.msg.other');
            msg.style.color = isDomTom ? 'var(--primary)' : 'var(--text-muted)';
            msg.style.display = 'block';

            // Apply language based on country
            const langMap = i18n.LANG_MAP;
            const targetLang = langMap[val] || 'fr';
            i18n.setLang(targetLang);
        };
    },

    // Apply translations to sidebar nav items (for logged-in app)
    applyToSidebar() {
        const map = {
            'nav-dashboard': this.t('nav.dashboard'),
            'nav-cashflow': this.t('nav.cashflow'),
            'nav-clients': this.t('nav.clients'),
            'nav-quotes': this.t('nav.quotes'),
            'nav-strategy': this.t('nav.strategy'),
            'nav-missions': this.t('nav.missions'),
            'nav-network': this.t('nav.network'),
            'nav-journal': this.t('nav.journal'),
            'nav-profile': this.t('nav.profile'),
            'nav-settings': this.t('nav.settings'),
            'nav-logout': this.t('nav.logout'),
        };
        Object.entries(map).forEach(([id, text]) => {
            const el = document.getElementById(id);
            if (el) {
                // If there's a specific label span, update its text
                const label = el.querySelector('.nav-label');
                if (label) {
                    label.textContent = text;
                } else {
                    // Legacy support: update text nodes
                    el.childNodes.forEach(node => {
                        if (node.nodeType === 3 && node.textContent.trim()) {
                            node.textContent = ' ' + text;
                        }
                    });
                    // Fallback for simple links without structure
                    if (!el.querySelector('i') && el.childNodes.length <= 1) {
                        el.textContent = text;
                    }
                }
            }
        });

        // Sidebar group labels
        const groups = {
            'nav-group-pilotage': this.t('nav.group.pilotage'),
            'nav-group-commerce': this.t('nav.group.commerce'),
            'nav-group-reseau': this.t('nav.group.reseau'),
        };
        Object.entries(groups).forEach(([id, text]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        });
    }
};

// Global function called by the language selector in the landing nav
window.changeLanguageCustom = function (lang) {
    i18n.setLang(lang);
};

window.i18n = i18n;
