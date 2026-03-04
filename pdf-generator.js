
/**
 * SoloPrice Pro - Vrai Générateur de PDF Vectoriel (PDFMake Edition)
 * Remplace totalement html2canvas et jspdf.
 * 100% Vectoriel, Sélectionnable, Zoom infini, et natif.
 */
const PdfGenerator = {
    COMPANY_INFO: {
        name: 'The SoloPrice Company',
        address: '123 Avenue de l\'Innovation\n75001 Paris, FRANCE',
        siret: '123 456 789 00012',
        vat: 'FR123456789'
    },

    commonStyles: {
        header: { fontSize: 22, bold: true, color: '#111827', margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, bold: true, color: '#4b5563', margin: [0, 15, 0, 5] },
        quoteNumber: { fontSize: 14, bold: true, color: '#10b981', alignment: 'right' },
        small: { fontSize: 9, color: '#6b7280' },
        tableHeader: { bold: true, fontSize: 10, color: '#111827', fillColor: '#f8fafc', alignment: 'center' },
        totalLabel: { bold: true, fontSize: 11, alignment: 'right', color: '#4b5563' },
        totalValue: { bold: true, fontSize: 12, alignment: 'right', color: '#111827' },
        grandTotalLabel: { bold: true, fontSize: 14, alignment: 'right', color: '#111827', margin: [0, 5, 0, 0] },
        grandTotalValue: { bold: true, fontSize: 14, alignment: 'right', color: '#10b981', margin: [0, 5, 0, 0] }
    },

    async _downloadRealPdf(docDefinition, filename) {
        if (typeof pdfMake === 'undefined') {
            console.error("PDFMake non chargé");
            if (typeof App !== 'undefined') App.showNotification('Erreur système PDF', 'error');
            return;
        }

        if (typeof App !== 'undefined') App.showNotification('Génération du document vectoriel...', 'info');

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        pdfMake.createPdf(docDefinition).getBlob((blob) => {
            try {
                if (isIOS) {
                    // SUR IOS : On ne peut pas appeler navigator.share ou window.open asynchronement après un long calcul.
                    // On stocke le blob globalement et on demande une action utilisateur MANUELLE.
                    window._lastPdfBlob = blob;
                    window._lastPdfFilename = filename;

                    if (typeof App !== 'undefined') {
                        App.showNotification(
                            `Prêt ! <button onclick="PdfGenerator._triggerIOSDownload()" style="margin-left:10px; padding:4px 8px; background:white; color:var(--primary); border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Ouvrir / Partager</button>`,
                            'success',
                            15000
                        );
                    } else {
                        this._fallbackDownload(blob, filename);
                    }
                } else {
                    // PC / Android -> Classic download
                    this._fallbackDownload(blob, filename);
                }
            } catch (e) {
                console.error("PDF download/share error", e);
                this._fallbackDownload(blob, filename);
            }
        });
    },

    _triggerIOSDownload() {
        if (!window._lastPdfBlob) return;
        const blob = window._lastPdfBlob;
        const filename = window._lastPdfFilename;

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        if (isIOS && navigator.share) {
            const file = new File([blob], filename, { type: 'application/pdf' });
            navigator.share({
                title: filename,
                files: [file]
            }).catch(err => {
                console.log("Share failed, falling back to window.open", err);
                this._fallbackDownload(blob, filename);
            });
        } else {
            this._fallbackDownload(blob, filename);
        }
    },

    async _fallbackDownload(blob, filename) {
        // Fallback ultime : On ouvre le blob dans un nouvel onglet ou on le télécharge
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        // On target blank car sur iOS, cliquer un lien programmeutiquement peut telecharger ou ouvrir
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if (typeof App !== 'undefined') App.showNotification('Document iOS généré avec succès', 'success');
        }, 100);
    },

    async generateQuote(quote, client, settings) {
        const dateStr = quote.date || new Date().toLocaleDateString('fr-FR');
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        const validUntil = endDate.toLocaleDateString('fr-FR');

        const providerName = Auth.user?.company?.name || Auth.user?.email || 'Prestataire Numérique';

        const tableBody = [
            [
                { text: 'Désignation', style: 'tableHeader', alignment: 'left' },
                { text: 'Qté', style: 'tableHeader' },
                { text: 'Prix Unitaire', style: 'tableHeader', alignment: 'right' },
                { text: 'Total HT', style: 'tableHeader', alignment: 'right' }
            ]
        ];

        quote.items.forEach(i => {
            tableBody.push([
                { text: i.desc + (i.subdesc ? ('\n' + i.subdesc) : ''), fontSize: 10, margin: [0, 5, 0, 5] },
                { text: i.quantity, alignment: 'center', fontSize: 10, margin: [0, 5, 0, 5] },
                { text: i.price + ' €', alignment: 'right', fontSize: 10, margin: [0, 5, 0, 5] },
                { text: i.total + ' €', alignment: 'right', fontSize: 10, margin: [0, 5, 0, 5] }
            ]);
        });

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 60],
            styles: this.commonStyles,
            defaultStyle: { font: 'Roboto', fontSize: 10 },
            content: [
                {
                    columns: [
                        { text: 'DEVIS', style: 'header' },
                        { text: `N° ${quote.id || 'BROUILLON'}`, style: 'quoteNumber' }
                    ]
                },
                {
                    columns: [
                        { text: `Date d'émission: ${dateStr}\nValable jusqu'au: ${validUntil}`, style: 'small' },
                        { text: '' }
                    ],
                    margin: [0, 0, 0, 30]
                },
                {
                    columns: [
                        {
                            width: '50%',
                            text: [
                                { text: 'Prestataire:\n', bold: true, color: '#4b5563' },
                                `${providerName}\n`,
                                `${Auth.user?.email || ''}\n`
                            ]
                        },
                        {
                            width: '50%',
                            text: [
                                { text: 'Client:\n', bold: true, color: '#4b5563' },
                                `${client?.name || 'Client Inconnu'}\n`,
                                `${client?.company || ''}\n`,
                                `${client?.address || ''}\n`,
                                `${client?.email || ''}\n`,
                                client?.vat_number ? `TVA: ${client.vat_number}` : ''
                            ],
                            alignment: 'right'
                        }
                    ],
                    margin: [0, 0, 0, 30]
                },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto'],
                        body: tableBody
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 0, 0, 20]
                },
                {
                    columns: [
                        { width: '*', text: '' },
                        {
                            width: 250,
                            table: {
                                widths: ['*', 'auto'],
                                body: [
                                    [{ text: 'Prestations HT:', style: 'totalLabel', border: [false, false, false, false] }, { text: `${quote.subtotal} €`, style: 'totalValue', border: [false, false, false, false] }],
                                    [{ text: 'Service & Gestion:', style: 'totalLabel', border: [false, false, false, false] }, { text: `${quote.margin} €`, style: 'totalValue', border: [false, false, false, false] }],
                                    [{ text: 'TOTAL TTC:', style: 'grandTotalLabel', border: [false, true, false, false] }, { text: `${quote.total} €`, style: 'grandTotalValue', border: [false, true, false, false] }]
                                ]
                            },
                            layout: 'noBorders'
                        }
                    ],
                    margin: [0, 0, 0, 40]
                },
                {
                    text: 'Instructions de Règlement & Bon pour accord',
                    style: 'subheader'
                },
                {
                    text: 'Ce document comporte deux instructions de règlement distinctes pour le prestataire et les frais de service.',
                    style: 'small',
                    margin: [0, 0, 0, 10]
                },
                {
                    columns: [
                        {
                            width: '48%',
                            stack: [
                                { text: `1. PART PRESTATAIRE (${settings.developerSplit}% HT)`, bold: true, color: '#10b981', fontSize: 10 },
                                { text: `Destinataire : ${providerName}`, fontSize: 9, margin: [0, 5, 0, 0] },
                                { text: 'Règlement direct sur compte.', fontSize: 9 }
                            ],
                            margin: [0, 0, 10, 0],
                            padding: [10, 10, 10, 10]
                        },
                        {
                            width: '48%',
                            stack: [
                                { text: `2. SERVICE SOLOPRICE (${settings.platformSplit}% HT)`, bold: true, color: '#10b981', fontSize: 10 },
                                { text: `Destinataire : SoloPrice Pro`, fontSize: 9, margin: [0, 5, 0, 0] },
                                { text: 'Paiement sécurisé en ligne exigé.', fontSize: 9 }
                            ],
                            margin: [10, 0, 0, 0],
                            padding: [10, 10, 10, 10]
                        }
                    ],
                    margin: [0, 0, 0, 30]
                },
                {
                    columns: [
                        {
                            width: '50%',
                            text: ''
                        },
                        {
                            width: '50%',
                            stack: [
                                { text: 'Signature du client', bold: true, alignment: 'center' },
                                { text: 'Précédé de la mention "Bon pour accord"', fontSize: 8, alignment: 'center', margin: [0, 5, 0, quote.signature ? 10 : 40] },
                                quote.signature
                                    ? { image: quote.signature, width: 130, alignment: 'center' }
                                    : { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: '#d1d5db' }], alignment: 'center' }
                            ]
                        }
                    ]
                }
            ],
            info: {
                title: `Devis_${quote.id || 'Brouillon'}`,
                author: providerName,
                subject: 'Devis de Prestations',
                keywords: 'devis, soloprice'
            }
        };

        this._downloadRealPdf(docDefinition, `Devis_${quote.id || 'Brouillon'}.pdf`);
    },

    async generateInvoice(quote, client, settings) {
        const dateStr = new Date().toLocaleDateString('fr-FR');
        const providerName = Auth.user?.company?.name || Auth.user?.email || 'Prestataire Numérique';

        const tableBody = [
            [
                { text: 'Désignation', style: 'tableHeader', alignment: 'left' },
                { text: 'Total', style: 'tableHeader', alignment: 'right' }
            ],
            [
                { text: 'Prestations Réalisées conformes au devis', margin: [0, 5, 0, 5] },
                { text: `${quote.subtotal} €`, alignment: 'right', margin: [0, 5, 0, 5] }
            ]
        ];

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 60],
            styles: this.commonStyles,
            defaultStyle: { font: 'Roboto', fontSize: 10 },
            content: [
                {
                    columns: [
                        { text: 'FACTURE', style: 'header' },
                        { text: `N° FAC-${quote.id || '1001'}`, style: 'quoteNumber' }
                    ]
                },
                {
                    text: `Date: ${dateStr}\nRéférence Devis: ${quote.id}`,
                    style: 'small',
                    margin: [0, 0, 0, 30]
                },
                {
                    columns: [
                        {
                            width: '50%',
                            text: [
                                { text: 'Prestataire:\n', bold: true, color: '#4b5563' },
                                `${providerName}\n`,
                                `${Auth.user?.email || ''}\n`
                            ]
                        },
                        {
                            width: '50%',
                            text: [
                                { text: 'Client:\n', bold: true, color: '#4b5563' },
                                `${client?.name || 'Client Inconnu'}\n`,
                                `${client?.company || ''}\n`,
                                `${client?.address || ''}\n`
                            ],
                            alignment: 'right'
                        }
                    ],
                    margin: [0, 0, 0, 30]
                },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto'],
                        body: tableBody
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 0, 0, 20]
                },
                {
                    columns: [
                        { width: '*', text: '' },
                        {
                            width: 250,
                            table: {
                                widths: ['*', 'auto'],
                                body: [
                                    [{ text: 'NET À PAYER:', style: 'grandTotalLabel', border: [false, true, false, false] }, { text: `${quote.subtotal} €`, style: 'grandTotalValue', border: [false, true, false, false] }]
                                ]
                            },
                            layout: 'noBorders'
                        }
                    ],
                    margin: [0, 0, 0, 40]
                },
                {
                    text: 'TVA non applicable, art. 293 B du CGI',
                    style: 'small',
                    alignment: 'center'
                }
            ]
        };

        this._downloadRealPdf(docDefinition, `Facture_${quote.id || 'Brouillon'}.pdf`);
    },

    async generateRoadmap() {
        if (typeof App !== 'undefined') App.showNotification('Fonction Roadmap (PDFMake) à configurer via DocDefinition', 'info');
    },

    async generateRecipeBook(year, data) {
        if (typeof App !== 'undefined') App.showNotification('Fonction Registre des Recettes (PDFMake) à configurer', 'info');
    },

    async generatePurchaseLedger(year, data) {
        if (typeof App !== 'undefined') App.showNotification('Fonction Registre des Achats (PDFMake) à configurer', 'info');
    }
};

window.PdfGenerator = PdfGenerator;
