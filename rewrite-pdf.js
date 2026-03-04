const fs = require('fs');

let content = fs.readFileSync('pdf-generator.js', 'utf8');

// We will inject the _downloadVectorPdf function right before _fallbackDownload
const downloadVectorFunc = `
    async _downloadVectorPdf(doc, filename) {
        App.showNotification('Génération du document PDF en cours...', 'info');
        try {
            const pdfBlob = doc.output('blob');
            const file = new File([pdfBlob], filename, { type: 'application/pdf' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: filename,
                        text: 'Voici votre document SoloPrice Pro'
                    });
                    App.showNotification('Partage du document ouvert.', 'success');
                } catch (shareError) {
                    if (shareError.name !== 'AbortError') {
                        this._fallbackDownload(pdfBlob, filename);
                    }
                }
            } else {
                // Desktop / Non-supported browsers Fallback
                this._fallbackDownload(pdfBlob, filename);
            }
        } catch (error) {
            console.error('PDF Generation Error:', error);
            App.showNotification('Erreur lors de la génération du PDF.', 'error');
        }
    },
`;

if (!content.includes('_downloadVectorPdf')) {
    content = content.replace('_fallbackDownload(blob, filename)', downloadVectorFunc + '\n    _fallbackDownload(blob, filename)');
}

