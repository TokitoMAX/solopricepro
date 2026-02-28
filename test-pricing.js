/**
 * Test du Moteur de Chiffrage (Pricing Engine)
 * Exécutez avec: node test-pricing.js
 */

const PricingEngine = require('./pricing-engine.js');

function test() {
    console.log('🧪 Démarrage des tests du PricingEngine...\n');

    const testCases = [
        {
            name: 'Cas Classique (3000 net, 15j, 500 charges, 22% taxes)',
            input: { monthlyRevenue: 3000, workingDays: 15, hoursPerDay: 7, monthlyCharges: 500, taxRate: 22 },
            expectedDailyPrice: 400 // (3000 + 500) / (0.78) = 4487 CA. 4487 / 15 = 299/j ??? 
            // Attends, refaisons le calcul de Scoper:
            // revenueNeeded = (3000 + 500) / (1 - 0.22) = 3500 / 0.78 = 4487.17
            // hourlyRate = 4487.17 / (15 * 7) = 4487.17 / 105 = 42.73
            // dailyRate = 42.73 * 7 = 299.14 -> 300/j
        },
        {
            name: 'Cas Expert (5000 net, 10j, 1000 charges, 22% taxes)',
            input: { monthlyRevenue: 5000, workingDays: 10, hoursPerDay: 7, monthlyCharges: 1000, taxRate: 22 },
            // (5000 + 1000) / 0.78 = 7692. 7692 / 10 = 769/j -> 770/j
        }
    ];

    testCases.forEach(tc => {
        const result = PricingEngine.calculateObjective(tc.input);
        console.log(`▶ TEST: ${tc.name}`);
        console.log(`   - Input: ${JSON.stringify(tc.input)}`);
        console.log(`   - Result: ${result.dailyRate} /j (Revenue Requis: ${result.revenueNeeded} )`);

        const diagnostic = PricingEngine.getMarketDiagnostic(result.dailyRate, tc.input.sector);
        console.log(`   - Diagnostic: ${diagnostic.title} (${diagnostic.color})\n`);
    });

    console.log('✅ Fin des tests.');
}

test();
