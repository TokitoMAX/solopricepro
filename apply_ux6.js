const fs = require('fs');

// 1. pdf-generator.js
let pdfJS = fs.readFileSync('pdf-generator.js', 'utf8');
pdfJS = pdfJS.replace('this._previewRealPdf(htmlContent, `Facture_Aperçu_${invoice.number}.pdf`);', 'this._downloadRealPdf(htmlContent, `Facture_Aperçu_${invoice.number}.pdf`);');
pdfJS = pdfJS.replace('this._previewRealPdf(htmlContent, `Devis_Aperçu_${quote.number}.pdf`);', 'this._downloadRealPdf(htmlContent, `Devis_Aperçu_${quote.number}.pdf`);');
let pIndex = pdfJS.indexOf('async _previewRealPdf(htmlContent, filename)');
if (pIndex > -1) {
    pdfJS = pdfJS.substring(0, pIndex).trim() + '\n};\n';
}
fs.writeFileSync('pdf-generator.js', pdfJS, 'utf8');

// 2. scoper.js
let scoperJS = fs.readFileSync('scoper.js', 'utf8');
scoperJS = scoperJS.replace('<div class="wizard-steps" style="display: flex; justify-content: space-between; margin-bottom: 3rem; position: relative;">', '<div class="wizard-steps" style="margin-bottom: 3rem; position: relative;">');
fs.writeFileSync('scoper.js', scoperJS, 'utf8');

// 3. styles.css
let css = fs.readFileSync('styles.css', 'utf8');
const mobileCSS = `
/* UX 6.0 Overrides */
@media (max-width: 768px) {
    .wizard-steps {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 15px !important;
        justify-content: center !important;
    }
    .wizard-steps::before {
        display: none !important;
    }
    .wizard-steps .step {
        width: 100% !important;
        margin-bottom: 10px !important;
    }
    
    .marketplace-nav {
        grid-template-columns: repeat(4, 1fr) !important;
        padding: 0 !important;
        gap: 5px !important;
    }
    .marketplace-nav .nav-btn {
        padding: 8px 2px !important;
    }
    .marketplace-nav .nav-btn i {
        font-size: 1.2rem !important;
    }
    .marketplace-nav .nav-btn span, .marketplace-nav .nav-btn {
        font-size: 0.6rem !important;
    }
}
`;
if (!css.includes('/* UX 6.0 Overrides */')) {
    css += '\n' + mobileCSS;
}
fs.writeFileSync('styles.css', css, 'utf8');

// 4. index.html
let index = fs.readFileSync('index.html', 'utf8');
index = index.replace(/\?v=20260304_0251/g, '?v=20260304_0260');
fs.writeFileSync('index.html', index, 'utf8');

console.log('All patches applied successfully.');
