import { BaseAIProvider, AIProviderConfig, AIProviderError } from './provider';

export interface OpenAIProviderConfig extends AIProviderConfig {
  model?: string;
  organization?: string;
}

export class OpenAIProvider extends BaseAIProvider {
  private model: string;
  private organization: string | undefined;

  constructor(config: OpenAIProviderConfig) {
    super(config);
    this.model = config.model || 'gpt-3.5-turbo';
    this.organization = config.organization || undefined;
  }

  async complete(
    input: string,
    opts?: {
      signal?: AbortSignal;
      system?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    const messages = this.buildMessages(input, opts?.system);
    
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: opts?.temperature ?? 0.7,
        max_tokens: opts?.maxTokens ?? 1000,
        stream: false,
      }),
    };

    if (opts?.signal) {
      requestOptions.signal = opts.signal;
    }

    const response = await this.makeRequest(
      'https://api.openai.com/v1/chat/completions',
      requestOptions
    );

    if (!response.ok) {
      this.handleError(response);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async streamComplete(
    input: string,
    opts?: {
      signal?: AbortSignal;
      system?: string;
      temperature?: number;
      maxTokens?: number;
      onChunk?: (chunk: string) => void;
    }
  ): Promise<string> {
    const messages = this.buildMessages(input, opts?.system);
    let fullResponse = '';

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: opts?.temperature ?? 0.7,
        max_tokens: opts?.maxTokens ?? 1000,
        stream: true,
      }),
    };

    if (opts?.signal) {
      requestOptions.signal = opts.signal;
    }

    const response = await this.makeRequest(
      'https://api.openai.com/v1/chat/completions',
      requestOptions
    );

    if (!response.ok) {
      this.handleError(response);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new AIProviderError('No response body', 'NO_BODY');
    }

    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                opts?.onChunk?.(content);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullResponse;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    };

    if (this.organization) {
      headers['OpenAI-Organization'] = this.organization;
    }

    return headers;
  }

  private buildMessages(input: string, system?: string): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];
    
    if (system) {
      messages.push({ role: 'system', content: system });
    }
    
    messages.push({ role: 'user', content: input });
    
    return messages;
  }
} 