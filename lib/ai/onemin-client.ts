/**
 * 1min.ai API Client
 *
 * Direct integration with 1min.ai's native API format.
 * API Base: https://api.1min.ai/api/
 * Auth: API-KEY header
 *
 * Request format uses type/model/promptObject structure.
 */

export interface OneMinResponse {
  aiRecord?: {
    aiRecordDetail?: {
      resultObject?: string;
    };
  };
  result?: string;
  error?: string;
}

export interface OneMinChatRequest {
  type: 'CHAT_WITH_AI' | 'CHAT_WITH_IMAGE' | 'IMAGE_GENERATOR';
  model: string;
  promptObject: {
    prompt: string;
    isMixed?: boolean;
    webSearch?: boolean;
    imageList?: string[];  // For CHAT_WITH_IMAGE type
  };
}

// Map Anthropic model names to 1min.ai model names
const MODEL_MAP: Record<string, string> = {
  'claude-sonnet-4-5-20250929': 'gpt-4o', // Fallback to GPT-4o due to Claude issues on 1min.ai
  'claude-sonnet-4-20250514': 'gpt-4o',
  'claude-3-5-sonnet-20241022': 'gpt-4o',
  'claude-3-5-haiku-20241022': 'gpt-4o-mini', // Fallback to GPT-4o-mini for speed/cost
  'claude-3-opus-20240229': 'gpt-4o',
  'claude-3-sonnet-20240229': 'gpt-4o',
  'claude-3-haiku-20240307': 'claude-3-haiku', // Keep original Haiku if it works, otherwise swap to gpt-4o-mini
  'meta/meta-llama-3-70b-instruct': 'llama-3-70b',
  'gpt-4o': 'gpt-4o',
};

/**
 * 1min.ai API client for chat and image analysis
 */
