
import { LiquitexScraper } from '../lib/scrapers/liquitex-scraper';

async function run() {
    console.log('--- START LIQUITEX DEBUG ---');
    try {
        const scraper = new LiquitexScraper();
        const result = await scraper.scrape();

        console.log(`Total Paints Found: ${result.paints.length}`);

        const withSwatch = result.paints.filter(p => p.swatchUrl).length;
        console.log(`Paints with Swatch URL: ${withSwatch}`);

        console.log('\n--- SAMPLE PAINTS ---');
        result.paints.slice(0, 5).forEach(p => {
            console.log(`[${p.name}]`);
            console.log(`   SKU Found? (implied by success)`);
            console.log(`   Swatch URL: ${p.swatchUrl || 'MISSING'}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Debug Failed:', error);
    }
    console.log('--- END LIQUITEX DEBUG ---');
}

run();
