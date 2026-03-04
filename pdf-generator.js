// SoloPrice Pro - PDF Generator

const PDFGenerator = {
    generateInvoice(invoice, client, user, isPreview = false) {
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
        doc.text(`Référence: ${invoice.number} | Émission: ${date} | Échéance: ${dueDate}`, 14, 32);

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
        const splitProvider = doc.splitTextToSize(`${providerName}\n${providerAddress}\n${providerEmail}\n${providerPhone}\n${providerSiret ? 'SIRET: '+providerSiret : ''}`, 80);
        doc.text(splitProvider, 18, 55);
        
        const splitClient = doc.splitTextToSize(`${client?.name || 'Client Inconnu'}\n${client?.company || ''}\n${client?.address || ''}\n${client?.email || ''}\n${client?.vat_number ? 'TVA: '+client.vat_number : ''}`, 80);
        doc.text(splitClient, 114, 55);

        // Table
        const tableData = invoice.items.map(item => [
            { content: item.desc + (item.subdesc ? ' - ' + item.subdesc : ''), styles: { fontStyle: 'bold' } },
            item.quantity,
            `${item.price} €`,
            `${item.total} €`
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
        doc.text(`${invoice.subtotal} €`, 190, finalY + 8, { align: 'right' });
        
        doc.text(`TVA (${invoice.taxContext?.vat !== undefined ? invoice.taxContext.vat : settings.taxRate}%):`, 114, finalY + 16);
        doc.text(`${invoice.tax} €`, 190, finalY + 16, { align: 'right' });
        
        doc.setTextColor(17, 24, 39);
        doc.setFont(undefined, 'bold');
        doc.text('TOTAL TTC:', 114, finalY + 26);
        doc.setFontSize(14);
        doc.text(`${invoice.total} €`, 190, finalY + 26, { align: 'right' });

        finalY += 40;

        // Legal 
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(107, 114, 128);
        
        if (invoice.tax === 0) {
            doc.text(`${invoice.taxContext?.taxName || 'TVA'} non applicable, art. 293 B du CGI`, 14, finalY);
        }
        
        doc.text(`Pénalités de retard : 3 fois le taux d'intérêt légal + 40 € d'indemnité forfaitaire (Art. L441-6).`, 14, finalY + 6);
        
        if (user.company?.footer_mentions) {
             const footerSplit = doc.splitTextToSize(user.company.footer_mentions, 180);
             doc.text(footerSplit, 14, finalY + 15);
        }

        // Send to share blob
        this._downloadVectorPdf(doc, `Facture${isPreview ? '_Aperçu' : ''}_${invoice.number}.pdf`);
    },


    generateQuote(quote, client, user, isPreview = false) {
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
        doc.text(`Référence: ${quote.number} | Date: ${date} | Échéance: ${validUntil}`, 14, 32);

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
        const splitProvider = doc.splitTextToSize(`${providerName}\n${providerAddress}\n${providerEmail}\n${providerPhone}\n${providerSiret ? 'SIRET: '+providerSiret : ''}`, 80);
        doc.text(splitProvider, 18, 55);
        
        const splitClient = doc.splitTextToSize(`${client?.name || 'Client Inconnu'}\n${client?.company || ''}\n${client?.address || ''}\n${client?.email || ''}\n${client?.vat_number ? 'TVA: '+client.vat_number : ''}`, 80);
        doc.text(splitClient, 114, 55);

        // Table
        const tableData = quote.items.map(item => [
            { content: item.desc + (item.subdesc ? ' - ' + item.subdesc : ''), styles: { fontStyle: 'bold' } },
            item.quantity,
            `${item.price} €`,
            `${item.total} €`
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
        doc.text(`${quote.subtotal} €`, 190, finalY + 8, { align: 'right' });
        
        doc.setTextColor(16, 185, 129);
        doc.text('Service & Gestion:', 114, finalY + 16);
        doc.text(`${quote.margin} €`, 190, finalY + 16, { align: 'right' });
        
        doc.setTextColor(17, 24, 39);
        doc.setFont(undefined, 'bold');
        doc.text('TOTAL TTC:', 114, finalY + 28);
        doc.setFontSize(14);
        doc.text(`${quote.total} €`, 190, finalY + 28, { align: 'right' });

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
        doc.text(`1. PART PRESTATAIRE (${settings.developerSplit}% HT)`, 18, finalY + 7);
        doc.setFontSize(9);
        doc.setTextColor(17, 24, 39);
        doc.setFont(undefined, 'normal');
        doc.text(`Destinataire : ${providerName}`, 18, finalY + 14);
        doc.text('Règlement sur l\'espace client.', 18, finalY + 20);

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
        doc.text(`Ce devis est valable jusqu'au ${validUntil}.`, 14, finalY);
        doc.setTextColor(16, 185, 129);
        doc.text('La Protection SoloPrice est une clause contractuelle obligatoire pour la validation.', 14, finalY + 6);
        
        doc.setTextColor(17, 24, 39);
        doc.setFont(undefined, 'bold');
        if (quote.tax === 0) {
            doc.text('TVA non applicable, art. 293 B du CGI', 14, finalY + 12);
        }
        
        doc.text('BON POUR ACCORD', 140, finalY + 25);

        // Send to share blob
        this._downloadVectorPdf(doc, `Devis${isPreview ? '_Aperçu' : ''}_${quote.number}.pdf`);
    },


    generateReceiptsLedger(invoices, user) {
        const year = new Date().getFullYear();
        const paidInvoices = invoices.filter(i => i.status === 'paid').sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const total = paidInvoices.reduce((sum, i) => sum + i.total, 0);

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=850">
                <title>Livre des Recettes - ${year}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; color: #333; }
                    .header { border-bottom: 2px solid #10b981; margin-bottom: 30px; padding-bottom: 10px; }
                    h1 { color: #10b981; margin: 0; }
                    .meta { display: flex; justify-content: space-between; margin-bottom: 40px; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; }
                    th { background: #f3f4f6; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-size: 12px; }
                    td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
                    .total-row { font-weight: bold; background: #f9fafb; }
                    .footer { margin-top: 50px; font-size: 10px; color: #6b7280; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Livre des Recettes</h1>
                    <p>Conforme aux obligations de l'auto-entrepreneur (Art. L123-28 du Code de commerce)</p>
                </div>
                <div class="meta">
                    <div>
                        <strong>Entreprise :</strong> ${user.company.name}<br>
                        <strong>SIRET :</strong> ${user.company.siret || '-'}
                    </div>
                    <div>
                        <strong>Période :</strong> Année ${year}<br>
                        <strong>Généré le :</strong> ${new Date().toLocaleDateString()}
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date encaissement</th>
                            <th>Référence Facture</th>
                            <th>Client</th>
                            <th>Nature</th>
                            <th style="text-align: right;">Montant Encaissé</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paidInvoices.map(i => `
                            <tr>
                                <td>${new Date(i.createdAt).toLocaleDateString()}</td>
                                <td>${i.number}</td>
                                <td>${Storage.getClient(i.clientId)?.name || 'Client'}</td>
                                <td>Prestation de services</td>
                                <td style="text-align: right;">${App.formatCurrency(i.total)}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td colspan="4">TOTAL ENCAISSÉ</td>
                            <td style="text-align: right;">${App.formatCurrency(total)}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="footer">Document généré par SoloPrice Pro &bull; Certifié conforme aux obligations légales de tenue de registre.</div>
            </body>
            </html>
        `;

        this._downloadRealPdf(htmlContent, `Livre_Recettes_${year}.pdf`);
    },

    generatePurchasesLedger(expenses, user) {
        const year = new Date().getFullYear();
        const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
        const total = sortedExpenses.reduce((sum, e) => sum + e.amount, 0);

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=850">
                <title>Registre des Achats - ${year}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; color: #333; }
                    .header { border-bottom: 2px solid #ef4444; margin-bottom: 30px; padding-bottom: 10px; }
                    h1 { color: #ef4444; margin: 0; }
                    .meta { display: flex; justify-content: space-between; margin-bottom: 40px; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; }
                    th { background: #f3f4f6; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-size: 12px; }
                    td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
                    .total-row { font-weight: bold; background: #f9fafb; }
                    .footer { margin-top: 50px; font-size: 10px; color: #6b7280; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Registre des Achats</h1>
                    <p>Conforme aux obligations de l'auto-entrepreneur (Art. L123-28 du Code de commerce)</p>
                </div>
                <div class="meta">
                    <div>
                        <strong>Entreprise :</strong> ${user.company.name}<br>
                        <strong>SIRET :</strong> ${user.company.siret || '-'}
                    </div>
                    <div>
                        <strong>Période :</strong> Année ${year}<br>
                        <strong>Généré le :</strong> ${new Date().toLocaleDateString()}
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date achat</th>
                            <th>Fournisseur / Description</th>
                            <th>Catégorie</th>
                            <th style="text-align: right;">Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedExpenses.map(e => `
                            <tr>
                                <td>${new Date(e.date).toLocaleDateString()}</td>
                                <td>${e.description}</td>
                                <td>${e.category}</td>
                                <td style="text-align: right;">${App.formatCurrency(e.amount)}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td colspan="3">TOTAL ACHATS</td>
                            <td style="text-align: right;">${App.formatCurrency(total)}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="footer">Document généré par SoloPrice Pro &bull; Certifié conforme aux obligations légales de tenue de registre.</div>
            </body>
            </html>
        `;

        this._downloadRealPdf(htmlContent, `Registre_Achats_${year}.pdf`);
    },

    openBlob(htmlContent) {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    generateTJMCard(results, data, user) {
        const date = new Date().toLocaleDateString('fr-FR');
        const advice = PricingEngine.getStrategicAdvice(results.dailyRate, data.sector);
        const providerName = user?.company?.name || user?.user_metadata?.company_name || 'Expert Indépendant';

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ma Roadmap de Rentabilité - SoloPrice Pro</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
                <style>
                    :root { color-scheme: light only !important; --primary: #10b981; --primary-dark: #059669; --text: #111827; --text-light: #6b7280; --border: #e5e7eb; --bg-light: #f9fafb; }
                    html, body { min-width: 800px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
                    body { font-family: 'Inter', sans-serif; color: #111827 !important; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 40px; background: #ffffff !important; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
                    @media (prefers-color-scheme: dark) {
                        body { background: #ffffff !important; color: #111827 !important; }
                        * { color: #111827 !important; border-color: #e5e7eb !important; }
                        .text-light { color: #6b7280 !important; }
                        .card { background: #f9fafb !important; border-color: #10b981 !important; }
                        .logo { color: #10b981 !important; }
                        .badge { background: #10b981 !important; color: white !important; }
                    }
                    .card { border: 2px solid var(--primary); border-radius: 24px; padding: 40px; position: relative; overflow: hidden; background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%); }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
                    .logo { font-size: 20px; font-weight: 900; color: var(--primary); letter-spacing: -1px; }
                    .badge { background: var(--primary); color: white; padding: 6px 12px; border-radius: 99px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
                    
                    .title-section { text-align: center; margin-bottom: 50px; }
                    .title-section h1 { font-size: 32px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px; }
                    .title-section p { color: var(--text-light); font-size: 16px; font-weight: 500; }

                    .main-stats { display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; margin-bottom: 50px; }
                    .tjm-box { background: var(--primary); color: white; padding: 30px; border-radius: 20px; text-align: center; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4); }
                    .tjm-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9; margin-bottom: 5px; }
                    .tjm-value { font-size: 56px; font-weight: 900; line-height: 1; margin-bottom: 10px; }
                    .tjm-sub { font-size: 14px; opacity: 0.8; }

                    .finance-box { padding: 25px; border: 1px solid var(--border); border-radius: 20px; background: white; }
                    .finance-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); }
                    .finance-row:last-child { border: none; }
                    .finance-label { font-size: 13px; color: var(--text-light); }
                    .finance-val { font-weight: 700; font-size: 15px; }

                    .strategy-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 50px; }
                    .pillar { padding: 20px; border-radius: 16px; border: 1px solid var(--border); background: white; }
                    .pillar h3 { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--primary); margin: 0 0 10px 0; letter-spacing: 1px; }
                    .pillar p { font-size: 13px; color: var(--text); margin: 0; font-weight: 500; }

                    .next-step { background: #fefce8; border: 1px solid #fef08a; padding: 30px; border-radius: 20px; text-align: center; }
                    .next-step h2 { font-size: 18px; font-weight: 800; margin: 0 0 10px 0; color: #854d0e; }
                    .next-step p { font-size: 14px; color: #713f12; margin-bottom: 20px; }
                    .btn-fake { display: inline-block; background: var(--primary); color: white; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; }

                    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: var(--text-light); }
                    .watermark-bg { position: absolute; bottom: -50px; right: -50px; font-size: 200px; font-weight: 900; color: rgba(16, 185, 129, 0.03); transform: rotate(-25deg); pointer-events: none; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="watermark-bg">SOLO</div>
                    <div class="header">
                        <div class="logo">SOLOPRICE <span style="color:var(--text)">PRO</span></div>
                        <div class="badge">Stratégie Individuelle</div>
                    </div>

                    <div class="title-section">
                        <h1>Ma Roadmap de Rentabilité</h1>
                        <p>Préparé pour <strong>${providerName}</strong> &bull; ${date}</p>
                    </div>

                    <div class="main-stats">
                        <div class="tjm-box">
                            <div class="tjm-label">TJM de Sécurité</div>
                            <div class="tjm-value">${typeof App !== 'undefined' ? App.formatCurrency(results.dailyRate) : results.dailyRate + '€'}</div>
                            <div class="tjm-sub">Tarif Journalier Minimum (H.T)</div>
                        </div>

                        <div class="finance-box">
                            <div class="finance-row">
                                <span class="finance-label">CA Requis / mois</span>
                                <span class="finance-val">${typeof App !== 'undefined' ? App.formatCurrency(results.revenueNeeded) : results.revenueNeeded + '€'}</span>
                            </div>
                            <div class="finance-row">
                                <span class="finance-label">Réserve Cotisations</span>
                                <span class="finance-val" style="color:#ef4444;">-${typeof App !== 'undefined' ? App.formatCurrency(results.taxAmount) : results.taxAmount + '€'}</span>
                            </div>
                            <div class="finance-row">
                                <span class="finance-label">Revenu Net Cible</span>
                                <span class="finance-val" style="color:var(--primary-dark);">${typeof App !== 'undefined' ? App.formatCurrency(data.monthlyRevenue || 0) : data.monthlyRevenue + '€'}</span>
                            </div>
                            <div class="finance-row" style="border: none;">
                                <span class="finance-label">Rythme Facturé</span>
                                <span class="finance-val">${data.workingDays} j/mois</span>
                            </div>
                        </div>
                    </div>

                    <div class="strategy-grid">
                        <div class="pillar">
                            <h3>Positionnement Marché</h3>
                            <p>${advice.diagnostic.title}</p>
                            <p style="font-size: 11px; color: var(--text-light); margin-top: 5px;">${advice.diagnostic.desc}</p>
                        </div>
                        <div class="pillar">
                            <h3>Argumentaire Valeur</h3>
                            <p>${advice.valueProposition}</p>
                        </div>
                        <div class="pillar">
                            <h3>Cible Client Idéale</h3>
                            <p>${advice.idealTarget}</p>
                        </div>
                        <div class="pillar">
                            <h3>Levier d'Optimisation</h3>
                            <p>${advice.optimization}</p>
                        </div>
                    </div>

                    <div class="next-step">
                        <h2> Prêt à passer à l'action ?</h2>
                        <p>Votre TJM de sécurité est maintenant défini. La prochaine étape est de l'appliquer sur une mission réelle pour vérifier sa validité terrain.</p>
                        <div class="btn-fake">Utiliser le Chiffrage Projet</div>
                    </div>

                    <div class="footer">
                        Généré par SoloPrice Pro &bull; www.soloprice-pro.fr &bull; Le copilote financier des indépendants.
                    </div>
                </div>
            </body>
            </html>
        `;

        this._downloadRealPdf(htmlContent, `Roadmap_Rentabilite.pdf`);
    },

    async _downloadRealPdf(htmlContent, filename) {
        if (typeof html2pdf === 'undefined') {
            console.error('html2pdf library is not loaded');
            App.showNotification('Erreur système: Librairie PDF manquante.', 'error');
            return;
        }

        App.showNotification('Génération du document PDF en cours...', 'info');

        // iOS Safari suspends canvas rendering for elements outside viewport (e.g. top: -9999px)
        // Position it under everything but within viewport bounds using opacity
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '850px';
        iframe.style.height = '1200px';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.zIndex = '-100';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        // Wait for styles and fonts to load
        setTimeout(async () => {
            const element = iframeDoc.body;
            element.style.overflow = 'hidden'; // Prevent scrollbars in output

            const opt = {
                margin: [0, 0, 0, 0],
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, windowWidth: 850, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            try {
                // Generate Blob instead of saving directly
                const pdfBlob = await html2pdf().set(opt).from(element).output('blob');

                // Native Share (iOS / Android)
                const file = new File([pdfBlob], filename, { type: 'application/pdf' });
                // Only try sharing if supported and we can share files
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
            } finally {
                document.body.removeChild(iframe);
            }
        }, 1500);
    },

    
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

    _fallbackDownload(blob, filename) {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            App.showNotification('Document téléchargé avec succès.', 'success');
        }, 150);
    }
};
