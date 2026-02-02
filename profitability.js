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
        const saved = localStorage.getItem('sp_profit_profile');
        if (saved) {
            this.profile = JSON.parse(saved);
        }
        console.log('Profitability Engine Loaded');
    },

    saveProfile(data) {
        this.profile = { ...this.profile, ...data };
        localStorage.setItem('sp_profit_profile', JSON.stringify(this.profile));
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
        // Will be used to show a small summary on the dashboard
    }
};

Profitability.init();
window.Profitability = Profitability;
