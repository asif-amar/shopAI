import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Message, MessageResponse } from '@/types/messages';
import '@/styles/global.css';

const Popup: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    checkConnection();
    getCurrentTab();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await sendMessage({ kind: 'PING' });
      setIsConnected(response.ok);
    } catch (error) {
      setIsConnected(false);
    }
  };

  const getCurrentTab = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url);
      }
    } catch (error) {
      console.error('Failed to get current tab:', error);
    }
  };

  const sendMessage = (message: Message): Promise<MessageResponse> => {
    return new Promise(resolve => {
      chrome.runtime.sendMessage(message, (response: MessageResponse) => {
        resolve(response);
      });
    });
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
            fontSize: '16px',
          }}
        >
          🛍️
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

      <div className="mb-4">
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
          Current Page
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: '12px', 
          color: 'var(--text-secondary)',
          wordBreak: 'break-all'
        }}>
          {currentUrl || 'No URL detected'}
        </p>
      </div>

      <div className="card mb-4">
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)',
          }}
        >
          shopAI Extension
        </h3>
        <p style={{ 
          margin: '0 0 12px 0', 
          fontSize: '14px', 
          color: 'var(--text-secondary)',
          lineHeight: '1.4'
        }}>
          Your shopping assistant extension is ready. Configure your preferences in settings.
        </p>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="btn w-100"
          style={{ fontSize: '14px', padding: '10px' }}
        >
          ⚙️ Open Settings
        </button>
      </div>

      <div
        className="text-center pt-3"
        style={{
          borderTop: '1px solid var(--border-color)',
          fontSize: '12px',
          color: 'var(--text-muted)',
        }}
      >
        <p className="mb-0">shopAI helps you make better purchase decisions</p>
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