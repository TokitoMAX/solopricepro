/**
 * SoloPrice Pro - Profitability Engine
 * Helps users ensure they are making money on every project.
 */
const Profitability = {
    // Current user's business profile for calculations
    profile: {
        chargesRate: 0,    // % of social charges/taxes on revenue
        fixedCosts: 0,     // Monthly fixed costs (software, rent, etc.)
        targetHourly: 50,  // Minimum hourly rate to stay profitable
        defaultTax: 20     // Default VAT for services
    },

    init() {
        if (typeof Storage === 'undefined') return;
        const settings = Storage.get(Storage.KEYS.SETTINGS) || {};
        if (settings.profitProfile) {
            this.profile = settings.profitProfile;
        }
        console.log('Profitability Engine Loaded');
    },

    saveProfile(data) {
        this.profile = { ...this.profile, ...data };
        if (typeof Storage !== 'undefined') {
            Storage.updateSettings({ profitProfile: this.profile });
        }
    },

    /**
     * Calculates the net profitability of a quote
     * @param {number} totalHT - Total price excluding tax
     * @param {number} costs - Direct costs for this project
     * @param {number} hours - Estimated hours spent
     */
    analyzeQuote(totalHT, costs = 0, hours = 0) {
        const grossMargin = totalHT - costs;
        const netSocial = grossMargin * (1 - (this.profile.chargesRate / 100));
        const netProfit = netSocial; // Simplified for now

        const hourlyEffective = hours > 0 ? (netProfit / hours) : 0;
        const isHealthy = hourlyEffective >= this.profile.targetHourly;

        return {
            grossMargin,
            netProfit,
            hourlyEffective,
            isHealthy,
            marginRate: (grossMargin / totalHT) * 100
        };
    },

    renderDashboardWidget() {
        if (typeof Storage === 'undefined' || typeof App === 'undefined') return '';
        
        const quotes = Storage.getQuotes() || [];
        const leads = Storage.getLeads() || [];
        
        // Analyze the health of the last 3 quotes
        const recentAnalysis = quotes.slice(0, 3).map(q => this.analyzeQuote(q.total, q.costs || 0, q.hours || 0));
        const healthScore = recentAnalysis.length > 0 
            ? Math.round((recentAnalysis.filter(a => a.isHealthy).length / recentAnalysis.length) * 100)
            : 100;

        return `
            <div class="bento-item glass-premium hover-lift" style="grid-column: span 4; padding: 2rem; border-radius: 24px; background: var(--bg-glass-heavy); border: 1px solid var(--glass-border-light); box-shadow: var(--shadow-premium); backdrop-filter: var(--bg-glass-blur); position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <span class="badge" style="background: ${healthScore >= 70 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${healthScore >= 70 ? 'var(--primary-light)' : '#f59e0b'}; padding: 4px 10px; border-radius: 8px; font-weight: 700; font-size: 0.75rem;">
                        SCORE: ${healthScore}%
                    </span>
                </div>
                <div>
                    <span style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Indicateur Santé</span>
                    <div style="font-size: 1.5rem; font-weight: 800; margin-top: 8px; color: white; line-height: 1.2;">
                        ${healthScore >= 70 ? 'Votre rentabilité est optimale.' : 'Attention à vos marges actuelles.'}
                    </div>
                    <p style="margin-top: 10px; font-size: 0.85rem; color: var(--text-muted);">Basé sur vos 3 derniers devis chiffrés.</p>
                </div>
                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-light);">
                    <a href="#" onclick="App.navigateTo('scoper'); return false;" style="color: var(--primary-light); text-decoration: none; font-size: 0.85rem; font-weight: 600;">Améliorer mon score →</a>
                </div>
            </div>
        `;
    }
};

Profitability.init();
window.Profitability = Profitability;
