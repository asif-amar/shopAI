import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Message, MessageResponse } from '@/types/messages';
import '@/styles/global.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Popup: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await sendMessage({ kind: 'PING' });
      setIsConnected(response.ok);
    } catch (error) {
      setIsConnected(false);
    }
  };

  const sendMessage = (message: Message): Promise<MessageResponse> => {
    return new Promise(resolve => {
      chrome.runtime.sendMessage(message, (response: MessageResponse) => {
        resolve(response);
      });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setResponse('');

    try {
      const result = await sendMessage({
        kind: 'RUN_AI',
        input: message,
        context: { url: window.location.href },
      });

      if (result.ok) {
        setResponse(result.data.text);
      } else {
        setResponse(`Error: ${(result as any).error}`);
      }
    } catch (error) {
      setResponse('Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="extension-popup p-4">
      <div
        className="d-flex align-center mb-4 pb-3"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div
          className="d-flex align-center justify-center"
          style={{
            width: '32px',
            height: '32px',
            background: 'var(--primary-gradient)',
            borderRadius: '50%',
            color: 'white',
            fontWeight: 'bold',
            marginRight: '12px',
          }}
        >
          AI
        </div>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-primary)',
            }}
          >
            shopAI Assistant
          </h1>
          <div
            className="d-flex align-center"
            style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isConnected
                  ? 'var(--success-color)'
                  : 'var(--error-color)',
                marginRight: '6px',
              }}
            />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="form-group">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Ask me about products, prices, or shopping advice..."
            className="form-input form-textarea"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !message.trim()}
          className="btn w-100"
        >
          {isLoading ? (
            <>
              <div className="spinner mr-2" />
              Analyzing...
            </>
          ) : (
            'Get AI Advice'
          )}
        </button>
      </form>

      {response && (
        <div className="card">
          <h3
            style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-primary)',
            }}
          >
            AI Response:
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.6',
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {response}
            </ReactMarkdown>
          </p>
        </div>
      )}

      <div
        className="text-center mt-4 pt-3"
        style={{
          borderTop: '1px solid var(--border-color)',
          fontSize: '12px',
          color: 'var(--text-muted)',
        }}
      >
        <p className="mb-2">shopAI helps you make better purchase decisions</p>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="btn btn-secondary"
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          Settings
        </button>
      </div>
    </div>
  );
};

// Initialize the popup
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
