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
    renderTeaser(title, description, icon = '') {
        return `
                    <div class="premium-teaser-card glass-premium tilt-card" style="padding: 2rem; border-radius: 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; position: relative; overflow: hidden; border: 1px solid var(--glass-highlight); box-shadow: var(--shadow-premium); background: var(--bg-glass-heavy); backdrop-filter: var(--bg-glass-blur); transition: transform 0.1s ease, border-color 0.3s ease;">
                <div class="tilt-glare-wrapper"><div class="tilt-glare"></div></div>
                <div style="position: absolute; top: -50px; left: 50%; width: 100px; height: 100px; background: var(--primary); opacity: 0.15; filter: blur(40px); transform: translateX(-50%); border-radius: 50%; pointer-events: none;"></div>
                <div style="font-size: 2.5rem; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));">${icon}</div>
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; background: linear-gradient(to right, #fff, rgba(255,255,255,0.7)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${title}</h3>
                <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted); max-width: 280px; line-height: 1.5;">${description}</p>
                <div style="margin-top: 0.5rem;">
                    <button class="button-primary" onclick="App.showUpgradeModal('feature')" style="padding: 0.75rem 1.5rem; font-size: 0.9rem; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-lock-open"></i> Débloquer l'accès PRO
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Renders a full page block
     * @param {string} featureName 
     */
    renderPageWall(featureName) {
        return `
            <div class="page-wall" style="min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 3rem 2rem; position: relative;">
                <div style="position: absolute; top: 10%; left: 50%; transform: translateX(-50%); width: 600px; height: 600px; background: radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%); pointer-events: none; z-index: 0;"></div>
                
                <div style="position: relative; z-index: 1;">
                    <div class="wall-icon" style="font-size: 3.5rem; margin-bottom: 1.5rem; filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.4));"><i class="fas fa-gem" style="color: var(--primary);"></i></div>
                    <h1 style="font-size: 3rem; font-weight: 800; margin-bottom: 1rem; letter-spacing: -1px; background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${featureName}</h1>
                    <p style="font-size: 1.15rem; color: var(--text-muted); margin-bottom: 3rem; max-width: 600px; line-height: 1.6; margin-left: auto; margin-right: auto;">
                        Cette fonctionnalité avancée est réservée aux membres <strong style="color: var(--primary-light);">SoloPrice PRO</strong>. 
                        Passez à la vitesse supérieure pour piloter votre activité comme un expert.
                    </p>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 4rem; width: 100%; max-width: 900px; margin-left: auto; margin-right: auto;">
                        <div class="glass-premium hover-lift tilt-card" style="padding: 2rem; border-radius: 16px; border: 1px solid var(--glass-highlight); text-align: left; background: var(--bg-glass-heavy); backdrop-filter: var(--bg-glass-blur); transition: transform 0.1s ease, background 0.3s ease;">
                            <div class="tilt-glare-wrapper"><div class="tilt-glare"></div></div>
                            <div style="font-size: 1.8rem; margin-bottom: 1rem; color: var(--primary-light);"><i class="fas fa-brain"></i></div>
                            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; color: #fff;">Coaching Business</h4>
                            <p style="font-size: 0.9rem; color: var(--text-muted); margin: 0; line-height: 1.5;">Analyses pointues de votre rentabilité et conseils stratégiques personnalisés.</p>
                        </div>
                        <div class="glass-premium hover-lift tilt-card" style="padding: 2rem; border-radius: 16px; border: 1px solid var(--glass-highlight); text-align: left; background: var(--bg-glass-heavy); backdrop-filter: var(--bg-glass-blur); transition: transform 0.1s ease, background 0.3s ease;">
                            <div class="tilt-glare-wrapper"><div class="tilt-glare"></div></div>
                            <div style="font-size: 1.8rem; margin-bottom: 1rem; color: var(--primary-light);"><i class="fas fa-stream"></i></div>
                            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; color: #fff;">Pipeline Kanban</h4>
                            <p style="font-size: 0.9rem; color: var(--text-muted); margin: 0; line-height: 1.5;">Suivez l'état d'avancement de toutes vos opportunités commerciales sans effort.</p>
                        </div>
                        <div class="glass-premium hover-lift tilt-card" style="padding: 2rem; border-radius: 16px; border: 1px solid var(--glass-highlight); text-align: left; background: var(--bg-glass-heavy); backdrop-filter: var(--bg-glass-blur); transition: transform 0.1s ease, background 0.3s ease;">
                            <div class="tilt-glare-wrapper"><div class="tilt-glare"></div></div>
                            <div style="font-size: 1.8rem; margin-bottom: 1rem; color: var(--primary-light);"><i class="fas fa-chart-pie"></i></div>
                            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; color: #fff;">Profit Net Réel</h4>
                            <p style="font-size: 0.9rem; color: var(--text-muted); margin: 0; line-height: 1.5;">Calcul ultra-précis de votre trésorerie après charges et impôts.</p>
                        </div>
                    </div>
                    
                    <button class="button-primary" style="padding: 1.2rem 3.5rem; font-size: 1.15rem; font-weight: 700; border-radius: 14px; box-shadow: 0 8px 30px rgba(16, 185, 129, 0.35); transition: transform 0.2s, box-shadow 0.2s;" onclick="App.showUpgradeModal('feature')" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 40px rgba(16, 185, 129, 0.45)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 30px rgba(16, 185, 129, 0.35)';">
                        Mettre à niveau mon compte
                    </button>
                </div>
            </div>
        `;
    }
};

window.PremiumWall = PremiumWall;
