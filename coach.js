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
                title: '💰 Cash Dormant',
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
                title: '⚠️ Alerte Trésorerie',
                message: `**${App.formatCurrency(overdueAmount)}** de factures sont en retard de paiement. Votre priorité n'est pas de prospecter, mais de récupérer cet argent.`,
                action: 'Voir les factures',
                nav: 'invoices'
            });
        }

        // 3. Analyse du Salaire Réel (La vérité crue) - RÉSERVÉ EXPERT
        if (App.isFeatureExpertGated('expert_coaching')) {
            truths.push({
                type: 'info',
                title: '💎 Analyse Avancée Verrouillée',
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
                        title: '📉 Risque de Salaire',
                        message: `À ce rythme, vous allez manquer votre objectif net de **${App.formatCurrency(gap)}**. Votre pipeline actuel ne suffit pas à couvrir l'écart.`,
                        action: 'Calculer un nouveau projet',
                        nav: 'scoper'
                    });
                }
            } else if (stats.monthlyRevenue > 0) {
                truths.push({
                    type: 'success',
                    title: '🚀 Objectif Atteint',
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
                title: '🎯 Focus du Jour',
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
            <div class="coach-widget" style="margin-bottom: 2rem;">
                <div class="section-header-inline" style="margin-bottom: 1rem;">
                    <h2 class="section-title-small" style="font-size: 0.9rem; color: var(--primary-light);">CONSEILS DU COACH BUSINESS</h2>
                    ${streak > 0 ? `<span class="streak-tag">🔥 Série : ${streak} jours</span>` : ''}
                </div>
                
                <div class="coach-cards-container" style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
                    ${truths.map(truth => `
                        <div class="coach-card coach-${truth.type} glass">
                            <div class="coach-card-header">
                                <span class="coach-card-title">${truth.title}</span>
                                <span class="coach-card-icon">${this.getTypeIcon(truth.type)}</span>
                            </div>
                            <div class="coach-card-body">
                                <p>${truth.message}</p>
                            </div>
                            <div class="coach-card-footer">
                                <button class="button-ghost small" onclick="App.navigateTo('${truth.nav}')">${truth.action} →</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <style>
                .streak-tag {
                    background: rgba(255, 107, 107, 0.1);
                    color: #ff6b6b;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    border: 1px solid rgba(255, 107, 107, 0.2);
                }
                .coach-card {
                    padding: 1.2rem;
                    border-radius: 12px;
                    border-left: 4px solid var(--primary);
                    transition: transform 0.2s ease;
                }
                .coach-card:hover { transform: translateY(-3px); }
                .coach-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
                .coach-card-title { font-weight: 800; font-size: 0.95rem; color: white; }
                .coach-card-body p { margin: 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; }
                .coach-card-footer { margin-top: 1rem; display: flex; justify-content: flex-end; }
                
                .coach-opportunity { border-left-color: #10b981; background: linear-gradient(145deg, rgba(16, 185, 129, 0.05), transparent); }
                .coach-danger { border-left-color: #ef4444; background: linear-gradient(145deg, rgba(239, 68, 68, 0.05), transparent); }
                .coach-warning { border-left-color: #f59e0b; background: linear-gradient(145deg, rgba(245, 158, 11, 0.05), transparent); }
                .coach-success { border-left-color: #6366f1; background: linear-gradient(145deg, rgba(99, 102, 241, 0.05), transparent); }
                .coach-info { border-left-color: var(--text-muted); background: rgba(255,255,255,0.02); }
            </style>
        `;
    },

    getTypeIcon(type) {
        switch (type) {
            case 'opportunity': return '📈';
            case 'danger': return '🚨';
            case 'warning': return '⚠️';
            case 'success': return '🏆';
            default: return '💡';
        }
    }
};

window.Coach = Coach;