// Write a pure vector generator for generateQuote
const quoteRegex = /generateQuote\s*\([^\{]+\{[\s\S]*?(?=\n\s*generate[A-Z]|openBlob)/m;

const newQuoteFunc = `generateQuote(quote, client, user, isPreview = false) {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            App.showNotification('Librairie PDF manquante (jsPDF).', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        
        const settings = Storage.get(Storage.KEYS.SETTINGS);
        const date = new Date(quote.createdAt).toLocaleDateString('fr-FR');
        
        const providerName = user?.company?.name || user?.user_metadata?.company_name || 'Votre Entreprise';
        const providerAddress = user?.company?.address || user?.user_metadata?.address || '';
        const providerEmail = user?.company?.email || user?.email || '';
        const providerPhone = user?.company?.phone || '';
        const providerSiret = user?.company?.siret || '';
        const validityDays = settings.quoteValidityDays || 30;
        const validUntil = new Date(new Date(quote.createdAt).getTime() + validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR');

        // Styles
        doc.setFont("helvetica");
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(17, 24, 39);
        doc.text(isPreview ? 'DEVIS (APERÇU)' : 'DEVIS', 14, 25);
        
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(\`Référence: \${quote.number} | Date: \${date} | Échéance: \${validUntil}\`, 14, 32);

        // Boxes (Provider left, Client right)
        doc.setFillColor(249, 250, 251);
        doc.rect(14, 40, 85, 45, 'F');
        doc.rect(110, 40, 85, 45, 'F');
        
        doc.setFontSize(11);
        doc.setTextColor(17, 24, 39);
        doc.setFont(undefined, 'bold');
        doc.text('PRESTATAIRE', 18, 48);
        doc.text('CLIENT', 114, 48);
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        const splitProvider = doc.splitTextToSize(\`\${providerName}\\n\${providerAddress}\\n\${providerEmail}\\n\${providerPhone}\\n\${providerSiret ? 'SIRET: '+providerSiret : ''}\`, 80);
        doc.text(splitProvider, 18, 55);
        
        const splitClient = doc.splitTextToSize(\`\${client?.name || 'Client Inconnu'}\\n\${client?.company || ''}\\n\${client?.address || ''}\\n\${client?.email || ''}\\n\${client?.vat_number ? 'TVA: '+client.vat_number : ''}\`, 80);
        doc.text(splitClient, 114, 55);

        // Table
        const tableData = quote.items.map(item => [
            { content: item.desc + (item.subdesc ? ' - ' + item.subdesc : ''), styles: { fontStyle: 'bold' } },
            item.quantity,
            \`\${item.price} €\`,
            \`\${item.total} €\`
        ]);

        let finalY = 95;
        
        if (doc.autoTable) {
            doc.autoTable({
                startY: 95,
                head: [['Désignation des prestations', 'Quantité', 'Prix Unitaire', 'Total HT']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [248, 250, 252], textColor: [17, 24, 39], fontStyle: 'bold' },
                styles: { font: "helvetica", fontSize: 10, cellPadding: 5 },
                columnStyles: {
                    0: { cellWidth: 90 },
                    1: { halign: 'center' },
                    2: { halign: 'right' },
                    3: { halign: 'right' }
                }
            });
            finalY = doc.lastAutoTable.finalY + 15;
        }

        // Totals Box
        doc.setFillColor(249, 250, 251);
        doc.rect(110, finalY, 85, 40, 'F');
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text('Prestations HT:', 114, finalY + 8);
        doc.text(\`\${quote.subtotal} €\`, 190, finalY + 8, { align: 'right' });
        
        doc.setTextColor(16, 185, 129);
        doc.text('Service & Gestion:', 114, finalY + 16);
        doc.text(\`\${quote.margin} €\`, 190, finalY + 16, { align: 'right' });
        
        doc.setTextColor(17, 24, 39);
        doc.setFont(undefined, 'bold');
        doc.text('TOTAL TTC:', 114, finalY + 28);
        doc.setFontSize(14);
        doc.text(\`\${quote.total} €\`, 190, finalY + 28, { align: 'right' });

        finalY += 50;

        // Legal & Protections
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text('Instructions de Règlement (Paiement Direct)', 14, finalY);
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text('Ce document comporte deux instructions de règlement distinctes pour le prestataire et les frais de service.', 14, finalY + 6);
        
        finalY += 15;
        
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(229, 231, 235);
        doc.rect(14, finalY, 85, 25);
        
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(\`1. PART PRESTATAIRE (\${settings.developerSplit}% HT)\`, 18, finalY + 7);
        doc.setFontSize(9);
        doc.setTextColor(17, 24, 39);
        doc.setFont(undefined, 'normal');
        doc.text(\`Destinataire : \${providerName}\`, 18, finalY + 14);
        doc.text('Règlement sur l\\'espace client.', 18, finalY + 20);

        doc.rect(110, finalY, 85, 25);
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('2. PROTECTION SOLOPRICE', 114, finalY + 7);
        doc.setFontSize(9);
        doc.setTextColor(17, 24, 39);
        doc.setFont(undefined, 'normal');
        doc.text('Destinataire : SoloPrice Pro', 114, finalY + 14);
        doc.text('Active la garantie de protection.', 114, finalY + 20);

        finalY += 35;
        
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(\`Ce devis est valable jusqu'au \${validUntil}.\`, 14, finalY);
        doc.setTextColor(16, 185, 129);
        doc.text('La Protection SoloPrice est une clause contractuelle obligatoire pour la validation.', 14, finalY + 6);
        
        doc.setTextColor(17, 24, 39);
        doc.setFont(undefined, 'bold');
        if (quote.tax === 0) {
            doc.text('TVA non applicable, art. 293 B du CGI', 14, finalY + 12);
        }
        
        doc.text('BON POUR ACCORD', 140, finalY + 25);

        // Send to share blob
        this._downloadVectorPdf(doc, \`Devis\${isPreview ? '_Aperçu' : ''}_\${quote.number}.pdf\`);
    },
`;

/// Do the same for generateInvoice but keep it extremely robust and minimal.
const invoiceRegex = /generateInvoice\s*\([^\{]+\{[\s\S]*?(?=\n\s*generateQuote)/m;

const newInvoiceFunc = `generateInvoice(invoice, client, user, isPreview = false) {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            App.showNotification('Librairie PDF manquante (jsPDF).', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        
        const settings = Storage.get(Storage.KEYS.SETTINGS);
        const date = new Date(invoice.createdAt).toLocaleDateString('fr-FR');
        const dueDate = new Date(invoice.dueDate).toLocaleDateString('fr-FR');
        
        const providerName = user?.company?.name || user?.user_metadata?.company_name || 'Votre Entreprise';
        const providerAddress = user?.company?.address || user?.user_metadata?.address || '';
        const providerEmail = user?.company?.email || user?.email || '';
        const providerPhone = user?.company?.phone || '';
        const providerSiret = user?.company?.siret || '';

        // Styles
        doc.setFont("helvetica");
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(17, 24, 39);
        doc.text(isPreview ? 'FACTURE (APERÇU)' : 'FACTURE', 14, 25);
        
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(\`Référence: \${invoice.number} | Émission: \${date} | Échéance: \${dueDate}\`, 14, 32);

        // Boxes
        doc.setFillColor(249, 250, 251);
        doc.rect(14, 40, 85, 45, 'F');
        doc.rect(110, 40, 85, 45, 'F');
        
        doc.setFontSize(11);
        doc.setTextColor(17, 24, 39);
        doc.setFont(undefined, 'bold');
        doc.text('PRESTATAIRE', 18, 48);
        doc.text('CLIENT', 114, 48);
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        const splitProvider = doc.splitTextToSize(\`\${providerName}\\n\${providerAddress}\\n\${providerEmail}\\n\${providerPhone}\\n\${providerSiret ? 'SIRET: '+providerSiret : ''}\`, 80);
        doc.text(splitProvider, 18, 55);
        
        const splitClient = doc.splitTextToSize(\`\${client?.name || 'Client Inconnu'}\\n\${client?.company || ''}\\n\${client?.address || ''}\\n\${client?.email || ''}\\n\${client?.vat_number ? 'TVA: '+client.vat_number : ''}\`, 80);
        doc.text(splitClient, 114, 55);

        // Table
        const tableData = invoice.items.map(item => [
            { content: item.desc + (item.subdesc ? ' - ' + item.subdesc : ''), styles: { fontStyle: 'bold' } },
            item.quantity,
            \`\${item.price} €\`,
            \`\${item.total} €\`
        ]);

        let finalY = 95;
        
        if (doc.autoTable) {
            doc.autoTable({
                startY: 95,
                head: [['Désignation des prestations', 'Quantité', 'Prix Unitaire', 'Total HT']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [248, 250, 252], textColor: [17, 24, 39], fontStyle: 'bold' },
                styles: { font: "helvetica", fontSize: 10, cellPadding: 5 },
                columnStyles: {
                    0: { cellWidth: 90 },
                    1: { halign: 'center' },
                    2: { halign: 'right' },
                    3: { halign: 'right' }
                }
            });
            finalY = doc.lastAutoTable.finalY + 15;
        }

        // Totals Box
        doc.setFillColor(249, 250, 251);
        doc.rect(110, finalY, 85, 30, 'F');
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text('Base Hors Taxes:', 114, finalY + 8);
        doc.text(\`\${invoice.subtotal} €\`, 190, finalY + 8, { align: 'right' });
        
        doc.text(\`TVA (\${invoice.taxContext?.vat !== undefined ? invoice.taxContext.vat : settings.taxRate}%):\`, 114, finalY + 16);
        doc.text(\`\${invoice.tax} €\`, 190, finalY + 16, { align: 'right' });
        
        doc.setTextColor(17, 24, 39);
        doc.setFont(undefined, 'bold');
        doc.text('TOTAL TTC:', 114, finalY + 26);
        doc.setFontSize(14);
        doc.text(\`\${invoice.total} €\`, 190, finalY + 26, { align: 'right' });

        finalY += 40;

        // Legal 
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(107, 114, 128);
        
        if (invoice.tax === 0) {
            doc.text(\`\${invoice.taxContext?.taxName || 'TVA'} non applicable, art. 293 B du CGI\`, 14, finalY);
        }
        
        doc.text(\`Pénalités de retard : 3 fois le taux d'intérêt légal + 40 € d'indemnité forfaitaire (Art. L441-6).\`, 14, finalY + 6);
        
        if (user.company?.footer_mentions) {
             const footerSplit = doc.splitTextToSize(user.company.footer_mentions, 180);
             doc.text(footerSplit, 14, finalY + 15);
        }

        // Send to share blob
        this._downloadVectorPdf(doc, \`Facture\${isPreview ? '_Aperçu' : ''}_\${invoice.number}.pdf\`);
    },
`;

content = content.replace(quoteRegex, newQuoteFunc);
content = content.replace(invoiceRegex, newInvoiceFunc);

fs.writeFileSync('pdf-generator.js', content, 'utf8');
console.log('Successfully injected jsPDF templates!');
