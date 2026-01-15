import { getAnthropicClient } from '../ai/anthropic-client';
import { PaintSetScraperResult, ScrapedPaintSet } from '../scrapers/paint-set-scraper-base';

/**
 * Base class for AI-based Paint Set Generation
 * Instead of scraping websites, we ask the AI to retrieve its knowledge of paint sets.
 */
export abstract class BaseAIPaintSetGenerator {
    protected abstract brandName: string;
    protected client = getAnthropicClient();

    /**
     * Main entry point to generate sets
     */
    async generate(): Promise<PaintSetScraperResult> {
        try {
            console.log(`[AI Generator] Generating sets for ${this.brandName}...`);

            // 1. Ask AI for a list of known paint sets
            const setNames = await this.getSetNames();
            console.log(`[AI Generator] Found ${setNames.length} known sets for ${this.brandName}`);

            // 2. For each set, ask AI for contents (in parallel batches)
            const sets: ScrapedPaintSet[] = [];
            const batchSize = 3;

            for (let i = 0; i < setNames.length; i += batchSize) {
                const batch = setNames.slice(i, i + batchSize);
                const batchResults = await Promise.all(
                    batch.map(setName => this.generateSetDetails(setName))
                );
                sets.push(...batchResults.filter(s => s !== null) as ScrapedPaintSet[]);

                // Rate limiting pause
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            return {
                brand: this.brandName,
                sets: sets,
                scrapedAt: new Date(),
                errors: []
            };

        } catch (error: any) {
            console.error(`[AI Generator] Error generating ${this.brandName}:`, error);
            return {
                brand: this.brandName,
                sets: [],
                scrapedAt: new Date(),
                errors: [error.message]
            };
        }
    }

    /**
     * Ask AI for list of official paint sets
     */
    protected async getSetNames(): Promise<string[]> {
        const prompt = `List the names of official paint sets, starter sets, and collection boxes released by ${this.brandName}.
    
    Rules:
    1. Only official product names.
    2. Include current and popular discontinued sets.
    3. Exclude single paints or individual bottles.
    4. Return ONLY the names, one per line.
    5. Limit to the top 20 most popular/comprehensive sets.`;

        const response = await this.client.callAPI({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
        });

        return response
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.match(/^\d+\./)) // Remove numbered lists if AI ignores instruction
            .map(s => s.replace(/^[-*•]\s+/, '')); // Remove bullet points
    }

    /**
     * Ask AI for contents of a specific set
     */
    protected async generateSetDetails(setName: string): Promise<ScrapedPaintSet | null> {
        try {
            console.log(`[AI Generator] Fetching details for: ${setName}`);

            const prompt = `For the ${this.brandName} product "${setName}":
      1. Write a brief 1-sentence description.
      2. List the exact names of the paints included.
      
      Format:
      DESCRIPTION: [Description here]
      PAINTS:
      [Paint Name 1]
      [Paint Name 2]
      ...`;

            const response = await this.client.callAPI({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 1000,
                messages: [{ role: 'user', content: prompt }]
            });

            // Parse response
            const lines = response.split('\n');
            let description = '';
            const paints: string[] = [];
            let mode: 'desc' | 'paints' | null = null;

            for (const line of lines) {
                const clean = line.trim();
                if (clean.startsWith('DESCRIPTION:')) {
                    description = clean.replace('DESCRIPTION:', '').trim();
                    mode = 'desc';
                } else if (clean.startsWith('PAINTS:')) {
                    mode = 'paints';
                } else if (clean.length > 0) {
                    if (mode === 'paints') {
                        paints.push(clean.replace(/^[-*•]\s+/, '').trim());
                    } else if (mode === 'desc' && !description) {
                        description = clean;
                    }
                }
            }

            if (paints.length === 0) return null;

            return {
                setName: setName,
                brand: this.brandName,
                paintCount: paints.length,
                paintNames: paints,
                sourceUrl: `https://google.com/search?q=${encodeURIComponent(this.brandName + ' ' + setName)}`, // Placeholder
                description: description,
                imageUrl: '' // AI cannot generate real product image URLs reliably without scraping
            };

        } catch (error) {
            console.error(`Failed to generate set ${setName}`, error);
            return null;
        }
    }
}
