import { Message, MessageResponse } from '@/types/messages';

const MESSAGE_HANDLERS: Record<
  string,
  (message: Message) => Promise<MessageResponse>
> = {
  PING: handlePing,
};

let isInitialized = true;

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