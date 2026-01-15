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
                if (i + batchSize < setNames.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
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
    4. Limit to the top 20 most popular/comprehensive sets.
    
    Return a strictly valid JSON array of strings. Example:
    ["Set Name 1", "Set Name 2"]`;

        const response = await this.client.callAPI({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
        });

        try {
            // Find JSON array in partial text if needed
            const jsonMatch = response.match(/\[.*\]/s);
            const jsonStr = jsonMatch ? jsonMatch[0] : response;
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error('Failed to parse set names JSON', e);
            // Fallback to text parsing
            return response
                .split('\n')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.match(/^\d+\./))
                .map(s => s.replace(/^[-*•]\s+/, '').replace(/^["']|["'],?$/g, ''));
        }
    }

    /**
     * Ask AI for contents of a specific set
     */
    protected async generateSetDetails(setName: string): Promise<ScrapedPaintSet | null> {
        try {
            console.log(`[AI Generator] Fetching details for: ${setName}`);

            const prompt = `For the ${this.brandName} product "${setName}":
            Provide the description and list of included maps.
            
            Return a strictly valid JSON object. Example:
            {
                "description": "Brief description here...",
                "paints": ["Paint 1", "Paint 2"]
            }`;

            const response = await this.client.callAPI({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 1000,
                messages: [{ role: 'user', content: prompt }]
            });

            let data: { description: string, paints: string[] } | null = null;

            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                const jsonStr = jsonMatch ? jsonMatch[0] : response;
                data = JSON.parse(jsonStr);
            } catch (e) {
                console.error('Failed to parse set details JSON', e);
                // Fallback attempt to parse partial text was unreliable, dropping fallback.
                return null;
            }

            if (!data || !data.paints || data.paints.length === 0) return null;

            return {
                setName: setName,
                brand: this.brandName,
                paintCount: data.paints.length,
                paintNames: data.paints,
                sourceUrl: `https://google.com/search?q=${encodeURIComponent(this.brandName + ' ' + setName)}`,
                description: data.description || '',
                imageUrl: ''
            };

        } catch (error) {
            console.error(`Failed to generate set ${setName}`, error);
            return null;
        }
    }
}
