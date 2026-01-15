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
  type: 'CHAT_WITH_AI' | 'CHAT_WITH_IMAGE';
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

    // 1min.ai expects images as data URLs or URLs
    const imageDataUrl = `data:${options.imageMediaType};base64,${options.imageBase64}`;

    const request: OneMinChatRequest = {
      type: 'CHAT_WITH_IMAGE',
      model,
      promptObject: {
        prompt: options.prompt,
        isMixed: false,
        webSearch: false,
        imageList: [imageDataUrl],
      },
    };

    const response = await this.makeRequest('/features', request);
    return this.extractTextResponse(response);
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