export class OneMinClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.1min.ai/api';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('1min.ai API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Map Anthropic model name to 1min.ai model name
   */
  private mapModel(anthropicModel: string): string {
    return MODEL_MAP[anthropicModel] || anthropicModel;
  }

  /**
   * Send a chat request to 1min.ai
   */
  async chat(options: {
    model: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<string> {
    const model = this.mapModel(options.model);

    console.log(`[1min.ai] Sending chat request with model: ${model}`);

    const request: OneMinChatRequest = {
      type: 'CHAT_WITH_AI',
      model,
      promptObject: {
        prompt: options.prompt,
        isMixed: false,
        webSearch: false,
      },
    };

    const response = await this.makeRequest('/features', request);
    return this.extractTextResponse(response);
  }

  /**
   * Send a chat request with an image to 1min.ai
   */
  async chatWithImage(options: {
    model: string;
    prompt: string;
    imageBase64: string;
    imageMediaType: string;
    maxTokens?: number;
  }): Promise<string> {
    let model = this.mapModel(options.model);

    // FIX: 1min.ai currently returns UNSUPPORTED_MODEL for claude-sonnet-4-5 with vision.
    // Fallback to gpt-4o for vision tasks as it is reliable on 1min.ai
    if (model === 'claude-sonnet-4-5' || model.includes('claude')) {
      console.log(`[1min.ai] Swapping ${model} to gpt-4o for vision support`);
      model = 'gpt-4o';
    }

    console.log(`[1min.ai] Sending image chat request with model: ${model}`);

    // 1min.ai expects images to be uploaded as assets first
    // Step 1: Upload the image
    let imageKey: string;
    try {
      console.log('[1min.ai] Uploading image asset...');
      imageKey = await this.uploadAsset(options.imageBase64, options.imageMediaType);
      console.log(`[1min.ai] Image uploaded successfully, key: ${imageKey}`);
    } catch (error: any) {
      console.error('[1min.ai] Asset upload failed:', error);
      throw new Error(`Failed to upload image to 1min.ai: ${error.message}`);
    }

    const request: OneMinChatRequest = {
      type: 'CHAT_WITH_IMAGE',
      model,
      promptObject: {
        prompt: options.prompt,
        isMixed: false,
        webSearch: false,
        imageList: [imageKey], // Use the provided key/path
      },
    };

    const response = await this.makeRequest('/features', request);
    return this.extractTextResponse(response);
  }

  /**
   * Generate an image based on a prompt (and optional input image for img2img)
   */
  async generateImage(options: {
    prompt: string;
    model?: string;
    aspectRatio?: string;
    imageBase64?: string;
    imageMediaType?: string;
  }): Promise<string> {
    // Default to a good image model if not specified
    const model = options.model || 'midjourney';

    console.log(`[1min.ai] Sending image generation request with model: ${model}`);

    // If input image is provided, upload it first
    let imageKey: string | undefined;
    if (options.imageBase64 && options.imageMediaType) {
      try {
        console.log('[1min.ai] Uploading input image for generation...');
        imageKey = await this.uploadAsset(options.imageBase64, options.imageMediaType);
      } catch (error: any) {
        console.warn('[1min.ai] Input image upload failed, proceeding with text-to-image only:', error.message);
      }
    }

    const request: any = {
      type: 'IMAGE_GENERATOR',
      model,
      promptObject: {
        prompt: options.prompt,
        // Common parameters for image generation
        aspectRatio: options.aspectRatio || '1:1',
        negativePrompt: 'blurry, low quality, distorted',
        // Required for Midjourney models
        mode: 'fast',
        n: 1,
      },
    };

    if (imageKey) {
      request.promptObject.imageList = [imageKey];
      // Some models might expect specific parameters for img2img, 
      // but typically presence of imageList signals it.
    }

    const response = await this.makeRequest('/features', request);

    // Extract image URL from response
    // Typically returns a URL to the generated image
    return this.extractTextResponse(response);
  }

  /**
   * Upload an image asset to 1min.ai
   */
  private async uploadAsset(base64Data: string, mediaType: string): Promise<string> {
    const url = `${this.baseUrl}/assets`;

    // Construct FormData with the file
    const formData = new FormData();

    // Convert base64 to Blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mediaType });

    formData.append('asset', blob, 'image.png'); // Filename is required by some APIs

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          // Do NOT set Content-Type here, let fetch set it with boundary
          'API-KEY': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Asset upload error (${response.status}): ${errorText}`);
      }

      const data: any = await response.json();
      // The API returns the path or key in a specific field. 
      // Based on common 1min.ai patterns, it might be 'url', 'path', or 'key'.
      // Search result said "image_key" or "path".
      // Let's assume it returns an object and try to find the key.
      // If it returns { url: "..." } or { path: "..." }

      // Log the response structure for debugging
      // console.log('[1min.ai] Asset upload response:', JSON.stringify(data).substring(0, 200));

      // Check common fields
      if (data.url) return data.url;
      if (data.fileUrl) return data.fileUrl; // Some endpoints like this
      if (data.id) return data.id; // Scenario.com style returns ID
      if (data.path) return data.path;
      if (data.key) return data.key;

      // Check nested fields based on user logs
      if (data.fileContent?.path) return data.fileContent.path;
      if (data.asset?.key) return data.asset.key;
      if (data.asset?.location) return data.asset.location;

      // If result is just a string
      if (typeof data === 'string') return data;

      // If nested (like features API)
      if (data.aiRecord?.aiRecordDetail?.url) return data.aiRecord?.aiRecordDetail?.url;

      console.error('[1min.ai] Failed to parse asset key. Response keys:', Object.keys(data));
      throw new Error(`Could not parse image key from asset upload response: ${JSON.stringify(data)}`);

    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Make a request to the 1min.ai API
   */
  private async makeRequest(endpoint: string, body: any): Promise<OneMinResponse> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-KEY': this.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`1min.ai API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data as OneMinResponse;
    } catch (error: any) {
      console.error('[1min.ai] Request failed:', error.message);
      throw error;
    }
  }

  /**
   * Extract text response from 1min.ai response format
   */
  private extractTextResponse(response: OneMinResponse): string {
    let result: string | undefined;

    // Try the nested aiRecord structure first
    if (response.aiRecord?.aiRecordDetail?.resultObject) {
      result = response.aiRecord.aiRecordDetail.resultObject;
    }
    // Try direct result field
    else if (response.result) {
      result = response.result;
    }

    if (result !== undefined) {
      // Ensure it is a string (e.g. if API returns a JSON object or number)
      if (typeof result !== 'string') {
        return JSON.stringify(result);
      }
      return result;
    }

    // Check for error
    if (response.error) {
      throw new Error(`1min.ai returned error: ${response.error}`);
    }

    console.error('[1min.ai] Unexpected response structure:', JSON.stringify(response).substring(0, 500));
    throw new Error('Unexpected response format from 1min.ai');
  }

  /**
   * Health check - verify API key works
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.chat({
        model: 'claude-3-5-haiku',
        prompt: 'Say "OK" and nothing else.',
        maxTokens: 10,
      });
      return true;
    } catch (error) {
      console.error('[1min.ai] Health check failed:', error);
      return false;
    }
  }
}

/**
 * Create a 1min.ai client instance
 */
export function createOneMinClient(): OneMinClient | null {
  const apiKey = process.env.MIN_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OneMinClient(apiKey);
}
