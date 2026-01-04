/**
 * Replicate API Client
 *
 * Integrates with Replicate for image processing:
 * - Image enhancement (Real-ESRGAN 2x): better clarity and detail
 * - Upscaling (Real-ESRGAN 4x): high-resolution upscaling
 */

import Replicate from 'replicate';

export type ReplicateOperation = 'enhancement' | 'upscaling';

export interface EnhancementResult {
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
  }

  /**
   * Enhance image with better clarity and detail (2x upscale)
   * @param imageUrl - URL of the image to process
   * @returns Result with enhanced image
   */
  async enhanceImage(imageUrl: string): Promise<EnhancementResult> {
    const startTime = Date.now();

    try {
      console.log('[Replicate] Starting image enhancement (2x upscale)...');

      let output = await this.client.run(
        this.enhancementModel as any,
        {
          input: {
            image: imageUrl,
            scale: 2,
            face_enhance: false,  // Don't enhance faces (for miniatures)
          },
        }
      );

      console.log('[Replicate] Raw output type:', typeof output);
      console.log('[Replicate] Is array:', Array.isArray(output));
      console.log('[Replicate] Is ReadableStream:', output instanceof ReadableStream);

      // Handle ReadableStream - Replicate streams the actual image data
      if (output instanceof ReadableStream) {
        console.log('[Replicate] Reading image data stream...');
        const reader = output.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
          }
        }

        console.log('[Replicate] Stream chunks count:', chunks.length);

        // Concatenate all chunks into a single buffer
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const imageData = new Uint8Array(totalLength);
        let offset = 0;

        for (const chunk of chunks) {
          imageData.set(chunk, offset);
          offset += chunk.length;
        }

        const imageBuffer = Buffer.from(imageData);
        const processingTime = Date.now() - startTime;

        console.log(`[Replicate] Image enhancement completed in ${processingTime}ms`);
        console.log(`[Replicate] Image buffer size: ${imageBuffer.length} bytes`);

        return {
          imageBuffer,
          processingTime,
        };
      }

      const processingTime = Date.now() - startTime;

      // Fallback: Output is a URL string or array with one URL
      let outputUrl: string | null = null;

      if (Array.isArray(output)) {
        outputUrl = output[0];
      } else if (typeof output === 'string') {
        outputUrl = output;
      } else if (output && typeof output === 'object') {
        // Sometimes Replicate returns an object with a URL
        outputUrl = (output as any).url || (output as any).output || (output as any).image;
      }

      if (!outputUrl || typeof outputUrl !== 'string') {
        console.error('[Replicate] Invalid output structure:', output);
        throw new Error(`Invalid output from enhancement model. Output type: ${typeof output}, Value: ${JSON.stringify(output)}`);
      }

      console.log(`[Replicate] Image enhancement completed in ${processingTime}ms`);
      console.log(`[Replicate] Output URL: ${outputUrl}`);

      return {
        outputUrl,
        processingTime,
      };
    } catch (error: any) {
      console.error('[Replicate] Image enhancement failed:', error);
      throw new Error(`Image enhancement failed: ${error.message}`);
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
