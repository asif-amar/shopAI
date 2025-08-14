import { Message, MessageResponse, AIResponse } from '@/types/messages';
import { OpenAIProvider } from '@/lib/ai/openai-provider';
import { AIProvider } from '@/lib/ai/provider';

/**
 * Background service worker for shopAI extension
 * Handles AI requests and manages extension state
 */

class BackgroundService {
  private aiProvider: AIProvider | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Load AI provider configuration from storage
      const config = await this.loadAIProviderConfig();
      if (config) {
        this.aiProvider = new OpenAIProvider(config);
        this.isInitialized = true;
        console.log('shopAI: Background service initialized with AI provider');
      } else {
        console.log('shopAI: No AI provider configured, some features will be disabled');
      }
    } catch (error) {
      console.error('shopAI: Failed to initialize background service:', error);
    }

    // Set up message listeners
    this.setupMessageListeners();
  }

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
      this.handleMessage(message, sender)
        .then(sendResponse)
        .catch(error => {
          console.error('shopAI: Message handling error:', error);
          sendResponse({ ok: false, error: error.message });
        });
      
      return true; // Keep message channel open for async response
    });
  }

  private async handleMessage(message: Message, _sender: chrome.runtime.MessageSender): Promise<MessageResponse> {
    console.log('shopAI: Received message:', message.kind);

    switch (message.kind) {
      case 'PING':
        return this.handlePing();
      
      case 'RUN_AI':
        return this.handleRunAI(message);
      
      case 'GET_PRODUCT_INFO':
        return this.handleGetProductInfo(message);
      
      case 'ANALYZE_PRICE':
        return this.handleAnalyzePrice(message);
      
      case 'GET_RECOMMENDATIONS':
        return this.handleGetRecommendations(message);
      
      case 'CHAT_MESSAGE':
        return this.handleChatMessage(message);
      
      default:
        return { ok: false, error: `Unknown message kind: ${(message as any).kind}` };
    }
  }

  private async handlePing(): Promise<MessageResponse<{ status: string; initialized: boolean }>> {
    return {
      ok: true,
      data: {
        status: 'ok',
        initialized: this.isInitialized
      }
    };
  }

  private async handleRunAI(message: Extract<Message, { kind: 'RUN_AI' }>): Promise<MessageResponse<AIResponse>> {
    if (!this.aiProvider) {
      return { ok: false, error: 'AI provider not configured' };
    }

    try {
      const response = await this.aiProvider.complete(message.input, {
        system: this.getSystemPrompt(message.context),
        temperature: 0.7,
        maxTokens: 1000
      });

      return {
        ok: true,
        data: {
          text: response,
          confidence: 0.8
        }
      };
    } catch (error) {
      console.error('shopAI: AI request failed:', error);
      return { ok: false, error: `AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  private async handleGetProductInfo(message: Extract<Message, { kind: 'GET_PRODUCT_INFO' }>): Promise<MessageResponse<any>> {
    // This would typically involve scraping the page or calling a product API
    // For now, return a placeholder response
    return {
      ok: true,
      data: {
        message: 'Product info extraction not yet implemented',
        url: message.url
      }
    };
  }

  private async handleAnalyzePrice(message: Extract<Message, { kind: 'ANALYZE_PRICE' }>): Promise<MessageResponse<AIResponse>> {
    if (!this.aiProvider) {
      return { ok: false, error: 'AI provider not configured' };
    }

    try {
      const prompt = `Analyze the price of "${message.productName}" at ${message.price} ${message.currency}. 
      Is this a good price? Provide insights on value for money and any recommendations.`;
      
      const response = await this.aiProvider.complete(prompt, {
        system: 'You are a shopping assistant that helps users make informed purchase decisions. Provide clear, actionable advice.',
        temperature: 0.7,
        maxTokens: 500
      });

      return {
        ok: true,
        data: {
          text: response,
          confidence: 0.8
        }
      };
    } catch (error) {
      console.error('shopAI: Price analysis failed:', error);
      return { ok: false, error: `Price analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  private async handleGetRecommendations(message: Extract<Message, { kind: 'GET_RECOMMENDATIONS' }>): Promise<MessageResponse<AIResponse>> {
    if (!this.aiProvider) {
      return { ok: false, error: 'AI provider not configured' };
    }

    try {
      const prompt = `Based on this product: ${message.productInfo.name} at ${message.productInfo.price} ${message.productInfo.currency}, 
      provide shopping recommendations. Consider alternatives, timing, and value.`;
      
      const response = await this.aiProvider.complete(prompt, {
        system: 'You are a shopping assistant that provides personalized recommendations based on product information and market knowledge.',
        temperature: 0.7,
        maxTokens: 800
      });

      return {
        ok: true,
        data: {
          text: response,
          confidence: 0.8,
          suggestions: this.extractSuggestions(response)
        }
      };
    } catch (error) {
      console.error('shopAI: Recommendations failed:', error);
      return { ok: false, error: `Recommendations failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  private async handleChatMessage(message: Extract<Message, { kind: 'CHAT_MESSAGE' }>): Promise<MessageResponse<AIResponse>> {
    if (!this.aiProvider) {
      return { ok: false, error: 'AI provider not configured' };
    }

    try {
      const systemPrompt = `You are shopAI, a helpful shopping assistant. The user is currently viewing a product: ${message.productInfo.name} at ${message.productInfo.price} ${message.productInfo.currency}. 
      
      Provide helpful, conversational responses about shopping decisions, product comparisons, pricing advice, and general shopping guidance. 
      Be friendly, informative, and focus on helping the user make the best purchase decision.`;
      
      const response = await this.aiProvider.complete(message.message, {
        system: systemPrompt,
        temperature: 0.7,
        maxTokens: 1000
      });

      return {
        ok: true,
        data: {
          text: response,
          confidence: 0.8
        }
      };
    } catch (error) {
      console.error('shopAI: Chat message failed:', error);
      return { ok: false, error: `Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  private getSystemPrompt(context?: { url?: string; productInfo?: any }): string {
    let prompt = 'You are shopAI, a helpful shopping assistant that provides clear, actionable advice to help users make informed purchase decisions.';
    
    if (context?.url) {
      prompt += ` The user is currently on: ${context.url}`;
    }
    
    if (context?.productInfo) {
      prompt += ` Product context: ${JSON.stringify(context.productInfo)}`;
    }
    
    prompt += ' Provide concise, helpful responses focused on value, quality, and user benefit.';
    
    return prompt;
  }

  private extractSuggestions(response: string): string[] {
    // Simple extraction of suggestions from AI response
    const suggestions: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        suggestions.push(line.trim().substring(1).trim());
      }
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private async loadAIProviderConfig(): Promise<any> {
    try {
      const result = await chrome.storage.local.get(['aiProviderConfig']);
      return result.aiProviderConfig;
    } catch (error) {
      console.error('shopAI: Failed to load AI provider config:', error);
      return null;
    }
  }
}

// Initialize the background service
new BackgroundService(); 