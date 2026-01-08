/**
 * Anthropic Claude API Client
 *
 * Integrates with Claude 3.5 Haiku Vision API for paint color analysis.
 * Cost: ~$0.80/1M input tokens ≈ $0.0008 per image analysis
 */

import Anthropic from '@anthropic-ai/sdk';

export interface ColorAnalysisResult {
  colors: DetectedColor[];
  confidence: number;
  analysisText?: string;
}

export interface DetectedColor {
  hex: string;
  name: string;
  location: 'base' | 'highlight' | 'shadow' | 'general';
  notes: string;
}

/**
 * Anthropic Claude client for color analysis
 */
export class AnthropicClient {
  private client: Anthropic;
  private model: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    this.client = new Anthropic({
      apiKey,
    });

    this.model = 'claude-3-5-haiku-20241022'; // Claude 3.5 Haiku
  }

  /**
   * Analyze paint colors in a miniature photo
   * @param imageUrl - URL of the image to analyze
   * @param context - Optional context about the miniature (e.g., "skull", "space marine")
   * @returns Color analysis with detected colors
   */
  async analyzePaintColors(
    imageUrl: string,
    context?: string
  ): Promise<ColorAnalysisResult> {
    try {
      // Fetch the image and convert to base64
      const imageData = await this.fetchImageAsBase64(imageUrl);

      // Build the prompt
      const prompt = this.buildAnalysisPrompt(context);

      // Call Claude Vision API
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: imageData.mediaType,
                  data: imageData.base64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      // Extract text response
      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude API');
      }

      const analysisText = textContent.text;

      // Parse the JSON response
      const parsedResult = this.parseAnalysisResponse(analysisText);

      return {
        ...parsedResult,
        analysisText,
      };
    } catch (error: any) {
      console.error('Error analyzing paint colors:', error);
      throw new Error(`Failed to analyze colors: ${error.message}`);
    }
  }

  /**
   * Build the analysis prompt for Claude
   */
  private buildAnalysisPrompt(context?: string): string {
    if (context && context.trim()) {
      // User provided a vision/description - suggest paints to achieve that look
      return `I want to paint this miniature with the following vision: "${context}"

Looking at this miniature photo, suggest 5-8 specific paint colors that would help me achieve this look.

For each color, provide:
1. Hex color code (e.g., #FF5733)
2. Descriptive name (e.g., "Deep Blood Red", "Metallic Gold", "Bone White")
3. Location/usage: where to apply this color
   - "base" for base coat colors
   - "highlight" for highlighted areas
   - "shadow" for shaded/shadow areas
   - "general" for other colors
4. Brief notes about why this color fits the vision and how to apply it

Return your response as a JSON object with this exact structure:
{
  "colors": [
    {
      "hex": "#FF5733",
      "name": "Deep Blood Red",
      "location": "shadow",
      "notes": "Use in recessed areas to create depth"
    }
  ],
  "confidence": 0.85
}

Important:
- Suggest colors that will achieve the described vision
- Consider the miniature's shape and details visible in the photo
- Provide accurate hex codes
- Be specific with color names and application tips
- confidence should be 0-1 (your confidence these colors will achieve the vision)
- Return ONLY the JSON object, no additional text`;
    } else {
      // No context - identify existing colors in the image
      return `Analyze this miniature painting photo and identify 5-8 distinct paint colors visible on the model.

For each color, provide:
1. Hex color code (e.g., #FF5733)
2. Descriptive name (e.g., "Deep Blood Red", "Metallic Gold", "Bone White")
3. Location/usage: where this color appears
   - "base" for base coat colors
   - "highlight" for highlighted areas
   - "shadow" for shaded/shadow areas
   - "general" for other colors
4. Brief notes about the shade, tone, or application

Return your response as a JSON object with this exact structure:
{
  "colors": [
    {
      "hex": "#FF5733",
      "name": "Deep Blood Red",
      "location": "shadow",
      "notes": "Dark crimson used in recessed areas"
    }
  ],
  "confidence": 0.85
}

Important:
- Focus on the most prominent and distinct colors
- Provide accurate hex codes that match the visible colors
- Be specific with color names (e.g., "Warm Ivory" not just "White")
- Consider the painting technique and color placement
- confidence should be 0-1 (your confidence in the color detection)
- Return ONLY the JSON object, no additional text`;
    }
  }

  /**
   * Parse Claude's JSON response
   */
  private parseAnalysisResponse(responseText: string): ColorAnalysisResult {
    try {
      // Extract JSON from response (Claude sometimes includes markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (!parsed.colors || !Array.isArray(parsed.colors)) {
        throw new Error('Invalid response structure: missing colors array');
      }

      // Validate each color
      const colors: DetectedColor[] = parsed.colors.map((color: any, index: number) => {
        if (!color.hex || !color.name || !color.location) {
          throw new Error(`Invalid color at index ${index}: missing required fields`);
        }

        // Ensure hex has # prefix
        const hex = color.hex.startsWith('#') ? color.hex : `#${color.hex}`;

        // Validate location
        const validLocations = ['base', 'highlight', 'shadow', 'general'];
        const location = validLocations.includes(color.location)
          ? color.location
          : 'general';

        return {
          hex,
          name: color.name,
          location: location as DetectedColor['location'],
          notes: color.notes || '',
        };
      });

      return {
        colors,
        confidence: parsed.confidence || 0.5,
      };
    } catch (error: any) {
      console.error('Error parsing Claude response:', error);
      console.error('Response text:', responseText);
      throw new Error(`Failed to parse color analysis: ${error.message}`);
    }
  }

  /**
   * Fetch image from URL and convert to base64
   */
  private async fetchImageAsBase64(imageUrl: string): Promise<{
    base64: string;
    mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  }> {
    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      const mediaType = this.getMediaType(contentType);

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      return { base64, mediaType };
    } catch (error: any) {
      console.error('Error fetching image:', error);
      throw new Error(`Failed to fetch image: ${error.message}`);
    }
  }

  /**
   * Get supported media type from Content-Type header
   */
  private getMediaType(contentType: string | null): 'image/jpeg' | 'image/png' | 'image/webp' {
    if (!contentType) return 'image/jpeg';

    if (contentType.includes('png')) return 'image/png';
    if (contentType.includes('webp')) return 'image/webp';
    return 'image/jpeg';
  }

  /**
   * Estimate token count for an image (rough estimate)
   * Claude charges by tokens: base64 images are ~1.3 tokens per character
   */
  estimateTokens(base64Length: number): number {
    return Math.ceil(base64Length * 1.3);
  }

  /**
   * Estimate cost for an analysis (in credits, where 1 credit = $0.001)
   */
  estimateCost(): number {
    // Claude 3.5 Haiku: $0.80/1M input tokens
    // Average image analysis: ~1000 tokens
    // Cost: ~$0.0008 = 0.8 credits
    return 8; // 0.8 cents = 8 credits
  }

  /**
   * Expand a paint set description into individual paint names.
   * Uses Claude's knowledge of hobby paint products.
   * 
   * @param description - User's description (e.g., "Speedpaint 2.0 Most Wanted Set")
   * @param availablePaints - List of paint names available in the database (for matching)
   * @returns Array of paint names that match
   */
  async expandPaintSet(
    description: string,
    availablePaints: string[]
  ): Promise<{ paints: string[]; rawOutput: string }> {
    try {
      // Build the prompt
      const prompt = `You are an expert on miniature painting paints and products from brands like Army Painter, Citadel, Vallejo, Scale75, and others.

A user says they own: "${description}"

Your task is to identify which INDIVIDUAL PAINTS from our database they likely own based on this description.

**CRITICAL INSTRUCTIONS:**
1. If the user mentions a SET (e.g., "Speedpaint 2.0 Most Wanted Set", "Game Color Starter Set"), you MUST use your knowledge to recall ALL the individual paints that are typically included in that set, and find matches for each one.
2. Do NOT output the set name as a paint. Only output individual paint names.
3. Be generous with fuzzy matching - if a paint like "Gravelord Grey" from your knowledge matches something like "Gravelord Gray" in the list, that's a match.
4. If you don't recognize a set name, do your best to identify paints that match the description.

Here is the list of available paints in our database (these are the ONLY valid paint names you can return):
${availablePaints.slice(0, 500).join('\n')}

Return ONLY a JSON array of the EXACT paint names from the list above that match the user's description. Example:
["Gravelord Grey", "Slaughter Red", "Pallid Bone"]

If no matches are found, return an empty array: []

JSON Output:`;

      // Use Claude Haiku 4.5 for knowledge tasks
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20250514',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text response
      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude API');
      }

      const rawOutput = textContent.text;
      console.log('[Claude] Raw output:', rawOutput.substring(0, 200));

      // Parse JSON array
      const jsonMatch = rawOutput.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('[Claude] No JSON array found in response');
        return { paints: [], rawOutput };
      }

      const paints = JSON.parse(jsonMatch[0]) as string[];
      return { paints, rawOutput };
    } catch (error: any) {
      console.error('[Claude] Error expanding paint set:', error);
      throw new Error(`Failed to expand paint set: ${error.message}`);
    }
  }
}

/**
 * Singleton instance
 */
let anthropicClient: AnthropicClient | null = null;

export function getAnthropicClient(): AnthropicClient {
  if (!anthropicClient) {
    anthropicClient = new AnthropicClient();
  }
  return anthropicClient;
}
