/**
 * Shared message types for communication between content scripts and background
 */

export type MessageKind = 'PING' | 'RUN_AI';

export interface BaseMessage {
  kind: MessageKind;
  id?: string;
}

export interface PingMessage extends BaseMessage {
  kind: 'PING';
}

export interface RunAIMessage extends BaseMessage {
  kind: 'RUN_AI';
  input: string;
  context?: {
    url?: string;
    productInfo?: ProductInfo;
  };
}

export type Message = PingMessage | RunAIMessage;

export interface ProductInfo {
  name: string;
  price: number;
  currency: string;
  url: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  brand?: string;
}

export interface AIResponse {
  text: string;
  confidence?: number;
  suggestions?: string[];
}

export type MessageResponse<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: string };
