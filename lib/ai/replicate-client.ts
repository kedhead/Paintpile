/**
 * Replicate API Client
 *
 * Integrates with Replicate for image processing:
 * - Background removal (RMBG-1.4): ~$0.0002 per image
 * - Upscaling (Real-ESRGAN): ~$0.001 per image
 */

import Replicate from 'replicate';

export type ReplicateOperation = 'backgroundRemoval' | 'upscaling';

export interface BackgroundRemovalResult {
  outputUrl: string;
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
  private bgRemovalModel: string;
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
    this.bgRemovalModel = process.env.REPLICATE_BG_REMOVAL_MODEL ||
      'lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1';

    this.upscaleModel = process.env.REPLICATE_UPSCALE_MODEL ||
      'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa';
  }

  /**
   * Remove background from an image
   * @param imageUrl - URL of the image to process
   * @returns Result with URL of processed image
   */
  async removeBackground(imageUrl: string): Promise<BackgroundRemovalResult> {
    const startTime = Date.now();

    try {
      console.log('[Replicate] Starting background removal...');

      const output = await this.client.run(
        this.bgRemovalModel as any,
        {
          input: {
            image: imageUrl,
          },
        }
      );

      const processingTime = Date.now() - startTime;

      // Output is typically a URL string or array with one URL
      const outputUrl = Array.isArray(output) ? output[0] : output as string;

      if (!outputUrl || typeof outputUrl !== 'string') {
        throw new Error('Invalid output from background removal model');
      }

      console.log(`[Replicate] Background removal completed in ${processingTime}ms`);

      return {
        outputUrl,
        processingTime,
      };
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
      const outputUrl = Array.isArray(output) ? output[0] : output as string;

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
   * Estimate cost for background removal (in credits)
   */
  estimateBackgroundRemovalCost(): number {
    // ~$0.0002 per image = 0.2 credits
    return 2; // 0.2 cents = 2 credits
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
