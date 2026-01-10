/**
 * Replicate API Client
 *
 * Integrates with Replicate for image processing:
 * - Image enhancement (Real-ESRGAN 2x): better clarity and detail
 * - Upscaling (Real-ESRGAN 4x): high-resolution upscaling
 */

import Replicate from 'replicate';

export type ReplicateOperation = 'enhancement' | 'upscaling' | 'aiCleanup';

export interface EnhancementResult {
  outputUrl?: string;
  imageBuffer?: Buffer;
  processingTime: number;
}

export interface AICleanupResult {
  outputUrl?: string;
  imageBuffer?: Buffer;
  processingTime: number;
}

export interface UpscalingResult {
  outputUrl: string;
  processingTime: number;
  scale: number;
}

/**
 * Replicate API client for image processing
 */
export class ReplicateClient {
  private client: Replicate;
  private enhancementModel: string;
  private upscaleModel: string;
  private aiCleanupModel: string;
  private recolorModel: string;
  private textGenerationModel: string;

  constructor() {
    const apiKey = process.env.REPLICATE_API_KEY;

    if (!apiKey) {
      throw new Error('REPLICATE_API_KEY environment variable is not set');
    }

    this.client = new Replicate({
      auth: apiKey,
    });

    // Model versions from environment or defaults
    // Using Real-ESRGAN for both enhancement and upscaling (2x)
    this.enhancementModel = process.env.REPLICATE_ENHANCEMENT_MODEL ||
      'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa';

    this.upscaleModel = process.env.REPLICATE_UPSCALE_MODEL ||
      'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa';

    // Using rembg for clean, reliable background removal
    this.aiCleanupModel = process.env.REPLICATE_AI_CLEANUP_MODEL ||
      'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003';

    // Google Nano-Banana (Gemini 2.5 Flash Image) for advanced image editing & enhancement
    const nanoBanana = 'google/nano-banana';
    this.recolorModel = process.env.REPLICATE_RECOLOR_MODEL || nanoBanana;
    this.enhancementModel = process.env.REPLICATE_ENHANCEMENT_MODEL || nanoBanana;

    // Meta Llama 3 70B Instruct for better knowledge retrieval (specifically for paint sets)
    this.textGenerationModel = 'meta/meta-llama-3-70b-instruct';
  }

  /**
   * Unified handler for Replicate outputs (Streams, ArrayBuffers, URLs, etc.)
   */
  private async _handleReplicateOutput(output: any, startTime: number): Promise<{ imageBuffer?: Buffer; outputUrl?: string; processingTime: number }> {
    const processingTime = Date.now() - startTime;
    const rawOutput: any = output;

    console.log('[Replicate] Raw output type:', typeof output);
    console.log('[Replicate] Is array:', Array.isArray(output));
    console.log('[Replicate] Is ReadableStream:', output instanceof ReadableStream);

    // 1. Handle ReadableStream directly
    if (rawOutput instanceof ReadableStream) {
      console.log('[Replicate] Reading image data from stream...');
      const reader = rawOutput.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }

      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const imageData = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        imageData.set(chunk, offset);
        offset += chunk.length;
      }

