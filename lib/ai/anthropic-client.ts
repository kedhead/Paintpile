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

    this.model = 'claude-sonnet-4-5-20250929'; // Claude Sonnet 4.5
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
   * Generate a complete paint recipe from a miniature photo.
   * Uses Claude 3.5 Sonnet for complex recipe generation.
   *
   * @param imageUrl - URL of the miniature photo to analyze
   * @param context - Optional user context (e.g., "gem effect", "weathered armor")
   * @returns Complete recipe with steps and ingredients
   */
  async generateRecipeFromPhoto(
    imageUrl: string,
    context?: string
  ): Promise<import('@/types/ai-recipe').GeneratedRecipe> {
    try {
      // Fetch the image and convert to base64
      const imageData = await this.fetchImageAsBase64(imageUrl);

      // Build the recipe generation prompt
      const prompt = this.buildRecipePrompt(context);

      // Call Claude Sonnet 4.5 (our smartest model for complex generation)
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929', // Sonnet 4.5 for complex reasoning
        max_tokens: 4096,
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

      const generatedText = textContent.text;

      // Parse the JSON response
      const recipe = this.parseRecipeResponse(generatedText);

      return recipe;
    } catch (error: any) {
      console.error('Error generating recipe from photo:', error);
      throw new Error(`Failed to generate recipe: ${error.message}`);
    }
  }

  /**
   * Build the prompt for recipe generation
   */
  private buildRecipePrompt(context?: string): string {
    const contextSection = context && context.trim()
      ? `\nUser Context: "${context}"\nConsider this context when generating the recipe.`
      : '';

    return `You are an expert miniature painting instructor. Analyze this miniature photo and generate a complete, detailed paint recipe.

${contextSection}

Generate a comprehensive recipe with the following structure:

**1. Recipe Metadata:**
- Catchy, descriptive name (e.g., "Ethereal Spectral Glow", "Battle-Worn Armor Plate")
- 2-3 sentence description of the overall effect
- Category: choose from skin-tone, metallic, fabric, leather, armor, weapon, wood, stone, nmm, osl, weathering, glow-effect, gem, base-terrain, other
- Difficulty: beginner, intermediate, or advanced
- Techniques: array of techniques used (nmm, osl, drybrushing, layering, glazing, washing, blending, feathering, stippling, wetblending, zenithal, airbrushing, freehand, weathering, other)
- Estimated time in minutes
- Surface type: armor, skin, fabric, leather, metal, wood, stone, gem, other

**2. Paint Colors (5-8):**
For each color, provide:
- Hex code (accurate to the visible color)
- Descriptive color name (e.g., "Deep Crimson Shadow", "Bright Ice Blue Highlight")
- Role: base, highlight, shadow, midtone, glaze, wash, layer
- Notes on application and why this color is important

**3. Step-by-Step Instructions (4-10 steps):**
For each step, provide:
- Title (e.g., "Base Coat Application", "First Edge Highlight")
- Detailed instruction (2-3 sentences)
- Paints used (by name)
- Technique used (optional)
- Tips array (optional, helpful hints)

**4. Additional Tips:**
- Mixing instructions (how to mix paints if needed)
- Application tips (general advice for executing this recipe)

Return your response as a JSON object with this EXACT structure:
{
  "name": "Recipe Name",
  "description": "2-3 sentence description",
  "category": "metallic",
  "difficulty": "intermediate",
  "techniques": ["layering", "glazing"],
  "surfaceType": "armor",
  "estimatedTime": 45,
  "ingredients": [
    {
      "hexColor": "#1a1a2e",
      "colorName": "Deep Midnight Blue",
      "role": "base",
      "notes": "Use as the base coat, applied thinly in 2-3 layers"
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "title": "Prime and Base Coat",
      "instruction": "Prime the model with black primer. Apply a thin base coat of Deep Midnight Blue, ensuring even coverage. Let dry completely between coats.",
      "paints": ["Deep Midnight Blue"],
      "technique": "layering",
      "tips": ["Thin the paint with water or medium", "Use a medium-sized brush"]
    }
  ],
  "mixingInstructions": "Mix paints on a wet palette to maintain consistency",
  "applicationTips": "Work in thin layers, building up color gradually. Patience is key for this effect.",
  "confidence": 0.85
}

Important:
- Analyze the photo carefully to suggest realistic, achievable colors
- Provide accurate hex codes that match visible colors
- Give specific, actionable instructions
- Consider the skill level needed for each technique
- Be realistic about estimated time
- Return ONLY the JSON object, no additional text
- Confidence should be 0-1 (your confidence this recipe will work)`;
  }

  /**
   * Parse Claude's recipe JSON response
   */
  private parseRecipeResponse(responseText: string): import('@/types/ai-recipe').GeneratedRecipe {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in recipe response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsed.name || !parsed.description || !parsed.category || !parsed.difficulty) {
        throw new Error('Missing required recipe fields');
      }

      if (!Array.isArray(parsed.ingredients) || parsed.ingredients.length === 0) {
        throw new Error('Recipe must have at least one ingredient');
      }

      if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
        throw new Error('Recipe must have at least one step');
      }

      // Return validated recipe
      return {
        name: parsed.name,
        description: parsed.description,
        category: parsed.category,
        difficulty: parsed.difficulty,
        techniques: Array.isArray(parsed.techniques) ? parsed.techniques : [],
        surfaceType: parsed.surfaceType,
        estimatedTime: parsed.estimatedTime,
        ingredients: parsed.ingredients
          .map((ing: any, index: number) => {
            // Validate and normalize hex color
            let hexColor = ing.hexColor;

            // Check if hexColor is missing, null, undefined, or empty
            if (!hexColor || typeof hexColor !== 'string' || hexColor.trim() === '') {
              console.warn(`Invalid hex color for ingredient ${index}: ${hexColor}. Using default gray.`);
              hexColor = '#808080'; // Default to gray if invalid
            }

            // Ensure it starts with #
            if (!hexColor.startsWith('#')) {
              hexColor = `#${hexColor}`;
            }

            // Validate hex format (# followed by 6 hex characters)
            const hexPattern = /^#[0-9A-Fa-f]{6}$/;
            if (!hexPattern.test(hexColor)) {
              console.warn(`Invalid hex color format for ingredient ${index}: ${hexColor}. Using default gray.`);
              hexColor = '#808080';
            }

            return {
              hexColor,
              colorName: ing.colorName || `Color ${index + 1}`,
              role: ing.role || 'base',
              notes: ing.notes || '',
            };
          })
          .filter((ing: { hexColor: string; colorName: string; role: string; notes: string }) =>
            ing.hexColor !== '#808080' || ing.colorName !== 'Color'
          ), // Keep gray only if explicitly named
        steps: parsed.steps.map((step: any, index: number) => ({
          stepNumber: step.stepNumber || index + 1,
          title: step.title || `Step ${index + 1}`,
          instruction: step.instruction || '',
          paints: Array.isArray(step.paints) ? step.paints : [],
          technique: step.technique,
          tips: Array.isArray(step.tips) ? step.tips : [],
        })),
        mixingInstructions: parsed.mixingInstructions,
        applicationTips: parsed.applicationTips,
        confidence: parsed.confidence || 0.5,
      };
    } catch (error: any) {
      console.error('Error parsing recipe response:', error);
      console.error('Response text:', responseText);
      throw new Error(`Failed to parse recipe: ${error.message}`);
    }
  }

  /**
   * Expand a paint set description into individual paint names.
   * Uses Claude's knowledge of hobby paint products.
   *
   * @param description - User's description (e.g., "Speedpaint 2.0 Most Wanted Set")
   * @returns Array of paint names that match
   */
  async expandPaintSet(
    description: string
  ): Promise<{ paints: string[]; rawOutput: string }> {
    try {
      // Build the prompt
      const prompt = `You are an expert on miniature painting paints and products from brands like Army Painter, Citadel, Vallejo, Scale75, and others.

A user says they own: "${description}"

Your task is to identify which INDIVIDUAL PAINTS are likely included in this set or description.

**CRITICAL INSTRUCTIONS:**
1. If the user mentions a SET (e.g., "Speedpaint 2.0 Most Wanted Set", "Game Color Starter Set"), you MUST use your knowledge to recall ALL the individual paints that are typically included in that set.
2. If it's a general description (e.g., "some red and blue paints"), list a few common standard paints that fit.
3. Return ONLY a JSON array of the paint names.
4. Do NOT output the set name itself in the array.

Example Output:
["Gravelord Grey", "Slaughter Red", "Pallid Bone"]

JSON Output:`;

      // Use Claude Sonnet 4.5 (Smartest model) for deep knowledge recall
      // More capable than Haiku for full set retrieval
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
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

  /**
   * Make a custom API call to Claude
   * Useful for scrapers and other tools that need direct access
   */
  async callAPI(params: {
    model?: string;
    max_tokens: number;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<string> {
    const response = await this.client.messages.create({
      model: params.model || this.model,
      max_tokens: params.max_tokens,
      messages: params.messages,
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude API');
    }

    return textContent.text;
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
