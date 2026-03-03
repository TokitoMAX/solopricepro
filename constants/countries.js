// SoloPrice Pro - Global Configuration Constants

const AppConstants = {
    // Country list with registration number labels and primary app language
    COUNTRIES: [
        { code: '', label: '— Sélectionner / Select / Seleccionar —', regLabel: null, lang: 'fr' },

        // ── FRANCE & DOM-TOM ──────────────────────────────────────────────
        { code: 'FR', label: '🇫🇷 France', regLabel: 'SIRET (14 chiffres)', pattern: '^[0-9]{14}$', verify: true, lang: 'fr', group: 'France & DOM-TOM' },
        { code: 'RE', label: '🇷🇪 La Réunion', regLabel: 'SIRET (14 chiffres)', pattern: '^[0-9]{14}$', verify: true, lang: 'fr', group: 'France & DOM-TOM' },
        { code: 'GP', label: '🇬🇵 Guadeloupe', regLabel: 'SIRET (14 chiffres)', pattern: '^[0-9]{14}$', verify: true, lang: 'fr', group: 'France & DOM-TOM' },
        { code: 'MQ', label: '🇲🇶 Martinique', regLabel: 'SIRET (14 chiffres)', pattern: '^[0-9]{14}$', verify: true, lang: 'fr', group: 'France & DOM-TOM' },
        { code: 'GF', label: '🇬🇫 Guyane Française', regLabel: 'SIRET (14 chiffres)', pattern: '^[0-9]{14}$', verify: true, lang: 'fr', group: 'France & DOM-TOM' },
        { code: 'PM', label: '🇵🇲 Saint-Pierre-et-Miquelon', regLabel: 'SIRET (14 chiffres)', pattern: '^[0-9]{14}$', verify: true, lang: 'fr', group: 'France & DOM-TOM' },
        { code: 'MF', label: '🇲🇫 Saint-Martin (FR)', regLabel: 'SIRET', pattern: null, verify: false, lang: 'fr', group: 'France & DOM-TOM' },
        { code: 'BL', label: '🇧🇱 Saint-Barthélemy', regLabel: 'SIRET', pattern: null, verify: false, lang: 'fr', group: 'France & DOM-TOM' },
        { code: 'WF', label: '🇼🇫 Wallis-et-Futuna', regLabel: 'SIRET', pattern: null, verify: false, lang: 'fr', group: 'France & DOM-TOM' },
        { code: 'NC', label: '🇳🇨 Nouvelle-Calédonie', regLabel: 'RIDET', pattern: null, verify: false, lang: 'fr', group: 'France & DOM-TOM' },
        { code: 'PF', label: '🇵🇫 Polynésie Française', regLabel: 'RCS Papeete', pattern: null, verify: false, lang: 'fr', group: 'France & DOM-TOM' },
        { code: 'YT', label: '🇾🇹 Mayotte', regLabel: 'SIRET (14 chiffres)', pattern: '^[0-9]{14}$', verify: true, lang: 'fr', group: 'France & DOM-TOM' },

        // ── EUROPE ────────────────────────────────────────────────────────
        { code: 'BE', label: '🇧🇪 Belgique', regLabel: 'Numéro BCE (10 chiffres)', pattern: '^[0-9]{10}$', verify: false, lang: 'fr', group: 'Europe' },
        { code: 'CH', label: '🇨🇭 Suisse', regLabel: 'UID (CHE-xxx.xxx.xxx)', pattern: null, verify: false, lang: 'fr', group: 'Europe' },
        { code: 'LU', label: '🇱🇺 Luxembourg', regLabel: 'RCS Luxembourg', pattern: null, verify: false, lang: 'fr', group: 'Europe' },
        { code: 'DE', label: '🇩🇪 Allemagne', regLabel: 'Handelsregisternummer', pattern: null, verify: false, lang: 'en', group: 'Europe' },
        { code: 'ES', label: '🇪🇸 Espagne', regLabel: 'NIF/CIF', pattern: null, verify: false, lang: 'es', group: 'Europe' },
        { code: 'IT', label: '🇮🇹 Italie', regLabel: 'Codice Fiscale / P.IVA', pattern: null, verify: false, lang: 'fr', group: 'Europe' },
        { code: 'PT', label: '🇵🇹 Portugal', regLabel: 'NIF', pattern: null, verify: false, lang: 'es', group: 'Europe' },
        { code: 'NL', label: '🇳🇱 Pays-Bas', regLabel: 'KVK-nummer', pattern: null, verify: false, lang: 'en', group: 'Europe' },
        { code: 'GB', label: '🇬🇧 Royaume-Uni', regLabel: 'Companies House Number', pattern: null, verify: false, lang: 'en', group: 'Europe' },
        { code: 'IE', label: '🇮🇪 Irlande', regLabel: 'CRO Number', pattern: null, verify: false, lang: 'en', group: 'Europe' },

        // ── AMÉRIQUES ─────────────────────────────────────────────────────
        { code: 'CA', label: '🇨🇦 Canada', regLabel: 'Business Number (BN)', pattern: '^[0-9]{9}$', verify: false, lang: 'fr', group: 'Amériques' },
        { code: 'US', label: '🇺🇸 États-Unis', regLabel: 'EIN (xx-xxxxxxx)', pattern: null, verify: false, lang: 'en', group: 'Amériques' },
        { code: 'MX', label: '🇲🇽 Mexique', regLabel: 'RFC', pattern: null, verify: false, lang: 'es', group: 'Amériques' },
        { code: 'CO', label: '🇨🇴 Colombie', regLabel: 'NIT', pattern: null, verify: false, lang: 'es', group: 'Amériques' },
        { code: 'BR', label: '🇧🇷 Brésil', regLabel: 'CNPJ', pattern: null, verify: false, lang: 'es', group: 'Amériques' },
        { code: 'AR', label: '🇦🇷 Argentine', regLabel: 'CUIT', pattern: null, verify: false, lang: 'es', group: 'Amériques' },
        { code: 'CL', label: '🇨🇱 Chili', regLabel: 'RUT', pattern: null, verify: false, lang: 'es', group: 'Amériques' },
        { code: 'GY', label: '🇬🇾 Guyane', regLabel: 'Business Registration', pattern: null, verify: false, lang: 'en', group: 'Amériques' },
        { code: 'HT', label: '🇭🇹 Haïti', regLabel: 'NIF', pattern: null, verify: false, lang: 'fr', group: 'Amériques' },

        // ── CARAÏBES & ÎLES ───────────────────────────────────────────────
        { code: 'JM', label: '🇯🇲 Jamaïque', regLabel: 'TRN', pattern: null, verify: false, lang: 'en', group: 'Caraïbes & Îles' },
        { code: 'TT', label: '🇹🇹 Trinité-et-Tobago', regLabel: 'Business Registration', pattern: null, verify: false, lang: 'en', group: 'Caraïbes & Îles' },
        { code: 'BB', label: '🇧🇧 Barbade', regLabel: 'Business Registration', pattern: null, verify: false, lang: 'en', group: 'Caraïbes & Îles' },
        { code: 'LC', label: '🇱🇨 Sainte-Lucie', regLabel: 'Business Registration', pattern: null, verify: false, lang: 'en', group: 'Caraïbes & Îles' },
        { code: 'VC', label: '🇻🇨 Saint-Vincent', regLabel: 'Business Registration', pattern: null, verify: false, lang: 'en', group: 'Caraïbes & Îles' },
        { code: 'GD', label: '🇬🇩 Grenade', regLabel: 'Business Registration', pattern: null, verify: false, lang: 'en', group: 'Caraïbes & Îles' },
        { code: 'DM', label: '🇩🇲 Dominique', regLabel: 'Business Registration', pattern: null, verify: false, lang: 'en', group: 'Caraïbes & Îles' },
        { code: 'AG', label: '🇦🇬 Antigua-et-Barbuda', regLabel: 'Business Registration', pattern: null, verify: false, lang: 'en', group: 'Caraïbes & Îles' },
        { code: 'KN', label: '🇰🇳 Saint-Kitts-et-Nevis', regLabel: 'Business Registration', pattern: null, verify: false, lang: 'en', group: 'Caraïbes & Îles' },
        { code: 'CU', label: '🇨🇺 Cuba', regLabel: 'REEUP', pattern: null, verify: false, lang: 'es', group: 'Caraïbes & Îles' },
        { code: 'DO', label: '🇩🇴 Rép. Dominicaine', regLabel: 'RNC', pattern: null, verify: false, lang: 'es', group: 'Caraïbes & Îles' },
        { code: 'PR', label: '🇵🇷 Porto Rico', regLabel: 'EIN', pattern: null, verify: false, lang: 'es', group: 'Caraïbes & Îles' },

        // ── AFRIQUE ───────────────────────────────────────────────────────
        { code: 'MA', label: '🇲🇦 Maroc', regLabel: 'ICE / RC', pattern: null, verify: false, lang: 'fr', group: 'Afrique' },
        { code: 'DZ', label: '🇩🇿 Algérie', regLabel: 'NIF', pattern: null, verify: false, lang: 'fr', group: 'Afrique' },
        { code: 'TN', label: '🇹🇳 Tunisie', regLabel: 'MF', pattern: null, verify: false, lang: 'fr', group: 'Afrique' },
        { code: 'SN', label: '🇸🇳 Sénégal', regLabel: 'NINEA', pattern: null, verify: false, lang: 'fr', group: 'Afrique' },
        { code: 'CI', label: '🇨🇮 Côte d\'Ivoire', regLabel: 'DGI Numéro contribuable', pattern: null, verify: false, lang: 'fr', group: 'Afrique' },
        { code: 'CM', label: '🇨🇲 Cameroun', regLabel: 'NIU', pattern: null, verify: false, lang: 'fr', group: 'Afrique' },
        { code: 'CD', label: '🇨🇩 Congo (RDC)', regLabel: 'NIF', pattern: null, verify: false, lang: 'fr', group: 'Afrique' },
        { code: 'GA', label: '🇬🇦 Gabon', regLabel: 'NIF', pattern: null, verify: false, lang: 'fr', group: 'Afrique' },
        { code: 'MG', label: '🇲🇬 Madagascar', regLabel: 'NIF', pattern: null, verify: false, lang: 'fr', group: 'Afrique' },
        { code: 'MU', label: '🇲🇺 Maurice', regLabel: 'BRN', pattern: null, verify: false, lang: 'en', group: 'Afrique' },
        { code: 'KM', label: '🇰🇲 Comores', regLabel: 'NIF', pattern: null, verify: false, lang: 'fr', group: 'Afrique' },
        { code: 'SC', label: '🇸🇨 Seychelles', regLabel: 'Business Registration', pattern: null, verify: false, lang: 'en', group: 'Afrique' },
        { code: 'CV', label: '🇨🇻 Cap-Vert', regLabel: 'NIF', pattern: null, verify: false, lang: 'es', group: 'Afrique' },
        { code: 'ST', label: '🇸🇹 São Tomé-et-Príncipe', regLabel: 'NIF', pattern: null, verify: false, lang: 'es', group: 'Afrique' },
        { code: 'NG', label: '🇳🇬 Nigéria', regLabel: 'CAC Number', pattern: null, verify: false, lang: 'en', group: 'Afrique' },
        { code: 'GH', label: '🇬🇭 Ghana', regLabel: 'TIN', pattern: null, verify: false, lang: 'en', group: 'Afrique' },
        { code: 'ZA', label: '🇿🇦 Afrique du Sud', regLabel: 'Company Reg. Number', pattern: null, verify: false, lang: 'en', group: 'Afrique' },

        // ── OCÉAN INDIEN / PACIFIQUE ──────────────────────────────────────
        { code: 'MV', label: '🇲🇻 Maldives', regLabel: 'Business Registration', pattern: null, verify: false, lang: 'en', group: 'Océan Indien / Pacifique' },
        { code: 'FJ', label: '🇫🇯 Fidji', regLabel: 'Business Registration', pattern: null, verify: false, lang: 'en', group: 'Océan Indien / Pacifique' },
        { code: 'SB', label: '🇸🇧 Îles Salomon', regLabel: 'Business Registration', pattern: null, verify: false, lang: 'en', group: 'Océan Indien / Pacifique' },
        { code: 'VU', label: '🇻🇺 Vanuatu', regLabel: 'Business Registration', pattern: null, verify: false, lang: 'fr', group: 'Océan Indien / Pacifique' },
        { code: 'TO', label: '🇹🇴 Tonga', regLabel: 'Business Registration', pattern: null, verify: false, lang: 'en', group: 'Océan Indien / Pacifique' },
        { code: 'WS', label: '🇼🇸 Samoa', regLabel: 'Business Registration', pattern: null, verify: false, lang: 'en', group: 'Océan Indien / Pacifique' },

        // ── ASIE / MOYEN-ORIENT ───────────────────────────────────────────
        { code: 'LB', label: '🇱🇧 Liban', regLabel: 'RC', pattern: null, verify: false, lang: 'fr', group: 'Asie / Moyen-Orient' },
        { code: 'AE', label: '🇦🇪 Émirats Arabes Unis', regLabel: 'Trade License', pattern: null, verify: false, lang: 'en', group: 'Asie / Moyen-Orient' },
        { code: 'SG', label: '🇸🇬 Singapour', regLabel: 'UEN', pattern: null, verify: false, lang: 'en', group: 'Asie / Moyen-Orient' },
        { code: 'IN', label: '🇮🇳 Inde', regLabel: 'CIN / GSTIN', pattern: null, verify: false, lang: 'en', group: 'Asie / Moyen-Orient' },
    ],

    // Map country code → app language
    LANG_MAP: {
        // French
        'FR': 'fr', 'RE': 'fr', 'GP': 'fr', 'MQ': 'fr', 'GF': 'fr', 'PM': 'fr', 'MF': 'fr', 'BL': 'fr',
        'WF': 'fr', 'NC': 'fr', 'PF': 'fr', 'YT': 'fr', 'BE': 'fr', 'CH': 'fr', 'LU': 'fr', 'IT': 'fr',
        'CA': 'fr', 'HT': 'fr', 'MA': 'fr', 'DZ': 'fr', 'TN': 'fr', 'SN': 'fr', 'CI': 'fr', 'CM': 'fr',
        'CD': 'fr', 'GA': 'fr', 'MG': 'fr', 'KM': 'fr', 'VU': 'fr', 'LB': 'fr',
        // Spanish
        'ES': 'es', 'MX': 'es', 'CO': 'es', 'BR': 'es', 'AR': 'es', 'CL': 'es', 'PT': 'es', 'CU': 'es',
        'DO': 'es', 'PR': 'es', 'CV': 'es', 'ST': 'es',
        // English (default)
    }
};

// Expose globally if not using full modules yet
window.AppConstants = AppConstants;
