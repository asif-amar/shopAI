/**
 * Shared message types for communication between content scripts and background
 */

export type MessageKind = 'PING';

export interface BaseMessage {
  kind: MessageKind;
  id?: string;
}

export interface PingMessage extends BaseMessage {
  kind: 'PING';
}

export type Message = PingMessage;

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


export type MessageResponse<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: string };
