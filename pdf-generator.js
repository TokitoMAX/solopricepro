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
                    
                    .trust-badge {
                        position: absolute; top: 20px; right: 20px;
                        background: var(--primary); color: white;
                        padding: 6px 12px; border-radius: 6px;
                        font-size: 9px; font-weight: 800;
                        text-transform: uppercase; letter-spacing: 0.5px;
                        display: flex; align-items: center; gap: 6px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }

                    .footer { margin-top: 40px; text-align: center; font-size: 10px; color: var(--text-light); border-top: 1px solid var(--border); padding-top: 20px; }
                    
                    .watermark {
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background-image: url("data:image/svg+xml,%3Csvg width='500' height='500' viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-size='35' font-weight='900' fill='rgba(0,0,0,0.03)' font-family='Arial' text-anchor='middle' transform='rotate(-35 250 250)'%3ESPÉCIMEN - SOLOPRICE PRO%3C/text%3E%3C/svg%3E");
                        pointer-events: none; z-index: -1;
                    }

                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="trust-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    Document Sécurisé via SoloPrice Pro
                </div>
                ${!Storage.isPro() ? '<div class="watermark"></div>' : ''}
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
                            <span class="text-light">Prestations HT</span>
                            <span style="font-weight: 600;">${App.formatCurrency(invoice.itemsSubtotal || invoice.subtotal)}</span>
                        </div>
                        <div class="total-row" style="color: var(--primary);">
                            <span class="text-light">Frais de Service (15%)</span>
                            <span style="font-weight: 600;">${App.formatCurrency(invoice.margin || 0)}</span>
                        </div>
                        <div class="total-row" style="border-top: 1px solid var(--border); margin-top: 4px; padding-top: 4px;">
                            <span class="text-light">Total Hors Taxes</span>
                            <span style="font-weight: 600;">${App.formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div class="total-row">
                            <span class="text-light">TVA (${(invoice.taxContext?.vat !== undefined) ? invoice.taxContext.vat : settings.taxRate}%)</span>
                            <span style="font-weight: 600;">${App.formatCurrency(invoice.tax)}</span>
                        </div>
                        <div class="total-row grand">
                            <span>TOTAL TTC</span>
                            <span>${App.formatCurrency(invoice.total)}</span>
                        </div>
                    </div>
                </div>

                <div class="legal-section">
                    <h4>Instructions de Règlement (Paiement Direct)</h4>
                    <p style="margin-bottom: 15px; color: var(--text-light);">Ce document contient deux instructions de règlement distinctes pour garantir l'indépendance des prestataires.</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <strong style="color: var(--primary); display: block; margin-bottom: 5px;">PART PRESTATAIRE : ${App.formatCurrency((invoice.itemsSubtotal || 0) * (1 + (invoice.tax / (invoice.subtotal || 1))))}</strong>
                            <p style="font-size: 11px; margin: 0;">
                                À régler à : <strong>${user.company.name}</strong><br>
                                Règlement par carte bancaire ou PayPal via votre espace client sécurisé.
                            </p>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid var(--border);">
                            <strong style="color: var(--primary); display: block; margin-bottom: 5px;">FRAIS PLATEFORME : ${App.formatCurrency((invoice.margin || 0) * (1 + (invoice.tax / (invoice.subtotal || 1))))}</strong>
                            <p style="font-size: 11px; margin: 0;">
                                À régler à : <strong>SoloPrice Pro</strong><br>
                                Règlement via votre espace client sécurisé / Mode de paiement enregistré.
                            </p>
                        </div>
                    </div>

                    <p style="margin-top: 20px;">
                        <strong>Échéance :</strong> ${dueDate}<br>
                        ${invoice.tax === 0 ? '<strong>TVA non applicable, art. 293 B du CGI</strong><br>' : ''}
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

    generateQuote(quote, client, user, isPreview = false) {
        const settings = Storage.get(Storage.KEYS.SETTINGS);
        const date = new Date(quote.createdAt).toLocaleDateString('fr-FR');

        // Normalization of provider info
        const providerName = user?.company?.name || user?.user_metadata?.company_name || 'Votre Entreprise';
        const providerAddress = user?.company?.address || user?.user_metadata?.address || '';
        const providerEmail = user?.company?.email || user?.email || '';
        const providerPhone = user?.company?.phone || '';
        const providerSiret = user?.company?.siret || '';

        // Dynamic validity
        const validityDays = settings.quoteValidityDays || 30;
        const validUntil = new Date(new Date(quote.createdAt).getTime() + validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${isPreview ? 'APERÇU - ' : ''}Devis ${quote.number}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
                <style>
                    :root { --primary: #10b981; --primary-dark: #059669; --text: #111827; --text-light: #6b7280; --border: #e5e7eb; --bg-light: #f9fafb; }
                    * { box-sizing: border-box; }
                    body { font-family: 'Inter', system-ui, sans-serif; color: var(--text); line-height: 1.5; max-width: 850px; margin: 0 auto; padding: 50px; background: #fff; position: relative; }
                    
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 60px; border-bottom: 2px solid var(--primary); padding-bottom: 30px; }
                    .header-logo { max-height: 80px; max-width: 250px; object-fit: contain; }
                    .company-logo-type { font-size: 28px; font-weight: 800; color: var(--primary); letter-spacing: -0.03em; margin-bottom: 5px; }
                    .company-details { font-size: 13px; color: var(--text-light); }
                    
                    .invoice-meta { text-align: right; }
                    .invoice-title { font-size: 32px; font-weight: 800; color: var(--primary); margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px; }
                    .meta-grid { display: grid; grid-template-columns: auto auto; gap: 8px 30px; font-size: 14px; color: var(--text-light); }
                    .meta-label { font-weight: 600; color: var(--text); }
                    
                    .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-bottom: 60px; }
                    .address-box h3 { font-size: 11px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 15px 0; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
                    .address-box p { font-size: 14px; margin: 0; white-space: pre-line; }
                    .address-box strong { font-size: 16px; color: var(--text); display: block; margin-bottom: 6px; font-weight: 700; }
                    
                    table { width: 100%; border-collapse: collapse; margin-bottom: 50px; }
                    th { background: var(--bg-light); padding: 15px 20px; text-align: left; font-size: 12px; font-weight: 700; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid var(--border); }
                    td { padding: 20px 20px; border-bottom: 1px solid var(--border); font-size: 15px; vertical-align: top; }
                    .item-desc { font-weight: 600; color: var(--text); margin-bottom: 5px; font-size: 16px; }
                    
                    .totals-container { display: flex; justify-content: flex-end; margin-bottom: 60px; }
                    .totals-table { width: 320px; background: var(--bg-light); padding: 25px; border-radius: 12px; }
                    .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 15px; }
                    .total-row.grand { border-top: 2px solid var(--primary); margin-top: 15px; padding-top: 15px; font-size: 20px; font-weight: 800; color: var(--primary); }
                    
                    .signature-area { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; page-break-inside: avoid; }
                    .signature-box { border: 2px dashed var(--border); border-radius: 16px; padding: 30px; position: relative; min-height: 200px; background: var(--bg-light); transition: all 0.3s; }
                    .signature-label { font-size: 12px; font-weight: 700; color: var(--text-light); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 90px; display: block; }
                    .signature-mention { font-size: 11px; color: var(--text-light); text-align: center; font-style: italic; }
                    
                    .footer { font-size: 11px; color: var(--text-light); border-top: 1px solid var(--border); padding-top: 30px; text-align: center; margin-top: 60px; line-height: 1.6; }

                    /* Preview Specific Premium Styles */
                    /* Watermark & Teaser Styles */
                    .watermark {
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background-image: url("data:image/svg+xml,%3Csvg width='500' height='500' viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-size='35' font-weight='900' fill='rgba(0,0,0,0.03)' font-family='Arial' text-anchor='middle' transform='rotate(-35 250 250)'%3ESPÉCIMEN - SOLOPRICE PRO%3C/text%3E%3C/svg%3E");
                        pointer-events: none; z-index: -1;
                    }
                    .preview-watermark {
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background-image: url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-size='30' font-weight='900' fill='rgba(0,0,0,0.03)' font-family='Arial' text-anchor='middle' transform='rotate(-35 200 200)'%3EAPERÇU GRATUIT%3C/text%3E%3C/svg%3E");
                        pointer-events: none; z-index: -1;
                    }
                    .preview-bar {
                        position: fixed; top: 15px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 800px;
                        background: rgba(17, 24, 39, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                        color: white; padding: 12px 25px; border-radius: 99px;
                        display: flex; justify-content: space-between; align-items: center;
                        z-index: 1000; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
                    }
                    .preview-info { display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 500; }
                    .preview-badge { background: var(--primary); color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
                    .preview-btn {
                        background: white; color: var(--text); border: none; padding: 10px 22px; border-radius: 99px;
                        font-weight: 700; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        font-size: 13px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                    }
                    .preview-btn:hover { background: var(--primary); color: white; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4); }

                    @media print {
                        body { padding: 0; }
                        .no-print, .preview-bar, .preview-watermark { display: none; }
                    }
                </style>
            </head>
            <body style="${isPreview ? 'padding-top: 100px;' : ''}">
                <div class="trust-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    Document Sécurisé via SoloPrice Pro
                </div>
                ${!Storage.isPro() ? '<div class="watermark"></div>' : ''}
                ${isPreview ? `
                    <div class="preview-bar no-print">
                        <div class="preview-info">
                            <span class="preview-badge">Aperçu</span>
                            <span>Export complet réservé aux membres PRO</span>
                        </div>
                        <button class="preview-btn" onclick="if(window.opener && window.opener.App) { window.opener.App.showUpgradeModal('pdf_download'); window.close(); } else { alert('Veuillez retourner sur l\\'onglet SoloPrice Pro pour passer PRO.'); }">
                            Passez PRO pour télécharger
                        </button>
                    </div>
                    <div class="preview-watermark"></div>
                ` : ''}

                <div class="header">
                    <div class="company-brand">
                        ${(user?.isPro && user.company.logo) ? `<img src="${user.company.logo}" class="header-logo">` : `<div class="company-logo-type">${providerName}</div>`}
                        <div class="company-details">
                            ${providerAddress ? `${providerAddress}<br>` : ''}
                            ${providerEmail} ${providerPhone ? `| ${providerPhone}` : ''}
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
                            <strong>${providerName}</strong>
                            ${providerSiret ? `SIRET : ${providerSiret}` : ''}
                        </p>
                    </div>
                    <div class="address-box">
                        <h3>Client</h3>
                        <p>
                            <strong>${client.name}</strong>
                            ${client.address ? `${client.address}<br>` : ''}
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
                            <td style="text-align: right; font-weight: 700;">${App.formatCurrency(item.quantity * item.unitPrice)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="totals-container">
                    <div class="totals-table">
                        <div class="total-row">
                            <span style="color: var(--text-light);">Prestations HT</span>
                            <span style="font-weight: 600;">${App.formatCurrency(quote.itemsSubtotal || quote.subtotal)}</span>
                        </div>
                        <div class="total-row" style="color: var(--primary-dark);">
                            <span style="color: var(--text-light);">Service & Gestion</span>
                            <span style="font-weight: 600;">${App.formatCurrency(quote.margin || 0)}</span>
                        </div>
                        <div class="total-row" style="border-top: 1px solid var(--border); margin-top: 5px; padding-top: 5px;">
                            <span style="font-weight: 600;">Base Hors Taxes</span>
                            <span style="font-weight: 600;">${App.formatCurrency(quote.subtotal)}</span>
                        </div>
                        <div class="total-row">
                            <span style="color: var(--text-light);">TVA (${(quote.taxContext?.vat !== undefined) ? quote.taxContext.vat : settings.taxRate}%)</span>
                            <span style="font-weight: 600;">${App.formatCurrency(quote.tax)}</span>
                        </div>
                        <div class="total-row grand">
                            <span>TOTAL TTC</span>
                            <span>${App.formatCurrency(quote.total)}</span>
                        </div>
                    </div>
                </div>

                <div class="legal-section" style="margin-top: 40px; margin-bottom: 40px; padding: 25px; background: var(--bg-light); border-radius: 12px; font-size: 12px; color: var(--text-light);">
                    <h4 style="font-size: 13px; color: var(--text); margin-top: 0; margin-bottom: 10px;">Instructions de Règlement (Paiement Direct)</h4>
                    <p style="margin-bottom: 15px; color: var(--text-light); font-size: 11px;">Ce document comporte deux instructions de règlement distinctes : l'une pour le prestataire et l'autre pour les frais de service de la plateforme.</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid var(--border);">
                            <strong style="color: var(--primary); display: block; margin-bottom: 5px;">1. PART PRESTATAIRE (85% HT + Taxe)</strong>
                            <span style="font-size: 16px; font-weight: 800; color: var(--text); display: block; margin-bottom: 10px;">
                                ${App.formatCurrency((quote.itemsSubtotal || 0) * (1 + (quote.tax / (quote.subtotal || 1))))}
                            </span>
                            <p style="font-size: 11px; margin: 0;">
                                Destinataire : <strong>${providerName}</strong><br>
                                Règlement sécurisé en ligne (Carte / PayPal) via le bouton de validation.
                            </p>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid var(--border);">
                            <strong style="color: var(--primary); display: block; margin-bottom: 5px;">2. PROTECTION SOLOPRICE (Obligatoire)</strong>
                            <span style="font-size: 16px; font-weight: 800; color: var(--text); display: block; margin-bottom: 10px;">
                                ${App.formatCurrency((quote.margin || 0) * (1 + (quote.tax / (quote.subtotal || 1))))}
                            </span>
                            <p style="font-size: 11px; margin: 0;">
                                Destinataire : <strong>SoloPrice Pro</strong><br>
                                Active la garantie de protection des fonds et le support juridique de la mission.
                            </p>
                        </div>
                    </div>

                    <div style="margin-top: 20px; font-size: 11px;">
                        <p style="margin-bottom: 5px;">Ce devis est valable jusqu'au ${validUntil}.</p>
                        <p style="color: var(--primary); font-weight: 600; margin-top: 10px;"><i class="fas fa-shield-alt"></i> La Protection SoloPrice est une clause contractuelle obligatoire pour la validation juridique de cette mission.</p>
                        ${quote.tax === 0 ? '<p style="font-weight: 700; color: var(--text);">TVA non applicable, art. 293 B du CGI</p>' : ''}
                        ${user.company?.footer_mentions ? `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border);">${user.company.footer_mentions}</div>` : ''}
                    </div>
                </div>

                <div class="signature-area">
                    <div class="signature-box" style="position: relative; border-color: transparent; background: transparent; padding: 10px;">
                        <span class="signature-label" style="margin-bottom: 40px; color: var(--primary);">Le Prestataire</span>
                        <div style="font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold; color: var(--text); border-bottom: 2px solid var(--primary); display: inline-block; padding-bottom: 5px;">
                            Signé numériquement par<br>
                            ${providerName}
                        </div>
                        <div class="signature-mention" style="margin-top: 10px; text-align: left;">
                            Date d'émission : ${date}
                        </div>
                    </div>
                    <div class="signature-box" style="position: relative;">
                        <span class="signature-label">Bon pour accord Client</span>
                        ${quote.signature ? `
                            <img src="${quote.signature.image}" style="max-width: 150px; position: absolute; top: 20px; left: 10px; mix-blend-mode: multiply;" />
                            <div class="signature-mention" style="margin-top: 60px;">Signé le ${new Date(quote.signature.date).toLocaleDateString()}</div>
                        ` : `
                            <div class="signature-mention">Date, signature et cachet</div>
                        `}
                    </div>
                </div>

                <div class="footer">
                    ${(Storage.getTier() === 'expert') ? '' : 'Devis généré professionnellement par <strong>SoloPrice Pro</strong> &bull; www.soloprice-pro.fr'}
                </div>

                <script>
                    ${isPreview ? '' : 'window.onload = function() { setTimeout(() => window.print(), 500); }'}
                </script>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        if (isPreview) {
            // Use window.open for previews to try and keep the opener reference
            const win = window.open(url, '_blank');
            if (!win) {
                // Fallback if popup blocked
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } else {
            const a = document.createElement('a');
            a.href = url;
            a.download = `Devis_${quote.number}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);

        App.showNotification(isPreview ? 'Aperçu généré.' : 'Devis prêt pour impression.', 'success');
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
                <script>window.onload = function() { setTimeout(() => window.print(), 500); }</script>
            </body>
            </html>
        `;

        this.openBlob(htmlContent);
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
                <script>window.onload = function() { setTimeout(() => window.print(), 500); }</script>
            </body>
            </html>
        `;

        this.openBlob(htmlContent);
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
                <title>Ma Roadmap de Rentabilité - SoloPrice Pro</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
                <style>
                    :root { --primary: #10b981; --primary-dark: #059669; --text: #111827; --text-light: #6b7280; --border: #e5e7eb; --bg-light: #f9fafb; }
                    body { font-family: 'Inter', sans-serif; color: var(--text); line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 40px; background: #fff; }
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
                            <div class="tjm-value">${results.dailyRate}€</div>
                            <div class="tjm-sub">Tarif Journalier Minimum (H.T)</div>
                        </div>

                        <div class="finance-box">
                            <div class="finance-row">
                                <span class="finance-label">CA Requis / mois</span>
                                <span class="finance-val">${results.revenueNeeded}€</span>
                            </div>
                            <div class="finance-row">
                                <span class="finance-label">Réserve Cotisations</span>
                                <span class="finance-val" style="color:#ef4444;">-${results.taxAmount}€</span>
                            </div>
                            <div class="finance-row">
                                <span class="finance-label">Revenu Net Cible</span>
                                <span class="finance-val" style="color:var(--primary-dark);">${data.monthlyRevenue}€</span>
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
                        <h2>🚀 Prêt à passer à l'action ?</h2>
                        <p>Votre TJM de sécurité est maintenant défini. La prochaine étape est de l'appliquer sur une mission réelle pour vérifier sa validité terrain.</p>
                        <div class="btn-fake">Utiliser le Chiffrage Projet</div>
                    </div>

                    <div class="footer">
                        Généré par SoloPrice Pro &bull; www.soloprice-pro.fr &bull; Le copilote financier des indépendants.
                    </div>
                </div>
                <script>
                    window.onload = function() { setTimeout(() => window.print(), 500); }
                </script>
            </body>
            </html>
        `;

        this.openBlob(htmlContent);
        App.showNotification('Roadmap Stratégique générée avec succès !', 'success');
    }
};
