/**
 * SoloPrice Pro - Gamification Module
 * Gère les missions quotidiennes et les citations motivantes
 */

const Gamification = {
    missions: [
        { id: 'add_lead', label: 'Ajouter un nouveau prospect au pipeline', icon: '' },
        { id: 'send_quote', label: 'Envoyer un devis en attente', icon: '' },
        { id: 'check_stats', label: 'Analyser votre rentabilité nette sur le dashboard', icon: '' },
        { id: 'update_scoper', label: 'Préciser le chiffrage d\'un projet en cours', icon: '' },
        { id: 'follow_up', label: 'Relancer un client dont le devis date de + de 3 jours', icon: '' }
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
            <div class="mission-card glass" style="margin-bottom: 2rem; padding: 1.5rem; border-radius: 15px; border-left: 5px solid var(--primary); display: flex; align-items: center; gap: 1.5rem; position: relative; overflow: hidden;">
                <div style="position: absolute; right: -10px; top: -10px; font-size: 5rem; opacity: 0.05; pointer-events: none;"></div>
                
                <div class="streak-badge" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 70px; height: 70px; background: rgba(255, 107, 107, 0.1); border-radius: 50%; border: 2px solid rgba(255, 107, 107, 0.3);">
                    <span style="font-size: 1.5rem;"></span>
                    <span style="font-weight: 800; font-size: 1rem; color: #ff6b6b;">${streak}</span>
                </div>

                <div style="flex: 1;">
                    <h3 style="margin: 0; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary-light);">Mission du jour</h3>
                    <p style="margin: 0.5rem 0; font-weight: 700; font-size: 1.1rem; color: white;">${mission.icon} ${mission.label}</p>
                    <p style="margin: 0; font-style: italic; font-size: 0.85rem; color: var(--text-muted);">"${quote}"</p>
                </div>

                <div>
                    <button class="button-primary small" onclick="App.showNotification('Mission acceptée ! À vous de jouer.', 'info')">C'est parti !</button>
                </div>
            </div>
        `;
    }
};

window.Gamification = Gamification;
