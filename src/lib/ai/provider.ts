/**
 * AI Provider interface for provider-agnostic AI functionality
 */

export interface AIProvider {
  complete(
    input: string, 
    opts?: { 
      signal?: AbortSignal; 
      system?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string>;
  
  streamComplete(
    input: string,
    opts?: {
      signal?: AbortSignal;
      system?: string;
      temperature?: number;
      maxTokens?: number;
      onChunk?: (chunk: string) => void;
    }
  ): Promise<string>;
}

export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

/**
 * Result type for better error handling
 */
export type Result<T, E = Error> = 
  | { ok: true; data: T }
  | { ok: false; error: E };

/**
 * Base AI Provider with common functionality
 */
export abstract class BaseAIProvider implements AIProvider {
  protected config: AIProviderConfig;
  protected defaultTimeout = 10000; // 10 seconds

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  abstract complete(
    input: string, 
    opts?: { 
      signal?: AbortSignal; 
      system?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string>;

  abstract streamComplete(
    input: string,
    opts?: {
      signal?: AbortSignal;
      system?: string;
      temperature?: number;
      maxTokens?: number;
      onChunk?: (chunk: string) => void;
    }
  ): Promise<string>;

  protected async makeRequest(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout || this.defaultTimeout);

    try {
      const requestOptions: RequestInit = { ...options };
      if (options.signal) {
        requestOptions.signal = options.signal;
      } else {
        requestOptions.signal = controller.signal;
      }

      const response = await fetch(url, requestOptions);

      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  protected handleError(response: Response, errorText?: string): never {
    const message = errorText || `HTTP ${response.status}: ${response.statusText}`;
    throw new AIProviderError(message, 'HTTP_ERROR', response.status);
  }
} 