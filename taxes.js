/**
 * SoloPrice Pro - Territorial Tax Engine
 * Manages specific tax rules for DOM-TOM, France, and Africa contexts.
 */
const TaxEngine = {
    contexts: {
        'FR-METRO': {
            name: 'France (Métropole)',
            vat: 20,
            taxName: 'TVA',
            socialRate: 21.1, // Taux AE Libéral standard 2024/2025
            description: 'TVA standard 20% | Charges Sociales ~21.1%',
            code: 'FR'
        },
        'FR-MICRO': {
            name: 'France (Auto-Entrepreneur)',
            vat: 0,
            taxName: 'TVA',
            socialRate: 21.1,
            description: 'TVA non applicable, art. 293 B du CGI | Charges ~21.1%',
            code: 'FR-AE'
        },
        'FR-REUNION': {
            name: 'La Réunion',
            vat: 8.5,
            taxName: 'TVA',
            socialRate: 21.1,
            description: 'TVA 8.5% | Charges Sociales ~21.1%',
            code: 'REU'
        },
        'AE-REUNION': {
            name: 'La Réunion (Auto-Entrepreneur)',
            vat: 0,
            taxName: 'TVA',
            socialRate: 21.1,
            description: 'TVA non applicable, art. 293 B du CGI | Charges ~21.1%',
            code: 'REU-AE'
        },
        'FR-GUADELOUPE': {
            name: 'Guadeloupe',
            vat: 8.5,
            taxName: 'TVA',
            socialRate: 21.1,
            description: 'TVA 8.5% | Charges Sociales ~21.1%',
            code: 'GUA'
        },
        'AE-GUADELOUPE': {
            name: 'Guadeloupe (Auto-Entrepreneur)',
            vat: 0,
            taxName: 'TVA',
            socialRate: 21.1,
            description: 'TVA non applicable, art. 293 B du CGI | Charges ~21.1%',
            code: 'GUA-AE'
        },
        'FR-MARTINIQUE': {
            name: 'Martinique',
            vat: 8.5,
            taxName: 'TVA',
            socialRate: 21.1,
            description: 'TVA 8.5% | Charges Sociales ~21.1%',
            code: 'MAR'
        },
        'AE-MARTINIQUE': {
            name: 'Martinique (Auto-Entrepreneur)',
            vat: 0,
            taxName: 'TVA',
            socialRate: 21.1,
            description: 'TVA non applicable, art. 293 B du CGI | Charges ~21.1%',
            code: 'MAR-AE'
        },
        'FR-GUYANE': {
            name: 'Guyane',
            vat: 0,
            taxName: 'TVA',
            socialRate: 21.1,
            description: 'Exonéré de TVA | Charges Sociales ~21.1%',
            code: 'GUY'
        },
        'CA-QC': {
            name: 'Canada (Québec)',
            vat: 14.975, // TPS 5% + TVQ 9.975%
            taxName: 'TPS/TVQ',
            socialRate: 15.0, // Estimation générique
            description: 'TPS/TVQ 14.975% | Charges ~15%',
            code: 'CA-QC'
        },
        'CH': {
            name: 'Suisse',
            vat: 8.1,
            taxName: 'TVA Suisse',
            socialRate: 10.0, // Estimation générique AVS/AI etc
            description: 'TVA 8.1% | Charges ~10%',
            code: 'CH'
        },
        'SN': {
            name: 'Sénégal',
            vat: 18,
            taxName: 'TVA',
            socialRate: 5.0, // TRJS simplifié ou équivalent
            description: 'TVA 18% | Charges locales applicables',
            code: 'SN'
        },
        'AFRICA-GENERAL': {
            name: 'Afrique (H. TVA)',
            vat: 0,
            taxName: 'Taxe Locale',
            socialRate: 0,
            description: 'Export de services - HT | Charges locales à définir',
            code: 'AFR'
        },
        'US-GENERIC': {
            name: 'United States (General)',
            vat: 0,
            taxName: 'Sales Tax',
            socialRate: 15.3, // Self-employment tax
            description: 'Sales Tax (depends on State) | SE Tax ~15.3%',
            code: 'US'
        },
        'LATAM-GENERIC': {
            name: 'América Latina (General)',
            vat: 15,
            taxName: 'IVA',
            socialRate: 10,
            description: 'IVA promedio 15% | Cargas sociales estimadas 10%',
            code: 'LATAM'
        },
        'ES-GENERIC': {
            name: 'España (Autónomo)',
            vat: 21,
            taxName: 'IVA',
            socialRate: 30, // Estimación cuota autónomos
            description: 'IVA 21% | Cuota de autónomos aplicable',
            code: 'ES'
        }
    },

    currentContext: 'FR-METRO',

    init() {
        if (typeof Storage === 'undefined') return;
        const settings = Storage.get(Storage.KEYS.SETTINGS) || {};
        if (settings.taxContext) {
            this.currentContext = settings.taxContext;
        }
    },

    setContext(ctxId) {
        if (this.contexts[ctxId]) {
            this.currentContext = ctxId;
            if (typeof Storage !== 'undefined') {
                Storage.updateSettings({ taxContext: ctxId });
            }
            return true;
        }
        return false;
    },

    getCurrent() {
        return this.contexts[this.currentContext] || this.contexts['FR-METRO'];
    },

    getSocialRate() {
        if (typeof Storage === 'undefined') return 21.1;
        const settings = Storage.get(Storage.KEYS.SETTINGS) || {};
        const status = settings.socialStatus || 'SERVICE';

        const rates = {
            'SERVICE': 21.1,
            'VENTE': 12.3,
            'CIPAV': 23.2,
            'EXEMPT': 0
        };

        return rates[status] || 21.1;
    },

    calculate(amountHT) {
        const ctx = this.getCurrent();
        const taxAmount = (amountHT * ctx.vat) / 100;
        const socialRate = this.getSocialRate();
        const socialCharges = (amountHT * socialRate) / 100;

        return {
            ht: amountHT,
            vat: taxAmount,
            taxName: ctx.taxName || 'TVA',
            ttc: amountHT + taxAmount,
            socialCharges: socialCharges,
            socialRate: socialRate,
            net: amountHT - socialCharges,
            description: ctx.description
        };
    },

    renderSelector(containerId, onchange) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="tax-selector-group">
                <label class="form-label">Régime Fiscal / Zone</label>
                <select class="form-input" id="tax-context-select">
                    ${Object.entries(this.contexts).map(([id, ctx]) => `
                        <option value="${id}" ${id === this.currentContext ? 'selected' : ''}>
                            ${ctx.name} (${ctx.vat}%)
                        </option>
                    `).join('')}
                </select>
                <p class="text-xs text-muted" id="tax-context-desc">${this.getCurrent().description}</p>
            </div>
        `;

        const select = document.getElementById('tax-context-select');
        select.addEventListener('change', (e) => {
            this.setContext(e.target.value);
            document.getElementById('tax-context-desc').textContent = this.getCurrent().description;
            if (onchange) onchange(e.target.value);
        });
    }
};

TaxEngine.init();
window.TaxEngine = TaxEngine;
