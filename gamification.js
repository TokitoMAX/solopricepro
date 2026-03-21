/**
 * SoloPrice Pro - Gamification Module
 * Gère les missions quotidiennes et les citations motivantes
 */

const Gamification = {
    missions: [
        { id: 'add_lead', label: 'Ajouter un nouveau prospect au pipeline', icon: '🚀' },
        { id: 'send_quote', label: 'Envoyer un devis en attente', icon: '📄' },
        { id: 'check_stats', label: 'Analyser votre rentabilité nette sur le dashboard', icon: '📊' },
        { id: 'update_scoper', label: 'Préciser le chiffrage d\'un projet en cours', icon: '⚙️' },
        { id: 'follow_up', label: 'Relancer un client dont le devis date de + de 3 jours', icon: '🎯' }
    ],

    quotes: [
        "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte.",
        "Votre temps est limité, ne le gâchez pas en menant une existence qui n'est pas la vôtre.",
        "La meilleure façon de prédire l'avenir est de le créer.",
        "Le prix est ce que vous payez. La valeur est ce que vous recevez.",
        "Arrêtez de courir après l'argent et commencez à courir après la passion."
    ],

    getDailyMission() {
        const today = new Date().toDateString();
        const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const index = seed % this.missions.length;
        return this.missions[index];
    },

    getRandomQuote() {
        const today = new Date().toDateString();
        const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const index = seed % this.quotes.length;
        return this.quotes[index];
    },

    renderMissionCard() {
        const mission = this.getDailyMission();
        const quote = this.getRandomQuote();
        const streak = Storage.getStreak();

        return `
            <div class="mission-card glass-premium hover-lift" style="margin-bottom: 2.5rem; padding: 1.5rem 2rem; border-radius: 20px; border-left: 6px solid var(--primary); display: flex; align-items: center; gap: 2rem; position: relative; overflow: hidden; background: var(--bg-glass-heavy); backdrop-filter: var(--bg-glass-blur); border: 1px solid var(--glass-border-light);">
                <div style="position: absolute; right: -20px; top: -20px; font-size: 8rem; opacity: 0.03; pointer-events: none; transform: rotate(-15deg); color: var(--primary);">
                    <i class="fas fa-medal"></i>
                </div>
                
                <div class="streak-badge" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 80px; height: 80px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.2)); border-radius: 50%; border: 2px solid var(--primary-glass); box-shadow: 0 0 20px rgba(16, 185, 129, 0.1);">
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary-light); text-transform: uppercase; margin-bottom: -2px;">Série</span>
                    <span style="font-weight: 900; font-size: 1.8rem; color: white;">${streak || 0}</span>
                </div>
 
                <div style="flex: 1; position: relative; z-index: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span style="font-size: 0.75rem; font-weight: 800; color: var(--primary-light); text-transform: uppercase; letter-spacing: 1.5px;">Mission du jour</span>
                        <span style="width: 4px; height: 4px; border-radius: 50%; background: var(--text-muted);"></span>
                        <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">${new Date().toLocaleDateString('fr-FR', { weekday: 'long' })}</span>
                    </div>
                    <p style="margin: 0.4rem 0; font-weight: 800; font-size: 1.25rem; color: white; letter-spacing: -0.5px;">${mission.icon} ${mission.label}</p>
                    <p style="margin: 0; font-style: italic; font-size: 0.9rem; color: var(--text-muted); opacity: 0.8;">"${quote}"</p>
                </div>
 
                <div style="position: relative; z-index: 1;">
                    <button class="button-primary" style="padding: 0.8rem 1.8rem; border-radius: 14px; font-weight: 700;" onclick="App.showNotification('🚀 Mission acceptée ! C\\'est le moment de passer à l\\'action.', 'success')">Relever le Défi</button>
                </div>
            </div>
        `;
    }
};

window.Gamification = Gamification;
