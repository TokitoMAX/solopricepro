// SoloPrice Pro - Calculator Module
// Handles TJM and Hourly Rate calculations

function initCalculator() {
    loadCalculatorInputs();

    // Add event listeners for auto-calculation
    const inputs = ['monthlyRevenue', 'workingDays', 'hoursPerDay', 'monthlyCharges', 'taxRate'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', calculatePrice);
        }
    });

    // Listen for tax context changes from TaxEngine
    const taxSelect = document.getElementById('tax-context-select');
    if (taxSelect) {
        taxSelect.addEventListener('change', () => {
            const currentTax = TaxEngine.getCurrent();
            const taxRateInput = document.getElementById('taxRate');
            if (taxRateInput) {
                taxRateInput.value = currentTax.vat;
                calculatePrice();
            }
        });
    }

    // Run initial calculation
    calculatePrice();
}

function calculatePrice() {
    // Check if calculator exists on this page
    const revenueInput = document.getElementById('monthlyRevenue');
    if (!revenueInput) return;

    // Get input values
    const monthlyRevenue = parseFloat(revenueInput.value) || 0;
    const workingDays = parseFloat(document.getElementById('workingDays')?.value) || 0;
    const hoursPerDay = parseFloat(document.getElementById('hoursPerDay')?.value) || 0;
    const monthlyCharges = parseFloat(document.getElementById('monthlyCharges')?.value) || 0;
    const taxRate = parseFloat(document.getElementById('taxRate')?.value) || 0;

    // Validation
    if (workingDays === 0 || hoursPerDay === 0) return;

    // Calculate total needed before taxes
    // Formula: RevenueNeeded = (NetGoal + Charges) / (1 - TaxRate)

    const targetNet = monthlyRevenue;
    const charges = monthlyCharges;
    const rate = taxRate / 100;

    // Total a facturer pour avoir le net voulu + payer les charges
    // Rev - (Rev * Rate) - Charges = Net
    // Rev(1 - Rate) = Net + Charges
    // Rev = (Net + Charges) / (1 - Rate)

    let revenueNeeded = 0;
    if (rate < 1) {
        revenueNeeded = (targetNet + charges) / (1 - rate);
    }

    // Calculate total monthly hours
    const monthlyHours = workingDays * hoursPerDay;

    // Calculate hourly rate
    const hourlyRate = monthlyHours > 0 ? revenueNeeded / monthlyHours : 0;

    // Calculate daily rate
    const dailyRate = hourlyRate * hoursPerDay;

    // Calculate annual revenue
    const annualRevenue = revenueNeeded * 12;

    // Save inputs and results to central storage
    const calcData = {
        monthlyRevenue,
        workingDays,
        hoursPerDay,
        monthlyCharges,
        taxRate,
        dailyRate: Math.ceil(dailyRate),
        hourlyRate: Math.ceil(hourlyRate)
    };

    // Save both for legacy compatibility and for the new Storage system
    localStorage.setItem('sp_calculator_inputs', JSON.stringify(calcData));
    if (typeof Storage !== 'undefined') {
        Storage.set('sp_calculator_data', calcData);
    }

    // Update UI
    const hourlyEl = document.getElementById('hourlyRate');
    if (hourlyEl) hourlyEl.textContent = `${Math.ceil(hourlyRate)} €/h`;

    const dailyEl = document.getElementById('dailyRate');
    if (dailyEl) dailyEl.textContent = `${Math.ceil(dailyRate)} €/j`;

    const annualEl = document.getElementById('annualRevenue');
    if (annualEl) annualEl.textContent = `${Math.ceil(annualRevenue).toLocaleString('fr-FR')} €`;

    // Update breakdown
    const taxAmount = revenueNeeded * rate;

    updateElement('breakdownNet', Math.ceil(targetNet));
    updateElement('breakdownTax', Math.ceil(taxAmount));
    updateElement('breakdownCharges', Math.ceil(charges));
    updateElement('breakdownTotal', Math.ceil(revenueNeeded));

    // Update comparison marker
    updateComparisonMarker(hourlyRate);

    // Show results
    const resultsPanel = document.getElementById('resultsPanel');
    if (resultsPanel) resultsPanel.style.display = 'block';
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = `${value.toLocaleString('fr-FR')} €`;
}

function saveCalculatorInputs(data) {
    // This is now partially handled inside calculatePrice to include results
    localStorage.setItem('sp_calculator_inputs', JSON.stringify(data));
}

function loadCalculatorInputs() {
    const data = JSON.parse(localStorage.getItem('sp_calculator_inputs'));
    if (data) {
        setInputValue('monthlyRevenue', data.monthlyRevenue);
        setInputValue('workingDays', data.workingDays);
        setInputValue('hoursPerDay', data.hoursPerDay);
        setInputValue('monthlyCharges', data.monthlyCharges);
        setInputValue('taxRate', data.taxRate);
    }
}

