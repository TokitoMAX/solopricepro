/**
 * Pricing Engine - Coeur de calcul de SoloPrice Pro
 * Isolé de l'interface DOM pour permettre des tests unitaires
 * et renforcer la "Moat" technique.
 */

const PricingEngine = {
    /**
     * Calcule les données d'objectif financier (TJM, Revenu Requis, etc.)
     * @param {Object} data - Données d'entrée (monthlyRevenue, workingDays, hoursPerDay, monthlyCharges, taxRate)
     * @returns {Object} - Résultats des calculs
     */
    calculateObjective(data = {}) {
        const revenue = parseFloat(data.monthlyRevenue) || 0;
        const days = parseFloat(data.workingDays) || 1;
        const hours = parseFloat(data.hoursPerDay) || 1;
        const charges = parseFloat(data.monthlyCharges) || 0;
        const taxRate = parseFloat(data.taxRate) || 0;

        const rate = taxRate / 100;
        let revenueNeeded = 0;

        // Formule de reverse-calcul : (Revenue Net + Charges) / (1 - Taux de cotisation)
        if (rate < 1) {
            revenueNeeded = (revenue + charges) / (1 - rate);
        }

        const monthlyHours = days * hours;
        const hourlyRate = monthlyHours > 0 ? revenueNeeded / monthlyHours : 0;
        const dailyRate = hourlyRate * hours;

        return {
            dailyRate: Math.ceil(dailyRate),
            hourlyRate: Math.ceil(hourlyRate),
            revenueNeeded: Math.ceil(revenueNeeded),
            taxAmount: Math.ceil(revenueNeeded * rate)
        };
    },

    /**
     * Diagnostic de positionnement de marché
     * @param {number} tjm - Le TJM calculé
     * @param {string} sector - Le secteur d'activité
     * @returns {Object} - Titre, description, couleur et icône
     */
    getMarketDiagnostic(tjm, sector = 'tech') {
        if (tjm <= 0) return { title: 'Objectif nul', desc: 'Veuillez remplir les données.', color: 'var(--text-muted)', icon: 'fa-info-circle' };

        let expertThreshold = 500;
        let seniorThreshold = 800;

        if (sector === 'artisanat' || sector === 'media') {
            expertThreshold = 350;
            seniorThreshold = 600;
        }

        if (tjm < expertThreshold * 0.7) {
            return {
                title: 'TJM "Entrée de Marché"',
                desc: 'Cohérent pour débuter. Attention à ne pas rester trop longtemps dans cette zone de prix.',
                color: 'var(--primary)',
                icon: 'fa-seedling'
            };
        } else if (tjm >= expertThreshold * 0.7 && tjm < seniorThreshold) {
            return {
                title: 'TJM "Expert Confirmé"',
                desc: `La zone saine pour le secteur ${sector}. C'est tangible et réaliste pour la majorité des clients.`,
                color: 'var(--success)',
                icon: 'fa-check-circle'
            };
        } else {
            return {
                title: 'TJM "Sénior / Niche"',
                desc: 'Profil haut de gamme. Demande une solide réputation ou une expertise rare.',
                color: 'var(--warning)',
                icon: 'fa-star'
            };
        }
    },

    /**
     * Génère un résumé stratégique complet pour le PDF
     */
    getStrategicAdvice(tjm, sector = 'tech') {
        const diagnostic = this.getMarketDiagnostic(tjm, sector);
        return {
            diagnostic,
            valueProposition: this.getCoachingValue(sector, tjm),
            idealTarget: this.getCoachingTarget(sector, tjm),
            optimization: tjm > 800 ? 'Proposez du forfait pour masquer le TJM.' : 'Augmentez votre rythme de 2j pour baisser la pression.'
        };
    },

    getCoachingValue(sector, tjm) {
        const values = {
            tech: tjm > 600 ? 'Vendez l\'expertise archi-logicielle, pas juste du code.' : 'Misez sur la rapidité de livraison et la propreté du code.',
            design: tjm > 500 ? 'Vendez de la stratégie de marque globale (Impact Business).' : 'Vendez des livrables de haute qualité esthétique.',
            conseil: 'Vendez le ROI (Retour sur Investissement) de votre intervention.'
        };
        return values[sector] || values.tech;
    },

    getCoachingTarget(sector, tjm) {
        if (tjm > 700) return 'Scale-ups, Grands Comptes et PME en forte croissance.';
        if (tjm > 400) return 'PME installées et agences en sous-traitance.';
        return 'TPE, Indépendants et petites structures locales.';
    },

    getScenarios(results) {
        const base = results.dailyRate;
        return {
            security: {
                label: 'Sécurité',
                tjm: base,
                annual: base * 12 * 15, // Simplified projection
                desc: 'Couvre vos besoins et charges.'
            },
            growth: {
                label: 'Croissance',
                tjm: Math.ceil(base * 1.15),
                annual: Math.ceil(base * 1.15) * 12 * 15,
                desc: 'Capacité d\'investissement (+15%).'
            },
            elite: {
                label: 'Elite',
                tjm: Math.ceil(base * 1.30),
                annual: Math.ceil(base * 1.30) * 12 * 15,
                desc: 'Haute valeur / Niche (+30%).'
            }
        };
    },

    getMarketPowerScore(tjm, sector = 'tech') {
        let average = 500;
        if (sector === 'artisanat') average = 350;

        // Lower TJM = Higher Market Power (easier to sell)
        // Higher TJM = Lower Market Power (needs more authority)
        const ratio = average / tjm;
        let score = Math.round(ratio * 70); // Base score

        if (score > 100) score = 100;
        if (score < 10) score = 10;
        return score;
    },

    /**
     * Calcule le "Facteur PITA" (Pain In The Ass) - [PRO]
     * @param {number} urgency - 1 à 5
     * @param {number} complexity - 1 à 5
     * @param {number} clientDiff - 1 à 5
     * @returns {number} - Multiplicateur (ex: 1.15 pour +15%)
     */
    getPitaIncentive(urgency = 1, complexity = 1, clientDiff = 1) {
        const points = (urgency - 1) + (complexity - 1) + (clientDiff - 1);
        return 1 + (points * 0.05);
    },

    /**
     * Ingénierie de Vente Avancée - [EXPERT]
     * S'adapte au secteur et à la cible.
     */
    getAdvancedSalesTactics(score, scenarios, sector = 'tech', target = 'pme') {
        const sectorArguments = {
            tech: "Focus sur la dette technique évitée et la scalabilité.",
            design: "Focus sur l'identité de marque et la conversion utilisateur.",
            conseil: "Focus sur le gain de productivité et le ROI organisationnel.",
            artisanat: "Focus sur la durabilité et la qualité des matériaux.",
            media: "Focus sur l'engagement et l'image de marque."
        };

        const targetArguments = {
            'tpe': "Rassurez sur la simplicité et la maîtrise du budget.",
            'pme': "Misez sur la croissance et la structure.",
            'grands-comptes': "Parlez de réduction de risque et de conformité."
        };

        const baseArg = sectorArguments[sector] || sectorArguments.tech;
        const targetArg = targetArguments[target] || targetArguments.pme;

        if (score > 75) {
            return {
                title: `Stratégie : Vitesse & Exécution (${sector.toUpperCase()})`,
                technique: "Le Biais d'Urgence",
                script: `Argumentez sur le coût du retard : '${baseArg} ${targetArg} Chaque mois sans cette solution, vous perdez en compétitivité.'`,
                objection: "Si le client dit 'C'est cher', répondez : 'Le coût de l'opportunité manquée est bien plus élevé que mon tarif.'"
            };
        } else if (score > 45) {
            return {
                title: "Stratégie : Valeur Contextuelle",
                technique: "L'Ancrage par le Haut",
                script: `Pour une cible ${target.toUpperCase()}, montrez le pack Elite (${scenarios.elite.tjm}€) pour ancrer la valeur. Le pack Confort deviendra le choix logique.`,
                objection: `Recadrez sur la qualité : 'Pour une structure comme la vôtre, un prix bas est une hypothèque sur la pérennité du projet ${sector}.'`
            };
        } else {
            return {
                title: "Stratégie : Posture d'Expert (Diagnostic)",
                technique: "L'Asymétrie d'Expertise",
                script: `Ne vendez pas, diagnostiquez. ${targetArg} 'Mon intervention en ${sector} résout votre blocage X pour débloquer votre revenu Y.'`,
                objection: "Contrez par l'expérience : 'Vous ne payez pas pour mon temps, mais pour la certitude du résultat.'"
            };
        }
    }
};

// Export pour Node (tests) et Browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PricingEngine;
} else {
    window.PricingEngine = PricingEngine;
}
