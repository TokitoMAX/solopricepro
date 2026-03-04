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
                <div class="tabs-header scoper-nav" style="border-bottom: 1px solid var(--border);">
                    <button class="tab-btn ${tab === 'objective' ? 'active' : ''}" onclick="Scoper.render('objective')" style="padding: 1rem; background: none; border: none; color: ${tab === 'objective' ? 'var(--primary-light)' : 'var(--text-muted)'}; border-bottom: 2px solid ${tab === 'objective' ? 'var(--primary)' : 'transparent'}; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-bullseye"></i> Mon Objectif TJM
                        <span style="font-size: 0.6rem; background: var(--success); color: white; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">Offert</span>
                    </button>
                    <button class="tab-btn ${tab === 'project' ? 'active' : ''}" onclick="Scoper.render('project')" style="padding: 1rem; background: none; border: none; color: ${tab === 'project' ? 'var(--primary-light)' : 'var(--text-muted)'}; border-bottom: 2px solid ${tab === 'project' ? 'var(--primary)' : 'transparent'}; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-calculator"></i> Chiffrage Projet 
                    </button>
                    <button class="tab-btn ${tab === 'closing' ? 'active' : ''}" onclick="Scoper.render('closing')" style="padding: 1rem; background: none; border: none; color: ${tab === 'closing' ? 'var(--primary-light)' : 'var(--text-muted)'}; border-bottom: 2px solid ${tab === 'closing' ? 'var(--primary)' : 'transparent'}; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-magic"></i> Stratégie de Closing
                        ${!Storage.isExpert() ? '<span style="font-size: 0.6rem; background: linear-gradient(135deg, #a855f7, #7c3aed); color: white; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;"><i class="fas fa-lock" style="font-size: 0.5rem; margin-right: 3px;"></i> Pack Expert</span>' : ''}
                    </button>
                    <button class="tab-btn ${tab === 'journal' ? 'active' : ''}" onclick="Scoper.render('journal')" style="padding: 1rem; background: none; border: none; color: ${tab === 'journal' ? 'var(--primary-light)' : 'var(--text-muted)'}; border-bottom: 2px solid ${tab === 'journal' ? 'var(--primary)' : 'transparent'}; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i class="fas fa-journal-whills"></i> Journal de Bord
                        ${!Storage.isExpert() ? '<span style="font-size: 0.6rem; background: linear-gradient(135deg, #a855f7, #7c3aed); color: white; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;"><i class="fas fa-lock" style="font-size: 0.5rem; margin-right: 3px;"></i> Pack Expert</span>' : ''}
                    </button>
                </div>
            </div>

            <div id="scoper-tab-content"></div>
        `;

        if (tab === 'objective') {
            this.renderObjectiveTab();
        } else if (tab === 'closing') {
            this.renderClosingTab();
        } else if (tab === 'journal') {
            this.renderJournalTab();
        } else {
            this.renderProjectTab();
        }
    },

    renderObjectiveTab() {
        let storedStep = Storage.get('sp_scoper_current_step');
        // Handle potential array/NaN from storage retrieval
        if (Array.isArray(storedStep) || isNaN(parseInt(storedStep))) {
            storedStep = 1;
            Storage.set('sp_scoper_current_step', 1);
        }
        this.currentObjectiveStep = parseInt(storedStep);

        const content = document.getElementById('scoper-tab-content');
        if (!content) return;

        let data = Storage.get('sp_calculator_data');
        // Ensure default values are populated if missing to avoid `undefined` calculations
        const defaultRev = (typeof App !== 'undefined' && App.getCurrencyConfig) ? App.getCurrencyConfig().defaultRevenue : 3000;
        const defaultData = { monthlyRevenue: defaultRev, workingDays: 15, hoursPerDay: 7, monthlyCharges: 500, taxRate: 22, sector: 'tech', target: 'tpe' };
        data = { ...defaultData, ...(data && typeof data === 'object' ? data : {}) };

        // Auto-save the defaults silently so calculations work natively everywhere
        if (!Storage.get('sp_calculator_data')) {
            Storage.set('sp_calculator_data', data);
        }

        const currentStep = this.currentObjectiveStep || 1;

        content.innerHTML = `
            <div class="strategy-wizard" style="max-width: 900px; margin: 0 auto;">
                <!-- Wizard Header / Steps -->
                <div class="wizard-steps" style="display: flex; justify-content: space-between; margin-bottom: 3rem; position: relative;">
                    <div style="position: absolute; top: 20px; left: 0; width: 100%; height: 2px; background: var(--border); z-index: 1;"></div>
                    <div style="position: absolute; top: 20px; left: 0; width: ${(currentStep - 1) * 25}%; height: 2px; background: var(--primary); z-index: 2; transition: width 0.3s ease;"></div>
                    
                    ${[1, 2, 3, 4, 5].map(s => {
            const labels = ['PROFIL', 'REVENU', 'RYTHME', 'CHARGES', 'VERDICT'];
            const icons = ['fa-user-tie', 'fa-money-bill-wave', 'fa-calendar-alt', 'fa-shield-alt', 'fa-flag-checkered'];
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
                        ${this.renderCurrentStepForm(currentStep, data)}
                    </div>

                    <div class="wizard-actions" style="display: flex; justify-content: space-between; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border);">
                        <button class="button-outline" ${currentStep === 1 ? 'disabled' : ''} onclick="Scoper.prevObjectiveStep()">
                            Retour
                        </button>
                        ${currentStep < 5 ? `
                            <button class="button-primary" onclick="Scoper.nextObjectiveStep()">
                                Continuer <i class="fas fa-arrow-right" style="margin-left: 10px;"></i>
                            </button>
                        ` : `
                            <div style="display: flex; gap: 1rem;">
                                <button class="button-primary" style="background: linear-gradient(135deg, #a855f7, #7c3aed); border: none;" onclick="Scoper.render('closing')">
                                    Coach de Vente Expert <i class="fas fa-magic" style="margin-left: 10px;"></i>
                                </button>
                                <button class="button-primary" onclick="Scoper.saveObjective()">
                                    Adopter ce TJM <i class="fas fa-check" style="margin-left: 10px;"></i>
                                </button>
                            </div>
                        `}
                    </div>
                </div>

                <div id="objective-next-step" style="display: none; margin-top: 2rem; padding: 1.5rem; background: var(--primary-glass); border: 1px solid var(--primary); border-radius: 12px; text-align: center; animation: fadeInUp 0.5s ease;">
                    <h4 style="color: var(--primary-light); margin-bottom: 10px;"> Stratégie validée !</h4>
                    <p style="font-size: 0.9rem; margin-bottom: 1.5rem;">Votre TJM est maintenant enregistré. Utilisez-le pour chiffrer vos futurs projets avec l'onglet <strong>Chiffrage Projet</strong>.</p>
                    <button class="button-primary" onclick="Scoper.render('project')">Commencer un chiffrage</button>
                </div>
            </div>
        `;
    },

    renderCurrentStepForm(step, data) {

        switch (step) {
            case 1: // PROFIL
                return `
                    <div class="step-header" style="margin-bottom: 2rem;">
                        <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem;">C'est quoi votre métier ?</h2>
                        <p class="text-muted">Cela nous aide à calibrer votre TJM par rapport au marché.</p>
                    </div>
                    <div class="sector-grid mobile-stack" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        ${[
                        { id: 'tech', label: 'Tech & Web', icon: 'fa-code' },
                        { id: 'design', label: 'Design & Branding', icon: 'fa-pen-nib' },
                        { id: 'marketing', label: 'Marketing & Com', icon: 'fa-ad' },
                        { id: 'conseil', label: 'Conseil & Strat', icon: 'fa-lightbulb' },
                        { id: 'media', label: 'Média & Vidéo', icon: 'fa-video' },
                        { id: 'artisanat', label: 'Artisanat & Prod', icon: 'fa-hammer' }
                    ].map(s => `
                            <div class="sector-card ${data.sector === s.id ? 'active selected' : ''}" 
                                 onclick="document.querySelectorAll('.sector-card').forEach(c => c.classList.remove('active', 'selected')); this.classList.add('active', 'selected'); Scoper.updateSector('${s.id}')">
                                <i class="fas ${s.icon} sector-icon"></i>
                                <div class="sector-label">${s.label}</div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="step-header" style="margin: 2.5rem 0 1rem;">
                        <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">Cible Client Principale</h3>
                        <p class="text-muted" style="font-size: 0.85rem;">Vos scripts de vente seront adaptés à cette typologie.</p>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        ${[
                        { id: 'tpe', label: 'TPE / Indépendants', icon: 'fa-user' },
                        { id: 'pme', label: 'PME & Startups', icon: 'fa-building' },
                        { id: 'grands-comptes', label: 'Grands Comptes', icon: 'fa-city' }
                    ].map(t => `
                            <div class="target-card ${data.target === t.id ? 'active selected' : ''}" 
                                 onclick="document.querySelectorAll('.target-card').forEach(c => c.classList.remove('active', 'selected')); this.classList.add('active', 'selected'); Scoper.updateTarget('${t.id}')">
                                <i class="fas ${t.icon} target-icon"></i>
                                <div class="target-label">${t.label}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            case 2: // REVENU (Ancien 1)
                return `
                    <div class="step-header" style="margin-bottom: 2rem;">
                        <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem;">Cibler votre revenu net</h2>
                        <p class="text-muted">Combien voulez-vous réellement toucher par mois, après avoir tout payé ?</p>
                    </div>
                    <div class="input-group">
                        <label class="form-label" style="font-size: 1.1rem;">Revenu Net Mensuel souhaité (${typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€'})</label>
                        <input type="number" id="monthlyRevenue" class="form-input large" value="${data.monthlyRevenue || ''}" placeholder="ex: 3000" oninput="Scoper.autoSaveObjective()" style="font-size: 1.5rem; padding: 1.2rem;">
                        <p class="text-xs text-muted" style="margin-top: 10px;"> C'est votre "salaire" cible. Soyez ambitieux mais réaliste pour votre marché.</p>
                    </div>
                `;
            case 3: // RYTHME (Ancien 2)
                return `
                    <div class="step-header" style="margin-bottom: 2rem;">
                        <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem;">Définir votre rythme</h2>
                        <p class="text-muted">Un freelance ne facture pas 20 jours par mois. Prévoyez du temps pour la prospection et l'administratif.</p>
                    </div>
                    <div class="mobile-stack" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                        <div class="input-group">
                            <label class="form-label">Jours facturés / mois</label>
                            <input type="number" id="workingDays" class="form-input" value="${data.workingDays ?? 15}" oninput="Scoper.autoSaveObjective()">
                            <p class="text-xs text-muted" style="margin-top: 8px;">Moyenne conseillée : 10 à 15 jours.</p>
                        </div>
                        <div class="input-group">
                            <label class="form-label">Heures productives / jour</label>
                            <input type="number" id="hoursPerDay" class="form-input" value="${data.hoursPerDay ?? 7}" oninput="Scoper.autoSaveObjective()">
                            <p class="text-xs text-muted" style="margin-top: 8px;">Le temps réel passé sur les dossiers.</p>
                        </div>
                    </div>
                `;
            case 4: // CHARGES (Ancien 3)
                return `
                    <div class="step-header" style="margin-bottom: 2rem;">
                        <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem;">Provisionner charges & taxes</h2>
                        <p class="text-muted">Le CA n'est pas votre revenu. Il faut payer l'État et vos outils.</p>
                    </div>
                    <div class="input-group">
                        <label class="form-label">Charges Fixes Mensuelles (${typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€'})</label>
                        <input type="number" id="monthlyCharges" class="form-input" value="${data.monthlyCharges ?? 500}" oninput="Scoper.autoSaveObjective()">
                        <p class="text-xs text-muted">Abonnements SaaS, loyer, mutuelle, assurance...</p>
                    </div>
                    <div class="input-group">
                        <label class="form-label">Cotisations / Impôts (%)</label>
                        <input type="number" id="taxRate" class="form-input" value="${data.taxRate ?? 22}" oninput="Scoper.autoSaveObjective()">
                        <p class="text-xs text-muted">Auto-entrepreneur : ~22% (BNC) ou ~12% (Achat-Revente).</p>
                    </div>
                `;
            case 5: // VERDICT / ROADMAP / MATRICE
                const results = PricingEngine.calculateObjective(data);
                const scenarios = PricingEngine.getScenarios(results);
                // We use a local state for the selected scenario in the UI
                const activeScenario = this.selectedScenario || 'security';
                const currentTJM = scenarios[activeScenario].tjm;
                const currentAnnual = scenarios[activeScenario].annual;
                const powerScore = PricingEngine.getMarketPowerScore(results.dailyRate, data.sector);

                return `
                    <div class="step-header" style="margin-bottom: 2rem; text-align: center;">
                        <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem;">Dashboard de Puissance Marché</h2>
                        <p class="text-muted">Simulez votre impact financier et testez votre force de frappe.</p>
                    </div>

    <div class="mobile-stack" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; align-items: start;">
        <!-- Col 1: Scénarios & Puissance -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">

            <!-- Market Power Gauge -->
            <div class="glass-card" style="padding: 1.5rem; border-radius: 20px; background: rgba(255,255,255,0.02); position: relative; overflow: hidden;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <span style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--primary-light);">Market Power Score</span>
                    <span style="font-size: 1.2rem; font-weight: 900; color: var(--white);">${powerScore}/100</span>
                </div>
                <div style="height: 8px; background: var(--border); border-radius: 4px; position: relative;">
                    <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${powerScore}%; background: linear-gradient(90deg, #f43f5e 0%, var(--primary) 100%); border-radius: 4px; transition: width 0.5s;"></div>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 10px;">
                    ${powerScore > 70 ? '<strong>Prix Massif</strong> : Facile à vendre, volume élevé possible.' : (powerScore > 40 ? '<strong>Prix Équilibré</strong> : Nécessite une bonne preuve sociale.' : '<strong>Prix Premium</strong> : Demande une autorité d\'expert reconnue.')}
                </p>
            </div>

            <!-- Coaching de Vente EXPERT -->
            <div class="expert-teaser-card" style="padding: 1.5rem; border-radius: 20px; border: 1px solid #a855f7; background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(124, 58, 237, 0.1)); position: relative; cursor: pointer; transition: all 0.3s ease;" onclick="Scoper.render('closing')">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
                    <span style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #c084fc;">Coaching de Vente</span>
                    <span class="badge" style="background: #a855f7; color: white; font-size: 0.6rem;">PACK EXPERT</span>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 45px; height: 45px; border-radius: 12px; background: rgba(168, 85, 247, 0.2); display: flex; align-items: center; justify-content: center; color: #c084fc;">
                        <i class="fas fa-magic" style="font-size: 1.2rem;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; color: white; font-size: 0.95rem;">Prêt pour le Closing ?</div>
                        <div style="font-size: 0.75rem; color: #e9d5ff; opacity: 0.8;">Accédez à votre Arsenal de Vente personnalisé.</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color: #c084fc; opacity: 0.5;"></i>
                </div>
            </div>

            <!-- Scenario Selector -->
            <div class="mobile-stack" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                ${Object.entries(scenarios).map(([key, s]) => `
                                    <div onclick="Scoper.selectScenario('${key}')" style="cursor: pointer; padding: 1rem; border-radius: 12px; border: 2px solid ${activeScenario === key ? 'var(--primary)' : 'var(--border)'}; background: ${activeScenario === key ? 'var(--primary-glass)' : 'transparent'}; text-align: center; transition: all 0.2s;">
                                        <div style="font-size: 0.6rem; font-weight: 800; text-transform: uppercase; color: ${activeScenario === key ? 'var(--primary-light)' : 'var(--text-muted)'};">${s.label}</div>
                                        <div style="font-size: 1.1rem; font-weight: 900; margin: 4px 0;">${typeof App !== 'undefined' ? App.formatCurrency(s.tjm) : s.tjm + '€'}</div>
                                        <div style="font-size: 0.6rem; opacity: 0.7;">${typeof App !== 'undefined' ? App.formatCurrency(s.annual) : s.annual.toLocaleString() + '€'}/an</div>
                                    </div>
                                `).join('')}
            </div>

            <div class="result-highlight glass-card" style="background: var(--primary-glass); border: 2px solid var(--primary); padding: 1.5rem; text-align: center; border-radius: 20px;">
                <div style="font-size: 0.8rem; color: var(--primary-light); font-weight: 700; margin-bottom: 5px; text-transform: uppercase;">PROJECTION REVENU ANNUEL</div>
                <div style="font-size: 2.5rem; font-weight: 900; color: var(--white); text-shadow: 0 0 20px var(--primary-glow);">${typeof App !== 'undefined' ? App.formatCurrency(currentAnnual) : currentAnnual.toLocaleString() + '€'}<span style="font-size: 0.9rem; font-weight: 400; opacity: 0.7; display: block;">Projection basée sur ${data.workingDays}j facturés / mois</span></div>
            </div>
        </div>

        <!-- Col 2: Pourquoi passer au Chiffrage ? -->
        <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="glass-card" style="padding: 1.5rem; border-radius: 20px; background: rgba(16, 185, 129, 0.05); border: 1px solid var(--primary-glass);">
                <h3 style="font-size: 1rem; color: var(--primary-light); margin-bottom: 10px;"><i class="fas fa-rocket"></i> Suite Logique : Chiffrage Projet</h3>
                <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 15px;">
                    Maintenant que vous avez votre <strong>TJM stratégique (${typeof App !== 'undefined' ? App.formatCurrency(currentTJM) : currentTJM + '€'})</strong>, il est crucial de vérifier s'il passe sur un contrat réel.
                </p>
                <ul style="padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
                    <li style="font-size: 0.8rem; display: flex; align-items: start; gap: 8px;"><i class="fas fa-check-circle" style="color: var(--primary); margin-top: 3px;"></i> Vos prix couvrent-ils vos dépenses réelles ?</li>
                    <li style="font-size: 0.8rem; display: flex; align-items: start; gap: 8px;"><i class="fas fa-check-circle" style="color: var(--primary); margin-top: 3px;"></i> Combien reste-t-il vraiment dans votre poche ?</li>
                    <li style="font-size: 0.8rem; display: flex; align-items: start; gap: 8px;"><i class="fas fa-check-circle" style="color: var(--primary); margin-top: 3px;"></i> Quel impact sur votre marge nette ?</li>
                </ul>
                <button class="button-primary" onclick="Scoper.render('project')" style="width: 100%; justify-content: center; padding: 12px;">
                    Tester ce TJM sur un Projet <i class="fas fa-arrow-right" style="margin-left: 10px;"></i>
                </button>
            </div>

            <p style="font-size: 0.7rem; color: var(--text-muted); text-align: center; opacity: 0.5;">
                <i class="fas fa-magic" style="margin-right: 5px;"></i> Diagnostic propulsé par SoloPrice PRO
            </p>
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
        let storedStep = Storage.get('sp_scoper_current_step');
        if (Array.isArray(storedStep) || isNaN(parseInt(storedStep))) storedStep = 1;

        if (!this.currentObjectiveStep) this.currentObjectiveStep = parseInt(storedStep);

        // Save current form data to backend before advancing
        const currentData = Storage.get('sp_calculator_data') || {};
        const merged = {
            ...currentData,
            monthlyRevenue: document.getElementById('monthlyRevenue') ? parseFloat(document.getElementById('monthlyRevenue').value) || currentData.monthlyRevenue : currentData.monthlyRevenue,
            workingDays: document.getElementById('workingDays') ? parseFloat(document.getElementById('workingDays').value) || currentData.workingDays : currentData.workingDays,
            hoursPerDay: document.getElementById('hoursPerDay') ? parseFloat(document.getElementById('hoursPerDay').value) || currentData.hoursPerDay : currentData.hoursPerDay,
            monthlyCharges: document.getElementById('monthlyCharges') ? parseFloat(document.getElementById('monthlyCharges').value) || currentData.monthlyCharges : currentData.monthlyCharges,
            taxRate: document.getElementById('taxRate') ? parseFloat(document.getElementById('taxRate').value) || currentData.taxRate : currentData.taxRate,
        };
        Storage.set('sp_calculator_data', merged);
        // Persist to Supabase (non-blocking)
        Storage.saveCalculatorData(merged).catch(e => console.warn('[SCOPER] Sync error:', e));

        if (this.currentObjectiveStep < 5) {
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

    updateSector(sector) {
        const data = Storage.get('sp_calculator_data') || {};
        data.sector = sector;
        Storage.set('sp_calculator_data', data);
        this.checkStepCompletion();
    },

    updateTarget(target) {
        const data = Storage.get('sp_calculator_data') || {};
        data.target = target;
        Storage.set('sp_calculator_data', data);
        this.checkStepCompletion();
    },

    checkStepCompletion() {
        const data = Storage.get('sp_calculator_data') || {};
        if (data.sector && data.target && this.currentObjectiveStep === 1) {
            setTimeout(() => this.nextObjectiveStep(), 400);
        }
    },

    autoSaveObjective() {
        const currentData = Storage.get('sp_calculator_data') || {};
        const data = {
            ...currentData,
            monthlyRevenue: document.getElementById('monthlyRevenue') ? (parseFloat(document.getElementById('monthlyRevenue').value) || 0) : (currentData.monthlyRevenue || 0),
            workingDays: document.getElementById('workingDays') ? (parseFloat(document.getElementById('workingDays').value) || 1) : (currentData.workingDays || 1),
            hoursPerDay: document.getElementById('hoursPerDay') ? (parseFloat(document.getElementById('hoursPerDay').value) || 1) : (currentData.hoursPerDay || 1),
            monthlyCharges: document.getElementById('monthlyCharges') ? (parseFloat(document.getElementById('monthlyCharges').value) || 0) : (currentData.monthlyCharges || 0),
            taxRate: document.getElementById('taxRate') ? (parseFloat(document.getElementById('taxRate').value) || 0) : (currentData.taxRate || 0)
        };

        // Final calculation for step 5 if we are on it
        if (this.currentObjectiveStep === 5) {
            const results = PricingEngine.calculateObjective(data);
            data.dailyRate = results.dailyRate;
            data.hourlyRate = results.hourlyRate;
        }

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

    getStrategicMatrix(results, data) {
        const sector = data.sector || 'tech';
        const tjm = results.dailyRate;
        const diag = this.getRealityDiagnostic(tjm, data);

        return [
            {
                title: 'Positionnement Marché',
                desc: `${diag.title}. ${diag.desc} `,
                color: diag.color,
                icon: diag.icon
            },
            {
                title: 'Argumentaire Valeur',
                desc: this.getCoachingValue(sector, tjm),
                color: 'var(--primary-light)',
                icon: 'fa-lightbulb'
            },
            {
                title: 'Cible Client Idéale',
                desc: this.getCoachingTarget(sector, tjm),
                color: 'var(--success)',
                icon: 'fa-bullseye'
            },
            {
                title: 'Levier d\'Optimisation',
                desc: tjm > 800 ? 'Proposez du forfait pour masquer le TJM.' : 'Augmentez votre rythme de 2j pour baisser la pression.',
                color: 'var(--warning)',
                icon: 'fa-adjust'
            }
        ];
    },

    getCoachingValue(sector, tjm) {
        return PricingEngine.getCoachingValue(sector, tjm);
    },

    getCoachingTarget(sector, tjm) {
        return PricingEngine.getCoachingTarget(sector, tjm);
    },

    getRealityDiagnostic(tjm, data = {}) {
        return PricingEngine.getMarketDiagnostic(tjm, data.sector);
    },

    calculateObjectiveData(data = {}) {
        return PricingEngine.calculateObjective(data);
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

    <div class="calculator-container mobile-stack" style="display: grid; grid-template-columns: 1.6fr 1fr; gap: 2rem;">

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

            <div class="result-cards mobile-stack" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                <div class="result-card primary" style="background: rgba(16, 185, 129, 0.05); border: 1px solid var(--primary); padding: 1.2rem; border-radius: 12px; grid-column: span 2;">
                    <div class="result-label" style="font-size: 0.8rem; color: var(--text-muted);">Total à Facturer (TTC)</div>
                    <div class="result-value" id="scoper-total-price" style="font-size: 2.2rem; font-weight: 800; color: var(--primary);">0 ${typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€'}</div>
                    <p class="text-xs text-muted">Budget estimé pour ce périmètre</p>
                    <div id="scoper-tax-info" style="font-size: 0.75rem; opacity: 0.7;">TVA: France (20.0%)</div>
                </div>

                <div class="result-card" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 1rem; border-radius: 12px;">
                    <div class="result-label" style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Temps Est.</div>
                    <div class="result-value" id="scoper-total-time" style="font-size: 1.2rem; font-weight: 700;">0h</div>
                </div>

                <div class="stat-card" style="flex: 1; padding: 1rem; border-radius: 12px; border: 1px solid var(--border); background: rgba(0,0,0,0.2);">
                    <div class="result-label" style="font-size: 0.8rem;">TJM Réel Dégagé</div>
                    <div class="result-value" id="scoper-actual-tjm" style="font-size: 1.2rem; font-weight: 700; color: var(--primary-light);">0 ${typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€'}/j</div>
                </div>
            </div>

            <div class="breakdown-section" style="background: transparent; border-top: 1px solid var(--border); padding-top: 1.5rem;">
                <h4 class="breakdown-title" style="margin-bottom: 1.5rem; font-weight: 600;">Stratégie & Rentabilité</h4>

                <div class="input-group">
                    <label class="form-label">TJM Stratégique de Référence (${typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€'})</label>
                    <input type="number" id="scoper-tjm" class="form-input" value="${this.getTJM()}" onchange="Scoper.calculate()" style="border-color: var(--primary-light);">
                        <p class="text-xs text-muted" style="margin-top: 4px;">Utilisez votre boussole définit à l'étape "Objectif".</p>
                </div>

                <div class="input-group" style="margin-top: 1.5rem;">
                    <label class="form-label" style="display: flex; justify-content: space-between;">
                        <span>Facteur PITA (Prime de Risque)</span>
                        <span class="badge" style="background: var(--primary-glass); color: var(--primary-light); font-size: 0.6rem;">PACK PRO</span>
                    </label>
                    <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px; margin-top: 5px; display: grid; gap: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.75rem; color: var(--text-muted);">Urgence</span>
                            <input type="range" id="scoper-pita-urgency" min="1" max="5" value="1" oninput="Scoper.calculate()" style="width: 100px;">
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.75rem; color: var(--text-muted);">Complexité</span>
                            <input type="range" id="scoper-pita-complexity" min="1" max="5" value="1" oninput="Scoper.calculate()" style="width: 100px;">
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.75rem; color: var(--text-muted);">Diff. Client</span>
                            <input type="range" id="scoper-pita-client" min="1" max="5" value="1" oninput="Scoper.calculate()" style="width: 100px;">
                        </div>
                        <div id="pita-multiplier-display" style="font-size: 0.75rem; text-align: right; color: var(--primary-light); font-weight: 700;">Impact : +0%</div>
                    </div>
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
            if (document.getElementById('monthlyRevenue')) document.getElementById('monthlyRevenue').value = data.monthlyRevenue || (typeof App !== 'undefined' && App.getCurrencyConfig ? App.getCurrencyConfig().defaultRevenue : 3000);
            if (document.getElementById('workingDays')) document.getElementById('workingDays').value = data.workingDays || 15;
            if (document.getElementById('hoursPerDay')) document.getElementById('hoursPerDay').value = data.hoursPerDay || 7;
            if (document.getElementById('monthlyCharges')) document.getElementById('monthlyCharges').value = data.monthlyCharges || 500;
            if (document.getElementById('taxRate')) document.getElementById('taxRate').value = data.taxRate || 22;
        }
    },

    async saveObjective() {
        const data = Storage.get('sp_calculator_data') || {};
        const results = PricingEngine.calculateObjective(data);

        const finalData = {
            ...data,
            dailyRate: results.dailyRate,
            hourlyRate: results.hourlyRate
        };

        if (finalData.dailyRate <= 0) {
            App.showNotification('Veuillez fixer un objectif valide étape par étape', 'warning');
            return;
        }

        // Persist to Supabase (source of truth)
        Storage.set('sp_calculator_data', finalData);
        try {
            await Storage.saveCalculatorData(finalData);
            console.log('[SCOPER] TJM objective synced to Supabase:', finalData.dailyRate + '€/j');
        } catch (e) {
            console.warn('[SCOPER] Backend sync warning (data saved locally):', e);
        }

        // Final Success View
        const formContainer = document.getElementById('step-form-container');
        if (formContainer) {
            formContainer.innerHTML = `
    <div style="text-align: center; padding: 2rem; animation: scaleIn 0.5s ease;">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--success); display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem; box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);">
                        <i class="fas fa-flag-checkered" style="font-size: 2.5rem; color: white;"></i>
                    </div>
                    <h2 style="font-size: 2rem; margin-bottom: 1rem;">Objectif Adopté !</h2>
                    <p class="text-muted" style="font-size: 1.1rem; margin-bottom: 2rem;">Votre stratégie est maintenant scellée. Votre TJM de <strong>${typeof App !== 'undefined' ? App.formatCurrency(finalData.dailyRate) : finalData.dailyRate + '€'}/j</strong> servira de boussole pour tous vos chiffrages.</p>
                    
                    <div style="display: flex; gap: 1rem; justify-content: center;">
                        <button class="button-primary" onclick="Scoper.render('project')" style="padding: 1rem 2rem; font-size: 1rem;">
                            <i class="fas fa-calculator" style="margin-right: 10px;"></i> Tester sur un Projet (Pack PRO)
                        </button>
                        <button class="button-outline" onclick="App.navigateTo('dashboard')" style="padding: 1rem 2rem;">
                            Retour au Dashboard
                        </button>
                    </div>
                </div>
`;
            // Hide the wizard tabs/steps and actions to focus on success
            const actions = document.querySelector('.wizard-actions');
            const steps = document.querySelector('.wizard-steps');
            if (actions) actions.style.display = 'none';
            if (steps) steps.style.opacity = '0.3';
        }

        const hint = document.getElementById('objective-next-step');
        if (hint) {
            hint.style.display = 'block';
            hint.scrollIntoView({ behavior: 'smooth' });
        }

        App.showNotification('Stratégie TJM scellée avec succès !', 'success');

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
                </div >
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

                        <button class="btn-icon btn-danger" onclick="Scoper.removeTask(${index})" title="Supprimer"></button>
                    </div>
                </div >
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
                
                .scoper-task-row .task-details {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    gap: 1.5rem;
                }
                
                .scoper-task-row .time-inputs { display: flex; gap: 0.8rem; }
                .time-field label { display: block; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px; }
                .form-input.mini { width: 70px; text-align: center; }
                
                .scoper-task-row .price-override { flex: 1; }
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

        const urgency = parseInt(document.getElementById('scoper-pita-urgency')?.value) || 1;
        const complexity = parseInt(document.getElementById('scoper-pita-complexity')?.value) || 1;
        const client = parseInt(document.getElementById('scoper-pita-client')?.value) || 1;

        const pitaMultiplier = PricingEngine.getPitaIncentive(urgency, complexity, client);
        const impactPercent = Math.round((pitaMultiplier - 1) * 100);
        const pitaDisplay = document.getElementById('pita-multiplier-display');
        if (pitaDisplay) pitaDisplay.textContent = `Impact: +${impactPercent}% `;

        const finalTJM = tjm * pitaMultiplier;

        let totalHoursInternal = 0;
        let totalCalculatedHT = 0;
        let totalFinalHT = 0;

        this.tasks.forEach(t => {
            const safeHours = t.max * (1 + buffer / 100);
            totalHoursInternal += safeHours;

            const taskCalculatedHT = (safeHours / 7) * finalTJM;
            totalCalculatedHT += taskCalculatedHT;

            totalFinalHT += t.manualPrice !== null ? t.manualPrice : taskCalculatedHT;
        });

        // Tax Calculation
        let totalTTC = totalFinalHT;
        let taxLabel = "HT";
        if (typeof TaxEngine !== 'undefined') {
            const taxResult = TaxEngine.calculate(totalFinalHT);
            totalTTC = taxResult.ttc;
            taxLabel = `TTC(incl.${TaxEngine.getCurrent().name})`;
            document.getElementById('scoper-tax-info').textContent = taxLabel;
        }

        // Display results
        const priceEl = document.getElementById('scoper-total-price');
        if (priceEl) priceEl.textContent = App.formatCurrency(totalTTC);

        const timeEl = document.getElementById('scoper-total-time');
        if (timeEl) timeEl.textContent = `${Math.ceil(totalHoursInternal)} h`;

        const rangeEl = document.getElementById('scoper-range');
        if (rangeEl) {
            const minH = this.tasks.reduce((s, t) => s + t.min, 0);
            const maxH = this.tasks.reduce((s, t) => s + t.max, 0);
            rangeEl.textContent = `Production: ${minH}h à ${maxH} h(+${buffer} % sécu)`;
        }

        const actualTjm = totalHoursInternal > 0 ? (totalFinalHT / (totalHoursInternal / 7)) : 0;
        const totalPriceEl = document.getElementById('scoper-total-price');
        const actualTjmEl = document.getElementById('scoper-actual-tjm');
        const sym = typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€';

        if (totalPriceEl) totalPriceEl.textContent = `${App.formatCurrency(totalTTC)}`;
        if (actualTjmEl) actualTjmEl.textContent = `${Math.round(actualTjm)}${sym}/j`;

        this.renderProfitability(actualTjm, tjm);

        const btn = document.getElementById('btn-create-quote');
        if (btn) btn.disabled = this.tasks.length === 0;
    },

    renderProfitability(actualTjm, targetTjm) {
        const container = document.getElementById('scoper-profitability-indicator');
        if (!container) return;

        if (this.tasks.length === 0) {
            container.innerHTML = '';
            return;
        }

        const diff = actualTjm - targetTjm;
        let color = 'var(--text-muted)';
        let status = 'Neutre';
        let advice = '';
        let icon = 'fa-info-circle';

        if (diff >= 50) {
            color = 'var(--success)';
            status = 'PROJET RENTABLE';
            advice = 'Votre TJM réel est au-dessus de votre objectif. C\'est une mission haute valeur.';
            icon = 'fa-rocket';
        } else if (diff <= -50) {
            color = 'var(--danger)';
            status = 'ALERTE RENTABILITÉ';
            advice = 'Vous êtes en dessous de votre boussole. Augmentez votre prix ou baissez le temps passé.';
            icon = 'fa-exclamation-triangle';
        } else {
            color = 'var(--primary)';
            status = 'OBJECTIF ALIGNÉ';
            advice = 'Le projet respecte parfaitement votre stratégie financière.';
            icon = 'fa-check-circle';
        }

        container.innerHTML = `
            <div style="padding: 1.2rem; background: rgba(255,255,255,0.02); border-radius: 12px; border-left: 4px solid ${color}; border: 1px solid ${color}44; border-left-width: 4px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <i class="fas ${icon}" style="color: ${color}; font-size: 0.9rem;"></i>
                    <div style="font-size: 0.75rem; font-weight: 700; color: ${color}; text-transform: uppercase; letter-spacing: 0.5px;">${status}</div>
                </div>
                <div style="font-size: 0.85rem; line-height: 1.4; color: var(--white);">${advice}</div>
                <div style="margin-top: 10px; font-size: 0.75rem; color: var(--text-muted);">
                    Écart : <strong style="color: ${diff >= 0 ? 'var(--success)' : 'var(--danger)'}">${diff >= 0 ? '+' : ''}${Math.round(diff)}€/j</strong> par rapport à l'objectif.
                </div>
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
                    <button class="modal-close" onclick="document.getElementById('catalog-selector-overlay').remove()"></button>
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
        if (!Storage.isPro() && this.tasks.length >= 5) {
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
    },

    generateRoadmapPDF() {
        const data = Storage.get('sp_calculator_data') || {};
        const results = PricingEngine.calculateObjective(data);
        const user = Storage.get(Storage.KEYS.USER);

        PDFGenerator.generateTJMCard(results, data, user);
    },

    selectScenario(scenario) {
        this.selectedScenario = scenario;
        this.render('objective');
    },

    /**
     * Rendu de l'onglet Closing (Arsenal de Vente EXPERT)
     */
    renderClosingTab() {
        const content = document.getElementById('scoper-tab-content');
        if (!content) return;

        if (!Storage.isExpert()) {
            content.innerHTML = `
                <div class="lock-screen glass-card" style="max-width: 600px; margin: 4rem auto; text-align: center; padding: 4rem 2rem; border: 1px solid #a855f7;">
                    <div style="width: 80px; height: 80px; border-radius: 20px; background: rgba(168, 85, 247, 0.1); display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem; color: #a855f7;">
                        <i class="fas fa-magic" style="font-size: 2.5rem;"></i>
                    </div>
                    <h2 style="font-size: 2rem; margin-bottom: 1rem; color: white;">Arsenal de Closing Expert</h2>
                    <p class="text-muted" style="margin-bottom: 2.5rem; font-size: 1.1rem;">Débloquez les stratégies de vente les plus puissantes pour doubler votre taux de conversion et vendre au prix fort.</p>
                    <button class="button-primary large" style="background: linear-gradient(135deg, #a855f7, #7c3aed); border: none;" onclick="App.showUpgradeModal('premium_feature')">
                         Passer au Pack EXPERT
                    </button>
                </div>
            `;
            return;
        }

        const data = Storage.get('sp_calculator_data') || {};
        const sector = data.sector || 'tech';
        const target = data.target || 'pme';

        const results = PricingEngine.calculateObjective(data);
        const scenarios = PricingEngine.getScenarios(results);
        const powerScore = PricingEngine.getMarketPowerScore(results.dailyRate, sector);
        const tactics = PricingEngine.getAdvancedSalesTactics(powerScore, scenarios, sector, target);

        // Human-readable labels
        const sectorLabel = { tech: 'Tech & Web', design: 'Design & Branding', marketing: 'Marketing & Com', conseil: 'Conseil & Strat', media: 'Média & Vidéo', artisanat: 'Artisanat & Prod' }[sector] || sector;
        const targetLabel = { tpe: 'TPE / Indépendants', pme: 'PME & Startups', 'grands-comptes': 'Grands Comptes' }[target] || target;

        const hasObjective = results.dailyRate > 0;
        const tjm = results.dailyRate;
        const monthlyNet = parseFloat(data.monthlyRevenue) || 0;
        const revenueNeeded = results.revenueNeeded;
        const taxAmount = results.taxAmount;

        content.innerHTML = `
            <style>
                .objection-card {
                    background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 20px; padding: 1.5rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; position: relative; overflow: hidden;
                }
                .objection-card:hover { border-color: #a855f7; background: rgba(168, 85, 247, 0.05); transform: translateY(-5px); }
                .objection-card.active { background: rgba(168, 85, 247, 0.1); border-color: #a855f7; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
                .rebuttal-box { max-height: 0; opacity: 0; overflow: hidden; transition: all 0.5s ease; }
                .objection-card.active .rebuttal-box { max-height: 200px; opacity: 1; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
                .diag-question { padding: 1.2rem; border-radius: 16px; background: rgba(0,0,0,0.2); border-left: 4px solid #a855f7; margin-bottom: 1rem; font-size: 0.95rem; color: #e9d5ff; transition: transform 0.2s; cursor: default; }
                .diag-question:hover { transform: translateX(10px); background: rgba(168, 85, 247, 0.05); }
                .expert-hero {
                    background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(30, 10, 60, 0.4) 100%);
                    border-radius: 30px; padding: 3rem 2rem 2rem; text-align: center; border: 1px solid rgba(168, 85, 247, 0.2); margin-bottom: 3rem; position: relative; overflow: hidden;
                }
                .tjm-stats-row { display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; margin-top: 2rem; }
                .tjm-stat-pill { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 1rem 1.5rem; text-align: center; min-width: 130px; }
                .tjm-stat-pill.primary { border-color: #a855f7; background: rgba(168,85,247,0.1); }
                .tjm-stat-value { font-size: 1.6rem; font-weight: 900; color: white; }
                .tjm-stat-label { font-size: 0.65rem; font-weight: 700; color: #c084fc; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px; }
                .no-objective-banner { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 16px; padding: 1rem 1.5rem; margin-top: 1.5rem; color: #fbbf24; font-size: 0.9rem; }
            </style>

            <div class="expert-closing-tab" style="animation: fadeIn 0.5s ease;">
                <div class="expert-hero">
                    <div style="font-size: 0.75rem; font-weight: 800; color: #c084fc; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 1rem;">Closing Engineer Mode</div>
                    <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem; color: white; letter-spacing: -1px;">Votre Arsenal de Vente</h1>
                    <p style="color: #e9d5ff; font-size: 1rem; opacity: 0.85; margin-bottom: 0;">
                        Stratégie personnalisée · <strong>${sectorLabel}</strong> → <strong>${targetLabel}</strong>
                    </p>

                    ${!hasObjective ? `
                        <div class="no-objective-banner">
                            <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
                            Aucun objectif TJM défini · <a onclick="Scoper.render('objective')" style="color: #fbbf24; cursor:pointer; text-decoration: underline;">Compléter l'Objectif TJM →</a>
                        </div>
                    ` : `
                        <div class="tjm-stats-row">
                            <div class="tjm-stat-pill primary">
                                <div class="tjm-stat-value">${typeof App !== 'undefined' ? App.formatCurrency(tjm) : tjm + '€'}</div>
                                <div class="tjm-stat-label">TJM Objectif</div>
                            </div>
                            <div class="tjm-stat-pill">
                                <div class="tjm-stat-value">${typeof App !== 'undefined' ? App.formatCurrency(monthlyNet) : monthlyNet.toLocaleString('fr-FR') + '€'}</div>
                                <div class="tjm-stat-label">Salaire Net / mois</div>
                            </div>
                            <div class="tjm-stat-pill">
                                <div class="tjm-stat-value">${typeof App !== 'undefined' ? App.formatCurrency(revenueNeeded) : revenueNeeded.toLocaleString('fr-FR') + '€'}</div>
                                <div class="tjm-stat-label">CA à Facturer</div>
                            </div>
                            <div class="tjm-stat-pill">
                                <div class="tjm-stat-value">${typeof App !== 'undefined' ? App.formatCurrency(taxAmount) : taxAmount.toLocaleString('fr-FR') + '€'}</div>
                                <div class="tjm-stat-label">Charges / mois</div>
                            </div>
                            <div class="tjm-stat-pill">
                                <div class="tjm-stat-value">${data.workingDays || 15}j</div>
                                <div class="tjm-stat-label">Jours Facturés</div>
                            </div>
                        </div>
                    `}
                </div>

                <div class="mobile-stack" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; margin-bottom: 3rem;">
                    <div class="glass-card" style="padding: 2.5rem; border-radius: 28px; border: 1px solid var(--border);">
                        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 2rem;">
                            <div style="width: 55px; height: 55px; border-radius: 15px; background: rgba(168, 85, 247, 0.15); display: flex; align-items: center; justify-content: center; color: #a855f7;"><i class="fas fa-stethoscope" style="font-size: 1.8rem;"></i></div>
                            <div>
                                <h3 style="margin: 0; font-size: 1.4rem; color: white;">La Posture Dr. Expert</h3>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">Posez ces 3 questions pour matérialiser le coût du problème.</div>
                            </div>
                        </div>
                        <div class="questions-list">
                            ${tactics.diagnostic.questions.map((q, i) => `<div class="diag-question"><span style="color: #a855f7; font-weight: 900; margin-right: 12px; font-style: italic;">Q${i + 1}</span>${q}</div>`).join('')}
                        </div>
                        <div style="margin-top: 2rem; padding: 1.2rem; background: linear-gradient(90deg, rgba(16, 185, 129, 0.1), transparent); border-radius: 16px; border-left: 4px solid #10b981;">
                            <div style="font-size: 0.7rem; color: #10b981; font-weight: 800; text-transform: uppercase; margin-bottom: 6px;">L'Argument ROI Imbattable :</div>
                            <div style="font-size: 1rem; font-weight: 700; color: white;">"${tactics.roi.argument}"</div>
                        </div>
                    </div>

                    <div class="glass-card" style="padding: 2.5rem; border-radius: 28px; border: 1px solid var(--border);">
                        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 2rem;">
                            <div style="width: 55px; height: 55px; border-radius: 15px; background: rgba(59, 130, 246, 0.15); display: flex; align-items: center; justify-content: center; color: #3b82f6;"><i class="fas fa-anchor" style="font-size: 1.8rem;"></i></div>
                            <div>
                                <h3 style="margin: 0; font-size: 1.4rem; color: white;">L'Ancrage de Puissance</h3>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">Utilisez le contraste pour rendre votre prix évident.</div>
                            </div>
                        </div>
                        <div style="background: rgba(0,0,0,0.3); border-radius: 20px; padding: 2rem; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="opacity: 0.3; transform: scale(0.9); margin-bottom: 1.5rem;">
                                <div style="font-size: 0.75rem; font-weight: 900; color: #a855f7; display: flex; align-items: center; gap: 5px;"><i class="fas fa-crown"></i> OPTION ELITE (Ancre)</div>
                                <div style="font-size: 2.2rem; font-weight: 900; color: white;">${typeof App !== 'undefined' ? App.formatCurrency(scenarios.elite.tjm) : scenarios.elite.tjm + '€'} <span style="font-size: 1rem; opacity: 0.6;">/ j</span></div>
                            </div>
                            <div style="background: var(--primary-glass); border: 2px solid var(--primary); padding: 1.5rem; border-radius: 18px; position: relative;">
                                <div style="font-size: 0.75rem; font-weight: 800; color: var(--primary-light); text-transform: uppercase;">Votre Prix de Closing</div>
                                <div style="font-size: 2.5rem; font-weight: 900; color: white;">${typeof App !== 'undefined' ? App.formatCurrency(scenarios.security.tjm) : scenarios.security.tjm + '€'} <span style="font-size: 1rem; opacity: 0.6;">/ j</span></div>
                                <div style="position: absolute; top: -12px; right: -12px; background: #10b981; color: white; font-size: 0.65rem; padding: 5px 12px; border-radius: 20px; font-weight: 900;">PRIX ACCEPTE</div>
                            </div>
                        </div>
                        <div style="margin-top: 2rem; padding: 1.2rem; background: rgba(59, 130, 246, 0.05); border-radius: 16px; border: 1px dashed rgba(59, 130, 246, 0.3);">
                            <div style="font-size: 0.7rem; color: #3b82f6; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">Logique Psychologique :</div>
                            <div style="font-size: 0.9rem; color: #bfdbfe; font-style: italic; line-height: 1.5;">"${tactics.anchoring.logic}"</div>
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="padding: 3rem; border-radius: 35px; border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2);">
                    <div style="text-align: center; margin-bottom: 3rem;">
                        <h3 style="font-size: 1.8rem; margin-bottom: 0.5rem; color: white;">Simulateur d'Objections</h3>
                        <p class="text-muted">Cliquez sur une objection pour simuler la réponse parfaite.</p>
                    </div>
                    <div class="mobile-stack" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
                        ${tactics.objections.map((obj, i) => `
                            <div class="objection-card" onclick="this.classList.toggle('active')">
                                <div style="font-size: 0.7rem; font-weight: 900; color: #f43f5e; margin-bottom: 12px; text-transform: uppercase;">Objection Courante</div>
                                <div style="font-size: 1.15rem; font-weight: 800; color: white; line-height: 1.3;">"${obj.hook}"</div>
                                <div class="rebuttal-box">
                                    <div style="font-size: 0.7rem; color: #10b981; font-weight: 900; text-transform: uppercase; margin-bottom: 8px;"><i class="fas fa-bolt"></i> Contre-Attaque</div>
                                    <div style="font-size: 0.9rem; color: #e9d5ff; line-height: 1.5; font-style: italic;">${obj.rebuttal}</div>
                                </div>
                                <div style="margin-top: 1.5rem; text-align: center; font-size: 0.65rem; color: var(--text-muted);"><i class="fas fa-mouse-pointer" style="margin-right: 5px;"></i> CLIQUEZ POUR RÉVÉLER</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Rendu de l'onglet Journal de Bord & Mentorat (Pack EXPERT)
     */
    renderJournalTab() {
        const content = document.getElementById('scoper-tab-content');
        if (!content) return;

        if (!Storage.isExpert()) {
            content.innerHTML = `
                <div class="lock-screen elite-card" style="max-width: 600px; margin: 4rem auto; text-align: center; padding: 4rem 2rem;">
                    <div style="width: 80px; height: 80px; border-radius: 20px; background: var(--primary-glass); display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem; color: var(--primary);">
                        <i class="fas fa-shield-alt" style="font-size: 2.5rem;"></i>
                    </div>
                    <h2 style="font-size: 2rem; margin-bottom: 1rem; color: white;">Journal Haute Performance</h2>
                    <p class="text-muted" style="margin-bottom: 2.5rem; font-size: 1.1rem;">Débloquez votre carnet de bord stratégique pour l'introspection et la maximisation de votre exécution (The ONE Thing).</p>
                    <button class="cta-button" onclick="App.showUpgradeModal('premium_feature')">Passer en Mode EXPERT</button>
                </div>
            `;
            return;
        }

        const calcData = Storage.get('sp_calculator_data') || {};
        const defaultJournal = { mood: 'focus', energy: 7, entries: [], daily_focus: '', reflection: '', habits: { prospection: false, deepwork: false, off: false } };
        let journal = { ...defaultJournal, ...(Storage.get('sp_journal') || {}) };
        if (!Array.isArray(journal.entries)) journal.entries = [];
        if (!journal.habits) journal.habits = { ...defaultJournal.habits, ...journal.habits };

        content.innerHTML = `
            <div class="elite-journal-container hp-journal mobile-stack" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                
                <!-- Col 1: Carnet de Vie (The Real Journaling) -->
                <div class="writing-col">
                    <div class="elite-card" style="height: 100%; display: flex; flex-direction: column;">
                        <div class="elite-card-title"><i class="fas fa-pen-nib"></i> Carnet de Vie</div>
                        <p class="text-xs text-muted" style="margin-bottom: 1.5rem;">Écrivez votre journée : avancements, réflexions, pensées. Sauvegarde automatique.</p>
                        
                        <textarea class="hp-reflection-input" 
                                  style="flex: 1; min-height: 400px; resize: none; background: rgba(0,0,0,0.3); border: 1px solid var(--border); padding: 1.5rem; border-radius: 12px; color: var(--text-light); font-size: 1rem; line-height: 1.6;"
                                  placeholder="Aujourd'hui, j'ai..."
                                  onchange="Scoper.updateJournalReflection(this.value)">${journal.reflection || ''}</textarea>
                        
                        <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                            <span class="text-xs text-muted"><i class="fas fa-cloud-upload-alt"></i> Synchronisé</span>
                            <button class="button-primary small" onclick="Scoper.addJournalEntry('note', document.querySelector('.hp-reflection-input').value)">
                                <i class="fas fa-plus"></i> Ajouter au Carnet de Route
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Col 2: Timeline de Route -->
                <div class="timeline-col">
                    <div class="elite-card" style="height: 100%; display: flex; flex-direction: column; max-height: 600px; overflow-y: auto;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <div class="elite-card-title"><i class="fas fa-book-journal-whills"></i> Carnet de Route</div>
                            <div class="hp-log-actions">
                                <button class="hp-log-btn victory" onclick="Scoper.addJournalEntry('victory')">+ Victoire</button>
                                <button class="hp-log-btn lesson" onclick="Scoper.addJournalEntry('lesson')">+ Leçon</button>
                            </div>
                        </div>

                        <div class="hp-timeline">
                            ${journal.entries.length === 0 ? "<div class='hp-empty-timeline'>Aucun événement enregistré.</div>" : ""}
                            ${journal.entries.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20).map(entry => {
            let badgeClass = "badge-note";
            let badgeText = "Note";
            let icon = "fa-sticky-note";

            if (entry.type === "victory") { badgeClass = "victory-type"; badgeText = "Victoire"; icon = "fa-trophy"; }
            if (entry.type === "lesson") { badgeClass = "lesson-type"; badgeText = "Leçon"; icon = "fa-lightbulb"; }

            return `
                                <div class="hp-timeline-entry ${badgeClass}" style="margin-bottom: 1.5rem; position: relative; padding-left: 2rem; border-left: 2px solid var(--border);">
                                    <div class="hp-timeline-dot" style="position: absolute; left: -6px; top: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--primary);"></div>
                                    <div class="hp-timeline-content" style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
                                        <div class="hp-timeline-header" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.8rem;">
                                            <span class="hp-timeline-badge" style="font-weight: bold; color: var(--text-light);"><i class="fas ${icon}"></i> ${badgeText}</span>
                                            <span class="hp-timeline-date" style="color: var(--text-muted);">${entry.date ? new Date(entry.date).toLocaleDateString() + ' ' + new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                                        </div>
                                        <div class="hp-timeline-text" style="color: var(--text-light); line-height: 1.5; white-space: pre-wrap;">${entry.text}</div>
                                        <div class="hp-timeline-delete" style="cursor: pointer; color: #ef4444; font-size: 0.8rem; margin-top: 0.8rem; text-align: right;" onclick="Scoper.removeJournalEntry('${entry.id}')"><i class="fas fa-trash-alt"></i> Supprimer</div>
                                    </div>
                                </div>
                                `;
        }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    updateJournalReflection(text) {
        const journal = Storage.get('sp_journal') || { mood: 'focus', energy: 7, entries: [], daily_focus: '', reflection: '', habits: {} };
        journal.reflection = text.trim();
        Storage.saveJournal(journal);
    },

    addJournalEntry(type, directText = null) {
        let label = 'note';
        let text = directText;

        if (type === 'victory') { label = 'victoire'; }
        if (type === 'lesson') { label = 'leçon'; }

        if (text === null) {
            text = prompt(`Quelle ${label} ?`);
        }

        if (!text || text.trim() === '') return;

        const journal = Storage.get('sp_journal') || { entries: [], reflection: '' };
        if (!Array.isArray(journal.entries)) journal.entries = [];

        journal.entries.unshift({
            id: 'jrn_' + Date.now(),
            type,
            text: text.trim(),
            date: new Date().toISOString()
        });

        // If it was a note from the textarea, clear the reflection textarea
        if (type === 'note') {
            journal.reflection = '';
            const reflectionInput = document.querySelector('.hp-reflection-input');
            if (reflectionInput) reflectionInput.value = '';
        }

        Storage.saveJournal(journal);
        this.renderJournalTab();
        App.showNotification(`${label.charAt(0).toUpperCase() + label.slice(1)} enregistrée.`, 'success');
    },

    removeJournalEntry(id) {
        const journal = Storage.get('sp_journal');
        if (!journal || !journal.entries) return;
        journal.entries = journal.entries.filter(e => e.id !== id);
        Storage.saveJournal(journal);
        this.renderJournalTab();
    }
};