function setInputValue(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined) el.value = value;
}

function updateComparisonMarker(hourlyRate) {
    const marker = document.getElementById('yourMarker');
    if (!marker) return;

    // Market ranges (Arbitrary for visual aid)
    const min = 30;
    const max = 150;

    // Calculate position (clamp between 5% and 95%)
    let position = ((hourlyRate - min) / (max - min)) * 100;
    position = Math.max(5, Math.min(95, position));

    marker.style.left = `${position}%`;

    const label = marker.querySelector('.marker-label');
    if (label) label.textContent = `Vous: ${Math.ceil(hourlyRate)}€`;
}

// Integration with Quotes
function useRate(type) {
    const dailyRateText = document.getElementById('dailyRate').textContent;
    const dailyRate = parseFloat(dailyRateText.replace(/[^0-9]/g, ''));

    if (dailyRate > 0) {
        // Create a draft item
        const draftItem = {
            description: 'Prestation (base TJM calculé)',
            quantity: 1,
            unitPrice: dailyRate
        };

        // Save to storage to be picked up by quotes.js
        Storage.set('sp_draft_quote_item', draftItem);

        // Navigate to quotes
        App.navigateTo('quotes');
        // Quotes will auto-detect the draft item in init
        setTimeout(() => {
            if (typeof Quotes !== 'undefined') Quotes.showAddForm();
        }, 100);
    }
}

// Global Exports
window.calculatePrice = calculatePrice;
window.useRate = useRate;
window.loadCalculatorInputs = initCalculator;

function renderCalculatorUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="calculator-container" style="grid-template-columns: 1fr; gap: 2rem;">
            <div class="calculator-inputs" style="padding: 1.5rem; background: var(--bg-sidebar);">
                <div class="input-group">
                    <label class="input-label">
                        <span class="label-text">Objectif Revenu Net Mensuel</span>
                        <span class="label-hint">Ce que vous voulez "dans votre poche" après charges et impôts.</span>
                    </label>
                    <input type="number" id="monthlyRevenue" class="input-field" placeholder="ex: 3000" value="3000">
                </div>

                <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="input-group">
                        <label class="input-label"><span class="label-text">Jours travaillés / mois</span></label>
                        <input type="number" id="workingDays" class="input-field" value="20">
                    </div>
                    <div class="input-group">
                        <label class="input-label"><span class="label-text">Heures / jour</span></label>
                        <input type="number" id="hoursPerDay" class="input-field" value="7">
                    </div>
                </div>

                <div class="input-group">
                    <label class="input-label">
                        <span class="label-text">Charges Fixes Mensuelles</span>
                        <span class="label-hint">Logiciels, loyer, assurance, etc.</span>
                    </label>
                    <input type="number" id="monthlyCharges" class="input-field" placeholder="ex: 500" value="500">
                </div>

                <div class="input-group">
                    <label class="input-label">
                        <span class="label-text">Taux de Cotisations / Impôts (%)</span>
                        <span class="label-hint">Ex: 22% pour auto-entrepreneur (services).</span>
                    </label>
                    <input type="number" id="taxRate" class="input-field" placeholder="ex: 22" value="22">
                </div>
            </div>

            <div class="results-panel" id="resultsPanel" style="padding: 1.5rem;">
                <div class="result-cards" style="grid-template-columns: 1fr 1fr; display: grid; gap: 1rem;">
                    <div class="result-card primary">
                        <div class="result-label">Taux Journalier (TJM)</div>
                        <div class="result-value" id="dailyRate" style="font-size: 1.8rem;">0 €/j</div>
                    </div>
                    <div class="result-card">
                        <div class="result-label">Taux Horaire</div>
                        <div class="result-value" id="hourlyRate" style="font-size: 1.8rem;">0 €/h</div>
                    </div>
                </div>
                
                <div class="breakdown-section" style="margin-top: 1rem; padding: 1rem;">
                    <div class="breakdown-items">
                        <div class="breakdown-item">
                            <span class="breakdown-label">Net souhaité</span>
                            <span class="breakdown-value" id="breakdownNet">0 €</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="breakdown-label">Charges</span>
                            <span class="breakdown-value" id="breakdownCharges">0 €</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="breakdown-label">Cotisations</span>
                            <span class="breakdown-value" id="breakdownTax">0 €</span>
                        </div>
                        <div class="breakdown-item total">
                            <span class="breakdown-label">CA Mensuel Requis</span>
                            <span class="breakdown-value" id="breakdownTotal">0 €</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    initCalculator();
}

window.renderCalculatorUI = renderCalculatorUI;
