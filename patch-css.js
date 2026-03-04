const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf8');

const overrideCSS = `
/* --- PUBLIC QUOTE OVERRIDES (FORCE LIGHT MODE) --- */
.force-light-mode, .force-light-mode * {
    color-scheme: light !important;
}
.public-quote-wrapper {
    background: #ffffff !important;
    color: #1a1a1a !important;
}
.public-quote-wrapper .glass, .public-quote-wrapper .quote-document {
    background: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    color: #1a1a1a !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}
.public-quote-wrapper h1, .public-quote-wrapper h2, .public-quote-wrapper h3, .public-quote-wrapper p, .public-quote-wrapper th, .public-quote-wrapper td, .public-quote-wrapper label {
    color: #1a1a1a !important;
}
.public-quote-wrapper th {
    background-color: #f8fafc !important;
    border-bottom: 2px solid #e2e8f0 !important;
}
.public-quote-wrapper td {
    border-bottom: 1px solid #e2e8f0 !important;
}
.public-quote-wrapper .client-info-box {
    background: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
}
.public-quote-wrapper .total-row td {
    background-color: #f1f5f9 !important;
    color: #0f172a !important;
}
`;
if (!css.includes('PUBLIC QUOTE OVERRIDES')) {
    css += '\n' + overrideCSS;
}

css = css.replace(/\.marketplace-nav \{/g, '.marketplace-nav-old {');
const mobileNav = `
@media (max-width: 768px) {
    .marketplace-nav {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 8px !important;
        padding: 5px !important;
        margin-bottom: 15px !important;
        border-radius: 12px !important;
        overflow: visible !important;
    }
    .marketplace-nav .nav-btn {
        padding: 10px 5px !important;
        font-size: 0.75rem !important;
        text-align: center !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        white-space: normal !important;
        gap: 5px !important;
    }
    .marketplace-nav .nav-btn i {
        margin-right: 0 !important;
        font-size: 1rem !important;
    }
}
@media (min-width: 769px) {
    .marketplace-nav {
        display: flex !important;
        flex-direction: row !important;
        overflow-x: auto !important;
        padding: 10px !important;
        margin-bottom: 15px !important;
        gap: 10px !important;
        border-radius: 12px !important;
    }
}
`;
if (!css.includes('grid-template-columns: repeat(2, 1fr) !important;')) {
    css += '\n' + mobileNav;
}

fs.writeFileSync('styles.css', css, 'utf8');
console.log('CSS updated successfully');
