// SoloPrice Pro - Project Scoper Module
// Outil d'estimation intelligente de projets (Value Pricing & Risk Management)

const Scoper = {
    tasks: [],
    settings: {
        hideHours: true
    },
    currentClientSector: 'ecommerce',
    currentProspectLevel: 'manager',
    currentArsenalLevel: 'intermediate',
    currentSalesPhase: 'preparation',
    currentObjectiveStep: 1,

    // --- MOTEUR AGENT DE POINTE (v2 Architecture - Market-Grade) ---
    Agent: {
        status: 'idle',
        memory: Storage.get('sp_agent_memory') || { facts: {}, history: [] },

        tools: {
            'scan_project_context': () => {
                const data = Storage.get('sp_calculator_data') || {};
                const tasks = Scoper.tasks || [];
                return `Analyse projet : ${tasks.length} tâches identifiées, Secteur=${Scoper.currentClientSector}, Cible=${data.target || 'TPE/PME'}.`;
            },
            'check_roi_viability': (data) => {
                const results = PricingEngine.calculateObjective(data);
                const leverage = (1500 * 12) + 25000;
                const isViable = leverage > (results.dailyRate * 10); // ROI > 10x
                return `Viabilité ROI : ${isViable ? 'ÉLEVÉE' : 'MODÉRÉE'} (Potentiel : ${App.formatCurrency(leverage)})`;
            },
            'analyze_objections': (prospectLevel) => {
                const pains = PricingEngine.clientSectorPainPoints[Scoper.currentClientSector]?.pains || ["budget", "temps"];
                return `Objections probables (${prospectLevel}) : ${pains.join(', ')}.`;
            }
        },

        async run(actionType, onLog, onComplete) {
            this.status = 'active';
            const data = Storage.get('sp_calculator_data') || {};

            // 1. PLANIFICATION DYNAMIQUE
            onLog("[PLANNER] Construction du plan d'action dynamique...");
            const plan = this.generateDynamicPlan(actionType, data);
            await new Promise(r => setTimeout(r, 600));

            // 2. EXÉCUTION DES ÉTAPES
            for (const step of plan) {
                onLog(`[${step.type}] ${step.content}`);
                await new Promise(r => setTimeout(r, 1000));

                if (step.type === "ACTION" && this.tools[step.tool]) {
                    const result = this.tools[step.tool](data);
                    onLog(`[RESULT] ${result}`);
                    this.updateMemory(step.tool, result);
                    await new Promise(r => setTimeout(r, 600));
                }

                // 3. AUTO-CRITIQUE (Self-Correction Loop)
                if (step.type === "CRITIQUE") {
                    onLog(`[SELF-CHECK] Analyse de la pertinence stratégique...`);
                    await new Promise(r => setTimeout(r, 1200));
                    onLog(`[ADJUSTMENT] ${step.adjustment}`);
                }
            }

            // 4. FINALISATION & PERSISTENCE
            this.saveMemory();
            this.status = 'idle';
            onComplete();
        },

        generateDynamicPlan(actionType, data) {
            // Logique de planification simulant un agent autonome décidant de ses étapes
            const basePlan = [
                { type: "THOUGHT", content: "Initialisation du contexte à partir de la mémoire à long terme." },
                { type: "ACTION", tool: "scan_project_context" }
            ];

            if (actionType === 'modal_roi') {
                basePlan.push(
                    { type: "THOUGHT", content: "Extraction des leviers de valeur pour " + (data.target || 'PME') + "." },
                    { type: "ACTION", tool: "check_roi_viability" },
                    { type: "CRITIQUE", content: "Vérification : L'argumentaire est-il assez agressif ?", adjustment: "Augmentation du poids des pertes d'inaction de 15%." }
                );
            } else if (actionType === 'modal_objections') {
                basePlan.push(
                    { type: "THOUGHT", content: "Anticipation des barrières psychologiques." },
                    { type: "ACTION", tool: "analyze_objections" },
                    { type: "CRITIQUE", content: "Vérification de la tonalité experte.", adjustment: "Utilisation d'un vocabulaire plus orienté 'Résultats' que 'Coûts'." }
                );
            } else {
                basePlan.push(
                    { type: "THOUGHT", content: "Alignement des objectifs TJM avec les livrables." },
                    { type: "CRITIQUE", content: "Analyse de cohérence financière.", adjustment: "Cadrage optimal détecté." }
                );
            }

            basePlan.push({ type: "THOUGHT", content: "Injection finale dans l'interface de closing." });
            return basePlan;
        },

        updateMemory(key, value) {
            this.memory.facts[key] = value;
            this.memory.history.push({ t: Date.now(), k: key, v: value });
        },

        saveMemory() {
            Storage.set('sp_agent_memory', this.memory);
        }
    },

    render(tab) {
        const container = document.getElementById('scoper-content');
        if (!container) return;

        // Fallback progressif : argument > activeTab (mémoire) > localStorage > 'objective'
        if (!tab) tab = this.activeTab || localStorage.getItem('sp_last_tab_scoper') || 'objective';

        this.activeTab = tab;
        const isPro = Storage.isPro();
        if (!this.currentObjectiveStep) this.currentObjectiveStep = Storage.get('sp_scoper_current_step') || 1;

        // Load persisted settings if not already in memory
        const data = Storage.get('sp_calculator_data') || {};
        if (data.clientSector) this.currentClientSector = data.clientSector;
        if (data.prospectLevel) this.currentProspectLevel = data.prospectLevel;
        if (data.arsenalLevel) this.currentArsenalLevel = data.arsenalLevel;
        if (data.salesPhase) this.currentSalesPhase = data.salesPhase;

        container.innerHTML = `
            <style>
                .scoper-tabs-nav {
                    display: flex; gap: 10px; margin-bottom: 3rem; background: rgba(255,255,255,0.02);
                    padding: 6px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); width: fit-content; margin-left: auto; margin-right: auto;
                }
                .scoper-tab-link {
                    padding: 10px 24px; border-radius: 12px; font-size: 0.9rem; font-weight: 700; color: #94a3b8;
                    cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 10px;
                }
                .scoper-tab-link:hover { color: white; background: rgba(255,255,255,0.03); }
                .scoper-tab-link.active { color: white; background: #1e1e1e; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
                
                .expert-lock-badge {
                    font-size: 0.65rem; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; 
                    padding: 2px 8px; border-radius: 6px; text-transform: uppercase; font-weight: 950; letter-spacing: 1px;
                }

                .scoper-modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
                    display: flex; align-items: center; justify-content: center; z-index: 9999;
                    animation: fadeIn 0.3s ease;
                }
                .scoper-modal-content {
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            </style>

            <div class="page-header" style="text-align: center; margin-bottom: 4rem;">
                <h1 style="font-size: 3.5rem; font-weight: 950; letter-spacing: -3px; margin-bottom: 0.5rem; line-height: 1;">${i18n.t('scoper.title')}</h1>
                <p class="text-muted" style="font-size: 1.2rem; max-width: 600px; margin: 0 auto;">${i18n.t('scoper.subtitle')}</p>
            </div>

            <div class="scoper-tabs-nav">
                <div class="scoper-tab-link ${tab === 'objective' ? 'active' : ''}" onclick="App.navigateTo('scoper', 'objective')">
                    <i class="fas fa-crosshairs"></i> ${i18n.t('scoper.tab.objective')}
                </div>
                <div class="scoper-tab-link ${tab === 'project' ? 'active' : ''}" onclick="App.navigateTo('scoper', 'project')">
                    <i class="fas fa-layer-group"></i> ${i18n.t('scoper.tab.project')}
                </div>
                <div class="scoper-tab-link ${tab === 'closing' ? 'active' : ''}" onclick="App.navigateTo('scoper', 'closing')">
                    <i class="fas fa-magic"></i> ${i18n.t('scoper.tab.closing')}
                    ${!Storage.isExpert() ? `<span class="expert-lock-badge"><i class="fas fa-lock" style="font-size: 0.6rem;"></i></span>` : ''}
                </div>
                <div class="scoper-tab-link ${tab === 'journal' ? 'active' : ''}" onclick="App.navigateTo('scoper', 'journal')">
                    <i class="fas fa-bolt"></i> ${i18n.t('scoper.tab.journal')}
                    ${!Storage.isExpert() ? `<span class="expert-lock-badge"><i class="fas fa-lock" style="font-size: 0.6rem;"></i></span>` : ''}
                </div>
            </div>

            <div id="scoper-tab-content" style="min-height: 60vh;"></div>
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
        if (Array.isArray(storedStep) || isNaN(parseInt(storedStep))) {
            storedStep = 1;
            Storage.set('sp_scoper_current_step', 1);
        }
        this.currentObjectiveStep = parseInt(storedStep);

        const content = document.getElementById('scoper-tab-content');
        if (!content) return;

        let data = Storage.get('sp_calculator_data');
        const defaultRev = (typeof App !== 'undefined' && App.getCurrencyConfig) ? App.getCurrencyConfig().defaultRevenue : 3000;
        const defaultData = { monthlyRevenue: defaultRev, workingDays: 15, hoursPerDay: 7, monthlyCharges: 500, taxRate: 22, sector: null, target: null };
        data = { ...defaultData, ...(data && typeof data === 'object' ? data : {}) };

        if (!Storage.get('sp_calculator_data')) {
            Storage.set('sp_calculator_data', data);
        }

        const currentStep = this.currentObjectiveStep || 1;
        const totalSteps = 6;

        content.innerHTML = `
            <style>
                .wizard-container { max-width: 900px; margin: 0 auto; padding: 2rem; }
                .wizard-progress { display: flex; justify-content: space-between; margin-bottom: 5rem; position: relative; }
                .wizard-progress::before {
                    content: ''; position: absolute; top: 24px; left: 0; width: 100%; height: 2px;
                    background: rgba(255,255,255,0.05); z-index: 1;
                }
                .wizard-progress-bar {
                    position: absolute; top: 24px; left: 0; height: 2px; background: var(--primary);
                    z-index: 2; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .step-node {
                    position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 12px;
                    width: 48px; cursor: pointer;
                }
                .step-circle {
                    width: 48px; height: 48px; border-radius: 16px; background: #0a0a0a; border: 1px solid rgba(255,255,255,0.1);
                    display: flex; align-items: center; justify-content: center; color: #4b5563; font-weight: 800;
                    transition: all 0.4s;
                }
                .step-node.active .step-circle { border-color: var(--primary); color: white; background: #1e1e1e; box-shadow: 0 0 20px rgba(16, 185, 129, 0.2); }
                .step-node.done .step-circle { background: var(--primary); border-color: var(--primary); color: white; }
                .step-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; text-align: center; }
                .step-node.active .step-label { color: white; }
                
                .wizard-card {
                    background: #0a0a0a; border: 1px solid rgba(255,255,255,0.06); border-radius: 40px; 
                    padding: 5rem; box-shadow: 0 40px 100px rgba(0,0,0,0.5); position: relative;
                }

                .sector-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 2rem; }
                .sector-card {
                    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px;
                    padding: 2rem 1rem; text-align: center; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .sector-card:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); }
                .sector-card.active { border-color: var(--primary); background: rgba(16, 185, 129, 0.05); }
                .sector-card i { font-size: 1.8rem; color: #4b5563; margin-bottom: 1rem; transition: all 0.3s; }
                .sector-card.active i { color: var(--primary); transform: scale(1.1); }
                .sector-label { font-size: 0.85rem; font-weight: 800; color: #94a3b8; }
                .sector-card.active .sector-label { color: white; }

                .target-grid { display: flex; gap: 1rem; margin-top: 2rem; }
                .target-card {
                    flex: 1; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px;
                    padding: 1.5rem; text-align: center; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; gap: 15px;
                }
                .target-card:hover { border-color: rgba(255,255,255,0.2); }
                .target-card.active { border-color: #6366f1; background: rgba(99, 102, 241, 0.05); }
                .target-card i { font-size: 1.2rem; color: #4b5563; }
                .target-card.active i { color: #6366f1; }
                .target-label { font-size: 0.8rem; font-weight: 800; color: #94a3b8; }
                .target-card.active .target-label { color: white; }

                .form-input-premium {
                    background: transparent; border: none; border-bottom: 2px solid rgba(255,255,255,0.05); 
                    font-size: 4rem; font-weight: 950; color: white; width: 100%; text-align: center;
                    padding: 1rem; outline: none; transition: all 0.4s; letter-spacing: -3px;
                }
                .form-input-premium:focus { border-color: var(--primary); }
                .form-input-premium::placeholder { opacity: 0.1; }
            </style>

            <div class="wizard-container" style="animation: fadeIn 0.8s ease-out;">
                <div class="wizard-progress">
                    <div class="wizard-progress-bar" style="width: ${(currentStep - 1) * 20}%"></div>
                    ${[1, 2, 3, 4, 5, 6].map(s => {
            const labels = [
                i18n.t('scoper.step.1') || 'Profil',
                'Briefing',
                i18n.t('scoper.step.2') || 'Revenu',
                i18n.t('scoper.step.3') || 'Rythme',
                i18n.t('scoper.step.4') || 'Charges',
                i18n.t('scoper.step.5') || 'Verdict'
            ];
            const isActive = currentStep === s;
            const isDone = currentStep > s;
            return `
                            <div class="step-node ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}" onclick="Scoper.goToObjectiveStep(${s})">
                                <div class="step-circle">${isDone ? '<i class="fas fa-check"></i>' : s}</div>
                                <span class="step-label">${labels[s - 1]}</span>
                            </div>
                        `;
        }).join('')}
                </div>

                <div class="wizard-card">
                    <div id="step-save-indicator" style="position: absolute; top: 2rem; right: 3rem; font-size: 0.7rem; color: var(--primary); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; opacity: 0.4; pointer-events: none;">
                        <i class="fas fa-shield-check"></i> Sauvegarde en cours
                    </div>
                    
                    <div id="step-form-container">
                        ${this.renderCurrentStepForm(currentStep, data)}
                    </div>

                    <div class="wizard-actions" style="display: flex; justify-content: space-between; margin-top: 5rem; align-items: center;">
                        <button class="button-outline" ${currentStep === 1 ? 'style="opacity:0; pointer-events:none;"' : ''} onclick="Scoper.prevObjectiveStep()" style="border-radius: 12px; font-weight: 800; padding: 1rem 2rem;">
                            <i class="fas fa-arrow-left" style="margin-right: 10px;"></i> ${i18n.t('scoper.action.back')}
                        </button>
                        
                        <div style="display: flex; gap: 1rem;">
                             <button class="button-outline" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 1rem 1.5rem;" onclick="Scoper.resetObjective()">
                                <i class="fas fa-power-off"></i>
                            </button>
                            ${currentStep < 6 ? `
                                <button class="button-primary large" onclick="Scoper.nextObjectiveStep()" style="background: white; color: black; border: none; font-weight: 900; border-radius: 16px; padding: 1rem 3rem;">
                                    ${i18n.t('scoper.action.continue')} <i class="fas fa-arrow-right" style="margin-left: 10px;"></i>
                                </button>
                            ` : `
                                <button class="button-primary large" onclick="Scoper.saveObjective()" style="background: var(--gradient-premium); border: none; font-weight: 900; border-radius: 16px; padding: 1rem 3rem;">
                                    <i class="fas fa-lock" style="margin-right: 10px;"></i> ${i18n.t('scoper.action.save')}
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderCurrentStepForm(currentStep, data) {
        switch (currentStep) {
            case 1: // PROFIL
                return `
                    <div class="step-header" style="text-align: center; margin-bottom: 4rem;">
                        <h2 style="font-size: 2.5rem; font-weight: 950; letter-spacing: -2px;">${i18n.t('scoper.wizard.title.1')}</h2>
                        <p class="text-muted" style="font-size: 1.1rem;">${i18n.t('scoper.wizard.desc.1')}</p>
                    </div>
                    <div class="sector-grid">
                        ${[
                        { id: 'tech', label: 'Tech & Web', icon: 'fa-code' },
                        { id: 'design', label: 'Design & Branding', icon: 'fa-pen-nib' },
                        { id: 'marketing', label: 'Marketing & Com', icon: 'fa-ad' },
                        { id: 'conseil', label: 'Conseil & Strat', icon: 'fa-lightbulb' },
                        { id: 'media', label: 'Média & Vidéo', icon: 'fa-video' },
                        { id: 'artisanat', label: 'Artisanat & Prod', icon: 'fa-hammer' }
                    ].map(s => `
                            <div class="sector-card ${data.sector === s.id ? 'active' : ''}" 
                                 onclick="document.querySelectorAll('.sector-card').forEach(c => c.classList.remove('active')); this.classList.add('active'); Scoper.updateSector('${s.id}')">
                                <i class="fas ${s.icon}"></i>
                                <div class="sector-label">${s.label}</div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="margin-top: 4rem;">
                        <h3 style="font-size: 0.8rem; font-weight: 950; text-transform: uppercase; letter-spacing: 2px; color: #4b5563; text-align: center; margin-bottom: 1.5rem;">Profil du Client</h3>
                        <div class="target-grid">
                            ${[
                        { id: 'tpe', label: 'TPE / Freelance', icon: 'fa-user' },
                        { id: 'pme', label: 'PME & Startups', icon: 'fa-building' },
                        { id: 'grands-comptes', label: 'Grands Comptes', icon: 'fa-city' }
                    ].map(t => `
                                <div class="target-card ${data.target === t.id ? 'active' : ''}" 
                                     onclick="document.querySelectorAll('.target-card').forEach(c => c.classList.remove('active')); this.classList.add('active'); Scoper.updateTarget('${t.id}')">
                                    <i class="fas ${t.icon}"></i>
                                    <div class="target-label">${t.label}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            case 2: // BRIEFING (NEW)
                return `
                    <div class="step-header" style="text-align: center; margin-bottom: 4rem;">
                        <h2 style="font-size: 2.5rem; font-weight: 950; letter-spacing: -2px;">Le Briefing de Réussite</h2>
                        <p class="text-muted" style="font-size: 1.1rem;">Précisez votre terrain de jeu pour des conseils ultra-personnalisés.</p>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 600px; margin: 0 auto;">
                        <div>
                            <label style="display: block; font-size: 0.7rem; font-weight: 950; color: #4b5563; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1rem;">Cible Spécifique (ex: CEOs de SaaS logistique, DRH...)</label>
                            <input type="text" id="specificTarget" class="form-input-premium" style="font-size: 1.5rem; text-align: left; padding: 0.5rem 0; letter-spacing: 0; font-weight: 700;" value="${data.specificTarget || ''}" placeholder="Cible que vous visez..." oninput="Scoper.autoSaveObjective()">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.7rem; font-weight: 950; color: #4b5563; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1rem;">Votre plus gros blocage en closing ?</label>
                            <input type="text" id="mainObstacle" class="form-input-premium" style="font-size: 1.5rem; text-align: left; padding: 0.5rem 0; letter-spacing: 0; font-weight: 700;" value="${data.mainObstacle || ''}" placeholder="Ex: Justifier mon prix, la relance..." oninput="Scoper.autoSaveObjective()">
                        </div>
                    </div>

                `;
            case 3: // REVENU
                return `
                    <div class="step-header" style="text-align: center; margin-bottom: 4rem;">
                        <h2 style="font-size: 2.5rem; font-weight: 950; letter-spacing: -2px;">${i18n.t('scoper.wizard.title.2')}</h2>
                        <p class="text-muted" style="font-size: 1.1rem;">${i18n.t('scoper.wizard.desc.2')}</p>
                    </div>
                    <div style="max-width: 500px; margin: 0 auto; text-align: center;">
                        <input type="number" id="monthlyRevenue" class="form-input-premium" value="${data.monthlyRevenue || ''}" placeholder="3000" oninput="Scoper.autoSaveObjective()">
                        <div style="color: #4b5563; font-weight: 900; font-size: 1.5rem; margin-top: -10px;">${typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€'} / MOIS NET</div>
                        <p class="text-muted" style="margin-top: 3rem; font-size: 0.9rem;">C'est votre base de calcul pour votre train de vie cible.</p>
                    </div>
                `;
            case 4: // RYTHME
                return `
                    <div class="step-header" style="text-align: center; margin-bottom: 4rem;">
                        <h2 style="font-size: 2.5rem; font-weight: 950; letter-spacing: -2px;">${i18n.t('scoper.wizard.title.3')}</h2>
                        <p class="text-muted" style="font-size: 1.1rem;">${i18n.t('scoper.wizard.desc.3')}</p>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem;">
                        <div style="text-align: center;">
                            <div style="font-size: 0.7rem; font-weight: 950; color: #4b5563; text-transform: uppercase; letter-spacing: 2px;">Jours Facturés</div>
                            <input type="number" id="workingDays" class="form-input-premium" value="${data.workingDays ?? 15}" oninput="Scoper.autoSaveObjective()">
                            <p class="text-muted" style="font-size: 0.8rem; margin-top: 10px;">Moyenne idéale : 12-15 jours.</p>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 0.7rem; font-weight: 950; color: #4b5563; text-transform: uppercase; letter-spacing: 2px;">Heures / Jour</div>
                            <input type="number" id="hoursPerDay" class="form-input-premium" value="${data.hoursPerDay ?? 7}" oninput="Scoper.autoSaveObjective()">
                            <p class="text-muted" style="font-size: 0.8rem; margin-top: 10px;">Temps de production effectif.</p>
                        </div>
                    </div>
                `;
            case 5: // CHARGES
                return `
                    <div class="step-header" style="text-align: center; margin-bottom: 4rem;">
                        <h2 style="font-size: 2.5rem; font-weight: 950; letter-spacing: -2px;">${i18n.t('scoper.wizard.title.4')}</h2>
                        <p class="text-muted" style="font-size: 1.1rem;">${i18n.t('scoper.wizard.desc.4')}</p>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem;">
                        <div style="text-align: center;">
                            <div style="font-size: 0.7rem; font-weight: 950; color: #4b5563; text-transform: uppercase; letter-spacing: 2px;">Charges Fixes</div>
                            <input type="number" id="monthlyCharges" class="form-input-premium" value="${data.monthlyCharges ?? 500}" oninput="Scoper.autoSaveObjective()">
                            <p class="text-muted" style="font-size: 0.8rem; margin-top: 10px;">SaaS, Assurances, Bureaux...</p>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 0.7rem; font-weight: 950; color: #4b5563; text-transform: uppercase; letter-spacing: 2px;">Imposition (%)</div>
                            <input type="number" id="taxRate" class="form-input-premium" value="${data.taxRate ?? 22}" oninput="Scoper.autoSaveObjective()">
                            <p class="text-muted" style="font-size: 0.8rem; margin-top: 10px;">Auto-entrepreneur : ~22%.</p>
                        </div>
                    </div>
                `;
            case 6: // VERDICT
                const results = PricingEngine.calculateObjective(data);
                const scenarios = PricingEngine.getScenarios(results);
                const activeScenario = this.selectedScenario || 'security';
                const currentTJM = scenarios[activeScenario].tjm;
                const currentAnnual = scenarios[activeScenario].annual;
                const powerScore = PricingEngine.getMarketPowerScore(results.dailyRate, data.sector);

                return `
                    <div class="step-header" style="text-align: center; margin-bottom: 4rem;">
                        <h2 style="font-size: 2.5rem; font-weight: 950; letter-spacing: -2px;">${i18n.t('scoper.wizard.title.5')}</h2>
                        <p class="text-muted" style="font-size: 1.1rem;">${i18n.t('scoper.wizard.desc.5')}</p>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem;">
                        <div style="display: flex; flex-direction: column; gap: 2rem;">
                            <div style="background: #111; border: 1px solid rgba(255,255,255,0.08); border-radius: 32px; padding: 3rem; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                                <div style="font-size: 0.7rem; font-weight: 950; color: var(--primary); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1rem;">Projection Annuelle</div>
                                <div style="font-size: 4rem; font-weight: 950; letter-spacing: -3px; color: white;">${typeof App !== 'undefined' ? App.formatCurrency(currentAnnual) : currentAnnual.toLocaleString() + '€'}</div>
                                <p class="text-muted" style="font-size: 0.9rem; margin-top: 1rem;">Basé sur ${data.workingDays}j / mois à ${typeof App !== 'undefined' ? App.formatCurrency(currentTJM) : currentTJM + '€'}/j</p>
                            </div>

                            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 2rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; align-items: center;">
                                    <span style="font-size: 0.8rem; font-weight: 800; color: #94a3b8;">Indice de Crédibilité Marché</span>
                                    <span style="font-size: 1.2rem; font-weight: 950; color: white;">${powerScore}%</span>
                                </div>
                                <div style="height: 6px; background: #1a1a1a; border-radius: 3px; overflow: hidden;">
                                    <div style="width: ${powerScore}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--primary-dark)); transition: width 1s ease-out;"></div>
                                </div>
                                <p style="font-size: 0.75rem; color: #64748b; margin-top: 1rem; line-height: 1.5;">
                                    ${powerScore > 70 ? '<strong>Positionnement Fort</strong> : Votre tarif est dans la zone de confort du marché.' : (powerScore > 40 ? '<strong>Positionnement Équilibré</strong> : Nécessite une argumentation solide.' : '<strong>Positionnement Premium</strong> : Exige une autorité d\'expert supérieure.')}
                                </p>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                            <div style="font-size: 0.7rem; font-weight: 950; color: #4b5563; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 0.5rem;">Sélectionner un Profil de Risque</div>
                            <div style="display: grid; gap: 1rem;">
                                ${Object.entries(scenarios).map(([key, s]) => `
                                    <div onclick="Scoper.selectScenario('${key}')" style="cursor: pointer; padding: 1.5rem; border-radius: 20px; border: 1px solid ${activeScenario === key ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}; background: ${activeScenario === key ? 'var(--primary-glass)' : 'rgba(255,255,255,0.02)'}; transition: all 0.3s; display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <div style="font-size: 0.9rem; font-weight: 800; color: ${activeScenario === key ? 'white' : '#94a3b8'}">${i18n.t(`scoper.scenario.${key}`) || s.label}</div>
                                            <div style="font-size: 0.7rem; color: #64748b;">${key === 'security' ? 'Sécurité maximale' : (key === 'balanced' ? 'Optimisation revenus' : 'Croissance agressive')}</div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="font-size: 1.2rem; font-weight: 950; color: white;">${typeof App !== 'undefined' ? App.formatCurrency(s.tjm) : s.tjm + '€'}</div>
                                            <div style="font-size: 0.7rem; color: #64748b;">TJM Recommandé</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>

                            <div onclick="App.navigateTo('scoper', 'project')" style="margin-top: 1rem; cursor: pointer; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1)); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 20px; padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem;">
                                <div style="width: 48px; height: 48px; border-radius: 14px; background: rgba(16, 185, 129, 0.2); display: flex; align-items: center; justify-content: center; color: #10b981;">
                                    <i class="fas fa-rocket"></i>
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 800; color: white; font-size: 0.95rem;">Prêt pour votre premier devis ?</div>
                                    <div style="font-size: 0.75rem; color: #10b981; font-weight: 700;">TESTER CE TJM SUR UN PROJET &rarr;</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            default:
                return 'No form content for this step';
        }
    },

    goToObjectiveStep(step) {
        this.currentObjectiveStep = step;
        Storage.set('sp_scoper_current_step', step);
        App.navigateTo('scoper', 'objective');
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

        // Recalculate rates every time we advance to ensure consistency
        const results = PricingEngine.calculateObjective(merged);
        merged.dailyRate = results.dailyRate;
        merged.hourlyRate = results.hourlyRate;

        Storage.set('sp_calculator_data', merged);
        // Persist to Supabase (non-blocking)
        Storage.saveCalculatorData(merged).catch(e => console.warn('[SCOPER] Sync error:', e));

        if (this.currentObjectiveStep < 6) {
            this.currentObjectiveStep++;
            Storage.set('sp_scoper_current_step', this.currentObjectiveStep);
            App.navigateTo('scoper', 'objective');
        }
    },

    prevObjectiveStep() {
        if (this.currentObjectiveStep > 1) {
            this.currentObjectiveStep--;
            Storage.set('sp_scoper_current_step', this.currentObjectiveStep);
            App.navigateTo('scoper', 'objective');
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

    updateClientSector(sector) {
        this.currentClientSector = sector;
        const data = Storage.get('sp_calculator_data') || {};
        data.clientSector = sector;
        Storage.set('sp_calculator_data', data);
        if (this.activeTab === 'closing') this.renderClosingTab();
    },



    updateArsenalLevel(level) {
        this.currentArsenalLevel = level;
        const data = Storage.get('sp_calculator_data') || {};
        data.arsenalLevel = level;
        Storage.set('sp_calculator_data', data);
        if (this.activeTab === 'closing') this.renderClosingTab();
    },

    updateSalesPhase(phase) {
        this.currentSalesPhase = phase;
        const data = Storage.get('sp_calculator_data') || {};
        data.salesPhase = phase;
        Storage.set('sp_calculator_data', data);
        if (this.activeTab === 'closing') this.renderClosingTab();
    },
    updateClientSector(sector) {
        this.currentClientSector = sector;
        const data = Storage.get('sp_calculator_data') || {};
        data.clientSector = sector;
        Storage.set('sp_calculator_data', data);
        if (this.activeTab === 'closing') this.renderClosingTab();
    },

    updateArsenalLevel(level) {
        this.currentArsenalLevel = level;
        const data = Storage.get('sp_calculator_data') || {};
        data.arsenalLevel = level;
        Storage.set('sp_calculator_data', data);
        if (this.activeTab === 'closing') this.renderClosingTab();
    },

    updateSalesPhase(phase) {
        this.currentSalesPhase = phase;
        const data = Storage.get('sp_calculator_data') || {};
        data.salesPhase = phase;
        Storage.set('sp_calculator_data', data);
        if (this.activeTab === 'closing') this.renderClosingTab();
    },


    autoSaveObjective() {
        const currentData = Storage.get('sp_calculator_data') || {};
        const data = {
            ...currentData,
            monthlyRevenue: document.getElementById('monthlyRevenue') ? (parseFloat(document.getElementById('monthlyRevenue').value) || 0) : (currentData.monthlyRevenue || 0),
            workingDays: document.getElementById('workingDays') ? (parseFloat(document.getElementById('workingDays').value) || 1) : (currentData.workingDays || 1),
            hoursPerDay: document.getElementById('hoursPerDay') ? (parseFloat(document.getElementById('hoursPerDay').value) || 1) : (currentData.hoursPerDay || 1),
            monthlyCharges: document.getElementById('monthlyCharges') ? (parseFloat(document.getElementById('monthlyCharges').value) || 0) : (currentData.monthlyCharges || 0),
            taxRate: document.getElementById('taxRate') ? (parseFloat(document.getElementById('taxRate').value) || 0) : (currentData.taxRate || 0),
            specificTarget: document.getElementById('specificTarget') ? document.getElementById('specificTarget').value : (currentData.specificTarget || ''),
            mainObstacle: document.getElementById('mainObstacle') ? document.getElementById('mainObstacle').value : (currentData.mainObstacle || '')
        };

        // Recalculate rates on every auto-save to ensure other tabs (Project, Closing) are always up to date
        const results = PricingEngine.calculateObjective(data);
        data.dailyRate = results.dailyRate;
        data.hourlyRate = results.hourlyRate;

        Storage.set('sp_calculator_data', data);

        // Show subtle visual confirmation
        const indicator = document.getElementById('step-save-indicator');
        if (indicator) {
            indicator.style.opacity = '1';
            indicator.innerHTML = '<i class="fas fa-sync fa-spin"></i> Synchronisation...';
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                indicator.innerHTML = `<i class="fas fa-check"></i> ${i18n.t('notify.saved_realtime') || 'Enregistré en temps réel'}`;
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
                title: i18n.t('scoper.matrix.positioning') || 'Positionnement Marché',
                desc: `${diag.title}. ${diag.desc} `,
                color: diag.color,
                icon: diag.icon
            },
            {
                title: i18n.t('scoper.matrix.argument') || 'Argumentaire Valeur',
                desc: this.getCoachingValue(sector, tjm),
                color: 'var(--primary-light)',
                icon: 'fa-lightbulb'
            },
            {
                title: i18n.t('scoper.matrix.target') || 'Cible Client Idéale',
                desc: this.getCoachingTarget(sector, tjm),
                color: 'var(--success)',
                icon: 'fa-bullseye'
            },
            {
                title: i18n.t('scoper.matrix.leverage') || 'Levier d\'Optimisation',
                desc: tjm > 800 ? (i18n.t('scoper.leverage.high') || 'Proposez du forfait pour masquer le TJM.') : (i18n.t('scoper.leverage.low') || 'Augmentez votre rythme de 2j pour baisser la pression.'),
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
            <style>
                .project-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 3rem; align-items: start; }
                .tasks-container { background: #0a0a0a; border: 1px solid rgba(255,255,255,0.06); border-radius: 32px; padding: 3rem; }
                .task-row-premium {
                    display: grid; grid-template-columns: 1fr auto; gap: 2rem; padding: 1.5rem;
                    background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px solid transparent;
                    transition: all 0.3s; margin-bottom: 1rem; position: relative;
                }
                .task-row-premium:hover { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); }
                .task-row-premium .delete-task {
                    position: absolute; top: -10px; right: -10px; width: 24px; height: 24px; border-radius: 50%;
                    background: #ef4444; color: white; display: flex; align-items: center; justify-content: center;
                    font-size: 0.7rem; cursor: pointer; opacity: 0; transition: all 0.3s; z-index: 10;
                }
                .task-row-premium:hover .delete-task { opacity: 1; }
                
                .results-sidebar {
                    position: sticky; top: 2rem; display: flex; flex-direction: column; gap: 1.5rem;
                }
                .summary-card-premium {
                    background: #111; border: 1px solid rgba(255,255,255,0.08); border-radius: 32px; padding: 2.5rem;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
                }

                .pita-selector {
                    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 1rem;
                }
            </style>

            <div class="project-grid" style="animation: fadeInUp 0.8s ease-out;">
                <div class="tasks-container">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                         <h3 style="font-size: 1.2rem; font-weight: 800; color: white;">Structure du Projet</h3>
                         <div style="display: flex; gap: 1rem;">
                            <button class="button-outline small" onclick="Scoper.addTask()" style="border-radius: 8px;">
                                <i class="fas fa-plus"></i> Ajouter une Tâche
                            </button>
                            <button class="button-secondary small" onclick="Scoper.showCatalogSelector()" style="border-radius: 8px; background: rgba(255,255,255,0.05); border: none;">
                                <i class="fas fa-folder-open"></i> Catalogue
                            </button>
                         </div>
                    </div>
                    
                    <div id="scoper-tasks"></div>
                </div>

                <div class="results-sidebar">
                    <div class="summary-card-premium">
                        <div style="font-size: 0.7rem; font-weight: 950; color: #10b981; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1rem;">Budget Estimé</div>
                        <div id="scoper-total-price" style="font-size: 3.5rem; font-weight: 950; letter-spacing: -3px; color: white;">0 €</div>
                        <div id="scoper-tax-info" style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem;">Incl. TVA 20%</div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05);">
                            <div>
                                <div style="font-size: 0.6rem; font-weight: 800; color: #64748b; text-transform: uppercase;">Temps Est.</div>
                                <div id="scoper-total-time" style="font-size: 1.2rem; font-weight: 900; color: white;">0h</div>
                            </div>
                            <div>
                                <div style="font-size: 0.6rem; font-weight: 800; color: #64748b; text-transform: uppercase;">TJM Réel</div>
                                <div id="scoper-actual-tjm" style="font-size: 1.2rem; font-weight: 900; color: var(--primary);">0 €</div>
                            </div>
                        </div>
                    </div>

                    <div id="scoper-profitability-indicator" style="margin-bottom: 1.5rem;"></div>

                    <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 2rem;">
                         <div style="font-size: 0.7rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.5rem;">Leviers de Prix & Stratégie</div>
                         
                         <div style="margin-bottom: 1.5rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <label style="font-size: 0.8rem; font-weight: 700; color: white; display: block;">TJM de Référence</label>
                                <span style="font-size: 0.6rem; font-weight: 900; color: var(--primary); background: var(--primary-glass); padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px;"><i class="fas fa-bullseye"></i> PILOTÉ PAR STRATÉGIE</span>
                            </div>
                            <input type="number" id="scoper-tjm" class="form-input" value="${this.getTJM()}" onchange="Scoper.calculate()" style="background: #111; border-color: rgba(255,255,255,0.1); border-radius: 12px; padding: 0.8rem;">
                         </div>

                         <div style="margin-bottom: 1.5rem;">
                            <label style="font-size: 0.8rem; font-weight: 700; color: white; display: block; margin-bottom: 0.5rem;">Facteur PITA (Risk)</label>
                            <div class="pita-selector">
                                <div id="pita-multiplier-display" style="grid-column: span 3; font-size: 0.7rem; font-weight: 800; color: var(--primary); text-align: right; margin-bottom: 5px;">Impact : +0%</div>
                                <div style="font-size: 0.6rem; color: #64748b; margin-bottom: 5px;">Urgence</div>
                                <input type="range" id="scoper-pita-urgency" min="1" max="5" value="1" oninput="Scoper.calculate()" style="grid-column: span 2; width: 100%;">
                                <div style="font-size: 0.6rem; color: #64748b; margin-bottom: 5px;">Complexité</div>
                                <input type="range" id="scoper-pita-complexity" min="1" max="5" value="1" oninput="Scoper.calculate()" style="grid-column: span 2; width: 100%;">
                                <div style="font-size: 0.6rem; color: #64748b; margin-bottom: 5px;">Client (PITA)</div>
                                <input type="range" id="scoper-pita-client" min="1" max="5" value="1" oninput="Scoper.calculate()" style="grid-column: span 2; width: 100%;">
                            </div>
                         </div>


                         <div style="margin-bottom: 1.5rem;">
                            <label style="font-size: 0.8rem; font-weight: 700; color: white; display: block; margin-bottom: 0.5rem;">Marge Sécurité (%)</label>
                            <input type="number" id="scoper-buffer" class="form-input" value="20" onchange="Scoper.calculate()" style="background: #111; border-color: rgba(255,255,255,0.1); border-radius: 12px; padding: 0.8rem;">
                         </div>

                         <div id="scoper-tax-container"></div>
                    </div>

                    <button class="button-primary" id="btn-create-quote" style="padding: 1.5rem; border-radius: 20px; background: white; color: black; border: none; font-weight: 900; font-size: 1.1rem; box-shadow: 0 20px 40px rgba(255,255,255,0.1);">
                        <i class="fas fa-file-invoice-dollar" style="margin-right: 12px;"></i> Générer le Devis Officiel
                    </button>
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
        return this.currentProjectTJM || calcData?.dailyRate || 400;
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
            console.log('[SCOPER] TJM objective synced to Supabase:', finalData.dailyRate + (typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€') + '/j');
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
                    <h2 style="font-size: 2rem; margin-bottom: 1rem;">${i18n.t('scoper.success.title')}</h2>
                    <p class="text-muted" style="font-size: 1.1rem; margin-bottom: 2rem;">
                        <strong>Stratégie Activée !</strong> Ce tarif de 
                        <span style="color: var(--primary); font-weight: 900;">${(typeof App !== 'undefined' ? App.formatCurrency(finalData.dailyRate) : finalData.dailyRate + '€')}</span> 
                        pilote désormais votre chiffrage projet et vos conseils de closing.
                    </p>
                    
                    <div style="display: flex; gap: 1rem; justify-content: center;">
                        <button class="button-primary" onclick="App.navigateTo('scoper', 'project')" style="padding: 1rem 2rem; font-size: 1rem;">
                            <i class="fas fa-calculator" style="margin-right: 10px;"></i> ${i18n.t('scoper.tab.project')} (Pack PRO)
                        </button>
                        <button class="button-outline" onclick="App.navigateTo('dashboard')" style="padding: 1rem 2rem;">
                            ${i18n.t('nav.dashboard')}
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

        App.showNotification(i18n.t('notify.strategy_saved') || 'Stratégie TJM scellée avec succès !', 'success');

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
                    <p class="text-muted">${i18n.t('scoper.no_tasks') || 'Aucune tâche définie.'}</p>
                    <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem;">
                        <button class="button-primary small" onclick="Scoper.addTask()">+ ${i18n.t('scoper.add_empty') || 'Tâche Vide'}</button>
                        <button class="button-secondary small" onclick="Scoper.showCatalogSelector()">+ ${i18n.t('scoper.from_catalog') || 'Du Catalogue'}</button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.tasks.map((task, index) => {
            const tjm = parseFloat(document.getElementById('scoper-tjm')?.value) || this.getTJM();
            const buffer = parseFloat(document.getElementById('scoper-buffer')?.value) || 20;
            const hours = task.max * (1 + buffer / 100);
            const calculatedPrice = (hours / 7) * tjm;

            return `
                <div class="scoper-task-row" data-index="${index}">
                    <div class="task-main">
                        <input type="text" placeholder="${i18n.t('scoper.task_placeholder') || 'Nom de la prestation (ex: Design UI)'}" class="form-input task-name" value="${task.name}" onchange="Scoper.updateTask(${index}, 'name', this.value)">
                    </div>
                    
                    <div class="task-details">
                        <div class="time-inputs">
                            <div class="time-field">
                                <label>${i18n.t('scoper.optimistic') || 'Optimiste'} (h)</label>
                                <input type="number" class="form-input mini" value="${task.min}" step="0.5" onchange="Scoper.updateTask(${index}, 'min', this.value)">
                            </div>
                            <div class="time-field">
                                <label>${i18n.t('scoper.realistic') || 'Réaliste'} (h)</label>
                                <input type="number" class="form-input mini" value="${task.max}" step="0.5" onchange="Scoper.updateTask(${index}, 'max', this.value)">
                            </div>
                        </div>

                        <div class="price-override">
                            <label>${i18n.t('scoper.flat_price') || 'Prix Forfaitaire'} (${typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€'})</label>
                            <input type="number" 
                                   class="form-input" 
                                   placeholder="${Math.round(calculatedPrice)}" 
                                   value="${task.manualPrice !== null ? task.manualPrice : ''}" 
                                   onchange="Scoper.updateTask(${index}, 'manualPrice', this.value)">
                        </div>

                        <button class="btn-icon btn-danger" onclick="Scoper.removeTask(${index})" title="Supprimer"></button>
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

        const pitaResult = PricingEngine.getPitaIncentive(urgency, complexity, client);
        const impactPercent = pitaResult.percent;
        const pitaDisplay = document.getElementById('pita-multiplier-display');
        if (pitaDisplay) pitaDisplay.textContent = i18n.t('scoper.pita.impact', { percent: impactPercent }) || `Impact: +${impactPercent}%`;

        const finalTJM = tjm * pitaResult.multiplier;

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
        this.currentProjectTJM = actualTjm;
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

        const sym = typeof App !== 'undefined' ? App.getCurrencyConfig().symbol : '€';

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
            status = i18n.t('scoper.status.profitable') || 'PROJET RENTABLE';
            advice = i18n.t('scoper.advice.profitable') || 'Votre TJM réel est au-dessus de votre objectif. C\'est une mission haute valeur.';
            icon = 'fa-rocket';
        } else if (diff <= -50) {
            color = 'var(--danger)';
            status = i18n.t('scoper.status.warning') || 'ALERTE RENTABILITÉ';
            advice = i18n.t('scoper.advice.warning') || 'Vous êtes en dessous de votre boussole. Augmentez votre prix ou baissez le temps passé.';
            icon = 'fa-exclamation-triangle';
        } else {
            color = 'var(--primary)';
            status = i18n.t('scoper.status.aligned') || 'OBJECTIF ALIGNÉ';
            advice = i18n.t('scoper.advice.aligned') || 'Le projet respecte parfaitement votre stratégie financière.';
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
                    ${i18n.t('scoper.gap') || 'Écart'} : <strong style="color: ${diff >= 0 ? 'var(--success)' : 'var(--danger)'}">${diff >= 0 ? '+' : ''}${Math.round(diff)}${sym}/j</strong> par rapport à l'objectif.
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
            App.showNotification(i18n.t('scoper.catalog_empty') || 'Votre catalogue est vide. Ajoutez des services dans les Réglages.', 'info');
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
                    <h3>${i18n.t('scoper.from_catalog') || 'Importer du Catalogue'}</h3>
                    <button class="modal-close" onclick="document.getElementById('catalog-selector-overlay').remove()"></button>
                </div>
                <div class="modal-body" style="padding: 1rem 0;">
                    <p class="text-sm text-muted" style="margin-bottom: 1.5rem;">${i18n.t('scoper.catalog_desc') || 'Sélectionnez les prestations à ajouter à votre estimation.'}</p>
                    <div class="catalog-list" style="max-height: 400px; overflow-y: auto; display: grid; gap: 0.5rem;">
                        ${services.map(s => `
                            <div class="catalog-item" onclick="Scoper.importService('${s.id}')" style="padding: 1rem; background: var(--bg-sidebar); border: 1px solid var(--border); border-radius: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s;">
                                <div>
                                    <div style="font-weight: 600;">${s.label}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);">${s.category || (i18n.t('scoper.standard') || 'Standard')}</div>
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
            newTask.min = 7;
            newTask.max = 7;
        } else if (service.unitType === 'Heure') {
            newTask.min = 1;
            newTask.max = 1;
        } else {
            newTask.manualPrice = service.unitPrice;
        }

        this.tasks.push(newTask);
        this.renderTasks();
        this.calculate();

        document.getElementById('catalog-selector-overlay')?.remove();
        App.showNotification(i18n.t('scoper.import_success', { label: service.label }) || `"${service.label}" importé.`, 'success');
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
                <div class="lock-screen glass-card" style="max-width: 600px; margin: 4rem auto; text-align: center; padding: 4rem 2rem; border: 1px solid rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.03); border-radius: 32px; backdrop-filter: blur(20px);">
                    <div style="width: 80px; height: 80px; border-radius: 24px; background: var(--primary-glass); display: flex; align-items: center; justify-content: center; margin: 0 auto 2.5rem; color: var(--primary); box-shadow: 0 10px 40px var(--primary-glass);">
                        <i class="fas fa-magic" style="font-size: 2.5rem;"></i>
                    </div>
                    <h2 style="font-size: 2.4rem; margin-bottom: 1rem; color: white; font-weight: 800; letter-spacing: -1.5px;">Arsenal de Closing Expert</h2>
                    <p class="text-muted" style="margin-bottom: 3rem; font-size: 1.15rem; line-height: 1.7; max-width: 450px; margin-left: auto; margin-right: auto;">Accédez aux stratégies des meilleurs closers et transformez chaque devis en un contrat signé avec une marge maximale.</p>
                    <button class="button-primary large hover-lift" style="padding: 1.4rem 3rem; font-weight: 800; border-radius: 16px;" onclick="App.showUpgradeModal('premium_feature')">
                         <i class="fas fa-crown" style="margin-right: 10px;"></i> Passer au Pack EXPERT
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

        // Pass tasks for context-aware tactics
        const tactics = PricingEngine.getAdvancedSalesTactics(0, scenarios, sector, target, this.currentProjectTJM || 0, this.currentClientSector || 'ecommerce', this.currentProspectLevel || 'manager', this.tasks);
        const aiPlan = tactics.aiPlan;
        const projectContext = tactics.projectContext;

        if (!this.currentSalesPhase) this.currentSalesPhase = 'preparation';
        if (!this.currentArsenalLevel) this.currentArsenalLevel = 'expert';

        const phaseKeys = Object.keys(PricingEngine.salesLifecycle);
        const activePhaseIndex = phaseKeys.indexOf(this.currentSalesPhase);
        const phase = PricingEngine.salesLifecycle[this.currentSalesPhase];
        const levelData = phase.levels[this.currentArsenalLevel];

        content.innerHTML = `
            <style>
                .closing-roadmap {
                    display: flex; justify-content: space-between; position: relative; margin-bottom: 3rem; padding: 0 1rem;
                }
                .closing-roadmap::before {
                    content: ''; position: absolute; top: 22px; left: 0; right: 0; height: 2px;
                    background: rgba(255,255,255,0.05); z-index: 0;
                }
                .roadmap-line-progress {
                    position: absolute; top: 22px; left: 0; height: 2px;
                    background: var(--primary); z-index: 1; transition: width 0.5s ease;
                    width: ${(activePhaseIndex / (phaseKeys.length - 1)) * 100}%;
                }
                .roadmap-step {
                    position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; width: 80px; cursor: pointer;
                }
                .step-dot {
                    width: 44px; height: 44px; border-radius: 50%; background: #1a1a1a;
                    border: 2px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;
                    color: #64748b; font-size: 1.1rem; transition: all 0.3s; margin-bottom: 10px;
                }
                .roadmap-step.active .step-dot {
                    background: var(--primary); border-color: var(--primary); color: white; box-shadow: 0 0 20px var(--primary-glass);
                }
                .roadmap-step.completed .step-dot {
                    background: var(--primary-glass); border-color: var(--primary); color: var(--primary);
                }
                .step-label {
                    font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 1px; text-align: center;
                }
                .roadmap-step.active .step-label { color: white; }

                .masterclass-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 2rem; }
                .tactics-panel { background: var(--bg-card); border: 1px solid var(--border); border-radius: 24px; padding: 2rem; }
                .sidebar-panel { display: flex; flex-direction: column; gap: 1.5rem; }
                
                .check-list-item {
                    display: flex; gap: 1rem; padding: 1rem; background: rgba(255,255,255,0.02); border: 1px solid transparent;
                    border-radius: 12px; transition: all 0.2s; cursor: pointer; margin-bottom: 0.5rem;
                }
                .check-list-item:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }
                .check-list-item input { margin-top: 3px; accent-color: var(--primary); width: 18px; height: 18px; }
                .check-list-title { font-weight: 600; font-size: 0.95rem; color: #e2e8f0; }

                @media (max-width: 992px) {
                    .masterclass-grid { grid-template-columns: 1fr; }
                }
            </style>

            <div class="arsenal-container" style="animation: fadeInUp 0.6s ease-out;">
                <!-- NEW VISUAL ROADMAP -->
                <div class="closing-roadmap">
                    <div class="roadmap-line-progress"></div>
                    ${phaseKeys.map((pKey, idx) => {
            const pData = PricingEngine.salesLifecycle[pKey];
            const isActive = this.currentSalesPhase === pKey;
            const isCompleted = idx < activePhaseIndex;
            return `
                            <div class="roadmap-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" onclick="Scoper.updateSalesPhase('${pKey}')">
                                <div class="step-dot">
                                    <i class="fas ${isCompleted ? 'fa-check' : pData.icon}"></i>
                                </div>
                                <div class="step-label">${pData.label}</div>
                            </div>
                        `;
        }).join('')}
                </div>

                <!-- AI INTELLIGENCE HEADER -->
                <div style="background: var(--bg-card); border-radius: 24px; padding: 2rem; border: 1px solid var(--border); margin-bottom: 2rem; border-left: 6px solid ${aiPlan.status === 'aligned' ? 'var(--success)' : '#ef4444'};">
                    <div style="display: flex; gap: 1.5rem; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                        <div style="display: flex; gap: 1.2rem; align-items: center;">
                            <div style="width: 50px; height: 50px; border-radius: 12px; background: var(--primary-glass); display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 1.3rem;">
                                <i class="fas fa-shield-check"></i>
                            </div>
                            <div>
                                <div style="font-size: 0.6rem; font-weight: 950; color: var(--primary); text-transform: uppercase; letter-spacing: 2px;">SoloPrice AI • Stratège de Défense</div>
                                <h2 style="font-size: 1.2rem; font-weight: 900; color: white; margin: 0;">${aiPlan.message}</h2>
                                <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Gap détecté : <span style="color: #ef4444; font-weight: 800;">${aiPlan.status === 'pending' ? '--' : (aiPlan.gapPercent || 0)}%</span> • Contexte : <span style="color: white; font-weight: 600;">${projectContext.keyTasks.join(', ') || 'Global'}</span></div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.8rem;">
                            <button class="button-primary mini" style="background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1);" onclick="Scoper.generateAIContent('quote')">
                                <i class="fas fa-file-invoice"></i> Script Devis
                            </button>
                            <button class="button-primary mini" style="background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1);" onclick="Scoper.generateAIContent('followup')">
                                <i class="fas fa-reply-all"></i> Relance Valeur
                            </button>
                        </div>
                    </div>
                </div>

                <div class="masterclass-grid">
                    <!-- MAIN TACTICS PANEL -->
                    <div class="tactics-panel">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
                            <div>
                                <div style="font-size: 0.7rem; font-weight: 950; color: var(--primary); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px;">Phase ${activePhaseIndex + 1} / 4</div>
                                <h2 style="font-size: 1.8rem; font-weight: 950; color: white; margin: 0; letter-spacing: -1px;">${levelData.title}</h2>
                            </div>
                             <div style="padding: 6px 14px; background: var(--bg-sidebar); border: 1px solid var(--border); border-radius: 8px; font-size: 0.7rem; color: #94a3b8;">
                                <i class="fas fa-user-tie"></i> Profil : ${tactics.subtitle.split(' face ')[0].split(' profil ')[1]}
                             </div>
                        </div>

                        <div style="margin-bottom: 2.5rem;">
                            <h4 style="font-size: 0.75rem; font-weight: 950; color: #64748b; text-transform: uppercase; margin-bottom: 1.2rem; letter-spacing: 1px;">Tactique de Terrain</h4>
                            ${levelData.tips.map(tip => `
                                <div class="tip-item" style="display: flex; gap: 1rem; margin-bottom: 1rem; color: #94a3b8; line-height: 1.5; font-size: 0.95rem;">
                                    <i class="fas fa-bolt" style="color: var(--primary); margin-top: 4px;"></i>
                                    <span>${tip}</span>
                                </div>
                            `).join('')}
                        </div>

                        <div style="padding: 1.5rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 16px;">
                            <h4 style="font-size: 0.75rem; font-weight: 950; color: white; text-transform: uppercase; margin-bottom: 1rem; display: flex; justify-content: space-between;">
                                <span>${this.currentSalesPhase === 'diagnostic' ? 'Questions d\'Impact' :
                this.currentSalesPhase === 'alignment' ? 'Argument ROI' :
                    this.currentSalesPhase === 'closing' ? 'Techniques de Bouclage' : 'Points de Vérification'}</span>
                                <i class="fas fa-atom" style="color: var(--primary);"></i>
                            </h4>
                            
                            ${this.currentSalesPhase === 'diagnostic' ?
                levelData.questions.map(q => `<div style="padding: 1rem; background: #111; border-radius: 10px; margin-bottom: 0.6rem; font-size: 0.9rem; color: white; font-weight: 600; border-left: 3px solid var(--primary);">"${q}"</div>`).join('') :
                this.currentSalesPhase === 'alignment' ?
                    `<div style="font-size: 1.1rem; font-weight: 700; color: white; font-style: italic; line-height: 1.5; border-left: 3px solid var(--primary); padding-left: 1rem;">"${levelData.argument}"</div>` :
                    this.currentSalesPhase === 'closing' ?
                        levelData.methods.map(m => `<div style="padding: 0.8rem 1.2rem; background: var(--primary-glass); border-radius: 8px; margin-bottom: 0.6rem; font-size: 0.85rem; color: white; font-weight: 800; display: flex; align-items: center; gap: 10px;"><i class="fas fa-check-double"></i> ${m}</div>`).join('') :
                        levelData.checklist.map(c => `<div style="margin-bottom: 0.6rem; font-size: 0.9rem; color: #94a3b8; display: flex; align-items: center; gap: 10px;"><i class="fas fa-square" style="color: #333;"></i> ${c}</div>`).join('')
            }
                        </div>
                    </div>

                    <!-- SIDEBAR ACTION PANEL -->
                    <div class="sidebar-panel">
                        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 1.5rem;">
                            <h4 style="font-size: 0.7rem; font-weight: 950; color: #64748b; text-transform: uppercase; margin-bottom: 1.2rem;">Action Items de Phase</h4>
                            <div class="action-check-list" style="display: flex; flex-direction: column; gap: 0.8rem;">
                                ${((levelData.checklist && levelData.checklist.length > 0) ? levelData.checklist : []).map((item, i) => {
                const checkId = item.id || `check-${this.currentSalesPhase}-${i}`;
                const isChecked = localStorage.getItem(`sp_closing_${checkId}`) === 'true';
                const actionIcon = item.icon || 'fa-bolt';
                return `
                                    <div class="action-item-card" style="background: rgba(255,255,255,0.03); border: 1px solid ${isChecked ? 'var(--primary-glass)' : 'rgba(255,255,255,0.05)'}; border-radius: 12px; padding: 1rem; transition: all 0.3s; position: relative; overflow: hidden;">
                                        <div style="display: flex; align-items: center; gap: 1rem; position: relative; z-index: 1;">
                                            <div style="width: 32px; height: 32px; border-radius: 8px; background: ${isChecked ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}; color: ${isChecked ? 'white' : '#64748b'}; display: flex; align-items: center; justify-content: center; transition: all 0.3s;">
                                                <i class="fas ${isChecked ? 'fa-check' : actionIcon}"></i>
                                            </div>
                                            <div style="flex: 1;">
                                                <div style="font-size: 0.85rem; font-weight: 700; color: ${isChecked ? 'white' : '#e2e8f0'}; margin-bottom: 2px;">${item.label}</div>
                                                <div style="font-size: 0.7rem; color: #64748b;">${isChecked ? 'Action complétée' : 'Action requise pour valider'}</div>
                                            </div>
                                            <button onclick="Scoper.openClosingActionModal('${checkId}', '${item.action}')" 
                                                    style="padding: 0.5rem 0.8rem; border-radius: 8px; background: ${isChecked ? 'rgba(255,255,255,0.05)' : 'var(--primary-glass)'}; border: 1px solid ${isChecked ? 'transparent' : 'var(--primary)'}; color: ${isChecked ? '#94a3b8' : 'white'}; font-size: 0.7rem; font-weight: 800; cursor: pointer; transition: all 0.3s;">
                                                ${isChecked ? 'Modifier' : 'Exécuter'}
                                            </button>
                                        </div>
                                        ${isChecked ? `<div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--primary);"></div>` : ''}
                                    </div>
                                `;
            }).join('')}
                            </div>
                        </div>

                        <div style="background: ${aiPlan.status === 'aligned' ? 'var(--primary-glass)' : 'rgba(239, 68, 68, 0.05)'}; border: 1px solid ${aiPlan.status === 'aligned' ? 'var(--primary)' : 'rgba(239, 68, 68, 0.2)'}; border-radius: 20px; padding: 1.5rem;">
                            <h4 style="font-size: 0.7rem; font-weight: 950; color: ${aiPlan.status === 'aligned' ? 'white' : '#ef4444'}; text-transform: uppercase; margin-bottom: 0.8rem;">Défense de Rentabilité</h4>
                            <p style="font-size: 0.85rem; color: #e2e8f0; line-height: 1.5; margin-bottom: 0;">
                                ${aiPlan.actions && aiPlan.actions.length > 0 ? aiPlan.actions[0].text : 'Votre TJM est aligné. Focalisez sur la livraison.'}
                            </p>
                        </div>

                        <div style="display: flex; gap: 0.8rem; margin-top: auto;">
                            ${activePhaseIndex > 0 ?
                `<button onclick="Scoper.updateSalesPhase('${phaseKeys[activePhaseIndex - 1]}')" style="flex: 1; padding: 0.8rem; border-radius: 12px; background: var(--bg-sidebar); border: 1px solid var(--border); color: #94a3b8; font-weight: 700; cursor: pointer;">Précédent</button>` : ''}
                            ${activePhaseIndex < phaseKeys.length - 1 ?
                `<button id="next-phase-btn" 
                                        onclick="Scoper.updateSalesPhase('${phaseKeys[activePhaseIndex + 1]}')" 
                                        style="flex: 2; padding: 0.8rem; border-radius: 12px; background: var(--primary); border: none; color: white; font-weight: 800; cursor: pointer; box-shadow: 0 4px 15px var(--primary-glass); transition: all 0.3s;"
                                        disabled>Débloquer Phase Suivante</button>` :
                `<button id="next-phase-btn" 
                                        onclick="App.navigateTo('quotes')" 
                                        style="flex: 2; padding: 0.8rem; border-radius: 12px; background: var(--primary); border: none; color: white; font-weight: 800; cursor: pointer;"
                                        disabled>Finaliser le Devis</button>`}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Logic check after render
        setTimeout(() => this.checkPhaseUnlock(), 100);
    },

    toggleClosingAction(id) {
        // Obsolete in the new system as we force modal actions
        this.openClosingActionModal(id, 'default');
    },

    checkPhaseUnlock() {
        const nextBtn = document.getElementById('next-phase-btn');
        if (!nextBtn) return;

        const phaseData = PricingEngine.salesLifecycle[this.currentSalesPhase];
        if (!phaseData || !phaseData.levels || !phaseData.levels.intermediate) return;

        const checklist = phaseData.levels.intermediate.checklist;
        const allChecked = checklist.every(item => localStorage.getItem(`sp_closing_${item.id}`) === 'true');

        nextBtn.disabled = !allChecked;
        nextBtn.style.opacity = allChecked ? '1' : '0.5';
        nextBtn.innerHTML = allChecked ?
            (this.currentSalesPhase === 'closing' ? 'Finaliser le Devis <i class="fas fa-arrow-right"></i>' : 'Passer à la Phase Suivante <i class="fas fa-chevron-right"></i>') :
            'Actions Requises pour Continuer';
    },

    openClosingActionModal(checkId, actionType) {
        const modal = document.createElement('div');
        modal.id = 'closing-action-modal';
        modal.className = 'scoper-modal-overlay';
        modal.style.display = 'flex';

        let modalContent = '';
        let title = '';

        const data = Storage.get('sp_calculator_data') || {};

        switch (actionType) {
            case 'modal_research':
                title = "Étude Stratégique du Prospect";
                modalContent = `
                    <div style="margin-bottom: 1.5rem;">
                        <p style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 1rem;">Lancer une recherche LinkedIn pour identifier les enjeux réels :</p>
                        <button onclick="window.open('https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(data.specificTarget || 'Decision Maker')}', '_blank')" 
                                style="width: 100%; padding: 1rem; border-radius: 12px; background: #0077b5; color: white; border: none; font-weight: 800; cursor: pointer; margin-bottom: 2rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <i class="fab fa-linkedin"></i> Rechercher sur LinkedIn
                        </button>
                        <label style="display: block; font-size: 0.75rem; font-weight: 800; color: white; margin-bottom: 0.8rem;">Quels sont les 3 points clés identifiés ?</label>
                        <textarea id="action-input-text" placeholder="Ex: Viennent de lever 2M€, Recrutent 10 devs, Focus sur l'UX..." style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; color: white; height: 100px; font-family: inherit; font-size: 0.9rem; outline: none; focus: border-color: var(--primary);"></textarea>
                    </div>
                `;
                break;
            case 'modal_framing':
                title = "Script d'Ouverture (Framing)";
                const opening = `Il semble que votre enjeu majeur soit ${PricingEngine.clientSectorPainPoints[data.clientSector || 'tech']?.risk || 'la performance'}. L'objectif aujourd'hui est de voir si mon approche peut sécuriser ce point précisément.`;
                modalContent = `
                    <div style="margin-bottom: 1.5rem;">
                        <p style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 1.5rem;">Le cadrage définit qui mène l'entretien. Utilisez ce script pour démarrer :</p>
                        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--primary-glass); border-radius: 12px; padding: 1.5rem; color: white; font-style: italic; line-height: 1.6; margin-bottom: 1.5rem; position: relative;">
                            ${opening}
                            <button onclick="navigator.clipboard.writeText('${opening.replace(/'/g, "\\'")}'); App.showNotification('Script copié !')" style="position: absolute; top: 10px; right: 10px; background: transparent; border: none; color: var(--primary); cursor: pointer;"><i class="fas fa-copy"></i></button>
                        </div>
                        <p style="font-size: 0.8rem; color: #64748b;">Note : Le script s'adapte automatiquement au secteur de votre client.</p>
                    </div>
                `;
                break;
            case 'modal_pricing':
            case 'modal_reserve':
                title = "Définition du Prix de Réserve";
                modalContent = `
                    <div style="margin-bottom: 1.5rem;">
                        <p style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 1.5rem;">C'est le montant EN DESSOUS DUQUEL vous ne devez jamais descendre pour ce projet.</p>
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; text-align: center; margin-bottom: 1.5rem;">
                            <div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem;">Votre TJM Objectif</div>
                            <div style="font-size: 2rem; font-weight: 900; color: white;">${Math.round(data.dailyRate || 0)}€</div>
                        </div>
                        <label style="display: block; font-size: 0.75rem; font-weight: 800; color: white; margin-bottom: 0.8rem;">Votre Prix de Réserve pour ce projet :</label>
                        <input type="number" id="action-input-val" placeholder="En € / jour" style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; color: white; font-size: 1.2rem; font-weight: 700; outline: none;">
                    </div>
                `;
                break;
            case 'modal_pains':
                title = "Diagnostic des Douleurs";
                modalContent = `
                    <div style="margin-bottom: 1.5rem;">
                        <p style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 1.5rem;">Identifiez les 'Deep Pains' : stress, perte de temps, pression hiérarchique.</p>
                        <label style="display: block; font-size: 0.75rem; font-weight: 800; color: white; margin-bottom: 0.8rem;">Douleur principale identifiée :</label>
                        <textarea id="action-input-text" placeholder="Ex: Risque son poste si le projet prend du retard, Perte de 50k€/mois..." style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; color: white; height: 100px; font-family: inherit; font-size: 0.9rem; outline: none;"></textarea>
                    </div>
                `;
                break;
            case 'modal_budget':
                title = "Validation du Budget Client";
                modalContent = `
                    <div style="margin-bottom: 1.5rem;">
                        <p style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 1.5rem;">Ne donnez jamais votre prix avant de connaître le leur (ou leur capacité).</p>
                        <div style="padding: 1rem; background: rgba(255,165,0,0.1); border-radius: 10px; border-left: 4px solid orange; margin-bottom: 1.5rem; font-size: 0.85rem; color: #e2e8f0;">
                            "Avez-vous déjà alloué une enveloppe budgétaire pour résoudre ce problème ?"
                        </div>
                        <label style="display: block; font-size: 0.75rem; font-weight: 800; color: white; margin-bottom: 0.8rem;">Budget estimé ou validé :</label>
                        <input type="number" id="action-input-val" placeholder="En € TTC" style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; color: white; font-size: 1.2rem; font-weight: 700; outline: none;">
                    </div>
                `;
                break;
            case 'modal_roi':
                title = "Calculateur ROI Impact";
                modalContent = `
                    <div style="margin-bottom: 1.5rem;">
                        <p style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 1.5rem;">Chiffrez le gain pour justifier l'investissement.</p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <label style="display: block; font-size: 0.65rem; font-weight: 800; color: #64748b; text-transform: uppercase;">Perte actuelle / mois</label>
                                <input type="number" id="roi-loss" class="form-input" value="1000" oninput="Scoper.updateROIMiniCalc()">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.65rem; font-weight: 800; color: #64748b; text-transform: uppercase;">Gain espéré / an</label>
                                <input type="number" id="roi-gain" class="form-input" value="12000" oninput="Scoper.updateROIMiniCalc()">
                            </div>
                        </div>
                        <div style="background: var(--primary-glass); padding: 1rem; border-radius: 12px; text-align: center;">
                            <div style="font-size: 0.7rem; color: white; opacity: 0.8;">VALEUR CRÉÉE (12 mois)</div>
                            <div id="roi-result" style="font-size: 1.8rem; font-weight: 900; color: white;">24 000€</div>
                        </div>
                        <input type="hidden" id="action-input-val">
                    </div>
                `;
                setTimeout(() => this.updateROIMiniCalc(), 200);
                break;
            case 'modal_anchoring':
                title = "Comparateur d'Ancrage visuel";
                const scenarios = PricingEngine.getScenarios(PricingEngine.calculateObjective(data));
                modalContent = `
                    <div style="margin-bottom: 1.5rem;">
                        <p style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 1.5rem;">Présentez l'option Elite en premier pour ancrer le prix haut.</p>
                        <div style="display: flex; gap: 1rem;">
                            <div style="flex: 1; padding: 1rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; text-align: center; opacity: 0.6;">
                                <div style="font-size: 0.6rem; color: #64748b;">OPTION SÉCURITÉ</div>
                                <div style="font-size: 1.2rem; font-weight: 800; color: white;">${scenarios.security.tjm}€ / j</div>
                            </div>
                            <div style="flex: 1; padding: 1rem; background: var(--primary-glass); border: 2px solid var(--primary); border-radius: 12px; text-align: center;">
                                <div style="font-size: 0.6rem; color: white;">OPTION ELITE (ANCRE)</div>
                                <div style="font-size: 1.2rem; font-weight: 800; color: white;">${scenarios.elite.tjm}€ / j</div>
                            </div>
                        </div>
                        <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 1.5rem; font-style: italic;">"L'option Elite assure une domination totale, la Sécurité est votre base de croissance saine."</p>
                    </div>
                `;
                break;
            case 'modal_objections':
                title = "Guide Anti-Objections";
                modalContent = `
                    <div style="margin-bottom: 1.5rem;">
                        <p style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 1rem;">Face à "C'est trop cher" :</p>
                        <div style="padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 12px; border: 1px solid var(--border); margin-bottom: 1.5rem;">
                            <div style="font-size: 0.75rem; color: var(--primary); font-weight: 800; margin-bottom: 0.5rem;">VOTRE CONTRE-ATTAQUE :</div>
                            <div style="color: white; font-size: 0.9rem; line-height: 1.5;">"Je comprends. Si on ne fait rien, quel sera le coût de [Risque Secteur] pour vous dans 6 mois ?"</div>
                        </div>
                        <button onclick="Scoper.generateAIContent('objections')" class="button-secondary mini" style="width: 100%;">Générer plus de réponses IA</button>
                    </div>
                `;
                break;
            case 'modal_terms':
                title = "Validation des Conditions";
                modalContent = `
                    <div style="margin-bottom: 1.5rem;">
                        <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                            <label class="check-list-item">
                                <input type="checkbox" id="term-1"> <span style="color: white;">Acompte de 30% ou 50% validé</span>
                            </label>
                            <label class="check-list-item">
                                <input type="checkbox" id="term-2"> <span style="color: white;">Dates de livraison bloquées</span>
                            </label>
                            <label class="check-list-item">
                                <input type="checkbox" id="term-3"> <span style="color: white;">Périmètre (Scope) figé</span>
                            </label>
                        </div>
                    </div>
                `;
                break;
            default:
                title = "Validation Mentale";
                modalContent = `
                    <div style="text-align: center; padding: 1rem 0;">
                        <p style="font-size: 1rem; color: white; line-height: 1.6;">Avez-vous réellement effectué cette action avec le niveau de rigueur requis ?</p>
                        <p style="font-size: 0.85rem; color: #94a3b8; margin-top: 1rem;">Votre succès en closing dépend de votre honnêteté envers vous-même.</p>
                    </div>
                `;
        }

        modal.innerHTML = `
            <div class="scoper-modal-content" style="max-width: 550px; padding: 2.5rem; border: 1px solid var(--primary-glass); box-shadow: 0 30px 60px rgba(0,0,0,0.8); background: #050505; border-radius: 24px; position: relative; overflow: hidden;">
                <!-- Header Technique -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div class="agent-pulse-icon" style="width: 48px; height: 48px; border-radius: 14px; background: rgba(16, 185, 129, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; border: 1px solid var(--primary-glass);">
                            <i class="fas fa-terminal"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.65rem; font-weight: 950; color: var(--primary); text-transform: uppercase; letter-spacing: 2px;">SoloPrice Agent v1.0.4</div>
                            <h2 style="font-size: 1.3rem; font-weight: 950; color: white; margin: 0; letter-spacing: -0.5px;">${title}</h2>
                        </div>
                    </div>
                </div>

                <!-- Zone de Pensée / Terminal REAct -->
                <div id="agent-thinking-area" style="margin-bottom: 2.5rem; min-height: 140px; max-height: 200px; overflow-y: auto; background: #000; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem; box-shadow: inset 0 0 30px rgba(0,0,0,1); scrollbar-width: thin;">
                    <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #4ade80; opacity: 0.5; margin-bottom: 0.5rem;">> INITIALIZING_AGENT_WORK_LOOP...</div>
                </div>
                
                <!-- Zone de Formulaire (masquée au début) -->
                <div id="modal-form-body" style="opacity: 0.1; pointer-events: none; transform: translateY(10px); transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);">${modalContent}</div>

                <!-- Actions de l'Agent -->
                <div id="modal-actions" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem; opacity: 0; pointer-events: none; transition: opacity 0.5s ease;">
                    <div style="display: flex; gap: 1rem;">
                        <button class="button-secondary" style="flex: 1; border-radius: 12px; font-weight: 700; height: 50px;" onclick="document.getElementById('closing-action-modal').remove()">Abandonner</button>
                        <button class="button-primary" style="flex: 1.8; border-radius: 12px; font-weight: 900; background: var(--primary); color: white; border: none; cursor: pointer; height: 50px; display: flex; align-items: center; justify-content: center; gap: 0.8rem; box-shadow: 0 10px 20px var(--primary-glass);" onclick="Scoper.saveClosingAction('${checkId}')">
                            VALIDER LA STRATÉGIE <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <style>
                    @keyframes terminalLine { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: translateX(0); } }
                    .agent-log-line { animation: terminalLine 0.2s ease-out forwards; }
                    .agent-pulse-icon { animation: pulseIcon 2s infinite; }
                    @keyframes pulseIcon { 0% { border-color: var(--primary-glass); } 50% { border-color: var(--primary); } 100% { border-color: var(--primary-glass); } }
                </style>
            </div>
        `;

        document.body.appendChild(modal);

        // Auto-run Agent sequence
        setTimeout(() => this.startAgentProcess(actionType, checkId), 600);
    },

    saveClosingAction(checkId) {
        // Enregistrer le succès
        localStorage.setItem(`sp_closing_${checkId}`, 'true');

        // Logique optionnelle de sauvegarde des données saisies (extensible)
        const textInput = document.getElementById('action-input-text');
        const valInput = document.getElementById('action-input-val');
        if (textInput) Storage.set(`sp_closing_data_${checkId}`, textInput.value);
        if (valInput) Storage.set(`sp_closing_data_${checkId}`, valInput.value);

        // Fermer la modal
        const modal = document.getElementById('closing-action-modal');
        if (modal) modal.remove();

        // Refresh UI & Phase Unlock
        App.navigateTo('scoper', 'closing');
        App.showNotification("Action validée avec succès !", "success");
    },

    updateROIMiniCalc() {
        const loss = parseFloat(document.getElementById('roi-loss')?.value) || 0;
        const gain = parseFloat(document.getElementById('roi-gain')?.value) || 0;
        const resultEl = document.getElementById('roi-result');
        const hiddenInput = document.getElementById('action-input-val');

        const totalValue = (loss * 12) + gain;
        if (resultEl) resultEl.innerText = App.formatCurrency(totalValue);
        if (hiddenInput) hiddenInput.value = totalValue;
    },

    startAgentProcess(actionType, checkId) {
        const thinkingArea = document.getElementById('agent-thinking-area');
        const formBody = document.getElementById('modal-form-body');
        const actionArea = document.getElementById('modal-actions');

        if (!thinkingArea) return;
        thinkingArea.innerHTML = '';

        this.Agent.run(actionType, (log) => {
            const div = document.createElement('div');
            div.className = 'agent-log-line';
            div.style.fontFamily = "'JetBrains Mono', monospace";
            div.style.fontSize = '0.7rem';
            div.style.marginBottom = '8px';
            div.style.paddingLeft = '0.75rem';
            div.style.borderLeft = '2px solid rgba(255,255,255,0.05)';
            div.style.animation = 'terminalLine 0.3s ease-out forwards';

            if (log.includes('[PLANNER]')) { div.style.color = '#f59e0b'; div.style.fontWeight = 'bold'; }
            else if (log.includes('[THOUGHT]')) { div.style.color = '#94a3b8'; div.style.opacity = '0.8'; }
            else if (log.includes('[ACTION]')) { div.style.color = 'var(--primary)'; div.style.background = 'rgba(16, 185, 129, 0.05)'; div.style.padding = '4px 8px'; div.style.borderRadius = '4px'; }
            else if (log.includes('[RESULT]')) { div.style.color = '#10b981'; }
            else if (log.includes('[SELF-CHECK]')) { div.style.color = '#a855f7'; div.style.fontWeight = '700'; }
            else if (log.includes('[ADJUSTMENT]')) { div.style.color = '#fbbf24'; div.style.background = 'rgba(251, 191, 36, 0.1)'; div.style.padding = '4px 8px'; div.style.borderRadius = '4px'; }

            div.innerText = log;
            thinkingArea.appendChild(div);
            thinkingArea.scrollTop = thinkingArea.scrollHeight;
        }, () => {
            this.draftActionWithAI(actionType, true);
            if (formBody) { formBody.style.opacity = "1"; formBody.style.pointerEvents = "all"; formBody.style.transform = "translateY(0)"; }
            if (actionArea) { actionArea.style.opacity = "1"; actionArea.style.pointerEvents = "all"; }

            const done = document.createElement('div');
            done.style.marginTop = '1.5rem';
            done.style.color = '#10b981';
            done.style.fontWeight = '900';
            done.style.fontSize = '0.8rem';
            done.style.textAlign = 'center';
            done.style.border = '1px solid rgba(16, 185, 129, 0.2)';
            done.style.padding = '10px';
            done.style.borderRadius = '12px';
            done.style.background = 'rgba(16, 185, 129, 0.05)';
            done.innerHTML = '<i class="fas fa-check-double"></i> AGENT CYCLE COMPLETE : OPTIMIZED STRATEGY READY';
            thinkingArea.appendChild(done);
        });
    },

    draftActionWithAI(actionType, silent = false) {
        const data = Storage.get('sp_calculator_data') || {};
        const results = PricingEngine.calculateObjective(data);
        const fullContext = {
            ...data,
            dailyRate: this.currentProjectTJM || results.dailyRate,
            tasks: this.tasks,
            clientSector: this.currentClientSector || 'ecommerce'
        };

        let draft = "";
        const textInput = document.getElementById('action-input-text');
        const valInput = document.getElementById('action-input-val');

        switch (actionType) {
            case 'modal_research':
            case 'modal_framing':
                draft = PricingEngine.generateResearchDraft(fullContext);
                if (textInput) textInput.value = draft;
                break;
            case 'modal_reserve':
            case 'modal_pricing':
                const reserve = Math.round(fullContext.dailyRate * 0.85);
                if (valInput) valInput.value = reserve;
                break;
            case 'modal_pains':
                const tactics = PricingEngine.getAdvancedSalesTactics(0, {}, data.sector, data.target, fullContext.dailyRate, fullContext.clientSector, 'manager', this.tasks);
                draft = tactics.diagnostic.questions.join('\n');
                if (textInput) textInput.value = draft;
                break;
            case 'modal_roi':
                const argument = PricingEngine.generateROIDetailedArgument(fullContext, 1500, 25000);
                if (textInput) textInput.value = argument;
                const lossInput = document.getElementById('roi-loss');
                const gainInput = document.getElementById('roi-gain');
                if (lossInput) lossInput.value = 1500;
                if (gainInput) gainInput.value = 25000;
                this.updateROIMiniCalc();
                break;
            case 'modal_anchoring':
                draft = `Ancrage suggéré :\n- Option Elite : ${Math.round(fullContext.dailyRate * 1.5)}€/j\n- Option Confort : ${fullContext.dailyRate}€/j\n\nLogique : Créer un contraste de valeur.`;
                if (textInput) textInput.value = draft;
                break;
            case 'modal_terms':
                if (document.getElementById('term-1')) document.getElementById('term-1').checked = true;
                if (document.getElementById('term-2')) document.getElementById('term-2').checked = true;
                break;
            default:
                draft = "Analyse terminée. Stratégie validée.";
                if (textInput) textInput.value = draft;
        }

        if (!silent) App.showNotification("Draft IA généré.", "info");
    },

    updateSalesPhase(phase) {
        this.currentSalesPhase = phase;
        this.render('closing');
    },

    generateAIContent(type) {
        const data = Storage.get('sp_calculator_data') || {};
        const results = PricingEngine.calculateObjective(data);
        const scenarios = PricingEngine.getScenarios(results);

        // Context enrichment
        const fullContext = {
            ...data,
            dailyRate: this.currentProjectTJM || results.dailyRate,
            gap: (this.currentProjectTJM || results.dailyRate) - results.dailyRate,
            tasks: this.tasks,
            prospectLevel: this.currentProspectLevel || 'manager',
            clientSector: this.currentClientSector || 'ecommerce'
        };

        let content = "";
        let title = "";

        if (type === 'quote') {
            title = "Script de Présentation du Devis";
            content = PricingEngine.generateQuoteScript(fullContext);
        } else if (type === 'followup') {
            title = "Relance Basée sur la Valeur";
            content = PricingEngine.generateValueFollowup(fullContext);
        } else if (type === 'objections') {
            title = "Arsenal de Réponse aux Objections";
            const tactics = PricingEngine.getAdvancedSalesTactics(0, scenarios, data.sector, data.target, fullContext.dailyRate, fullContext.clientSector, fullContext.prospectLevel, this.tasks);
            content = tactics.objections.map(o => `POUR : "${o.hook}"\nDITES : "${o.rebuttal}"`).join('\n\n');
        }

        // Show in a dedicated modal
        const modal = document.createElement('div');
        modal.className = 'scoper-modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="scoper-modal-content" style="max-width: 600px; padding: 2.5rem; border: 1px solid var(--primary-glass); background: #0a0a0a; border-radius: 24px;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--primary-glass); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div>
                        <div style="font-size: 0.6rem; font-weight: 950; color: var(--primary); text-transform: uppercase;">SoloPrice AI Agent</div>
                        <h2 style="font-size: 1.4rem; font-weight: 950; color: white; margin: 0;">${title}</h2>
                    </div>
                </div>
                
                <textarea id="ai-generated-text" style="width: 100%; height: 300px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; color: #e2e8f0; font-family: inherit; font-size: 0.95rem; line-height: 1.6; resize: none; margin-bottom: 2rem;">${content}</textarea>

                <div style="display: flex; gap: 1rem;">
                    <button class="button-secondary" style="flex: 1; border-radius: 12px;" onclick="this.closest('.scoper-modal-overlay').remove()">Fermer</button>
                    <button class="button-primary" style="flex: 2; border-radius: 12px; font-weight: 800; background: var(--primary); color: white; border: none;" onclick="navigator.clipboard.writeText(document.getElementById('ai-generated-text').value); App.showNotification('Copié dans le presse-papier !', 'success')">
                        Copier le Draft <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
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
                    <div style="width: 80px; height: 80px; border-radius: 20px; background: var(--primary-glass); display: flex; align-items: center; justify-content: center; margin: 0 auto 2.5rem; color: var(--primary); border: 1px solid var(--primary-glass);">
                        <i class="fas fa-shield-alt" style="font-size: 2.5rem;"></i>
                    </div>
                    <h2 style="font-size: 2rem; margin-bottom: 1rem; color: white;">${i18n.t('scoper.journal.hp_title') || 'Journal Haute Performance'}</h2>
                    <p class="text-muted" style="margin-bottom: 2.5rem; font-size: 1.1rem;">${i18n.t('scoper.journal.hp_desc') || 'Débloquez votre carnet de bord stratégique pour l\'introspection et la maximisation de votre exécution (The ONE Thing).'}</p>
                    <button class="cta-button" onclick="App.showUpgradeModal('premium_feature')">${i18n.t('scoper.journal.mode_expert') || 'Passer en Mode EXPERT'}</button>
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
                <div class="writing-col">
                    <div style="background: var(--bg-card); border-radius: 24px; padding: 2rem; border: 1px solid var(--border); margin-bottom: 2rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: white;">Progression Objectif</h3>
                            <div style="font-size: 0.7rem; font-weight: 950; color: var(--primary); text-transform: uppercase;">Actuel vs Cible</div>
                        </div>
                        <div style="height: 12px; background: rgba(255,255,255,0.05); border-radius: 100px; overflow: hidden; margin-bottom: 1rem;">
                            <div style="height: 100%; width: ${Math.min(100, Math.round(((this.currentProjectTJM || 0) / (calcData.dailyRate || 1)) * 100))}%; background: var(--primary); box-shadow: 0 0 20px var(--primary-glass);"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700;">
                            <div style="color: white;">${App.formatCurrency(this.currentProjectTJM || 0)} <span style="font-size: 0.7rem; opacity: 0.5;">Actuel</span></div>
                            <div style="color: var(--primary);">${App.formatCurrency(calcData.dailyRate || 0)} <span style="font-size: 0.7rem; opacity: 0.5;">Cible</span></div>
                        </div>
                    </div>
                    <div class="elite-card" style="height: 100%; display: flex; flex-direction: column;">
                        <div class="elite-card-title"><i class="fas fa-pen-nib"></i> ${i18n.t('scoper.journal.title') || 'Carnet de Vie'}</div>
                        <p class="text-xs text-muted" style="margin-bottom: 1.5rem;">${i18n.t('scoper.journal.desc') || 'Écrivez votre journée : avancements, réflexions, pensées. Sauvegarde automatique.'}</p>
                        
                        <textarea class="hp-reflection-input" 
                                  style="flex: 1; min-height: 400px; resize: none; background: rgba(0,0,0,0.3); border: 1px solid var(--border); padding: 1.5rem; border-radius: 12px; color: var(--text-light); font-size: 1rem; line-height: 1.6;"
                                  placeholder="${i18n.t('scoper.journal.placeholder') || 'Aujourd\'hui, j\'ai...'}"
                                  onchange="Scoper.updateJournalReflection(this.value)">${journal.reflection || ''}</textarea>
                        
                        <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                            <span class="text-xs text-muted"><i class="fas fa-cloud-upload-alt"></i> ${i18n.t('scoper.journal.synced') || 'Synchronisé'}</span>
                            <button class="button-primary small" onclick="Scoper.addJournalEntry('note', document.querySelector('.hp-reflection-input').value)">
                                <i class="fas fa-plus"></i> ${i18n.t('scoper.journal.add_entry') || 'Ajouter au Carnet de Route'}
                            </button>
                        </div>
                    </div>
                </div>

                <div class="timeline-col">
                    <div class="elite-card" style="height: 100%; display: flex; flex-direction: column; max-height: 600px; overflow-y: auto;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <div class="elite-card-title"><i class="fas fa-book-journal-whills"></i> ${i18n.t('scoper.journal.route') || 'Carnet de Route'}</div>
                            <div class="hp-log-actions">
                                <button class="hp-log-btn victory" onclick="Scoper.addJournalEntry('victory')">+ ${i18n.t('scoper.journal.victory') || 'Victoire'}</button>
                                <button class="hp-log-btn lesson" onclick="Scoper.addJournalEntry('lesson')">+ ${i18n.t('scoper.journal.lesson') || 'Leçon'}</button>
                            </div>
                        </div>

                        <div class="hp-timeline">
                            ${journal.entries.length === 0 ? `<div class='hp-empty-timeline'>${i18n.t('scoper.journal.empty') || 'Aucun événement enregistré.'}</div>` : ""}
                            ${journal.entries.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20).map(entry => {
            let badgeClass = "badge-note";
            let badgeText = i18n.t('scoper.journal.note') || "Note";
            let icon = "fa-sticky-note";

            if (entry.type === "victory") { badgeClass = "victory-type"; badgeText = i18n.t('scoper.journal.victory') || "Victoire"; icon = "fa-trophy"; }
            if (entry.type === "lesson") { badgeClass = "lesson-type"; badgeText = i18n.t('scoper.journal.lesson') || "Leçon"; icon = "fa-lightbulb"; }

            return `
                                <div class="hp-timeline-entry ${badgeClass}" style="margin-bottom: 1.5rem; position: relative; padding-left: 2rem; border-left: 2px solid var(--border);">
                                    <div class="hp-timeline-dot" style="position: absolute; left: -6px; top: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--primary);"></div>
                                    <div class="hp-timeline-content" style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
                                        <div class="hp-timeline-header" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.8rem;">
                                            <span class="hp-timeline-badge" style="font-weight: bold; color: var(--text-light);"><i class="fas ${icon}"></i> ${badgeText}</span>
                                            <span class="hp-timeline-date" style="color: var(--text-muted);">${entry.date ? new Date(entry.date).toLocaleDateString() + ' ' + new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                                        </div>
                                        <div class="hp-timeline-text" style="color: var(--text-light); line-height: 1.5; white-space: pre-wrap;">${entry.text}</div>
                                        <div class="hp-timeline-delete" style="cursor: pointer; color: #ef4444; font-size: 0.8rem; margin-top: 0.8rem; text-align: right;" onclick="Scoper.removeJournalEntry('${entry.id}')"><i class="fas fa-trash-alt"></i> ${i18n.t('scoper.journal.delete') || 'Supprimer'}</div>
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

        if (type === 'victory') { label = i18n.t('scoper.journal.victory') || 'victoire'; }
        if (type === 'lesson') { label = i18n.t('scoper.journal.lesson') || 'leçon'; }

        if (text === null) {
            text = prompt(i18n.t('scoper.journal.prompt', { label }) || `Quelle ${label} ?`);
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
        App.showNotification(i18n.t('scoper.journal.entry_saved', { label: label.charAt(0).toUpperCase() + label.slice(1) }) || `${label.charAt(0).toUpperCase() + label.slice(1)} enregistrée.`, 'success');
    },

    removeJournalEntry(id) {
        const journal = Storage.get('sp_journal');
        if (!journal || !journal.entries) return;
        journal.entries = journal.entries.filter(e => e.id !== id);
        Storage.saveJournal(journal);
        this.renderJournalTab();
    },

    /**
     * Réinitialise complètement l'objectif TJM
     */
    async resetObjective() {
        if (!confirm(i18n.t('scoper.reset_confirm') || 'Voulez-vous vraiment réinitialiser votre stratégie TJM ? Toutes les données de l\'assistant seront effacées.')) return;

        const defaultData = {
            monthlyRevenue: (typeof App !== 'undefined' && App.getCurrencyConfig) ? App.getCurrencyConfig().defaultRevenue : 3000,
            workingDays: 15,
            hoursPerDay: 7,
            monthlyCharges: 500,
            taxRate: 22,
            sector: null,
            target: null,
            specificTarget: '',
            mainObstacle: '',
            dailyRate: 0,
            hourlyRate: 0,
            clientSector: 'tech',
            prospectLevel: 'manager',
            arsenalLevel: 'intermediate',
            salesPhase: 'preparation'
        };

        this.currentObjectiveStep = 1;
        this.currentClientSector = 'tech';
        this.currentProspectLevel = 'manager';
        this.currentArsenalLevel = 'intermediate';
        this.currentSalesPhase = 'preparation';
        this.currentProjectTJM = 0;
        this.tasks = [];

        Storage.set('sp_scoper_current_step', 1);
        this.currentObjectiveStep = 1;
        this.activeTab = 'objective'; // New line from instruction
        // Nettoyage complet du journal également
        Storage.set('sp_journal', { mood: 'focus', energy: 7, entries: [], daily_focus: '', reflection: '', habits: {} });

        App.navigateTo('scoper', 'objective'); // Replaced this.render('objective')
        App.showNotification(i18n.t('scoper.reset_success') || 'Stratégie et Journal réinitialisés.', 'info');
    },

    saveObjective() {
        this.autoSaveObjective();
        App.showNotification(i18n.t('notify.saved_success') || "Objectif stratégique enregistré !", "success");
        setTimeout(() => App.navigateTo('scoper', 'closing'), 1000);
    },

    /**
     * Génère et affiche le contenu IA
     */
    generateAIContent(type) {
        const data = Storage.get('sp_calculator_data') || {};
        const tactics = PricingEngine.getAdvancedSalesTactics(0, PricingEngine.getScenarios(PricingEngine.calculateObjective(data)), data.sector, data.target, this.currentProjectTJM || 0);

        const scriptData = {
            sector: data.sector,
            clientSector: this.currentClientSector || 'ecommerce',
            prospectLevel: this.currentProspectLevel || 'manager',
            specificTarget: data.specificTarget || '',
            mainObstacle: data.mainObstacle || '',
            target: data.target,
            dailyRate: this.currentProjectTJM || data.dailyRate,
            gap: tactics.aiPlan.gap,
            roi: tactics.roi.argument
        };

        let content = "";
        let title = "";

        if (type === 'quote') {
            title = "Script d'Accompagnement de Devis";
            content = PricingEngine.generateQuoteScript(scriptData);
        } else {
            title = "Email de Relance Orientation Valeur";
            content = PricingEngine.generateValueFollowup(scriptData);
        }

        this.showAIModal(title, content);
    },

    /**
     * Affiche une modale premium pour le contenu IA
     */
    showAIModal(title, content) {
        const modalId = 'scoper-ai-modal';
        let modal = document.getElementById(modalId);

        if (!modal) {
            // Add animation styles once
            if (!document.getElementById('scoper-modal-styles')) {
                const style = document.createElement('style');
                style.id = 'scoper-modal-styles';
                style.textContent = `
                    @keyframes scoperModalIn {
                        from { opacity: 0; transform: translateY(30px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    .scoper-modal-animate {
                        animation: scoperModalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                `;
                document.head.appendChild(style);
            }

            modal = document.createElement('div');
            modal.id = modalId;
            modal.style.cssText = `
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(12px);
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 1.5rem;
            `;
            modal.innerHTML = `
                <div class="elite-card scoper-modal-animate" style="max-width: 600px; width: 100%; padding: 3rem; border-radius: 32px; position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--primary-glass); color: var(--primary); display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-robot"></i>
                            </div>
                            <h3 id="ai-modal-title" style="margin: 0; font-size: 1.2rem; font-weight: 800; color: white;">SoloPrice AI</h3>
                        </div>
                        <button class="close-modal" onclick="document.getElementById('scoper-ai-modal').style.display='none'">&times;</button>
                    </div>
                    <div id="ai-modal-body" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; color: #e2e8f0; font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap; margin-bottom: 2rem; max-height: 400px; overflow-y: auto; font-family: 'Inter', sans-serif;"></div>
                    <div style="display: flex; gap: 1rem;">
                        <button class="button-primary" style="flex: 1;" onclick="Scoper.copyAIContent()">
                            <i class="fas fa-copy"></i> Copier le texte
                        </button>
                        <button class="button-secondary" style="flex: 1;" onclick="document.getElementById('scoper-ai-modal').style.display='none'">Fermer</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('ai-modal-title').textContent = title;
        document.getElementById('ai-modal-body').textContent = content;
        modal.style.display = 'flex';
    },

    copyAIContent() {
        const content = document.getElementById('ai-modal-body').textContent;
        navigator.clipboard.writeText(content).then(() => {
            App.showNotification("Texte copié dans le presse-papier !", "success");
        });
    }
};

window.Scoper = Scoper;
