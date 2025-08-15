import { generateText, stepCountIs, tool } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { Message, MessageResponse, AIResponse } from '@/types/messages';
import { buildSystemPrompt } from '@/lib/prompts';
import { z } from 'zod';

const MESSAGE_HANDLERS: Record<
  string,
  (message: Message) => Promise<MessageResponse>
> = {
  PING: handlePing,
  RUN_AI: handleAIRequest,
};

let geminiApiKey: string | null = null;
let isInitialized = false;

async function handleMessage(message: Message): Promise<MessageResponse> {
  console.log('shopAI: Received message:', message.kind);

  const handler = MESSAGE_HANDLERS[message.kind];
  if (!handler) {
    return { ok: false, error: `Unknown message kind: ${message.kind}` };
  }

  return handler(message);
}

async function handlePing(): Promise<
  MessageResponse<{ status: string; initialized: boolean }>
> {
  return {
    ok: true,
    data: { status: 'ok', initialized: isInitialized },
  };
}

async function handleAIRequest(
  message: Message
): Promise<MessageResponse<AIResponse>> {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) {
    return { ok: false, error: 'Gemini API key not configured' };
  }

  const google = createGoogleGenerativeAI({ apiKey: apiKey });

  const runAIMessage = message as Extract<Message, { kind: 'RUN_AI' }>;

  try {
    const result = await generateText({
      model: google('models/gemini-2.5-flash-lite'),
      system: buildSystemPrompt(runAIMessage.context),
      prompt: runAIMessage.input,
      stopWhen: stepCountIs(5),
      tools: {
        listProducts: tool<{ message: string }>({
          description: 'Use this tool to list products in the store',
          inputSchema: z.object({
            message: z.string(), //.describe('The message to get the products for'),
          }) as any,
          execute: async ({ message }) => {
            const products = [
              {
                name: 'חלב',
                price: 10,
                currency: 'ILS',
                url: 'https://example.com/product-1',
                description: 'חלב 3%',
                imageUrl: 'https://example.com/product-1.jpg',
              },
              {
                name: 'לחם',
                price: 20,
                currency: 'ILS',
                url: 'https://example.com/product-2',
                description: 'לחם שיפון',
                imageUrl: 'https://example.com/product-2.jpg',
              },
            ];

            return products;
          },
        }),
      },
    });

    return {
      ok: true,
      data: { text: result.text, confidence: 0.8 },
    };
  } catch (error) {
    console.error('shopAI: AI request failed:', error);
    return {
      ok: false,
      error: `AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function getGeminiApiKey(): Promise<string | null> {
  if (!geminiApiKey) {
    const config = await loadGeminiConfig();
    if (config?.apiKey) {
      geminiApiKey = config.apiKey;
      isInitialized = true;
      console.log('shopAI: Initialized with Gemini API key');
    }
  }
  return geminiApiKey;
}

async function loadGeminiConfig(): Promise<{ apiKey?: string } | null> {
  try {
    const result = await chrome.storage.local.get(['geminiConfig']);
    return result.geminiConfig;
  } catch (error) {
    console.error('shopAI: Failed to load Gemini config:', error);
    return null;
  }
}

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    handleMessage(message)
      .then(sendResponse)
      .catch(error => {
        console.error('shopAI: Message handling error:', error);
        sendResponse({ ok: false, error: error.message });
      });

    return true;
  }
);
