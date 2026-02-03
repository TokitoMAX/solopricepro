/**
 * SoloPrice Pro - Legal Kit Module
 * Bibliothèque de ressources juridiques pour les Experts.
 */
const Legal = {
    documents: [
        {
            id: 'cgv-service',
            title: 'CGV - Prestations de Service',
            description: 'Conditions Générales de Vente standard pour freelance, conformes au Code de Commerce.',
            preview: \`CONDITIONS GÉNÉRALES DE VENTE (PRESTATION DE SERVICE)

ARTICLE 1 - OBJET ET CHAMP D'APPLICATION
Les présentes Conditions Générales de Vente (CGV) s'appliquent sans restrictions ni réserves à toute prestation de services commercialisée par le Prestataire auprès de clients professionnels ou particuliers.
Toute commande implique l'acceptation sans réserve des présentes CGV, qui prévalent sur toutes conditions d'achat du Client.

ARTICLE 2 - TARIFS ET PAIEMENT
2.1 Prix: Les services sont fournis aux tarifs en vigueur au jour de la commande, exprimés en Euros hors taxes (HT).
2.2 Délais: Le paiement est exigible, sauf accord spécifique, à 30 jours date de facture.
2.3 Retards: En cas de retard de paiement, des pénalités égales à trois fois le taux d'intérêt légal seront exigibles sans rappel, majorées de l'indemnité forfaitaire de 40€ pour frais de recouvrement (Art. L441-10 du Code de Commerce).

ARTICLE 3 - RÉSERVE DE PROPRIÉTÉ
Le Prestataire conserve la propriété pleine et entière des résultats de la prestation (livrables, fichiers sources) jusqu'au paiement intégral du prix (principal et accessoires).

ARTICLE 4 - RESPONSABILITÉ
Le Prestataire est tenu d'une obligation de moyens. Sa responsabilité est plafonnée au montant des honoraires perçus pour la mission concernée.\`,
            type: 'docx'
        },
        {
            id: 'contrat-cadre',
            title: 'Contrat Cadre de Prestation',
            description: 'Modèle de contrat pour les missions longues durées, avec clauses de propriété intellectuelle.',
            preview: \`CONTRAT DE PRESTATION DE SERVICES

ENTRE LES SOUSSIGNÉS :
[Société du Prestataire], demeurant au [Adresse], immatriculée sous le SIRET [Numéro], ci-après "le Prestataire".
ET
[Société du Client], demeurant au [Adresse], ci-après "le Client".

IL A ÉTÉ CONVENU CE QUI SUIT :

ARTICLE 1 - NATURE DE LA MISSION
Le Client confie au Prestataire une mission de conseil et d'assistance technique visant à [Description détaillée de la mission].

ARTICLE 4 - CESSION DES DROITS
4.1 Principe: Sauf disposition contraire, le Prestataire cède au Client les droits d'exploitation (reproduction, représentation) sur les livrables finaux, pour le monde entier et pour la durée de protection légale des droits d'auteur.
4.2 Condition: Cette cession n'est effective qu'au paiement complet et définitif du prix.

ARTICLE 8 - NON-SOLLICITATION
Le Client s'interdit d'engager ou de faire travailler tout collaborateur du Prestataire ayant participé à la mission, pendant toute la durée du contrat et 12 mois après sa fin.\`,
            type: 'docx'
        },
        {
            id: 'nda',
            title: 'Accord de Confidentialité (NDA)',
            description: 'Accord de non-divulgation pour protéger vos idées et données sensibles lors des négociations.',
            preview: \`ACCORD DE CONFIDENTIALITÉ UNILATÉRAL

Le présent Accord est conclu afin de permettre des discussions relatives à [Projet/Partenariat] (ci-après "le Projet").

Article 1. DÉFINITION
Sont considérées comme "Informations Confidentielles" toutes informations techniques, commerciales, financières ou juridiques, divulguées par la Partie Émettrice à la Partie Recevante, sous forme écrite ou orale.

Article 2. OBLIGATIONS
La Partie Recevante s'engage à :
i) Ne pas divulguer les Informations Confidentielles à des tiers sans accord écrit.
ii) N'utiliser ces Informations que pour l'évaluation du Projet.
iii) Protéger les Informations avec le même degré de soin que ses propres données confidentielles.

Article 5. DURÉE
Les obligations de confidentialité resteront en vigueur pendant une durée de 5 ans à compter de la signature des présentes.\`,
            type: 'pdf'
        },
        {
            id: 'relance',
            title: 'Modèles de Relance Facture',
            description: '3 niveaux de courriers de relance (Amiable, Ferme, Mise en demeure) pour vos impayés.',
            preview: \`NIVEAU 2 : RELANCE FERME

Objet : 2ème Relance - Retard de paiement Facture N°[Numéro]

Madame, Monsieur,

Sauf erreur de notre part, nous n'avons toujours pas reçu le règlement de la facture citée en objet, échue depuis le [Date].

Nous vous rappelons que conformément à l'article L441-10 du Code de Commerce et à nos CGV, tout retard entraîne l'application de pénalités de retard et d'une indemnité forfaitaire de 40€.

Nous vous mettons en demeure de procéder au virement sous 48h. À défaut, nous serons contraints de transmettre ce dossier à notre service recouvrement.

Cordialement,\`,
            type: 'txt'
        }
    ],

    render(containerId = 'legal-content') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const isExpert = App.isFeatureExpertGated ? !App.isFeatureExpertGated('legal_kit') : Storage.getTier() === 'expert';
        // Note: isFeatureExpertGated returns true if BLOCKED, so !BLOCKED = ALLOWED.
        // But let's check explicit tier for clarity if helper is missing logic.
        const canAccess = Storage.getTier() === 'expert';

        container.innerHTML = `
        < div class= "legal-header" style = "margin-bottom: 2rem;" >
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
                <h2 class="section-title-small">Bibliothèque Juridique</h2>
                <p style="color: var(--text-muted);">Modèles de contrats et documents administratifs prêts à l'emploi.</p>
            </div>
            ${canAccess ? '<span class="badge" style="background:var(--primary); color:white;">ACCÈS EXPERT ACTIVÉ</span>' : ''}
        </div>
                ${!canAccess ? `
                    <div class="premium-banner-inline" style="margin-top: 1rem; background: linear-gradient(90deg, rgba(255,215,0,0.1) 0%, rgba(0,0,0,0) 100%); border-left: 3px solid #FFD700; padding: 1rem;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <span style="font-size: 1.5rem;">⚖️</span>
                            <div>
                                <strong style="color: #FFD700;">Réservé aux Experts</strong>
                                <p style="font-size: 0.9rem; margin: 0; color: var(--text-muted);">Ces documents ont une valeur de plus de 500€. Débloquez-les avec le pack Expert.</p>
                            </div>
                            <button class="button-primary small" onclick="App.showUpgradeModal('feature')" style="margin-left: auto;">Débloquer</button>
                        </div>
                    </div>
                ` : ''}
            </div >

            <div class="legal-grid" style="display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
                ${this.documents.map(doc => this.renderDocumentCard(doc, canAccess)).join('')}
            </div>
            
            <div style="margin-top: 3rem; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.8rem; color: var(--text-muted); text-align: center;">
                <p style="margin: 0;"><strong>⚠️ Avertissement Légal :</strong> Ces documents sont des modèles types fournis à titre indicatif. Ils doivent être adaptés à votre situation spécifique. SoloPrice décline toute responsabilité quant à leur utilisation sans validation par un professionnel du droit.</p>
            </div>
`;
    },

    renderDocumentCard(doc, canAccess) {
        return `
    < div class="legal-card glass" style = "display: flex; flex-direction: column; height: 100%; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; position: relative;" >
                <div class="card-header" style="padding: 1.5rem; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <div class="doc-icon" style="font-size: 1.5rem;">${this.getIcon(doc.type)}</div>
                        <span class="doc-badge" style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.1);">${doc.type.toUpperCase()}</span>
                    </div>
                    <h3 style="margin: 0; font-size: 1.1rem; color: var(--white);">${doc.title}</h3>
                </div>
                
                <div class="card-body" style="padding: 1.5rem; flex: 1; display: flex; flex-direction: column;">
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">${doc.description}</p>
                    
                    <div class="doc-preview ${!canAccess ? 'blurred' : ''}" style="
                        background: #fff; 
                        color: #333; 
                        padding: 1rem; 
                        border-radius: 4px; 
                        font-family: 'Courier New', monospace; 
                        font-size: 0.7rem; 
                        line-height: 1.4;
                        margin-bottom: 1rem;
                        position: relative;
                        flex: 1;
                        max-height: 150px;
                        overflow: hidden;
                        box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
                    ">
                        ${doc.preview}
                        ${!canAccess ? `
                            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
                                background: linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.9) 60%, #fff 100%);
                                display: flex; align-items: center; justify-content: center;
                                flex-direction: column;
                            ">
                                <span style="font-size: 2rem;">🔒</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="doc-meta" style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                         <span style="color: #10b981;">●</span> Mis à jour : ${doc.lastUpdated || 'Récemment'}
                    </div>

                    <button class="button-secondary small" style="width: 100%; margin-top: auto;" 
                        onclick="${canAccess ? `Legal.download('${doc.id}')` : `App.showUpgradeModal('feature')`}">
                        ${canAccess ? 'Télécharger le modèle' : 'Débloquer le modèle'}
                    </button>
                </div>
            </div >
    `;
    },

    getIcon(type) {
        switch (type) {
            case 'docx': return '📝';
            case 'pdf': return '📄';
            default: return '📋';
        }
    },

    download(id) {
        App.showNotification('Téléchargement du modèle en cours...', 'success');
        // Simulation de téléchargement
        setTimeout(() => {
            alert('Dans la version finale, le fichier ' + id + ' serait téléchargé.');
        }, 500);
    }
};

window.Legal = Legal;
