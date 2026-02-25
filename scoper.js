// SoloPrice Pro - Project Scoper Module
// Outil d'estimation intelligente de projets (Value Pricing & Risk Management)

const Scoper = {
    tasks: [],
    settings: {
        hideHours: true
    },

    render(tab = 'objective') {
        const container = document.getElementById('scoper-content');
        if (!container) return;

        const isPro = Storage.isPro();
        if (!this.currentObjectiveStep) this.currentObjectiveStep = Storage.get('sp_scoper_current_step') || 1;

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Stratégie & Chiffrage</h1>
                    <p class="page-subtitle">Définissez votre objectif de revenu et chiffrez vos prestations avec précision.</p>
                </div>
            </div>

            <div class="tabs-container" style="margin-bottom: 2rem;">
                <div class="tabs-header" style="display: flex; gap: 1rem; border-bottom: 1px solid var(--border);">
                    <button class="tab-btn ${tab === 'objective' ? 'active' : ''}" onclick="Scoper.render('objective')" style="padding: 1rem; background: none; border: none; color: ${tab === 'objective' ? 'var(--primary-light)' : 'var(--text-muted)'}; border-bottom: 2px solid ${tab === 'objective' ? 'var(--primary)' : 'transparent'}; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-bullseye"></i> Mon Objectif TJM
                    </button>
                    <button class="tab-btn ${tab === 'project' ? 'active' : ''}" onclick="Scoper.render('project')" style="padding: 1rem; background: none; border: none; color: ${tab === 'project' ? 'var(--primary-light)' : 'var(--text-muted)'}; border-bottom: 2px solid ${tab === 'project' ? 'var(--primary)' : 'transparent'}; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-calculator"></i> Chiffrage Projet ${!isPro ? '<i class="fas fa-lock" style="font-size: 0.7rem; margin-left: 5px; opacity: 0.5;"></i>' : ''}
                    </button>
                </div>
            </div>

            <div id="scoper-tab-content"></div>
        `;

        if (tab === 'objective') {
            this.renderObjectiveTab();
        } else {
            this.renderProjectTab();
        }
    },

    renderObjectiveTab() {
        const content = document.getElementById('scoper-tab-content');
        if (!content) return;

        const data = Storage.get('sp_calculator_data') || {};
        const currentStep = this.currentObjectiveStep || 1;

        content.innerHTML = `
            <div class="strategy-wizard" style="max-width: 900px; margin: 0 auto;">
                <!-- Wizard Header / Steps -->
                <div class="wizard-steps" style="display: flex; justify-content: space-between; margin-bottom: 3rem; position: relative;">
                    <div style="position: absolute; top: 20px; left: 0; width: 100%; height: 2px; background: var(--border); z-index: 1;"></div>
                    <div style="position: absolute; top: 20px; left: 0; width: ${(currentStep - 1) * 33.33}%; height: 2px; background: var(--primary); z-index: 2; transition: width 0.3s ease;"></div>
                    
                    ${[1, 2, 3, 4].map(s => {
            const labels = ['REVENU', 'RYTHME', 'CHARGES', 'VERDICT'];
            const icons = ['fa-money-bill-wave', 'fa-calendar-alt', 'fa-shield-alt', 'fa-flag-checkered'];
            const isActive = currentStep === s;
            const isDone = currentStep > s;
            return `
                            <div class="wizard-step-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}" 
                                 onclick="Scoper.goToObjectiveStep(${s})"
                                 style="position: relative; z-index: 3; text-align: center; cursor: pointer;">
                                <div class="step-icon" style="width: 40px; height: 40px; border-radius: 50%; background: ${isDone ? 'var(--primary)' : (isActive ? 'var(--primary-dark)' : '#111')}; border: 2px solid ${isActive || isDone ? 'var(--primary)' : 'var(--border)'}; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; transition: all 0.3s;">
                                    <i class="fas ${isDone ? 'fa-check' : icons[s - 1]}" style="color: ${isActive || isDone ? 'var(--white)' : 'var(--text-muted)'}; font-size: 0.9rem;"></i>
                                </div>
                                <span style="font-size: 0.7rem; font-weight: 700; color: ${isActive || isDone ? 'var(--primary-light)' : 'var(--text-muted)'}; letter-spacing: 1px;">${labels[s - 1]}</span>
                            </div>
                        `;
        }).join('')}
                </div>

                <div class="wizard-step-content glass-card" style="padding: 3rem; min-height: 400px; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
                    <div id="step-save-indicator" style="position: absolute; top: 1rem; right: 1.5rem; font-size: 0.7rem; color: var(--primary-light); opacity: 0.5; transition: opacity 0.3s; pointer-events: none;">
                        <i class="fas fa-check"></i> En attente
                    </div>
                    <div id="step-form-container">
                        ${this.renderCurrentStepForm(currentStep)}
                    </div>

                    <div class="wizard-actions" style="display: flex; justify-content: space-between; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border);">
                        <button class="button-outline" ${currentStep === 1 ? 'disabled' : ''} onclick="Scoper.prevObjectiveStep()">
                            Retour
                        </button>
                        ${currentStep < 4 ? `
                            <button class="button-primary" onclick="Scoper.nextObjectiveStep()">
                                Continuer <i class="fas fa-arrow-right" style="margin-left: 10px;"></i>
                            </button>
                        ` : `
                            <button class="button-primary" onclick="Scoper.saveObjective()">
                                Adopter mon TJM Stratégique <i class="fas fa-check" style="margin-left: 10px;"></i>
                            </button>
                        `}
                    </div>
                </div>

                <div id="objective-next-step" style="display: none; margin-top: 2rem; padding: 1.5rem; background: var(--primary-glass); border: 1px solid var(--primary); border-radius: 12px; text-align: center; animation: fadeInUp 0.5s ease;">
                    <h4 style="color: var(--primary-light); margin-bottom: 10px;">🚀 Stratégie validée !</h4>
                    <p style="font-size: 0.9rem; margin-bottom: 1.5rem;">Votre TJM est maintenant enregistré. Utilisez-le pour chiffrer vos futurs projets avec l'onglet <strong>Chiffrage Projet</strong>.</p>
                    <button class="button-primary" onclick="Scoper.render('project')">Commencer un chiffrage</button>
                </div>
            </div>
        `;
    },

    renderCurrentStepForm(step) {
        const data = Storage.get('sp_calculator_data') || { monthlyRevenue: 3000, workingDays: 15, hoursPerDay: 7, monthlyCharges: 500, taxRate: 22 };

        switch (step) {
            case 1: // REVENU
                return `
                    <div class="step-header" style="margin-bottom: 2rem;">
                        <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem;">Cibler votre revenu net</h2>
                        <p class="text-muted">Combien voulez-vous réellement toucher par mois, après avoir tout payé ?</p>
                    </div>
                    <div class="input-group">
                        <label class="form-label" style="font-size: 1.1rem;">Revenu Net Mensuel souhaité (€)</label>
                        <input type="number" id="monthlyRevenue" class="form-input large" value="${data.monthlyRevenue || ''}" placeholder="ex: 3000" oninput="Scoper.autoSaveObjective()" style="font-size: 1.5rem; padding: 1.2rem;">
                        <p class="text-xs text-muted" style="margin-top: 10px;">💡 C'est votre "salaire" cible. Soyez ambitieux mais réaliste pour votre marché.</p>
                    </div>
                `;
            case 2: // RYTHME
                return `
                    <div class="step-header" style="margin-bottom: 2rem;">
                        <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem;">Définir votre rythme</h2>
                        <p class="text-muted">Un freelance ne facture pas 20 jours par mois. Prévoyez du temps pour la prospection et l'administratif.</p>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                        <div class="input-group">
                            <label class="form-label">Jours facturés / mois</label>
                            <input type="number" id="workingDays" class="form-input" value="${data.workingDays || 15}" oninput="Scoper.autoSaveObjective()">
                            <p class="text-xs text-muted" style="margin-top: 8px;">Moyenne conseillée : 10 à 15 jours.</p>
                        </div>
                        <div class="input-group">
                            <label class="form-label">Heures productives / jour</label>
                            <input type="number" id="hoursPerDay" class="form-input" value="${data.hoursPerDay || 7}" oninput="Scoper.autoSaveObjective()">
                            <p class="text-xs text-muted" style="margin-top: 8px;">Le temps réel passé sur les dossiers.</p>
                        </div>
                    </div>
                `;
            case 3: // CHARGES
                return `
                    <div class="step-header" style="margin-bottom: 2rem;">
                        <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem;">Provisionner charges & taxes</h2>
                        <p class="text-muted">Le CA n'est pas votre revenu. Il faut payer l'État et vos outils.</p>
                    </div>
                    <div class="input-group">
                        <label class="form-label">Charges Fixes Mensuelles (€)</label>
                        <input type="number" id="monthlyCharges" class="form-input" value="${data.monthlyCharges || 500}" oninput="Scoper.autoSaveObjective()">
                        <p class="text-xs text-muted">Abonnements SaaS, loyer, mutuelle, assurance...</p>
                    </div>
                    <div class="input-group">
                        <label class="form-label">Cotisations / Impôts (%)</label>
                        <input type="number" id="taxRate" class="form-input" value="${data.taxRate || 22}" oninput="Scoper.autoSaveObjective()">
                        <p class="text-xs text-muted">Auto-entrepreneur : ~22% (BNC) ou ~12% (Achat-Revente).</p>
                    </div>
                `;
            case 4: // VERDICT
                const results = this.calculateObjectiveData(data);
                return `
                    <div class="step-header" style="margin-bottom: 2rem; text-align: center;">
                        <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem;">C'est prêt ! Voici votre TJM cible</h2>
                        <p class="text-muted">Si vous facturez ce prix, vous atteindrez votre objectif de revenu net.</p>
                    </div>
                    
                    <div class="result-highlight glass-card" style="background: var(--primary-glass); border: 2px solid var(--primary); padding: 2.5rem; text-align: center; border-radius: 20px; margin-bottom: 2rem;">
                        <div style="font-size: 1.1rem; color: var(--primary-light); font-weight: 700; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">TJM STRATÉGIQUE</div>
                        <div style="font-size: 4rem; font-weight: 900; color: var(--white); text-shadow: 0 0 20px var(--primary-glow);">${results.dailyRate}€<span style="font-size: 1.5rem; font-weight: 400; opacity: 0.7;"> / jour</span></div>
                    </div>

                    <div class="verdict-breakdown" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                        <div style="padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 12px; text-align: center;">
                            <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 5px;">CA Mensuel Requis</div>
                            <div style="font-weight: 700;">${results.revenueNeeded}€</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 12px; text-align: center;">
                            <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 5px;">Taxes (Est.)</div>
                            <div style="font-weight: 700;">${results.taxAmount}€</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 12px; text-align: center;">
                            <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 5px;">Taux Horaire</div>
                            <div style="font-weight: 700;">${results.hourlyRate}€/h</div>
                        </div>
                    </div>
                `;
        }
    },

    goToObjectiveStep(step) {
        this.currentObjectiveStep = step;
        Storage.set('sp_scoper_current_step', step);
        this.render('objective');
    },

    nextObjectiveStep() {
        if (!this.currentObjectiveStep) this.currentObjectiveStep = Storage.get('sp_scoper_current_step') || 1;
        if (this.currentObjectiveStep < 4) {
            this.currentObjectiveStep++;
            Storage.set('sp_scoper_current_step', this.currentObjectiveStep);
            this.render('objective');
        }
    },

    prevObjectiveStep() {
        if (this.currentObjectiveStep > 1) {
            this.currentObjectiveStep--;
            Storage.set('sp_scoper_current_step', this.currentObjectiveStep);
            this.render('objective');
        }
    },

    autoSaveObjective() {
        const data = {
            monthlyRevenue: parseFloat(document.getElementById('monthlyRevenue')?.value) || 0,
            workingDays: parseFloat(document.getElementById('workingDays')?.value) || 1,
            hoursPerDay: parseFloat(document.getElementById('hoursPerDay')?.value) || 1,
            monthlyCharges: parseFloat(document.getElementById('monthlyCharges')?.value) || 0,
            taxRate: parseFloat(document.getElementById('taxRate')?.value) || 0
        };
        Storage.set('sp_calculator_data', data);

        // Show subtle visual confirmation
        const indicator = document.getElementById('step-save-indicator');
        if (indicator) {
            indicator.style.opacity = '1';
            indicator.innerHTML = '<i class="fas fa-sync fa-spin"></i> Synchronisation...';
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                indicator.innerHTML = '<i class="fas fa-check"></i> Enregistré en temps réel';
                setTimeout(() => { indicator.style.opacity = '0.5'; }, 1000);
            }, 500);
        }
    },

    calculateObjectiveData(data) {
        const rate = (data.taxRate || 0) / 100;
        let revenueNeeded = 0;
        if (rate < 1) {
            revenueNeeded = ((data.monthlyRevenue || 0) + (data.monthlyCharges || 0)) / (1 - rate);
        }

        const monthlyHours = (data.workingDays || 1) * (data.hoursPerDay || 1);
        const hourlyRate = monthlyHours > 0 ? revenueNeeded / monthlyHours : 0;
        const dailyRate = hourlyRate * (data.hoursPerDay || 1);

        return {
            dailyRate: Math.ceil(dailyRate),
            hourlyRate: Math.ceil(hourlyRate),
            revenueNeeded: Math.ceil(revenueNeeded),
            taxAmount: Math.ceil(revenueNeeded * rate)
        };
    },

    renderProjectTab() {
        const content = document.getElementById('scoper-tab-content');
        if (!content) return;

        if (!Storage.isPro()) {
            content.innerHTML = PremiumWall.renderPageWall('Estimateur de Projet');
            return;
        }

        content.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Chiffrage Projet</h1>
                    <p class="page-subtitle">Calculez le prix juste pour cette mission spécifique (Valeur & Risque).</p>
                </div>
            </div>

            <div class="calculator-container" style="display: grid; grid-template-columns: 1.6fr 1fr; gap: 2rem;">
                
                <!-- Task List Input -->
                <div class="calculator-inputs" style="background: #0a0a0a; border: 1px solid var(--border); padding: 2rem; border-radius: var(--radius-lg);">
                    <div class="section-header-inline" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h3 style="font-size: 1.2rem; font-weight: 700;">Décomposition du Projet</h3>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="button-secondary small" onclick="Scoper.addTask()" title="Ajouter une ligne vide">
                                + Tâche
                            </button>
                            <button class="button-outline small" onclick="Scoper.showCatalogSelector()" title="Importer depuis votre catalogue">
                                <i class="fas fa-book"></i> Catalogue
                            </button>
                        </div>
                    </div>

                    <div id="scoper-tasks" class="scoper-tasks-list">
                        <!-- Rempli par renderTasks -->
                    </div>
                </div>

                <!-- Results & Analysis -->
                <div class="results-panel" style="background: #050505; border: 1px solid var(--primary-glass); padding: 2rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-glow);">
                    <div class="results-header" style="margin-bottom: 2rem;">
                        <h3 class="results-title" style="font-size: 1.1rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Analyse Financière</h3>
                    </div>

                    <div class="result-cards" style="display: grid; gap: 1rem; margin-bottom: 2.5rem;">
                        <div class="result-card primary" style="background: rgba(16, 185, 129, 0.05); border: 1px solid var(--primary); padding: 1.5rem; border-radius: 12px;">
                            <div class="result-label" style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Montant à Facturer (TTC)</div>
                            <div class="result-value" id="scoper-total-price" style="font-size: 2.5rem; font-weight: 800; color: var(--primary);">0€</div>
                            <div class="result-description" id="scoper-tax-info" style="font-size: 0.8rem; opacity: 0.7;">Zone: France (20%)</div>
                        </div>

                        <div class="result-card" style="background: #111; border: 1px solid var(--border); padding: 1rem; border-radius: 12px;">
                            <div class="result-label" style="font-size: 0.75rem; color: var(--text-muted);">Temps de Production Est.</div>
                            <div class="result-value" id="scoper-total-time" style="font-size: 1.4rem; font-weight: 700; color: var(--white);">0h</div>
                            <div class="result-description" id="scoper-range" style="font-size: 0.75rem;">Sécurité incluse</div>
                        </div>
                    </div>

                    <div class="breakdown-section" style="background: transparent; border-top: 1px solid var(--border); padding-top: 1.5rem;">
                        <h4 class="breakdown-title" style="margin-bottom: 1.5rem; font-weight: 600;">Stratégie & Rentabilité</h4>
                        
                        <div class="input-group">
                            <label class="form-label">TJM appliqué à ce projet (€)</label>
                            <input type="number" id="scoper-tjm" class="form-input" value="${this.getTJM()}" onchange="Scoper.calculate()" style="border-color: var(--primary-light);">
                            <p class="text-xs text-muted" style="margin-top: 4px;">Défaut : TJM Stratégique définit dans les Réglages.</p>
                        </div>

                        <div class="input-group">
                            <label class="form-label">Marge de Sécurité (%)</label>
                            <input type="number" id="scoper-buffer" class="form-input" value="20" onchange="Scoper.calculate()">
                        </div>

                        <div class="input-group" style="margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid var(--border);">
                            <label class="checkbox-container" style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" id="scoper-hide-hours" ${this.settings.hideHours ? 'checked' : ''} onchange="Scoper.updateSettings('hideHours', this.checked)">
                                <span style="font-size: 0.85rem; font-weight: 500;">Masquer le détail des heures sur le devis</span>
                            </label>
                            <p class="text-xs text-muted" style="margin-top: 5px; margin-left: 25px;">Focus sur la valeur perçue.</p>
                        </div>

                        <div id="scoper-profitability-indicator" style="margin-top: 1.5rem;">
                            <!-- Rentabilité interne -->
                        </div>

                        <div id="scoper-tax-container" style="margin-top: 1rem;"></div>
                    </div>

                    <div class="calculator-actions" style="margin-top: 2rem;">
                        <button class="button-primary full-width" id="btn-create-quote" style="padding: 1rem; font-size: 1rem;">
                            Générer le Devis Officiel
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.renderTasks();

        if (typeof TaxEngine !== 'undefined') {
            TaxEngine.renderSelector('scoper-tax-container', () => this.calculate());
        }

        this.calculate();

        // Attach event listener explicitly to avoid inline onclick issues
        const createBtn = document.getElementById('btn-create-quote');
        if (createBtn) {
            createBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Create Quote Clicked');
                this.createQuote();
            });
        }
    },

    getTJM() {
        const calcData = Storage.get('sp_calculator_data');
        return calcData?.dailyRate || 400;
    },

    loadObjectiveInputs() {
        const data = Storage.get('sp_calculator_data');
        if (data) {
            if (document.getElementById('monthlyRevenue')) document.getElementById('monthlyRevenue').value = data.monthlyRevenue || 3000;
            if (document.getElementById('workingDays')) document.getElementById('workingDays').value = data.workingDays || 15;
            if (document.getElementById('hoursPerDay')) document.getElementById('hoursPerDay').value = data.hoursPerDay || 7;
            if (document.getElementById('monthlyCharges')) document.getElementById('monthlyCharges').value = data.monthlyCharges || 500;
            if (document.getElementById('taxRate')) document.getElementById('taxRate').value = data.taxRate || 22;
        }
    },

    async saveObjective() {
        const data = {
            monthlyRevenue: parseFloat(document.getElementById('monthlyRevenue')?.value) || 0,
            workingDays: parseFloat(document.getElementById('workingDays')?.value) || 1,
            hoursPerDay: parseFloat(document.getElementById('hoursPerDay')?.value) || 1,
            monthlyCharges: parseFloat(document.getElementById('monthlyCharges')?.value) || 0,
            taxRate: parseFloat(document.getElementById('taxRate')?.value) || 0,
            dailyRate: Math.ceil(parseFloat(document.getElementById('dailyRate').textContent)),
            hourlyRate: Math.ceil(parseFloat(document.getElementById('hourlyRate').textContent))
        };

        if (data.dailyRate <= 0) {
            App.showNotification('Veuillez fixer un objectif valide', 'warning');
            return;
        }

        await Storage.set('sp_calculator_data', data);
        App.showNotification('Stratégie TJM enregistrée !', 'success');

        // Show next step hint
        const hint = document.getElementById('objective-next-step');
        if (hint) hint.style.display = 'block';

        // Refresh onboarding if needed
        if (typeof Onboarding !== 'undefined') {
            const dashboard = document.getElementById('dashboard');
            if (dashboard && dashboard.classList.contains('active')) {
                Dashboard.render();
            }
        }
    },

    updateSettings(key, value) {
        this.settings[key] = value;
        this.calculate();
    },

    addTask() {
        if (!Auth.getUser()?.isPro && this.tasks.length >= 5) {
            App.showUpgradeModal('scoper_limit');
            return;
        }
        this.tasks.push({ name: '', min: 1, max: 2, manualPrice: null });
        this.renderTasks();
        this.calculate();
    },

    removeTask(index) {
        this.tasks.splice(index, 1);
        this.renderTasks();
        this.calculate();
    },

    updateTask(index, field, value) {
        if (field === 'name') this.tasks[index].name = value;
        else if (field === 'manualPrice') {
            const val = parseFloat(value);
            this.tasks[index].manualPrice = (isNaN(val) || value === '') ? null : Math.max(0, val);
        } else {
            const val = parseFloat(value);
            this.tasks[index][field] = Math.max(0, val) || 0;
        }
        this.calculate();
    },

    renderTasks() {
        const container = document.getElementById('scoper-tasks');
        if (!container) return;

        if (this.tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 3rem; text-align: center; background: rgba(255,255,255,0.02); border-radius: 12px; border: 2px dashed var(--border);">
                    <p class="text-muted">Aucune tâche définie.</p>
                    <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem;">
                        <button class="button-primary small" onclick="Scoper.addTask()">+ Tâche Vide</button>
                        <button class="button-secondary small" onclick="Scoper.showCatalogSelector()">+ Du Catalogue</button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.tasks.map((task, index) => {
            // Calculated price as fallback/ghost
            const tjm = parseFloat(document.getElementById('scoper-tjm')?.value) || this.getTJM();
            const buffer = parseFloat(document.getElementById('scoper-buffer')?.value) || 20;
            const hours = task.max * (1 + buffer / 100);
            const calculatedPrice = (hours / 7) * tjm;

            return `
                <div class="scoper-task-row" data-index="${index}">
                    <div class="task-main">
                        <input type="text" placeholder="Nom de la prestation (ex: Design UI)" class="form-input task-name" value="${task.name}" onchange="Scoper.updateTask(${index}, 'name', this.value)">
                    </div>
                    
                    <div class="task-details">
                        <div class="time-inputs">
                            <div class="time-field">
                                <label>Optimiste (h)</label>
                                <input type="number" class="form-input mini" value="${task.min}" step="0.5" onchange="Scoper.updateTask(${index}, 'min', this.value)">
                            </div>
                            <div class="time-field">
                                <label>Réaliste (h)</label>
                                <input type="number" class="form-input mini" value="${task.max}" step="0.5" onchange="Scoper.updateTask(${index}, 'max', this.value)">
                            </div>
                        </div>

                        <div class="price-override">
                            <label>Prix Forfaitaire (€)</label>
                            <input type="number" 
                                   class="form-input" 
                                   placeholder="${Math.round(calculatedPrice)}€" 
                                   value="${task.manualPrice !== null ? task.manualPrice : ''}" 
                                   onchange="Scoper.updateTask(${index}, 'manualPrice', this.value)">
                        </div>

                        <button class="btn-icon btn-danger" onclick="Scoper.removeTask(${index})" title="Supprimer">✕</button>
                    </div>
                </div>
            `;
        }).join('');

        // Inject Styles
        if (!document.getElementById('scoper-styles-v2')) {
            const style = document.createElement('style');
            style.id = 'scoper-styles-v2';
            style.textContent = `
                .scoper-task-row {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 1.2rem;
                    margin-bottom: 1rem;
                    transition: transform 0.2s;
                }
                .scoper-task-row:hover { border-color: var(--primary-glass); }
                
                .task-main { margin-bottom: 1rem; }
                .task-main .task-name { font-weight: 600; font-size: 1rem; width: 100%; }
                
                .task-details {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    gap: 1.5rem;
                }
                
                .time-inputs { display: flex; gap: 0.8rem; }
                .time-field label { display: block; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px; }
                .form-input.mini { width: 70px; text-align: center; }
                
                .price-override { flex: 1; }
                .price-override label { display: block; font-size: 0.7rem; font-weight: 600; color: var(--primary); margin-bottom: 4px; }
                .price-override input { width: 100%; border-color: var(--primary-glass); background: rgba(var(--primary-rgb), 0.05); }
                
                .btn-icon.btn-danger { padding: 0.5rem; border-radius: 6px; }
            `;
            document.head.appendChild(style);
        }
    },

    calculate() {
        const tjmEl = document.getElementById('scoper-tjm');
        const bufferEl = document.getElementById('scoper-buffer');

        const tjm = tjmEl ? parseFloat(tjmEl.value) : (this.getTJM() || 400);
        const buffer = bufferEl ? parseFloat(bufferEl.value) : 20;

        let totalHoursInternal = 0;
        let totalCalculatedHT = 0;
        let totalFinalHT = 0;

        this.tasks.forEach(t => {
            const safeHours = t.max * (1 + buffer / 100);
            totalHoursInternal += safeHours;

            const taskCalculatedHT = (safeHours / 7) * tjm;
            totalCalculatedHT += taskCalculatedHT;

            totalFinalHT += t.manualPrice !== null ? t.manualPrice : taskCalculatedHT;
        });

        // Tax Calculation
        let totalTTC = totalFinalHT;
        let taxLabel = "HT";
        if (typeof TaxEngine !== 'undefined') {
            const taxResult = TaxEngine.calculate(totalFinalHT);
            totalTTC = taxResult.ttc;
            taxLabel = `TTC (incl. ${TaxEngine.getCurrent().name})`;
            document.getElementById('scoper-tax-info').textContent = taxLabel;
        }

        // Display results
        const priceEl = document.getElementById('scoper-total-price');
        if (priceEl) priceEl.textContent = App.formatCurrency(totalTTC);

        const timeEl = document.getElementById('scoper-total-time');
        if (timeEl) timeEl.textContent = `${Math.ceil(totalHoursInternal)}h`;

        const rangeEl = document.getElementById('scoper-range');
        if (rangeEl) {
            const minH = this.tasks.reduce((s, t) => s + t.min, 0);
            const maxH = this.tasks.reduce((s, t) => s + t.max, 0);
            rangeEl.textContent = `Production: ${minH}h à ${maxH}h (+${buffer}% sécu)`;
        }

        this.renderProfitability(totalFinalHT, totalCalculatedHT);

        const btn = document.getElementById('btn-create-quote');
        if (btn) btn.disabled = this.tasks.length === 0;
    },

    renderProfitability(finalHT, targetHT) {
        const container = document.getElementById('scoper-profitability-indicator');
        if (!container) return;

        if (this.tasks.length === 0) {
            container.innerHTML = '';
            return;
        }

        const ratio = targetHT > 0 ? (finalHT / targetHT) * 100 : 100;
        let color = 'var(--text-muted)';
        let message = 'Basé sur votre objectif net';

        if (ratio > 110) {
            color = 'var(--success)';
            message = `Prix Premium (+${Math.round(ratio - 100)}% vs objectif stratégique)`;
        } else if (ratio < 90) {
            color = 'var(--danger)';
            message = `Attention : Inférieur à votre TJM cible (-${Math.round(100 - ratio)}%)`;
        } else {
            color = 'var(--primary)';
            message = 'Prix parfait : Aligné sur vos besoins nets';
        }

        container.innerHTML = `
            <div style="padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 10px; border-left: 4px solid ${color};">
                <div style="font-size: 0.75rem; font-weight: 600; color: ${color}; text-transform: uppercase; letter-spacing: 0.5px;">Indicateur de Rentabilité</div>
                <div style="font-size: 0.9rem; margin-top: 4px; color: var(--white);">${message}</div>
            </div>
        `;
    },

    createQuote() {
        console.log('Starting createQuote...');
        try {
            const limits = App.checkFreemiumLimits();
            if (!limits.canAddQuote) {
                console.log('Limit reached');
                App.showUpgradeModal('quotes');
                return;
            }

            const tjmEl = document.getElementById('scoper-tjm');
            const bufferEl = document.getElementById('scoper-buffer');

            // Fallbacks robustes
            const tjm = tjmEl ? (parseFloat(tjmEl.value) || 400) : (this.getTJM() || 400);
            const buffer = bufferEl ? (parseFloat(bufferEl.value) || 20) : 20;

            console.log('Params:', { tjm, buffer });

            const quoteItems = [];

            this.tasks.forEach(task => {
                if (!task.name) return;

                const hours = task.max * (1 + buffer / 100);
                const calculatedPrice = (hours / 7) * tjm;
                const finalPrice = task.manualPrice !== null ? task.manualPrice : calculatedPrice;

                let description = task.name;
                if (!this.settings.hideHours) {
                    description += ` (Est. ${Math.ceil(hours)}h)`;
                }

                quoteItems.push({
                    description: description,
                    quantity: 1,
                    unitPrice: finalPrice
                });
            });

            if (quoteItems.length > 0) {
                console.log('Items generated, saving to storage...', quoteItems);
                Storage.set('sp_draft_quote_items', quoteItems);

                console.log('Navigating to quotes...');
                App.navigateTo('quotes');

                setTimeout(() => {
                    if (typeof Quotes !== 'undefined') {
                        console.log('Opening Add Form...');
                        Quotes.showAddForm();
                    } else {
                        console.error('Quotes module undefined');
                        App.showNotification('Erreur: Module Devis non chargé', 'error');
                    }
                }, 100);
            } else {
                App.showNotification('Aucune tâche à deviser', 'warning');
            }
        } catch (error) {
            console.error('CRITICAL ERROR in createQuote:', error);
            alert('Erreur critique lors de la génération : ' + error.message);
        }
    },

    showCatalogSelector() {
        const services = Storage.getServices();
        if (services.length === 0) {
            App.showNotification('Votre catalogue est vide. Ajoutez des services dans les Réglages.', 'info');
            return;
        }

        // Simple modal or dropdown logic - here we'll use a fast prompt-like overlay or just append
        // For better UX, let's create a quick "Catalog Browser" overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'catalog-selector-overlay';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Importer du Catalogue</h3>
                    <button class="modal-close" onclick="document.getElementById('catalog-selector-overlay').remove()">✕</button>
                </div>
                <div class="modal-body" style="padding: 1rem 0;">
                    <p class="text-sm text-muted" style="margin-bottom: 1.5rem;">Sélectionnez les prestations à ajouter à votre estimation.</p>
                    <div class="catalog-list" style="max-height: 400px; overflow-y: auto; display: grid; gap: 0.5rem;">
                        ${services.map(s => `
                            <div class="catalog-item" onclick="Scoper.importService('${s.id}')" style="padding: 1rem; background: var(--bg-sidebar); border: 1px solid var(--border); border-radius: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s;">
                                <div>
                                    <div style="font-weight: 600;">${s.label}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);">${s.category || 'Standard'}</div>
                                </div>
                                <div style="font-weight: 700; color: var(--primary);">${App.formatCurrency(s.unitPrice)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Inject Catalog Styles if not present
        if (!document.getElementById('catalog-selector-styles')) {
            const style = document.createElement('style');
            style.id = 'catalog-selector-styles';
            style.textContent = `
                .catalog-item:hover { border-color: var(--primary); transform: translateX(5px); background: rgba(16, 185, 129, 0.05); }
            `;
            document.head.appendChild(style);
        }
    },

    importService(serviceId) {
        if (!Auth.getUser()?.isPro && this.tasks.length >= 5) {
            App.showUpgradeModal('scoper_limit');
            return;
        }
        const service = Storage.getService(serviceId);
        if (!service) return;

        // Convert service to task
        // Logic: if price is fixed in catalog, we use manualPrice. If it's time-based, we estimate hours.
        // For now, we'll try to guess hours if it's "Jour" or "Heure", else manual price.

        const newTask = {
            name: service.label,
            min: 1,
            max: 1,
            manualPrice: null
        };

        if (service.unitType === 'Jour') {
            newTask.min = 1;
            newTask.max = 1;
        } else if (service.unitType === 'Heure') {
            newTask.min = 7;
            newTask.max = 7;
        } else {
            newTask.manualPrice = service.unitPrice;
        }

        this.tasks.push(newTask);
        this.renderTasks();
        this.calculate();

        document.getElementById('catalog-selector-overlay')?.remove();
        App.showNotification(`"${service.label}" importé.`, 'success');
    }
};
