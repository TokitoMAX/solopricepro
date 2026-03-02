/**
 * SoloPrice Pro - Onboarding Module
 * Helps new users set up their business correctly.
 */
const Onboarding = {
    getSteps() {
        const user = Storage.getUser() || {};
        const clients = Storage.getClients() || [];
        const quotes = Storage.getQuotes() || [];
        const calculator = Storage.get('sp_calculator_data');

        return [
            {
                id: 'profile',
                title: 'Compléter mon profil',
                description: 'Ajoutez votre SIRET et vos coordonnées Pro.',
                isComplete: !!((user.companyName || (user.company && user.company.name)) && (user.siret || (user.company && user.company.siret))),
                nav: 'profile'
            },
            {
                id: 'strategy',
                title: 'Fixer ma stratégie',
                description: 'Ciblez votre revenu net et votre TJM de sécurité.',
                isComplete: !!(calculator && calculator.dailyRate),
                nav: 'scoper'
            },
            {
                id: 'client',
                title: 'Ajouter mon premier client',
                description: 'Importez ou créez votre premier contact dans Le Cercle.',
                isComplete: clients.length > 0,
                nav: 'network'
            },
            {
                id: 'quote',
                title: 'Envoyer mon premier devis',
                description: 'Transformez une opportunité en document officiel.',
                isComplete: quotes.length > 0,
                nav: 'quotes'
            }
        ];
    },

    isAllComplete() {
        return this.getSteps().every(s => s.isComplete);
    },

    renderWidget() {
        if (this.isAllComplete()) return '';

        const steps = this.getSteps();
        const completedCount = steps.filter(s => s.isComplete).length;
        const progress = Math.round((completedCount / steps.length) * 100);

        return `
            <div class="onboarding-widget glass-card" style="margin-bottom: 2rem; border-left: 4px solid var(--primary);">
                <div class="section-header-inline" style="margin-bottom: 1rem;">
                    <h3 class="section-title-small" style="color: var(--primary-light);"> Ma Checklist de Lancement</h3>
                    <span class="badge" style="background: var(--primary-glass);">${progress}%</span>
                </div>
                <div class="progress-bar-container" style="height: 6px; margin-bottom: 1.5rem;">
                    <div class="progress-bar-fill" style="width: ${progress}%;"></div>
                </div>
                <div class="onboarding-steps" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    ${steps.map(s => `
                        <div class="onboarding-step ${s.isComplete ? 'complete' : ''}" 
                             onclick="App.navigateTo('${s.nav}')"
                             style="padding: 1rem; border: 1px solid ${s.isComplete ? 'var(--success-glass)' : 'var(--border)'}; border-radius: 12px; cursor: pointer; opacity: ${s.isComplete ? '0.6' : '1'};">
                            <div style="display: flex; align-items: flex-start; gap: 0.8rem;">
                                <div class="step-check" style="width: 20px; height: 20px; border-radius: 50%; border: 2px solid ${s.isComplete ? 'var(--success)' : 'var(--text-muted)'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
                                    ${s.isComplete ? '<i class="fas fa-check" style="color: var(--success); font-size: 0.7rem;"></i>' : ''}
                                </div>
                                <div>
                                    <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 2px;">${s.title}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.2;">${s.description}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
};

window.Onboarding = Onboarding;