      const imageBuffer = Buffer.from(imageData);
      console.log(`[Replicate] Stream processing completed in ${processingTime}ms. Size: ${imageBuffer.length} bytes`);
      return { imageBuffer, processingTime };
    }

    // 2. Handle objects with arrayBuffer method (Replicate FileOutput)
    if (rawOutput && typeof rawOutput.arrayBuffer === 'function') {
      console.log('[Replicate] Extracting image data via arrayBuffer()...');
      const ab = await rawOutput.arrayBuffer();
      const imageBuffer = Buffer.from(ab);
      console.log(`[Replicate] ArrayBuffer extraction completed in ${processingTime}ms`);
      return { imageBuffer, processingTime };
    }

    // 3. Extract URL from various formats
    let outputUrl: string | null = null;

    // Check for specific URL method
    if (rawOutput && typeof rawOutput.url === 'function') {
      outputUrl = rawOutput.url();
    }
    // Check if it's a direct string
    else if (typeof rawOutput === 'string' && rawOutput.startsWith('http')) {
      outputUrl = rawOutput;
    }
    // Check for array output
    else if (Array.isArray(rawOutput) && rawOutput.length > 0) {
      const first = rawOutput[0];
      if (typeof first === 'string' && first.startsWith('http')) {
        outputUrl = first;
      } else if (first && typeof first.url === 'function') {
        outputUrl = first.url();
      } else if (first && typeof first === 'object') {
        outputUrl = first.url || first.image || first.output;
      }
    }
    // Check for general object properties
    else if (rawOutput && typeof rawOutput === 'object') {
      outputUrl = rawOutput.url || rawOutput.image || rawOutput.output;
      // Final fallback: check if String(rawOutput) looks like a URL
      const outputStr = String(rawOutput);
      if (!outputUrl && outputStr.startsWith('http')) {
        outputUrl = outputStr;
      }
    }

    if (!outputUrl || typeof outputUrl !== 'string') {
      const keys = rawOutput && typeof rawOutput === 'object' ? Object.keys(rawOutput) : [];
      const proto = rawOutput ? Object.getPrototypeOf(rawOutput)?.constructor?.name : 'null';
      console.error('[Replicate] Invalid output structure:', { type: typeof rawOutput, keys, proto, value: JSON.stringify(rawOutput) });
      throw new Error(`Invalid output structure: ${JSON.stringify(rawOutput)}`);
    }

    console.log(`[Replicate] Output URL resolved: ${outputUrl}`);
    return { outputUrl, processingTime };
  }

  /**
   * Recolor/Edit image based on text prompt using InstructPix2Pix
   * @param image - URL or Buffer of the image to process
   * @param prompt - Text instruction (e.g., "make the armor red")
   * @returns Result with processed image
   */
  async recolorImage(image: string | Buffer, prompt: string): Promise<EnhancementResult> {
    const startTime = Date.now();

    try {
      console.log('[Replicate] Starting image recolor with google/nano-banana...');
      console.log(`[Replicate] Prompt: "${prompt}"`);

      // google/nano-banana uses image_input as an array and prompt as a string
      // It returns a single URL string directly.
      const output = await this.client.run(
        this.recolorModel as any,
        {
          input: {
            prompt: prompt,
            image_input: [image],
            aspect_ratio: "match_input_image",
            output_format: "jpg"
          },
        }
      );

      return this._handleReplicateOutput(output, startTime);
    } catch (error: any) {
      console.error('[Replicate] Image recolor failed:', error);
      throw new Error(`Image recolor failed: ${error.message}`);
    }
  }

  /**
   * Enhance image with better clarity and detail (2x upscale)
   * @param imageUrl - URL of the image to process
   * @returns Result with enhanced image
   */
  async enhanceImage(imageUrl: string, prompt?: string): Promise<EnhancementResult> {
    const startTime = Date.now();
    try {
      console.log('[Replicate] Starting image enhancement with google/nano-banana...');

      const enhancementPrompt = prompt || "enhance image clarity, sharpen details, improve lighting, remove noise, keep original colors";

      const output = await this.client.run(
        this.enhancementModel as any,
        {
          input: {
            prompt: enhancementPrompt,
            image_input: [imageUrl],
            aspect_ratio: "match_input_image",
            output_format: "jpg"
          }
        }
      );
      return this._handleReplicateOutput(output, startTime);
    } catch (error: any) {
      console.error('[Replicate] Image enhancement failed:', error);
      throw new Error(`Image enhancement failed: ${error.message}`);
    }
  }

  /**
   * AI-powered cleanup - removes background cleanly
   * @param imageUrl - URL of the image to process
   * @returns Result with background-removed image
   */
  async aiCleanup(imageUrl: string): Promise<AICleanupResult> {
    const startTime = Date.now();
    try {
      console.log('[Replicate] Starting background removal...');
      console.log('[Replicate] Image URL:', imageUrl);

      // Use rembg for clean background removal
      const output = await this.client.run(
        this.aiCleanupModel as any,
        {
          input: {
            image: imageUrl,
          },
        }
      );

      return this._handleReplicateOutput(output, startTime);
    } catch (error: any) {
      console.error('[Replicate] Background removal failed:', error);
      throw new Error(`Background removal failed: ${error.message}`);
    }
  }

  /**
   * Upscale an image using Real-ESRGAN
   * @param imageUrl - URL of the image to upscale
   * @param scale - Upscale factor (2 or 4)
   * @returns Result with URL of upscaled image
   */
  async upscaleImage(
    imageUrl: string,
    scale: 2 | 4 = 2
  ): Promise<UpscalingResult> {
    const startTime = Date.now();

    try {
      console.log(`[Replicate] Starting ${scale}x upscaling...`);

      const output = await this.client.run(
        this.upscaleModel as any,
        {
          input: {
            image: imageUrl,
            scale,
            face_enhance: false,  // Don't enhance faces (for miniatures)
          },
        }
      );

      const processingTime = Date.now() - startTime;

      // Output is typically a URL string or array
      const outputUrl = Array.isArray(output) ? output[0] : (output as unknown as string);

      if (!outputUrl || typeof outputUrl !== 'string') {
        throw new Error('Invalid output from upscaling model');
      }

      console.log(`[Replicate] Upscaling completed in ${processingTime}ms`);

      return {
        outputUrl,
        processingTime,
        scale,
      };
    } catch (error: any) {
      console.error('[Replicate] Upscaling failed:', error);
      throw new Error(`Upscaling failed: ${error.message}`);
    }
  }

  /**
   * Generate text using Llama 3
   * @param prompt - The full prompt including system instructions
   * @returns Generated text
   */
  async generateText(prompt: string): Promise<string> {
    const startTime = Date.now();
    try {
      console.log('[Replicate] Starting text generation with Llama 3...');

      const output = await this.client.run(
        this.textGenerationModel as any,
        {
          input: {
            prompt,
            max_tokens: 1024,
            temperature: 0.2, // Low temperature for deterministic output (good for JSON)
            top_p: 0.9,
          }
        }
      );

      const processingTime = Date.now() - startTime;

      // Llama 3 output is an array of strings (tokens) or a single string
      let text = '';
      if (Array.isArray(output)) {
        text = output.join('');
      } else {
        text = String(output);
      }

      console.log(`[Replicate] Text generation completed in ${processingTime}ms`);
      return text;
    } catch (error: any) {
      console.error('[Replicate] Text generation failed:', error);
      throw new Error(`Text generation failed: ${error.message}`);
    }
  }

  /**
   * Wait for a prediction to complete (for async predictions)
   * @param predictionId - Prediction ID
   * @param maxWaitTime - Maximum time to wait in milliseconds
   * @returns Prediction result
   */
  async waitForPrediction(
    predictionId: string,
    maxWaitTime: number = 60000
  ): Promise<any> {
    const startTime = Date.now();
    const pollInterval = 1000; // Poll every second

    while (Date.now() - startTime < maxWaitTime) {
      const prediction = await this.client.predictions.get(predictionId);

      if (prediction.status === 'succeeded') {
        return prediction.output;
      }

      if (prediction.status === 'failed') {
        throw new Error(`Prediction failed: ${prediction.error}`);
      }

      if (prediction.status === 'canceled') {
        throw new Error('Prediction was canceled');
      }

      // Still processing, wait before next poll
      await this.sleep(pollInterval);
    }

    throw new Error('Prediction timed out');
  }

  /**
   * Sleep helper for polling
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Estimate cost for image enhancement (in credits)
   */
  estimateEnhancementCost(): number {
    // Real-ESRGAN: ~$0.001 per image
    return 10; // 1.0 cent = 10 credits
  }

  /**
   * Estimate cost for upscaling (in credits)
   */
  estimateUpscalingCost(scale: 2 | 4): number {
    // ~$0.001 per image = 1 credit
    // 4x scale might cost slightly more
    return scale === 4 ? 15 : 10; // 1.0-1.5 cents = 10-15 credits
  }

  /**
   * Estimate cost for recoloring (in credits)
   */
  estimateRecolorCost(): number {
    // InstructPix2Pix run
    return 20; // ~2.0 cents = 20 credits
  }

  /**
   * Estimate cost for text generation (in credits)
   */
  estimateTextGenerationCost(): number {
    // Llama 3 8B is very cheap
    return 1; // ~0.1 cents
  }

  /**
   * Download image from Replicate output URL
   * @param url - Replicate output URL
   * @returns Image buffer
   */
  async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to download image: HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      console.error('[Replicate] Failed to download image:', error);
      throw new Error(`Failed to download processed image: ${error.message}`);
    }
  }

  /**
   * Check if Replicate API is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to list models (lightweight check)
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('[Replicate] Health check failed:', error);
      return false;
    }
  }
}

/**
 * Singleton instance
 */
let replicateClient: ReplicateClient | null = null;

export function getReplicateClient(): ReplicateClient {
  if (!replicateClient) {
    replicateClient = new ReplicateClient();
  }
  return replicateClient;
}
