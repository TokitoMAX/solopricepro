const fs = require('fs');
let f = fs.readFileSync('styles.css', 'utf8');

// Find the end of the clean file
const marker = '/* Scaler animations */';
const idx1 = f.indexOf(marker);
if (idx1 === -1) { console.error('Marker not found'); process.exit(1); }

// Find the end of the @keyframes block
const idx2 = f.indexOf('transform: scale(1);', idx1);
const idx3 = f.indexOf('}', idx2);
const finalBrace = f.indexOf('}', idx3 + 1);

let cleanContent = f.substring(0, finalBrace + 1) + '\n\n';

// Add the fixed CSS
cleanContent += `
@media (max-width: 768px) {
    /* Scoper Wizard Steps (Grid instead of horizontal scroll/slide) */
    .wizard-steps {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 10px !important;
        padding-bottom: 10px !important;
        overflow: visible !important;
    }
    .wizard-step-item {
        min-width: 0 !important;
        padding: 5px !important;
        text-align: center;
    }
    .step-number {
        margin: 0 auto 5px auto !important;
    }
    
    /* Scoper Top Navigation (Grid instead of slide) */
    .scoper-nav {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 10px !important;
        overflow: visible !important;
        padding-bottom: 10px !important;
    }
    .scoper-nav button {
        white-space: normal !important;
        font-size: 0.8rem !important;
        padding: 8px !important;
    }

    /* Kanban / Cashflow Pipeline (Vertical Stack instead of slide) */
    .kanban-board {
        display: flex !important;
        flex-direction: column !important;
        overflow-y: visible !important;
        overflow-x: hidden !important;
        scroll-snap-type: none !important;
        gap: 20px !important;
    }
    .kanban-column {
        width: 100% !important;
        flex: none !important;
        min-width: 0 !important;
    }

    /* Marketplace Mobile Layout (Top Horizontal Ribbon) */
    .marketplace-feed-container {
        display: flex !important;
        flex-direction: column !important;
    }
    .marketplace-main-feed {
        order: 0 !important;
    }
    .marketplace-sidebar .user-quick-card {
        display: none !important;
    }
    .marketplace-nav {
        display: flex !important;
        flex-direction: row !important;
        overflow-x: auto !important;
        padding: 10px !important;
        margin-bottom: 15px !important;
        gap: 10px !important;
        border-radius: 12px !important;
        -webkit-overflow-scrolling: touch;
    }
    .marketplace-nav .nav-btn {
        flex: 0 0 auto !important;
        white-space: nowrap !important;
        padding: 10px 15px !important;
        justify-content: center !important;
    }
}
`;

fs.writeFileSync('styles.css', cleanContent, 'utf8');
console.log('Successfully repaired styles.css');
