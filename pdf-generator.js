
/**
 * SoloPrice Pro - Vrai Générateur de PDF Vectoriel (PDFMake Edition)
 * Remplace totalement html2canvas et jspdf.
 * 100% Vectoriel, Sélectionnable, Zoom infini, et natif.
 */
const PDFGenerator = {
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

    _format(val) {
        if (typeof val !== 'number') return val || (typeof App !== 'undefined' ? App.formatCurrency(0) : '0 €');
        if (typeof App !== 'undefined') return App.formatCurrency(val);
        const config = (typeof App !== 'undefined') ? App.getCurrencyConfig() : { locale: i18n.currentLanguage === 'fr' ? 'fr-FR' : (i18n.currentLanguage === 'es' ? 'es-ES' : 'en-US'), symbol: '€' };
        return val.toLocaleString(config.locale).replace(/\u00A0|\u202F/g, ' ') + ' ' + config.symbol;
    },

    async _downloadRealPdf(docDefinition, filename) {
        if (typeof pdfMake === 'undefined') {
            console.error("PDFMake non chargé");
            if (typeof App !== 'undefined') App.showNotification(i18n.t('error.pdf_system') || 'Erreur système PDF', 'error');
            return;
        }

        if (typeof App !== 'undefined') App.showNotification(i18n.t('pdf.notify.generating') || 'Génération du document vectoriel en cours...', 'info');

        pdfMake.createPdf(docDefinition).getBlob((blob) => {
            try {
                if (navigator.share && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
                    const file = new File([blob], filename, { type: 'application/pdf' });
                    navigator.share({
                        title: filename,
                        files: [file]
                    }).catch(err => {
                        console.log("Share failed, falling back to download", err);
                        this._fallbackDownload(blob, filename);
                    });
                } else {
                    this._fallbackDownload(blob, filename);
                }
            } catch (e) {
                console.error("PDF download/share error", e);
                this._fallbackDownload(blob, filename);
            }
        });
    },

    _fallbackDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if (typeof App !== 'undefined') App.showNotification(i18n.t('pdf.notify.success') || 'Document téléchargé avec succès', 'success');
        }, 100);
    },

    async generateQuote(quote, client, settings) {
        const config = (typeof App !== 'undefined') ? App.getCurrencyConfig() : { locale: 'fr-FR' };
        const dateStr = quote.date || new Date().toLocaleDateString(config.locale);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        const validUntil = endDate.toLocaleDateString(config.locale);

        const providerName = Auth.user?.company?.name || Auth.user?.email || i18n.t('pdf.provider') || 'Prestataire Numérique';

        const tableBody = [
            [
                { text: i18n.t('pdf.table.designation') || 'Désignation', style: 'tableHeader', alignment: 'left' },
                { text: i18n.t('pdf.table.qty') || 'Qté', style: 'tableHeader' },
                { text: i18n.t('pdf.table.unit_price') || 'Prix Unitaire', style: 'tableHeader', alignment: 'right' },
                { text: i18n.t('pdf.table.total_ht') || 'Total HT', style: 'tableHeader', alignment: 'right' }
            ]
        ];

        quote.items.forEach(i => {
            const desc = i.description || i.desc || i18n.t('pdf.items_conform') || 'Sans désignation';
            const qty = i.quantity || 0;
            const price = i.unitPrice || i.price || 0;
            const total = qty * price;

            tableBody.push([
                { text: desc, fontSize: 10, margin: [0, 5, 0, 5] },
                { text: qty, alignment: 'center', fontSize: 10, margin: [0, 5, 0, 5] },
                { text: this._format(price), alignment: 'right', fontSize: 10, margin: [0, 5, 0, 5] },
                { text: this._format(total), alignment: 'right', fontSize: 10, margin: [0, 5, 0, 5] }
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
                        { text: i18n.t('pdf.quote.title'), style: 'header' },
                        { text: `${i18n.t('pdf.number')} ${quote.number || quote.id || i18n.t('status.draft').toUpperCase()}`, style: 'quoteNumber' }
                    ]
                },
                {
                    columns: [
                        { text: `${i18n.t('pdf.date_issue')}: ${dateStr}\n${i18n.t('pdf.valid_until')}: ${validUntil}`, style: 'small' },
                        { text: '' }
                    ],
                    margin: [0, 0, 0, 30]
                },
                {
                    columns: [
                        {
                            width: '50%',
                            text: [
                                { text: `${i18n.t('pdf.provider')}:\n`, bold: true, color: '#4b5563' },
                                `${providerName}\n`,
                                `${Auth.user?.email || ''}\n`
                            ]
                        },
                        {
                            width: '50%',
                            text: [
                                { text: `${i18n.t('pdf.client')}:\n`, bold: true, color: '#4b5563' },
                                `${client?.name || i18n.t('pdf.client_unknown')}\n`,
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
                                    [{ text: `${i18n.t('pdf.total.items') || 'Prestations HT'}:`, style: 'totalLabel', border: [false, false, false, false] }, { text: this._format(quote.itemsSubtotal || 0), style: 'totalValue', border: [false, false, false, false] }],
                                    [{ text: `${i18n.t('pdf.total.service') || 'Service & Gestion'}:`, style: 'totalLabel', border: [false, false, false, false] }, { text: this._format(quote.margin || 0), style: 'totalValue', border: [false, false, false, false] }],
                                    [{ text: `${i18n.t('pdf.total.subtotal') || 'Total HT'}:`, style: 'totalLabel', border: [false, false, false, false] }, { text: this._format(quote.subtotal || 0), style: 'totalValue', border: [false, false, false, false] }],
                                    [{ text: `${i18n.t('pdf.total.tax') || 'TVA'} (${quote.taxRate || 0}%):`, style: 'totalLabel', border: [false, false, false, false] }, { text: this._format(quote.tax || 0), style: 'totalValue', border: [false, false, false, false] }],
                                    [{ text: `${i18n.t('pdf.total.ttc') || 'TOTAL TTC'}:`, style: 'grandTotalLabel', border: [false, true, false, false] }, { text: this._format(quote.total || 0), style: 'grandTotalValue', border: [false, true, false, false] }]
                                ]
                            },
                            layout: 'noBorders'
                        }
                    ],
                    margin: [0, 0, 0, 40]
                },
                {
                    text: i18n.t('pdf.settlement.title'),
                    style: 'subheader'
                },
                {
                    text: i18n.t('pdf.settlement.desc'),
                    style: 'small',
                    margin: [0, 0, 0, 10]
                },
                {
                    columns: [
                        {
                            width: '48%',
                            stack: [
                                { text: `1. ${i18n.t('pdf.settlement.part_provider')} (${settings.developerSplit}% HT)`, bold: true, color: '#10b981', fontSize: 10 },
                                { text: `${i18n.t('pdf.settlement.recipient')} : ${providerName}`, fontSize: 9, margin: [0, 5, 0, 0] },
                                { text: i18n.t('pdf.settlement.direct'), fontSize: 9 }
                            ],
                            margin: [0, 0, 10, 0],
                            padding: [10, 10, 10, 10]
                        },
                        {
                            width: '48%',
                            stack: [
                                { text: `2. ${i18n.t('pdf.settlement.part_service')} (${settings.platformSplit}% HT)`, bold: true, color: '#10b981', fontSize: 10 },
                                { text: `${i18n.t('pdf.settlement.recipient')} : SoloPrice Pro`, fontSize: 9, margin: [0, 5, 0, 0] },
                                { text: i18n.t('pdf.settlement.online'), fontSize: 9 }
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
                                { text: i18n.t('quotes.signature.title_client'), bold: true, alignment: 'center' },
                                { text: i18n.t('pdf.signature.mention'), fontSize: 8, alignment: 'center', margin: [0, 5, 0, 40] },
                                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: '#d1d5db' }], alignment: 'center' }
                            ]
                        }
                    ]
                }
            ],
            info: {
                title: `${i18n.t('pdf.quote.title')}_${quote.number || quote.id || i18n.t('status.draft')}`,
                author: providerName,
                subject: i18n.t('pdf.quote.subject'),
                keywords: 'devis, soloprice'
            }
        };

        this._downloadRealPdf(docDefinition, `${i18n.t('pdf.quote.title')}_${quote.number || quote.id || i18n.t('status.draft')}.pdf`);
    },

    async generateInvoice(quote, client, settings) {
        const config = (typeof App !== 'undefined') ? App.getCurrencyConfig() : { locale: 'fr-FR' };
        const dateStr = new Date().toLocaleDateString(config.locale);
        const providerName = Auth.user?.company?.name || Auth.user?.email || i18n.t('pdf.provider') || 'Prestataire Numérique';

        const tableBody = [
            [
                { text: i18n.t('pdf.table.designation') || 'Désignation', style: 'tableHeader', alignment: 'left' },
                { text: i18n.t('pdf.table.qty') || 'Qté', style: 'tableHeader' },
                { text: i18n.t('pdf.table.unit_price') || 'Prix Unitaire', style: 'tableHeader', alignment: 'right' },
                { text: i18n.t('pdf.table.total_ht') || 'Total HT', style: 'tableHeader', alignment: 'right' }
            ]
        ];

        if (quote.items && quote.items.length > 0) {
            quote.items.forEach(i => {
                const desc = i.description || i.desc || i18n.t('pdf.items_conform') || 'Prestation';
                const qty = i.quantity || 1;
                const price = i.unitPrice || i.price || 0;
                const total = qty * price;

                tableBody.push([
                    { text: desc, fontSize: 10, margin: [0, 5, 0, 5] },
                    { text: qty, alignment: 'center', fontSize: 10, margin: [0, 5, 0, 5] },
                    { text: this._format(price), alignment: 'right', fontSize: 10, margin: [0, 5, 0, 5] },
                    { text: this._format(total), alignment: 'right', fontSize: 10, margin: [0, 5, 0, 5] }
                ]);
            });
        } else {
            tableBody.push([
                { text: i18n.t('pdf.items_conform') || 'Prestations Réalisées conformes au devis', margin: [0, 5, 0, 5], colSpan: 3 },
                {},
                {},
                { text: this._format(quote.subtotal || 0), alignment: 'right', margin: [0, 5, 0, 5] }
            ]);
        }

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 60],
            styles: this.commonStyles,
            defaultStyle: { font: 'Roboto', fontSize: 10 },
            content: [
                {
                    columns: [
                        { text: i18n.t('pdf.invoice.title'), style: 'header' },
                        { text: `${i18n.t('pdf.number')} ${quote.number || quote.id || 'FAC-1001'}`, style: 'quoteNumber' }
                    ]
                },
                {
                    text: `${i18n.t('pdf.date_issue')}: ${dateStr}${quote.id ? `\n${i18n.t('pdf.reference')}: ${quote.id}` : ''}`,
                    style: 'small',
                    margin: [0, 0, 0, 30]
                },
                {
                    columns: [
                        {
                            width: '50%',
                            text: [
                                { text: `${i18n.t('pdf.provider_issuer')}:\n`, bold: true, color: '#4b5563' },
                                `${providerName}\n`,
                                `${Auth.user?.email || ''}\n`
                            ]
                        },
                        {
                            width: '50%',
                            text: [
                                { text: `${i18n.t('pdf.client_billed')}:\n`, bold: true, color: '#4b5563' },
                                `${client?.name || i18n.t('pdf.client_unknown')}\n`,
                                `${client?.company || ''}\n`,
                                `${client?.address || ''}\n`,
                                `${client?.email || ''}\n`
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
                                    [{ text: `${i18n.t('pdf.total.items') || 'Prestations HT'}:`, style: 'totalLabel', border: [false, false, false, false] }, { text: this._format(quote.itemsSubtotal || 0), style: 'totalValue', border: [false, false, false, false] }],
                                    [{ text: `${i18n.t('pdf.total.service') || 'Service & Gestion'}:`, style: 'totalLabel', border: [false, false, false, false] }, { text: this._format(quote.margin || 0), style: 'totalValue', border: [false, false, false, false] }],
                                    [{ text: `${i18n.t('pdf.total.subtotal') || 'Total HT'}:`, style: 'totalLabel', border: [false, false, false, false] }, { text: this._format(quote.subtotal || 0), style: 'totalValue', border: [false, false, false, false] }],
                                    [{ text: `${i18n.t('pdf.total.tax') || 'TVA'} (${quote.taxRate || 0}%):`, style: 'totalLabel', border: [false, false, false, false] }, { text: this._format(quote.tax || 0), style: 'totalValue', border: [false, false, false, false] }],
                                    [{ text: `${i18n.t('pdf.total.net_to_pay') || 'NET À PAYER'}:`, style: 'grandTotalLabel', border: [false, true, false, false] }, { text: this._format(quote.total || 0), style: 'grandTotalValue', border: [false, true, false, false] }]
                                ]
                            },
                            layout: 'noBorders'
                        }
                    ],
                    margin: [0, 0, 0, 40]
                },
                {
                    text: i18n.t('pdf.legal.title'),
                    style: 'subheader'
                },
                {
                    text: (i18n.t('pdf.legal.penalties', { amount: (typeof App !== 'undefined' ? App.formatCurrency(40) : '40 €') })) + '.\n' +
                        (quote.tax === 0 ? i18n.t('pdf.legal.no_tax') : ''),
                    style: 'small'
                }
            ],
            info: {
                title: `${i18n.t('pdf.invoice.title')}_${quote.number || quote.id}`,
                author: providerName,
                subject: i18n.t('pdf.invoice.subject'),
                keywords: 'facture, soloprice'
            }
        };

        this._downloadRealPdf(docDefinition, `${i18n.t('pdf.invoice.title')}_${quote.number || quote.id}.pdf`);
    },

    async generateRoadmap() {
        if (typeof App !== 'undefined') App.showNotification('Fonction Roadmap (PDFMake) à configurer via DocDefinition', 'info');
    },

    async generateReceiptsLedger(invoices, user) {
        if (!invoices || invoices.length === 0) {
            if (typeof App !== 'undefined') App.showNotification('Aucune facture à exporter.', 'info');
            return;
        }

        const config = (typeof App !== 'undefined') ? App.getCurrencyConfig() : { locale: 'fr-FR' };
        const dateStr = new Date().toLocaleDateString(config.locale);
        const providerName = user?.company?.name || user?.email || 'Prestataire';

        // Entête du tableau
        const tableBody = [
            [
                { text: 'Date', style: 'tableHeader' },
                { text: 'Facture', style: 'tableHeader' },
                { text: 'Client', style: 'tableHeader' },
                { text: 'Montant HT', style: 'tableHeader', alignment: 'right' },
                { text: 'Montant TTC', style: 'tableHeader', alignment: 'right' },
                { text: 'Statut', style: 'tableHeader', alignment: 'center' }
            ]
        ];

        let totalHT = 0;
        let totalTTC = 0;

        // Tri par date
        const sortedInvoices = [...invoices].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        sortedInvoices.forEach(inv => {
            const amountHT = inv.subtotal || 0;
            const amountTTC = inv.total || 0;
            totalHT += amountHT;
            totalTTC += amountTTC;

            tableBody.push([
                { text: new Date(inv.createdAt).toLocaleDateString(config.locale), fontSize: 9 },
                { text: inv.number || 'N/A', fontSize: 9, bold: true },
                { text: (Storage.getClient(inv.clientId)?.name || 'Client inconnu'), fontSize: 9 },
                { text: this._format(amountHT), alignment: 'right', fontSize: 9 },
                { text: this._format(amountTTC), alignment: 'right', fontSize: 9 },
                { text: inv.status === 'paid' ? 'PAYÉ' : 'EN ATTENTE', alignment: 'center', fontSize: 8, color: inv.status === 'paid' ? '#10b981' : '#f59e0b' }
            ]);
        });

        // Ligne de total
        tableBody.push([
            { text: 'TOTAUX PÉRIODE', colSpan: 3, bold: true, margin: [0, 5, 0, 5] },
            {},
            {},
            { text: this._format(totalHT), alignment: 'right', bold: true, margin: [0, 5, 0, 5] },
            { text: this._format(totalTTC), alignment: 'right', bold: true, margin: [0, 5, 0, 5], color: '#10b981' },
            {}
        ]);

        const docDefinition = {
            pageSize: 'A4',
            pageOrientation: 'landscape',
            pageMargins: [30, 40, 30, 40],
            styles: this.commonStyles,
            defaultStyle: { font: 'Roboto', fontSize: 10 },
            content: [
                {
                    columns: [
                        { text: 'LIVRE DES RECETTES', style: 'header' },
                        { text: `Généré le ${dateStr}`, alignment: 'right', style: 'small' }
                    ]
                },
                {
                    text: [
                        { text: `${providerName}\n`, bold: true },
                        { text: `SIRET: ${user?.company?.siret || 'Non renseigné'}\n`, fontSize: 9 },
                        { text: `Document obligatoire pour la comptabilité Micro-Entrepreneur (Art. L123-28 du Code de commerce)`, fontSize: 8, color: '#6b7280', italic: true }
                    ],
                    margin: [0, 10, 0, 25]
                },
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '15%', '*', '15%', '15%', 'auto'],
                        body: tableBody
                    },
                    layout: 'lightHorizontalLines'
                }
            ],
            footer: (currentPage, pageCount) => {
                return {
                    text: `Page ${currentPage} / ${pageCount} - SoloPrice Pro Receipt Ledger`,
                    alignment: 'center',
                    fontSize: 8,
                    margin: [0, 10, 0, 0]
                };
            }
        };

        this._downloadRealPdf(docDefinition, `Livre_des_Recettes_${new Date().getFullYear()}.pdf`);
    },

    async generatePurchaseLedger(year, data) {
        if (typeof App !== 'undefined') App.showNotification('Registre des Achats à venir dans une prochaine version.', 'info');
    }
};

window.PDFGenerator = PDFGenerator;
