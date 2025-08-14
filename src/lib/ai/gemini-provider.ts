import { GoogleGenAI } from '@google/genai';
import { BaseAIProvider, AIProviderConfig, AIProviderError } from './provider';

export interface GeminiProviderConfig extends AIProviderConfig {
  model?: string;
  apiVersion?: string;
}

export interface GeminiTool {
  name: string;
  description: string;
  parametersJsonSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export class GeminiProvider extends BaseAIProvider {
  private client: GoogleGenAI;
  private model: string;
  private apiVersion: string;

  constructor(config: GeminiProviderConfig) {
    super(config);
    this.model = config.model || 'gemini-2.5-flash-lite';
    this.apiVersion = config.apiVersion || 'v1beta';

    this.client = new GoogleGenAI({
      apiKey: config.apiKey,
      apiVersion: this.apiVersion,
    });
  }

  async complete(
    input: string,
    opts?: {
      signal?: AbortSignal;
      system?: string;
      temperature?: number;
      maxTokens?: number;
      tools?: GeminiTool[];
    }
  ): Promise<string> {
    try {
      const contents = this.buildContents(input, opts?.system);

      const request: any = {
        model: this.model,
        contents,
        generationConfig: {
          temperature: opts?.temperature ?? 0.7,
          maxOutputTokens: opts?.maxTokens ?? 1000,
        },
      };

      // Add tools if provided
      if (opts?.tools && opts.tools.length > 0) {
        request.tools = [
          {
            function_declarations: opts.tools.map(tool => ({
              name: tool.name,
              description: tool.description,
              parameters: tool.parametersJsonSchema,
            })),
          },
        ];
      }

      const response = await this.client.models.generateContent(request);

      if (
        !response ||
        !response.candidates ||
        response.candidates.length === 0
      ) {
        throw new AIProviderError('No response generated', 'NO_RESPONSE');
      }

      const candidate = response.candidates[0];

      // Handle function calls
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.functionCall) {
            // Return structured function call response
            return JSON.stringify({
              type: 'function_call',
              function: part.functionCall.name,
              arguments: part.functionCall.args,
            });
          }
        }
      }

      // Return text response
      return response.text || '';
    } catch (error) {
      console.error('Gemini API error:', error);
      if (error instanceof Error) {
        throw new AIProviderError(
          `Gemini request failed: ${error.message}`,
          'GEMINI_ERROR'
        );
      }
      throw new AIProviderError('Unknown Gemini error', 'UNKNOWN_ERROR');
    }
  }

  async streamComplete(
    input: string,
    opts?: {
      signal?: AbortSignal;
      system?: string;
      temperature?: number;
      maxTokens?: number;
      onChunk?: (chunk: string) => void;
      tools?: GeminiTool[];
    }
  ): Promise<string> {
    try {
      const contents = this.buildContents(input, opts?.system);

      const request: any = {
        model: this.model,
        contents,
        generationConfig: {
          temperature: opts?.temperature ?? 0.7,
          maxOutputTokens: opts?.maxTokens ?? 1000,
        },
      };

      // Add tools if provided
      if (opts?.tools && opts.tools.length > 0) {
        request.tools = [
          {
            function_declarations: opts.tools.map(tool => ({
              name: tool.name,
              description: tool.description,
              parameters: tool.parametersJsonSchema,
            })),
          },
        ];
      }

      const stream = await this.client.models.generateContentStream(request);
      let fullResponse = '';

      for await (const chunk of stream) {
        const text = chunk.text || '';
        if (text) {
          fullResponse += text;
          opts?.onChunk?.(text);
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('Gemini streaming error:', error);
      if (error instanceof Error) {
        throw new AIProviderError(
          `Gemini streaming failed: ${error.message}`,
          'GEMINI_STREAM_ERROR'
        );
      }
      throw new AIProviderError(
        'Unknown Gemini streaming error',
        'UNKNOWN_STREAM_ERROR'
      );
    }
  }

  /**
   * Generate content with function calling support
   */
  async generateWithTools(
    input: string,
    tools: GeminiTool[],
    opts?: {
      signal?: AbortSignal;
      system?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<{ text?: string; functionCall?: { name: string; args: any } }> {
    try {
      const response = await this.complete(input, { ...opts, tools });

      try {
        const parsed = JSON.parse(response);
        if (parsed.type === 'function_call') {
          return {
            functionCall: {
              name: parsed.function,
              args: parsed.arguments,
            },
          };
        }
      } catch {
        // Response is not JSON, treat as text
      }

      return { text: response };
    } catch (error) {
      throw error; // Re-throw the error from complete()
    }
  }

  private buildContents(input: string, system?: string): Array<any> {
    const contents = [];

    if (system) {
      contents.push({
        role: 'user',
        parts: [{ text: `System: ${system}` }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: input }],
    });

    return contents;
  }

  /**
   * Get available models for this provider
   */
  static getAvailableModels(): string[] {
    return [
      'gemini-2.5-flash-lite',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
    ];
  }

  /**
   * Get provider capabilities
   */
  static getCapabilities() {
    return {
      streaming: true,
      functionCalling: true,
      systemMessages: true,
      multimodal: true,
      maxTokens: 2000000, // Gemini's context window
    };
  }
}
