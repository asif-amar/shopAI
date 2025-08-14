/**
 * Shared message types for communication between content scripts and background
 */

export type MessageKind = 
  | "PING"
  | "RUN_AI"
  | "GET_PRODUCT_INFO"
  | "ANALYZE_PRICE"
  | "GET_RECOMMENDATIONS"
  | "CHAT_MESSAGE";

export interface BaseMessage {
  kind: MessageKind;
  id?: string;
}

export interface PingMessage extends BaseMessage {
  kind: "PING";
}

export interface RunAIMessage extends BaseMessage {
  kind: "RUN_AI";
  input: string;
  context?: {
    url?: string;
    productInfo?: ProductInfo;
  };
}

export interface GetProductInfoMessage extends BaseMessage {
  kind: "GET_PRODUCT_INFO";
  url: string;
}

export interface AnalyzePriceMessage extends BaseMessage {
  kind: "ANALYZE_PRICE";
  price: number;
  currency: string;
  productName: string;
  url: string;
}

export interface GetRecommendationsMessage extends BaseMessage {
  kind: "GET_RECOMMENDATIONS";
  productInfo: ProductInfo;
}

export interface ChatMessage extends BaseMessage {
  kind: "CHAT_MESSAGE";
  productInfo: ProductInfo;
  message: string;
}

export type Message = 
  | PingMessage
  | RunAIMessage
  | GetProductInfoMessage
  | AnalyzePriceMessage
  | GetRecommendationsMessage
  | ChatMessage;

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