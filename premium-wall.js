/**
 * SoloPrice Pro - Premium Wall Utility
 * Provides consistent UI for gated features.
 */

const PremiumWall = {
    /**
     * Renders a "Pro Only" teaser card/overlay
     * @param {string} title - The title of the gated feature
     * @param {string} description - Why they should unlock it
     * @param {string} icon - Emoji icon
     * @returns {string} HTML string
     */
    renderTeaser(title, description, icon = '🔒') {
        return `
            <div class="premium-teaser-card glass" style="padding: 1.5rem; border: 1px dashed var(--primary-glass); border-radius: 16px; text-align: center; background: rgba(99, 102, 241, 0.02); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; min-height: 160px;">
                <div style="font-size: 2rem;">${icon}</div>
                <h3 style="margin: 0; font-size: 1rem; color: var(--primary-light);">${title}</h3>
                <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); max-width: 250px;">${description}</p>
                <button class="button-primary small" onclick="App.showUpgradeModal('feature')" style="margin-top: 0.5rem; padding: 0.5rem 1rem; font-size: 0.8rem;">
                    Débloquer
                </button>
            </div>
        `;
    },

    /**
     * Renders a full page block
     * @param {string} featureName 
     */
    renderPageWall(featureName) {
        return `
            <div class="page-wall" style="height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem;">
                <div class="wall-icon" style="font-size: 4rem; margin-bottom: 2rem; opacity: 0.5;">💎</div>
                <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">${featureName}</h1>
                <p style="font-size: 1.2rem; color: var(--text-muted); margin-bottom: 2.5rem; max-width: 600px;">
                    Cette fonctionnalité est réservée aux membres **SoloPrice PRO**. 
                    Passez à la vitesse supérieure pour piloter votre activité comme un expert.
                </p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin-bottom: 3rem; width: 100%; max-width: 800px;">
                    <div style="background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border);">
                        <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📈</div>
                        <h4 style="margin: 0 0 5px 0;">Coaching Business</h4>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Analyses automatiques et conseils stratégiques.</p>
                    </div>
                    <div style="background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border);">
                        <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📊</div>
                        <h4 style="margin: 0 0 5px 0;">Pipeline Illimité</h4>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Visualisation Kanban complète de vos ventes.</p>
                    </div>
                    <div style="background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border);">
                        <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">💰</div>
                        <h4 style="margin: 0 0 5px 0;">Profit Net Réel</h4>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Suivi des dépenses et salaire net en temps réel.</p>
                    </div>
                </div>
                <button class="button-primary" style="padding: 1rem 3rem; font-size: 1.2rem;" onclick="App.showUpgradeModal('feature')">
                    Passer en PRO maintenant
                </button>
            </div>
        `;
    }
};

window.PremiumWall = PremiumWall;
