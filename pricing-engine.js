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

    /**
     * Calcule l'incitation PITA (Pain In The Ass)
     * @param {number} urgency - Niveau d'urgence (1-5)
     * @param {number} complexity - Niveau de complexité (1-5)
     * @param {number} client - Niveau de difficulté client (1-5)
     * @returns {Object} - Multiplicateur et pourcentage d'impact
     */
    getPitaIncentive(urgency = 1, complexity = 1, client = 1) {
        // Formule : Chaque point au-dessus de 1 ajoute un poids
        // Poids maximal théorique : (5-1) * 3 = 12 points
        // On considère que chaque point de "douleur" ajoute ~8.33% (100/12)
        const totalPain = (parseInt(urgency) - 1) + (parseInt(complexity) - 1) + (parseInt(client) - 1);
        const impactPercent = Math.min(100, totalPain * 8); // Plafonné à 100% pour rester "réaliste"
        const multiplier = 1 + (impactPercent / 100);

        return {
            multiplier: multiplier,
            percent: impactPercent
        };
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
        const benchmarks = {
            tech: 500, design: 450, marketing: 400, conseil: 600, media: 400, artisanat: 350
        };
        const ref = benchmarks[sector] || 450;
        const ratio = tjm / ref;
        if (ratio < 0.8) return 95;
        if (ratio < 1.1) return 80;
        if (ratio < 1.5) return 60;
        if (ratio < 2.5) return 35;
        return 15;
    },

    /**
     * Analyse de l'Action Stratégique (Support de Pilotage)
     * Génère un plan d'action pour atteindre l'objectif TJM.
     */
    getStrategicActionPlan(currentTJM, targetTJM, sector = 'tech') {
        const gap = targetTJM - currentTJM;

        if (currentTJM <= 0) {
            return {
                status: 'pending',
                gapPercent: 0,
                message: "Analyse en attente : Listez vos livrables dans 'Chiffrage Projet'.",
                actions: [
                    { type: 'setup', text: "Listez les livrables du projet pour calculer votre TJM réel.", icon: 'fa-list-ol' },
                    { type: 'strategy', text: "Définissez votre périmètre pour détecter les zones de risque.", icon: 'fa-shield-halved' }
                ]
            };
        }

        const gapPercent = Math.round((gap / currentTJM) * 100);

        if (gap <= 0) {
            return {
                status: 'aligned',
                gapPercent: 0,
                message: "Position d'Autorité : Votre projet est aligné sur vos ambitions financières.",
                actions: [
                    { type: 'upsell', text: "Proposez une option 'Accélération Stratégique' (+25%) pour une priorité absolue.", icon: 'fa-bolt' },
                    { type: 'authority', text: "Sollicitez un témoignage d'impact dès que la valeur est perçue.", icon: 'fa-video' },
                    { type: 'retention', text: "Structurez déjà le prochain lot de valeur pour fidéliser ce partenaire.", icon: 'fa-sync' }
                ]
            };
        }

        const actions = [];
        if (gapPercent > 40) {
            actions.push({ type: 'strategy', text: "Pivot de Valeur : Votre écart est trop grand pour une simple remise. Reformulez le projet comme une 'Solution Business' et non une 'Mise en œuvre technique'.", icon: 'fa-exclamation-triangle' });
            actions.push({ type: 'scope', text: "Réduction de Périmètre : Supprimez les 20% de tâches les plus chronophages pour faire remonter mécaniquement votre TJM.", icon: 'fa-scissors' });
        } else {
            actions.push({ type: 'pricing', text: `Expertise Premium : Appliquez une majoration de ${gapPercent}% justifiée par votre spécialisation ${sector}.`, icon: 'fa-star' });
            actions.push({ type: 'anchoring', text: "Ancrage Elite : Montrez d'abord une option à 3x ce prix pour rendre votre offre 'évidente'.", icon: 'fa-anchor' });
        }

        actions.push({ type: 'diagnostic', text: "Questions de Pouvoir : Utilisez le diagnostic pour faire admettre au client le coût de son problème (ROI).", icon: 'fa-stethoscope' });

        return {
            status: 'gap',
            gap: gap,
            gapPercent: gapPercent,
            message: `Attention : Il vous manque ${Math.round(gap)}€ / jour pour atteindre votre objectif.`,
            actions: actions
        };
    },

    /**
     * Diagnostic de projet basé sur les tâches - [PRO]
     * Extrait le contexte des tâches pour personnaliser les conseils.
     */
    getProjectDiagnostic(tasks = []) {
        const keywords = {
            tech: ['dev', 'code', 'bug', 'api', 'back', 'front', 'data', 'mobile', 'web', 'app', 'infrastructure', 'logiciel', 'saas'],
            marketing: ['seo', 'sea', 'ads', 'lead', 'puchase', 'conversion', 'trafic', 'réseaux', 'contenu', 'stratégie'],
            design: ['ux', 'ui', 'logo', 'charte', 'maquette', 'visuel', 'interface', 'framer', 'figma'],
            conseil: ['audit', 'accompagnement', 'mentor', 'formation', 'process', 'optimisation', 'stratégie'],
            artisanat: ['pose', 'travaux', 'chantier', 'rénovation', 'dépannage', 'installation'],
            media: ['vidéo', 'photo', 'montage', 'shooting', 'podcast', 'tournage']
        };

        const taskContext = {
            totalTasks: tasks.length,
            detectedSectors: new Set(),
            keyTasks: tasks.slice(0, 3).map(t => t.name)
        };

        tasks.forEach(task => {
            const name = task.name.toLowerCase();
            for (const [sector, terms] of Object.entries(keywords)) {
                if (terms.some(term => name.includes(term))) {
                    taskContext.detectedSectors.add(sector);
                }
            }
        });

        return taskContext;
    },

    /**
     * Ingénierie de Vente Avancée - [EXPERT]
     * Génère un arsenal complet de vente personnalisé au secteur et à la cible.
     */
    getAdvancedSalesTactics(score, scenarios, sector = 'tech', target = 'pme', currentTJM = 0, clientSector = 'ecommerce', prospectLevel = 'manager', tasks = []) {
        const targetTJM = scenarios.security.tjm;
        const aiPlan = this.getStrategicActionPlan(currentTJM, targetTJM, sector);
        const projectContext = this.getProjectDiagnostic(tasks);

        const sectorData = {
            tech: {
                focus: "Dette Technique & Perte de Marché",
                questions: [
                    "Combien vous coûte chaque mois d'indisponibilité de ce système ?",
                    "Quel est l'impact sur votre équipe si ce développement prend 3 mois de retard interne ?",
                    "Si on ne règle pas ce bug structurel maintenant, quel est le risque d'échec du prochain scale ?"
                ],
                roi: "Réduction de 40% des coûts opérationnels sur 12 mois."
            },
            marketing: {
                focus: "Invisibilité & Opportunités Perdues",
                questions: [
                    "Combien de prospects qualifiés perdez-vous chaque mois faute de stratégie claire ?",
                    "Si votre concurrent prend la parole avant vous, quel sera le coût pour regagner ce terrain ?",
                    "Quel est l'impact d'une image de marque 'floue' sur vos marges actuelles ?"
                ],
                roi: "Augmentation de +25% du volume de leads qualifiés sous 6 mois."
            },
            design: {
                focus: "Image Low-Cost & Faible Conversion",
                questions: [
                    "Quel est le taux de rebond actuel sur votre tunnel de vente ?",
                    "Combien de clients potentiels perdent confiance à cause d'une interface datée ?",
                    "Si votre identité ne change pas, comment allez-vous justifier vos nouveaux tarifs ?"
                ],
                roi: "Augmentation du taux de transformation de +15% minimum."
            },
            conseil: {
                focus: "Stagnation & Coût d'Opportunité",
                questions: [
                    "Quel est le coût de chaque décision prise sans ces données stratégiques ?",
                    "Combien d'heures par semaine votre équipe perd-elle sur des process non optimisés ?",
                    "Si votre stratégie ne pivote pas ce trimestre, où en sera votre CA dans un an ?"
                ],
                roi: "Gain de 10h/semaine de productivité pour vos cadres dirigeants."
            },
            artisanat: {
                focus: "Réparations Coûteuses & Mauvaise Réputation",
                questions: [
                    "Quel est le coût d'une intervention en urgence si l'installation lâche ?",
                    "Combien vaut pour vous la tranquillité d'esprit sur les 10 prochaines années ?",
                    "Si les finitions ne sont pas parfaites, quel message envoyez-vous à vos futurs clients ?"
                ],
                roi: "Zéro coût de maintenance sur les 5 premières années."
            },
            media: {
                focus: "Invisibilité & Perte d'Attention",
                questions: [
                    "Combien vous coûte l'acquisition d'un client sans image de marque forte ?",
                    "Si votre contenu ne se démarque pas, comment allez-vous capter l'attention de votre cible ?",
                    "Quel est l'impact d'une communication 'bricolée' sur votre crédibilité ?"
                ],
                roi: "Baisse de 30% du coût d'acquisition client (CAC)."
            }
        };

        // Use detected sector if available and valid
        let activeSector = sector;
        if (projectContext.detectedSectors.size > 0) {
            const detected = Array.from(projectContext.detectedSectors)[0];
            if (sectorData[detected]) activeSector = detected;
        }

        const currentSector = sectorData[activeSector] || sectorData.tech;
        const targetLabel = { 'tpe': 'Indépendant/TPE', 'pme': 'PME/Startup', 'grands-comptes': 'Grand Compte/Institution' }[target] || 'PME';

        const securityTJM = scenarios.security.tjm;
        const eliteTJM = scenarios.elite.tjm;

        return {
            title: "Arsenal de Closing Expert",
            subtitle: `Stratégie optimisée pour un profil ${activeSector.toUpperCase()} face à un ${targetLabel}`,
            diagnostic: {
                title: "La Posture Dr. Expert",
                description: "Ne vendez pas, diagnostiquez. Posez ces 3 questions pour que le client réalise le coût de son problème.",
                questions: currentSector.questions
            },
            anchoring: {
                title: "L'Ancrage de Puissance",
                description: "Présentez toujours la valeur avant le prix. Utilisez l'effet de contraste.",
                strategy: `Ancrez sur le Pack ELITE à ${typeof App !== 'undefined' ? App.formatCurrency(eliteTJM) : eliteTJM + '€'} pour faire passer le Pack CONFORT (${typeof App !== 'undefined' ? App.formatCurrency(securityTJM) : securityTJM + '€'}) pour un investissement 'Évident'.`,
                logic: `Expliquez que l'Elite (${typeof App !== 'undefined' ? App.formatCurrency(eliteTJM) : eliteTJM + '€'}) est pour une 'Domination Totale' alors que le Sécurité (${typeof App !== 'undefined' ? App.formatCurrency(securityTJM) : securityTJM + '€'}) est pour une 'Croissance Sereine'.`
            },
            roi: {
                title: "L'Argument Choc (ROI)",
                description: "Transformez le coût en investissement mathématique.",
                argument: currentSector.roi
            },
            objections: [
                {
                    hook: "C'est trop cher.",
                    rebuttal: `Recadrez sur l'inaction : 'Je comprends que ${typeof App !== 'undefined' ? App.formatCurrency(securityTJM) : securityTJM + '€'} soit un budget. Mais si on ne fait rien, combien vous coûtera la ${currentSector.focus} dans 6 mois ?'`
                },
                {
                    hook: "On doit réfléchir.",
                    rebuttal: `Questionnez le risque : 'Bien sûr. Quelle est l'information manquante aujourd'hui pour être certain qu'investir ${typeof App !== 'undefined' ? App.formatCurrency(securityTJM) : securityTJM + '€'} dans ce projet soit un succès total ?'`
                },
                {
                    hook: "Un concurrent est moins cher.",
                    rebuttal: `Misez sur l'expertise : 'Exact, on trouve toujours moins cher que ${typeof App !== 'undefined' ? App.formatCurrency(securityTJM) : securityTJM + '€'}. Mais quel est le prix d'un projet qui doit être refait dans un an parce qu'il n'était pas assez robuste ?'`
                }
            ],
            aiPlan: aiPlan,
            projectContext: projectContext
        };
    },

    /**
     * Base de Données d'Intelligence de Marché Réelle (Google 2024/2025)
     * Ces données sont utilisées pour les analyses de marché.
     */
    MarketIntelligence: {
        ecommerce: {
            trends: ["Hyper-personnalisation via GenAI", "Expansion massive du Social Commerce (TikTok Shop)", "Logistique ultra-rapide (Q-Commerce)"],
            pains: ["Hausse massive des CAC (Coût d'acquisition)", "Attentes clients sur la vitesse de livraison", "Fraude au remboursement et cyber-risques"],
            source: "Analyse Google Trends 2024/2025"
        },
        saas: {
            trends: ["Modèles de prix à l'usage (Usage-based)", "Vertical SaaS ultra-spécialisé", "Stratégie native intégrée au workflow"],
            pains: ["Pression sur la rentabilité (Rule of 40)", "Complexité d'adoption des nouveaux outils", "SaaS Sprawl (trop d'outils fragiles)"],
            source: "Rapport SaaS Industry 2024"
        },
        btp: {
            trends: ["Rénovation énergétique (MaPrimeRénov')", "Grands projets d'infrastructure (Grand Paris)", "Digitalisation du chantier"],
            pains: ["Hausse des matériaux (+31% depuis 2020)", "Pénurie de main d'œuvre qualifiée", "Difficultés de financement (taux d'intérêt)"],
            source: "Observatoire BTP France 2024"
        },
        luxe: {
            trends: ["Experience-Led Luxury (Hôtellerie/Voyage)", "Luxe Silencieux (Quiet Luxury)", "Marché de la seconde main certifiée"],
            pains: ["Moindre engagement de la Gen Z", "Incertitudes géopolitiques mondiales", "Contraction de la base de clients"],
            source: "Bain & Company Luxury Study 2024"
        },
        sante: {
            trends: ["Digitalisation pour la réduction de la bureaucratie", "Focus Santé Mentale (Priorité 2025)", "Développement de la Télémédecine"],
            pains: ["Déserts médicaux en France", "Déficit budgétaire record (22 Mds€)", "Difficultés de recrutement paramédical"],
            source: "Rapport Santé France 2024/2025"
        }
    },

    /**
     * Mappage des enjeux par secteur client (Support de Pilotage)
     */
    clientSectorPainPoints: {
        luxe: {
            risk: "la dégradation de l'image de marque et l'expérience client irrégulière",
            roi: "la préservation de l'exclusivité et l'augmentation du panier moyen"
        },
        btp: {
            risk: "les retards de livraison et les surcoûts liés à une mauvaise coordination",
            roi: "la sécurisation des marges et la fiabilité opérationnelle"
        },
        ecommerce: {
            risk: "l'abandon de panier et l'augmentation faramineuse des coûts d'acquisition",
            roi: "l'optimisation du taux de conversion et la LTV client"
        },
        formation: {
            risk: "le désengagement des apprenants et le manque de crédibilité pédagogique",
            roi: "le rayonnement de votre expertise et la scalabilité de votre savoir"
        },
        sante: {
            risk: "les failles de conformité et l'inefficacité de la prise en charge",
            roi: "la sécurité des données et le gain de temps pour les praticiens"
        },
        asso: {
            risk: "la perte de confiance des donateurs et le manque de visibilité d'impact",
            roi: "la maximisation des fonds collectés et l'engagement communautaire"
        }
    },

    /**
     * Logique par niveau d'interlocuteur (Support de Pilotage)
     */
    prospectLevelLogic: {
        ceo: {
            label: "Exécutif / CEO",
            hook: "votre vision stratégique, votre croissance et votre avantage concurrentiel",
            vocabulary: ["levier de croissance", "impact sur l'EBITDA", "vision long-terme", "domination du marché", "ROI stratégique"],
            style: "Direct, axé sur les résultats macro et la valeur business globale."
        },
        manager: {
            label: "Stratégique / Manager",
            hook: "l'optimisation de vos processus, la fiabilité technique et la performance d'équipe",
            vocabulary: ["efficacité opérationnelle", "gestion des risques", "fiabilité", "livraison continue", "KPIs de performance"],
            style: "Professionnel, axé sur la fiabilité, les process et le respect des objectifs."
        },
        operating: {
            label: "Opérationnel",
            hook: "votre quotidien, votre sérénité et la résolution de vos points de douleur immédiats",
            vocabulary: ["gain de temps", "simplicité", "fiabilité technique", "réduction du stress", "livrables impeccables"],
            style: "Pragmatique, axé sur l'usage, la rapidité et la résolution de problèmes réels."
        }
    },

    /**
     * Arsenal de Vente Professionnel - [MASTERCLASS]
     * Contenu structuré par phase et par niveau d'expérience.
     */
    salesLifecycle: {
        preparation: {
            label: "Préparation",
            icon: "fa-user-shield",
            levels: {
                beginner: {
                    title: "Le Socle de Confiance",
                    tips: [
                        "Démontrez votre certitude : relisez vos succès passés avant l'appel.",
                        "Identifiez la valeur métier (Business Value) spécifique à ce client.",
                        "Soyez prêt à expliquer votre 'Pourquoi' en moins de 30 secondes."
                    ],
                    checklist: ["Portfolio sectoriel prêt", "SoloPrice Pro configuré", "Mindset de Consultant"]
                },
                intermediate: {
                    title: "Le Cadrage Stratégique",
                    tips: [
                        "Analysez le profil du prospect : quels sont ses enjeux actuels ?",
                        "Définissez votre 'Prix de Réserve' (ne descendez JAMAIS en dessous).",
                        "Préparez vos 'Labels' (ex: Il semble que le délai soit votre risque n°1)."
                    ],
                    checklist: [
                        {
                            id: 'prep_profile',
                            label: "Étude du prospect finie",
                            action: 'modal_research',
                            icon: 'fa-search',
                            clues: "Cherchez des signaux de croissance (recrutement, levée de fonds) ou de friction (avis clients, tech stack vieillissante).",
                            steps: [
                                "Parcourir le profil LinkedIn (Activité, Expériences)",
                                "Vérifier l'actualité de l'entreprise (Google News / Site Officiel)",
                                "Identifier 1 enjeu concret à citer dès l'ouverture"
                            ]
                        },
                        {
                            id: 'prep_reserve',
                            label: "Prix de réserve défini",
                            action: 'modal_pricing',
                            icon: 'fa-hand-holding-usd',
                            clues: "Votre prix de réserve est la limite mentale qui vous protège des mauvaises affaires.",
                            steps: [
                                "Calculer le temps minimal incompressible",
                                "Additionner vos frais fixes spécifiques au projet",
                                "Définir le montant 'Stop' (en dessous de X, je dis non)"
                            ]
                        },
                        {
                            id: 'prep_labels',
                            label: "Plan de cadrage prêt",
                            action: 'modal_framing',
                            icon: 'fa-clipboard-list',
                            clues: "Un bon cadrage empêche le client de prendre le contrôle de l'entretien par le bas.",
                            steps: [
                                "Adapter le script d'ouverture au secteur",
                                "Préparer 2 'Labels' d'empathie tactique",
                                "Valider l'ordre du jour avec le client dès le début"
                            ]
                        }
                    ]
                },
                expert: {
                    title: "L'Autorité d'Élite",
                    tips: [
                        "Détachement total : vous n'avez pas besoin de ce contrat, vous voulez l'aider.",
                        "Préparez l'Ancrage de Puissance (une option 3-5x plus chère).",
                        "Mindset 'Challenger' : préparez-vous à dire non si l'alignement n'est pas là."
                    ],
                    checklist: ["Mindset de détachement", "Contraste Elite prêt", "Tactiques d'Empathie Tactique"]
                }
            }
        },
        diagnostic: {
            label: "Diagnostic",
            icon: "fa-stethoscope",
            levels: {
                beginner: {
                    title: "Écoute Active",
                    tips: [
                        "Laissez le client parler 70% du temps.",
                        "Prenez des notes sur les mots exacts qu'il utilise pour qualifier son problème.",
                        "Reformulez : 'Si je comprends bien, votre enjeu majeur est...'"
                    ],
                    questions: [
                        "Quel est l'objectif n°1 du projet ?",
                        "Qu'est-ce qui vous empêche d'y arriver aujourd'hui ?",
                        "Qu'attendez-vous d'un partenaire comme moi ?"
                    ]
                },
                intermediate: {
                    title: "Excavation de Douleur",
                    tips: [
                        "Creusez avec le 'Pourquoi' (jusqu'à 3 fois).",
                        "Identifiez l'impact personnel du problème sur l'interlocuteur.",
                        "Cherchez la 'Deep Pain' : stress, perte de temps, pression hiérarchique."
                    ],
                    checklist: [
                        {
                            id: 'diag_pains',
                            label: "Douleurs identifiées",
                            action: 'modal_pains',
                            icon: 'fa-heart-broken',
                            clues: "La douleur n'est pas technique, elle est business ou psychologique.",
                            steps: [
                                "Identifier l'impact financier n°1",
                                "Identifier le stress personnel de l'interlocuteur",
                                "Valider que le client reconnaît la gravité du problème"
                            ]
                        },
                        {
                            id: 'diag_budget',
                            label: "Budget validé",
                            action: 'modal_budget',
                            icon: 'fa-coins',
                            clues: "Parlez de budget le plus tôt possible pour éviter les fausses pistes.",
                            steps: [
                                "Demander si une enveloppe a déjà été allouée",
                                "Vérifier la capacité de décision de l'interlocuteur",
                                "Donner une fourchette pour tester la réaction"
                            ]
                        },
                        {
                            id: 'diag_impact',
                            label: "Impact ROI chiffré",
                            action: 'modal_roi',
                            icon: 'fa-chart-line',
                            clues: "Le ROI est votre meilleure arme contre l'objection de prix.",
                            steps: [
                                "Estimer le coût annuel de l'inaction",
                                "Calculer le bénéfice potentiel du succès",
                                "Faire dire au client qu'il est d'accord sur ces chiffres"
                            ]
                        }
                    ],
                    questions: [
                        "Depuis combien de temps ce problème persiste-t-il ?",
                        "Combien de CA perdez-vous chaque mois à cause de cette situation ?",
                        "Si on ne règle rien maintenant, à quoi ressemble votre business dans 6 mois ?"
                    ]
                },
                expert: {
                    title: "L'IRM du Business",
                    tips: [
                        "Utilisez le silence pour laisser le client réaliser la gravité de son problème.",
                        "Pratiquez l'Empathie Tactique : 'Il semble que vous ayez peur que ce projet échoue...'",
                        "Validez le coût de l'inaction avant de parler de solution."
                    ],
                    questions: [
                        "Quel budget avez-vous déjà 'jeté par la fenêtre' en essayant de régler ça ?",
                        "Qu'est-ce qui se passe pour vous personnellement si cet objectif n'est pas atteint ?",
                        "Est-ce qu'on règle le problème à la racine, ou on continue de mettre des pansements ?"
                    ]
                }
            }
        },
        alignment: {
            label: "Alignement",
            icon: "fa-project-diagram",
            levels: {
                beginner: {
                    title: "Pont de Valeur",
                    tips: [
                        "Liez chaque fonctionnalité à un bénéfice concret pour le client.",
                        "Utilisez des preuves sociales (témoignages, logos).",
                        "Restez simple : ne vous noyez pas dans la technique."
                    ],
                    argument: "Ma solution règle [Problème] et vous apporte [Résultat]."
                },
                intermediate: {
                    title: "Translation Business",
                    tips: [
                        "Parlez de ROI, pas de coût. Montrez comment l'investissement se rentabilise.",
                        "Créez une vision futuriste positive : 'Imaginez quand le système sera...'",
                        "Positionnez-vous comme l'unique pont vers son objectif."
                    ],
                    checklist: [
                        {
                            id: 'align_solution',
                            label: "Solution validée",
                            action: 'modal_solution',
                            icon: 'fa-check-circle',
                            clues: "Assurez-vous que le client voit MA solution comme LE pont vers son futur désiré.",
                            steps: [
                                "Lier chaque livrable à une douleur identifiée",
                                "Valider l'adhésion technique et business",
                                "Faire confirmer le 'Go' sur le périmètre"
                            ]
                        },
                        {
                            id: 'align_anchoring',
                            label: "Ancrage prix effectué",
                            action: 'modal_anchoring',
                            icon: 'fa-anchor',
                            clues: "L'option Elite protège votre marge sur l'option Sécurité.",
                            steps: [
                                "Présenter l'Option 3 (Elite) sans trembler",
                                "Attendre le silence du client (Empathie Tactique)",
                                "Présenter l'Option 2 comme la solution évidente"
                            ]
                        },
                        {
                            id: 'align_agreement',
                            label: "Accord de principe",
                            action: 'modal_agreement',
                            icon: 'fa-handshake',
                            clues: "L'accord de principe est un engagement moral avant le papier.",
                            steps: [
                                "Demander si quelque chose s'oppose à la collaboration",
                                "Fixer la date de lancement",
                                "Valider les prochaines étapes administratives"
                            ]
                        }
                    ],
                    argument: "Investir aujourd'hui sécurise un gain réel sur l'année."
                },
                expert: {
                    title: "Le Contraste Stratégique",
                    tips: [
                        "Utilisez l'option 3 (Elite) pour rendre l'option 2 (Sécurité) évidente.",
                        "Vendez le 'futur désiré', pas le processus.",
                        "Gérez la psychologie : rendez l'achat gratifiant."
                    ],
                    argument: "L'Elite est une domination totale, la Sécurité est votre croissance sereine."
                }
            }
        },
        closing: {
            label: "Closing",
            icon: "fa-check-double",
            levels: {
                beginner: {
                    title: "L'Invitation",
                    tips: [
                        "N'ayez pas peur de demander : 'Est-ce qu'on commence lundi ?'",
                        "Validez les prochaines étapes concrètes.",
                        "Remerciez pour la confiance."
                    ],
                    methods: ["Direct Close", "Next Step Close"]
                },
                intermediate: {
                    title: "Le Bouclage Professionnel",
                    tips: [
                        "Utilisez le 'Summary Close' : récapitulez tous les bénéfices avant le prix.",
                        "Adressez les objections de front.",
                        "Obtenez un engagement ferme (Acompte)."
                    ],
                    checklist: [
                        { id: 'close_objections', label: "Objections levées", action: 'modal_objections', icon: 'fa-shield-alt' },
                        { id: 'close_terms', label: "Conditions validées", action: 'modal_terms', icon: 'fa-file-signature' },
                        { id: 'close_kickoff', label: "Plan de démarrage prêt", action: 'modal_kickoff', icon: 'fa-rocket' }
                    ],
                    methods: ["Summary Close", "Benefit Close", "Objection Reframe"]
                },
                expert: {
                    title: "L'Engagement d'Élite",
                    tips: [
                        "L'Assumptive Close : parlez comme si le projet avait déjà commencé.",
                        "Utilisez le silence après avoir annoncé le prix.",
                        "Maitrisez les objections par la négociation (Labeling/Mirroring)."
                    ],
                    methods: ["Assumptive Close", "Tactical Empathy Close", "The Calibrated Question"]
                }
            }
        }
    },

    /**
     * Génère un script de présentation du devis (Support de Pilotage)
     */
    generateQuoteScript(data) {
        const sector = data.sector || 'tech';
        const clientSector = data.clientSector || 'ecommerce';
        const prospectLevel = data.prospectLevel || 'manager';
        const tjm = data.dailyRate || 500;

        const intro = {
            tech: "En tant qu'expert technique, l'enjeu ici n'est pas seulement de livrer du code, mais de sécuriser votre infrastructure.",
            marketing: "Notre approche ne se limite pas à la visibilité, mais à la conversion réelle de vos leads.",
            design: "Le design que je propose est un levier direct pour augmenter votre taux de transformation.",
            conseil: "Mon accompagnement stratégique vise à optimiser vos processus pour un gain de temps immédiat.",
            media: "La qualité de votre communication visuelle est le premier vecteur de confiance pour vos clients.",
            artisanat: "Mon intervention garantit une durabilité et une conformité aux plus hauts standards."
        }[sector] || "Mon expertise est dédiée à la réussite de votre projet.";

        const levelData = this.prospectLevelLogic[prospectLevel] || this.prospectLevelLogic.manager;
        const clientFocus = this.clientSectorPainPoints[clientSector]?.roi || "votre performance professionnelle";
        const targetText = data.specificTarget ? ` (spécifiquement pour les ${data.specificTarget})` : "";
        const obstacleText = data.mainObstacle ? `\n\nJ'ai bien noté votre enjeu concernant "${data.mainObstacle}", c'est un point que nous sécuriserons en priorité pour garantir le succès de la mission.` : "";
        const gapText = data.gap > 0 ? `\nNotez que ce tarif est un investissement stratégique calculé pour combler l'écart de performance identifié de ${Math.round(data.gap)}€.` : "";

        return `
Bonjour,

Suite à notre échange, je vous transmets ma proposition détaillée${targetText}.

${intro}

Pour ce projet, mon TJM est de ${typeof App !== 'undefined' ? App.formatCurrency(tjm) : tjm + '€'}. 

Ce tarif reflète l'expertise nécessaire pour adresser ${levelData.hook}, tout en sécurisant vos enjeux de ${clientFocus} propres au secteur ${clientSector.toUpperCase()}.${obstacleText}${gapText}

L'objectif est de transformer cet investissement en un ${levelData.vocabulary ? levelData.vocabulary[0] : 'levier de succès'} pour votre structure.

Je reste à votre disposition pour en discuter plus en détail.
        `.trim();
    },

    /**
     * Génère un mail de relance basé sur la valeur (Support de Pilotage)
     */
    generateValueFollowup(data) {
        const sector = data.sector || 'tech';
        const clientSector = data.clientSector || 'ecommerce';
        const prospectLevel = data.prospectLevel || 'manager';

        const focus = {
            tech: "les risques liés à la dette technique",
            marketing: "le manque à gagner sur vos leads actuels",
            design: "la perte de conversion liée à l'UX actuelle",
            conseil: "les inefficacités opérationnelles identifiées",
            media: "le déficit d'image face à vos concurrents",
            artisanat: "les coûts de maintenance future"
        }[sector] || "la réussite de votre projet";

        const levelData = this.prospectLevelLogic[prospectLevel] || this.prospectLevelLogic.manager;
        const clientRisk = this.clientSectorPainPoints[clientSector]?.risk || "la stagnation de vos résultats";
        const obstacleAdvice = data.mainObstacle ? `\n\nConcernant votre défi sur "${data.mainObstacle}", j'ai préparé une approche spécifique pour lever ce frein dès le démarrage.` : "";

        return `
Bonjour,

Je reviens vers vous concernant ma proposition.

Au-delà de l'aspect budgétaire, j'ai repensé à notre discussion sur ${focus}. Chaque semaine d'attente accentue ${clientRisk}, ce qui retarde ${levelData.hook}.${obstacleAdvice}

C'est un risque de ${levelData.vocabulary && levelData.vocabulary[2] ? levelData.vocabulary[2] : 'perte de vitesse'} que nous pouvons mitiger dès le lancement de notre collaboration.

Avons-nous un créneau de 10 min cette semaine pour valider les prochaines étapes ?
        `.trim();
    },

    generateResearchDraft(data) {
        const sector = data.sector || 'tech';
        const target = data.target || 'pme';
        const specific = data.specificTarget || 'le client';

        return `
ANALYSE PRÉ - APPEL(${specific.toUpperCase()}) :
        1. Enjeux Sectoriels: Pour une ${target.toUpperCase()} en ${sector.toUpperCase()}, le défi majeur actuel est le coût d'acquisition et la rétention.
        2. Angle d'Attaque : Se positionner non pas comme un prestataire, mais comme un partenaire de croissance ${sector}.
        3. Point de Vigilance: Vérifier qui est le décisionnaire réel(Directeur vs Exécutif).

DRAFT DE CADRAGE:
        "D'après mon analyse de votre marché, vous faites face à un gap de [KPI]. L'objectif de notre échange est de valider si ma solution peut combler ce gap sous 90 jours."
            `.trim();
    },

    generateROIDetailedArgument(data, loss, gain) {
        const total = (loss * 12) + gain;
        const risks = data.highRiskTasks && data.highRiskTasks.length > 0
            ? `\n\nNotamment sur des points critiques comme ${data.highRiskTasks.slice(0, 2).join(' et ')}.`
            : "";
        return `
ARGUMENTAIRE ROI (Retour sur Investissement) :

Sur une période de 12 mois, l'inaction face à votre problème actuel représente un coût masqué de ${total}€.
            - Pertes directes évitées : ${loss * 12}€ / an.
            - Gain de performance projeté : ${gain}€ / an.${risks}

Mon accompagnement s'autofinance au bout de [X] mois, transformant cette dépense en un levier pur de rentabilité.
            `.trim();
    }
};

// Export pour Node (tests) et Browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PricingEngine;
} else {
    window.PricingEngine = PricingEngine;
}

window.Scoper = typeof Scoper !== 'undefined' ? Scoper : window.Scoper;
