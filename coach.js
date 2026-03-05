/**
 * SoloPrice Pro - Business Coach Module
 * Analyse les données réelles pour fournir des "Hard Truths" et des actions à fort impact.
 */

const Coach = {
    getAnalysis() {
        const quotes = Storage.getQuotes();
        const invoices = Storage.getInvoices();
        const expenses = Storage.getExpenses();
        const calcData = Storage.get('sp_calculator_data') || { monthlyRevenue: 5000 };
        const targetMonthlyNet = parseFloat(calcData.monthlyRevenue) || 5000;

        const now = new Date();
        const truths = [];

        // 1. Analyse du Cash Dormant (Devis envoyés non relancés)
        const dormantQuotes = quotes.filter(q => {
            if (q.status !== 'sent') return false;
            const lastAction = q.lastFollowUpAt || q.sentAt || q.createdAt;
            const daysSinceAction = (now - new Date(lastAction)) / (1000 * 60 * 60 * 24);
            return daysSinceAction > 3; // Plus de 3 jours sans nouvelles
        });

        const dormantAmount = dormantQuotes.reduce((sum, q) => sum + q.total, 0);
        if (dormantAmount > 0) {
            truths.push({
                type: 'opportunity',
                title: ' Cash Dormant',
                message: `Vous avez **${App.formatCurrency(dormantAmount)}** qui dorment dans ${dormantQuotes.length} devis non relancés. Une relance aujourd'hui augmente vos chances de closing de 30%.`,
                action: 'Relancer maintenant',
                nav: 'quotes'
            });
        }

        // 2. Analyse de la Trésorerie Critique (Factures en retard)
        const overdueInvoices = invoices.filter(i => i.status === 'overdue' || (i.status === 'sent' && new Date(i.dueDate) < now));
        const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.total, 0);
        if (overdueAmount > 0) {
            truths.push({
                type: 'danger',
                title: '️ Alerte Trésorerie',
                message: `**${App.formatCurrency(overdueAmount)}** de factures sont en retard de paiement. Votre priorité n'est pas de prospecter, mais de récupérer cet argent.`,
                action: 'Voir les factures',
                nav: 'invoices'
            });
        }

        // 3. Analyse du Salaire Réel (La vérité crue) - RÉSERVÉ EXPERT
        if (App.isFeatureExpertGated('expert_coaching')) {
            truths.push({
                type: 'info',
                title: ' Analyse Avancée Verrouillée',
                message: `Le calcul prédictif de votre salaire net réel et l'analyse de risque sont réservés aux membres EXPERT.`,
                action: 'Débloquer le Pack Expert',
                nav: 'settings' // Redirige vers l'upgrade
            });
        } else {
            const stats = Storage.getStats();
            const currentNet = stats.monthlyRevenue - (stats.monthlyRevenue * (TaxEngine.getSocialRate() / 100)) - expenses.reduce((sum, e) => sum + e.amount, 0);
            const gap = targetMonthlyNet - currentNet;

            if (gap > 0) {
                const pipelineValue = quotes.filter(q => q.status === 'sent' || q.status === 'accepted').reduce((sum, q) => sum + q.total, 0);
                const probaPipe = pipelineValue * 0.5; // On estime 50% de closing

                if (currentNet + probaPipe < targetMonthlyNet) {
                    truths.push({
                        type: 'warning',
                        title: ' Risque de Salaire',
                        message: `À ce rythme, vous allez manquer votre objectif net de **${App.formatCurrency(gap)}**. Votre pipeline actuel ne suffit pas à couvrir l'écart.`,
                        action: 'Calculer un nouveau projet',
                        nav: 'scoper'
                    });
                }
            } else if (stats.monthlyRevenue > 0) {
                truths.push({
                    type: 'success',
                    title: ' Objectif Atteint',
                    message: `Félicitations. Votre salaire net cible est sécurisé. C'est le moment idéal pour investir dans vos outils ou prendre du repos.`,
                    action: 'Voir les réglages',
                    nav: 'settings'
                });
            }
        }

        // 4. Mission d'impact (Si rien d'autre)
        if (truths.length === 0) {
            truths.push({
                type: 'info',
                title: ' Focus du Jour',
                message: "Tout est sous contrôle. Profitez de ce calme pour ajouter 2 nouveaux prospects à votre pipeline et sécuriser les mois suivants.",
                action: 'Ajouter un prospect',
                nav: 'leads'
            });
        }

        return truths;
    },

    renderWidget() {
        const truths = this.getAnalysis();
        const streak = Storage.getStreak();

        return `
            <div class="coach-widget ai-chat-widget glass tilt-card" style="margin-bottom: 2rem; border-radius: 24px; padding: 2rem; background: var(--bg-glass-heavy); backdrop-filter: var(--bg-glass-blur); border: 1px solid var(--glass-border-light); box-shadow: var(--shadow-premium); transition: transform 0.1s ease, box-shadow 0.3s ease;">
                <div class="tilt-glare-wrapper"><div class="tilt-glare"></div></div>
                <div class="chat-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--border-light); padding-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="ai-avatar" style="width: 44px; height: 44px; border-radius: 14px; background: var(--gradient-premium); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); animation: float-gentle 4s ease-in-out infinite;">
                            ✨
                        </div>
                        <div>
                            <h2 style="font-size: 1.15rem; font-weight: 800; color: white; margin: 0; letter-spacing: -0.5px;">Solo Coach IA</h2>
                            <p style="font-size: 0.8rem; color: var(--primary-light); margin: 0; display: flex; align-items: center; gap: 6px; font-weight: 500;">
                                <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--primary-light); display: inline-block; animation: pulse-ring 2s infinite;"></span>
                                Analyse en temps réel
                            </p>
                        </div>
                    </div>
                    ${streak > 0 ? `<div class="streak-pill" style="background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.2); color: #ff6b6b; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 6px;"><i class="fas fa-fire"></i> ${streak} j</div>` : ''}
                </div>
                
                <div class="chat-messages" style="display: flex; flex-direction: column; gap: 1.5rem;">
                    ${truths.map((truth, index) => `
                        <div class="ai-message message-${truth.type}" style="display: flex; gap: 1.25rem; animation: message-in 0.5s ease-out ${index * 0.15}s both;">
                            <div class="message-icon" style="width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; margin-top: 2px;">
                                ${this.getTypeIcon(truth.type) || '💡'}
                            </div>
                            <div class="message-content">
                                <span class="message-title" style="display: block; font-weight: 700; color: white; margin-bottom: 6px; font-size: 0.95rem;">${truth.title}</span>
                                <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; margin: 0 0 14px 0;">${truth.message.replace(/\*\*(.*?)\*\*/g, '<strong style="color: white; font-weight: 600;">$1</strong>')}</p>
                                <button class="action-pill pill-${truth.type}" onclick="App.navigateTo('${truth.nav}')" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid transparent;">
                                    ${truth.action} <i class="fas fa-arrow-right" style="font-size: 0.75rem;"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <style>
                .message-opportunity .message-icon { background: rgba(16, 185, 129, 0.1); color: var(--primary); }
                .message-danger .message-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .message-warning .message-icon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .message-success .message-icon { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
                .message-info .message-icon { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); }
                
                .action-pill { background: rgba(255,255,255,0.03); color: var(--text-muted); border-color: var(--glass-border-light); }
                .action-pill:hover { background: rgba(255,255,255,0.08); color: white; transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
                
                .pill-opportunity:hover { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3); }
                .pill-danger:hover { background: #ef4444; color: white; border-color: #ef4444; box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3); }
                .pill-warning:hover { background: #f59e0b; color: white; border-color: #f59e0b; box-shadow: 0 5px 15px rgba(245, 158, 11, 0.3); }
            </style>
        `;
    },

    getTypeIcon(type) {
        switch (type) {
            case 'opportunity': return '';
            case 'danger': return '';
            case 'warning': return '️';
            case 'success': return '';
            default: return '';
        }
    }
};

window.Coach = Coach;
