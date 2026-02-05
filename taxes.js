/**
 * SoloPrice Pro - Territorial Tax Engine
 * Manages specific tax rules for DOM-TOM, France, and Africa contexts.
 */
const TaxEngine = {
    contexts: {
        'FR-METRO': {
            name: 'France (Métropole)',
            vat: 20,
            socialRate: 21.1, // Taux AE Libéral standard 2024/2025
            description: 'TVA standard 20% | Charges Sociales ~21.1%',
            code: 'FR'
        },
        'FR-REUNION': {
            name: 'La Réunion',
            vat: 8.5,
            socialRate: 21.1,
            description: 'TVA 8.5% | Charges Sociales ~21.1%',
            code: 'REU'
        },
        'FR-GUADELOUPE': {
            name: 'Guadeloupe',
            vat: 8.5,
            socialRate: 21.1,
            description: 'TVA 8.5% | Charges Sociales ~21.1%',
            code: 'GUA'
        },
        'FR-MARTINIQUE': {
            name: 'Martinique',
            vat: 8.5,
            socialRate: 21.1,
            description: 'TVA 8.5% | Charges Sociales ~21.1%',
            code: 'MAR'
        },
        'FR-GUYANE': {
            name: 'Guyane',
            vat: 0,
            socialRate: 21.1,
            description: 'Exonéré de TVA | Charges Sociales ~21.1%',
            code: 'GUY'
        },
        'AFRICA-GENERAL': {
            name: 'Afrique (H. TVA)',
            vat: 0,
            socialRate: 0,
            description: 'Export de services - HT | Charges locales à définir',
            code: 'AFR'
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
        return this.contexts[this.currentContext];
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
