// SoloPrice Pro - PDF Generator

const PDFGenerator = {
    generateInvoice(invoice, client, user) {
        const settings = Storage.get(Storage.KEYS.SETTINGS);
        const date = new Date(invoice.createdAt).toLocaleDateString('fr-FR');
        const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-FR') : '-';

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Facture ${invoice.number}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    :root { --primary: #10b981; --primary-dark: #059669; --text: #000000; --text-light: #4b5563; --border: #e5e7eb; --bg-light: #f9fafb; }
                    * { box-sizing: border-box; }
                    body { font-family: 'Inter', system-ui, sans-serif; color: var(--text); line-height: 1.5; max-width: 850px; margin: 0 auto; padding: 50px; background: #fff; }
                    .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 60px; border-bottom: 1px solid var(--border); padding-bottom: 30px; }
                    .header-logo { max-height: 80px; max-width: 250px; object-fit: contain; }
                    .company-logo-type { font-size: 24px; font-weight: 800; color: var(--primary); letter-spacing: -0.02em; }
                    .company-details { font-size: 13px; color: var(--text-light); margin-top: 10px; }
                    .invoice-meta { text-align: right; }
                    .invoice-title { font-size: 24px; font-weight: 800; color: var(--primary); margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px; }
                    .meta-grid { display: grid; grid-template-columns: auto auto; gap: 5px 20px; font-size: 13px; color: var(--text-light); }
                    .meta-label { font-weight: 600; color: var(--text); }
                    
                    .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-bottom: 50px; }
                    .address-box h3 { font-size: 11px; font-weight: 700; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 5px; }
                    .address-box p { font-size: 14px; margin: 0; }
                    .address-box strong { font-size: 15px; color: var(--text); display: block; margin-bottom: 4px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                    th { background: var(--bg-light); padding: 12px 15px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
                    td { padding: 15px 15px; border-bottom: 1px solid var(--border); font-size: 14px; vertical-align: top; }
                    .item-desc { font-weight: 600; color: var(--text); margin-bottom: 4px; }
                    .item-subdesc { font-size: 12px; color: var(--text-light); }
                    
                    .totals-container { display: flex; justify-content: flex-end; }
                    .totals-table { width: 280px; }
                    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
                    .total-row.grand { border-top: 2px solid var(--primary); margin-top: 10px; padding-top: 12px; font-size: 18px; font-weight: 800; color: var(--primary); }
                    
                    .status-stamp {
                        position: absolute; top: 120px; left: 50%; transform: translateX(-50%) rotate(-12deg);
                        font-size: 48px; font-weight: 900; color: rgba(16, 185, 129, 0.2); border: 8px solid rgba(16, 185, 129, 0.2);
                        padding: 10px 30px; border-radius: 12px; pointer-events: none;
                    }
                    
                    .legal-section { margin-top: 60px; padding: 25px; background: var(--bg-light); border-radius: 12px; font-size: 12px; color: var(--text-light); }
                    .legal-section h4 { font-size: 13px; color: var(--text); margin-top: 0; margin-bottom: 10px; }
                    
                    .footer { margin-top: 40px; text-align: center; font-size: 10px; color: var(--text-light); border-top: 1px solid var(--border); padding-top: 20px; }

                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                ${invoice.status === 'paid' ? '<div class="status-stamp">PAYÉE</div>' : ''}
                
                <div class="header">
                    <div class="company-brand">
                        ${(user?.isPro && user.company.logo) ? `<img src="${user.company.logo}" class="header-logo">` : `<div class="company-logo-type">${user.company.name || 'SoloPrice Pro User'}</div>`}
                        <div class="company-details">
                            ${user.company.address || ''}<br>
                            ${user.company.email || ''} | ${user.company.phone || ''}
                        </div>
                    </div>
                    <div class="invoice-meta">
                        <h1 class="invoice-title">Facture</h1>
                        <div class="meta-grid">
                            <span class="meta-label">Référence</span> <span>${invoice.number}</span>
                            <span class="meta-label">Date</span> <span>${date}</span>
                            <span class="meta-label">Échéance</span> <span>${dueDate}</span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <div class="address-box">
                        <h3>Émetteur</h3>
                        <p>
                            <strong>${user.company.name}</strong>
                            ${user.company.siret ? `SIRET : ${user.company.siret}` : ''}
                        </p>
                    </div>
                    <div class="address-box">
                        <h3>Destinataire</h3>
                        <p>
                            <strong>${client.name}</strong>
                            ${client.address || ''}<br>
                            ${client.zipCode || ''} ${client.city || ''}<br>
                            ${client.email || ''}
                        </p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="min-width: 300px;">Prestation</th>
                            <th style="text-align: right;">Quantité</th>
                            <th style="text-align: right;">Prix Unitaire</th>
                            <th style="text-align: right;">Total HT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                        <tr>
                            <td>
                                <div class="item-desc">${item.description}</div>
                            </td>
                            <td style="text-align: right;">${item.quantity}</td>
                            <td style="text-align: right;">${App.formatCurrency(item.unitPrice)}</td>
                            <td style="text-align: right; font-weight: 600;">${App.formatCurrency(item.quantity * item.unitPrice)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="totals-container">
                    <div class="totals-table">
                        <div class="total-row">
                            <span class="text-light">Sous-total HT</span>
                            <span style="font-weight: 600;">${App.formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div class="total-row">
                            <span class="text-light">TVA (${settings.taxRate}%)</span>
                            <span style="font-weight: 600;">${App.formatCurrency(invoice.tax)}</span>
                        </div>
                        <div class="total-row grand">
                            <span>TOTAL TTC</span>
                            <span>${App.formatCurrency(invoice.total)}</span>
                        </div>
                    </div>
                </div>

                <div class="legal-section">
                    <h4>Informations de paiement</h4>
                    <p>
                        Règlement souhaité par virement bancaire.<br>
                        <strong>Échéance :</strong> ${dueDate}<br>
                        <em>Pénalités de retard : 3 fois le taux d'intérêt légal + 40€ d'indemnité forfaitaire (Art. L441-6).</em>
                    </p>
                    ${user.company.footer_mentions ? `<div style="margin-top: 15px; border-top: 1px solid var(--border); padding-top: 10px;">${user.company.footer_mentions}</div>` : ''}
                </div>

                <div class="footer">
                    ${(Storage.getTier() === 'expert') ? '' : 'Document généré par <strong>SoloPrice Pro</strong> &bull; www.soloprice-pro.fr'}
                </div>

                <script>
                    window.onload = function() { setTimeout(() => window.print(), 500); }
                </script>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        App.showNotification('Facture prête pour impression.', 'success');
    },

    generateQuote(quote, client, user) {
        const settings = Storage.get(Storage.KEYS.SETTINGS);
        const date = new Date(quote.createdAt).toLocaleDateString('fr-FR');

        // Dynamic validity
        const validityDays = settings.quoteValidityDays || 30;
        const validUntil = new Date(new Date(quote.createdAt).getTime() + validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Devis ${quote.number}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    :root { --primary: #10b981; --primary-dark: #059669; --text: #000000; --text-light: #4b5563; --border: #e5e7eb; --bg-light: #f9fafb; }
                    * { box-sizing: border-box; }
                    body { font-family: 'Inter', system-ui, sans-serif; color: var(--text); line-height: 1.5; max-width: 850px; margin: 0 auto; padding: 50px; background: #fff; }
                    .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 60px; border-bottom: 1px solid var(--border); padding-bottom: 30px; }
                    .header-logo { max-height: 80px; max-width: 250px; object-fit: contain; }
                    .company-logo-type { font-size: 24px; font-weight: 800; color: var(--primary); letter-spacing: -0.02em; }
                    .company-details { font-size: 13px; color: var(--text-light); margin-top: 10px; }
                    .invoice-meta { text-align: right; }
                    .invoice-title { font-size: 24px; font-weight: 800; color: var(--primary); margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px; }
                    .meta-grid { display: grid; grid-template-columns: auto auto; gap: 5px 20px; font-size: 13px; color: var(--text-light); }
                    .meta-label { font-weight: 600; color: var(--text); }
                    
                    .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-bottom: 50px; }
                    .address-box h3 { font-size: 11px; font-weight: 700; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 5px; }
                    .address-box p { font-size: 14px; margin: 0; }
                    .address-box strong { font-size: 15px; color: var(--text); display: block; margin-bottom: 4px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                    th { background: var(--bg-light); padding: 12px 15px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
                    td { padding: 15px 15px; border-bottom: 1px solid var(--border); font-size: 14px; vertical-align: top; }
                    .item-desc { font-weight: 600; color: var(--text); margin-bottom: 4px; }
                    
                    .totals-container { display: flex; justify-content: flex-end; }
                    .totals-table { width: 280px; }
                    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
                    .total-row.grand { border-top: 2px solid var(--primary); margin-top: 10px; padding-top: 12px; font-size: 18px; font-weight: 800; color: var(--primary); }
                    
                    .signature-area { display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; margin-top: 50px; page-break-inside: avoid; }
                    .signature-box { border: 1px solid var(--border); border-radius: 12px; padding: 25px; position: relative; min-height: 180px; background: var(--bg-light); }
                    .signature-label { font-size: 11px; font-weight: 700; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 80px; display: block; }
                    .signature-mention { font-size: 10px; color: var(--text-light); text-align: center; font-style: italic; }
                    
                    .footer { font-size: 10px; color: var(--text-light); border-top: 1px solid var(--border); padding-top: 20px; text-align: center; margin-top: 40px; }

                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-brand">
                        ${(user?.isPro && user.company.logo) ? `<img src="${user.company.logo}" class="header-logo">` : `<div class="company-logo-type">${user.company.name || 'SoloPrice Pro User'}</div>`}
                        <div class="company-details">
                            ${user.company.address || ''}<br>
                            ${user.company.email || ''} | ${user.company.phone || ''}
                        </div>
                    </div>
                    <div class="invoice-meta">
                        <h1 class="invoice-title">Devis</h1>
                        <div class="meta-grid">
                            <span class="meta-label">Référence</span> <span>${quote.number}</span>
                            <span class="meta-label">Date</span> <span>${date}</span>
                            <span class="meta-label">Échéance</span> <span>${validUntil}</span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <div class="address-box">
                        <h3>Prestataire</h3>
                        <p>
                            <strong>${user.company.name}</strong>
                            ${user.company.siret ? `SIRET : ${user.company.siret}` : ''}
                        </p>
                    </div>
                    <div class="address-box">
                        <h3>Client</h3>
                        <p>
                            <strong>${client.name}</strong>
                            ${client.address || ''}<br>
                            ${client.zipCode || ''} ${client.city || ''}<br>
                            ${client.email || ''}
                        </p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="min-width: 300px;">Désignation des prestations</th>
                            <th style="text-align: right;">Quantité</th>
                            <th style="text-align: right;">Prix Unitaire</th>
                            <th style="text-align: right;">Total HT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${quote.items.map(item => `
                        <tr>
                            <td>
                                <div class="item-desc">${item.description}</div>
                            </td>
                            <td style="text-align: right;">${item.quantity}</td>
                            <td style="text-align: right;">${App.formatCurrency(item.unitPrice)}</td>
                            <td style="text-align: right; font-weight: 600;">${App.formatCurrency(item.quantity * item.unitPrice)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="totals-container">
                    <div class="totals-table">
                        <div class="total-row">
                            <span class="text-light">Sous-total HT</span>
                            <span style="font-weight: 600;">${App.formatCurrency(quote.subtotal)}</span>
                        </div>
                        <div class="total-row">
                            <span class="text-light">TVA (${settings.taxRate}%)</span>
                            <span style="font-weight: 600;">${App.formatCurrency(quote.tax)}</span>
                        </div>
                        <div class="total-row grand">
                            <span>TOTAL TTC</span>
                            <span>${App.formatCurrency(quote.total)}</span>
                        </div>
                    </div>
                </div>

                <div class="signature-area">
                    <div style="font-size: 13px; color: var(--text-light);">
                        <p><strong>Conditions de vente :</strong></p>
                        <p>Ce devis est valable pour une durée de ${validityDays} jours à compter de sa date d'émission. Le début des travaux est conditionné par le retour de ce devis signé accompagné du versement de l'acompte convenu.</p>
                        ${user.company.footer_mentions ? `<div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid var(--border);">${user.company.footer_mentions}</div>` : ''}
                    </div>
                    <div class="signature-box">
                        <span class="signature-label">Bon pour accord</span>
                        <div class="signature-mention">Date, signature et cachet</div>
                    </div>
                </div>

                <div class="footer">
                    ${(Storage.getTier() === 'expert') ? '' : 'Devis généré par <strong>SoloPrice Pro</strong> &bull; www.soloprice-pro.fr'}
                </div>

                <script>
                    window.onload = function() { setTimeout(() => window.print(), 500); }
                </script>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.download = `Devis_${quote.number}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        App.showNotification('Devis prêt pour impression.', 'success');
    }
};
