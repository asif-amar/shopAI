import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/global.css';
import ChatStorageManager, { ChatMessage } from '@/utils/chatStorage';

const SidePanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentHost, setCurrentHost] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat when component mounts
  useEffect(() => {
    initializeChat();
  }, []);

  // Listen for tab changes to update host
  useEffect(() => {
    const handleTabUpdate = () => {
      initializeChat();
    };

    // Listen for tab activation
    chrome.tabs.onActivated.addListener(handleTabUpdate);
    chrome.tabs.onUpdated.addListener(handleTabUpdate);

    return () => {
      chrome.tabs.onActivated.removeListener(handleTabUpdate);
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
    };
  }, []);

  const initializeChat = async () => {
    try {
      const host = await ChatStorageManager.getCurrentHost();
      setCurrentHost(host);
      
      // Load existing conversation for this host
      const existingMessages = await ChatStorageManager.loadConversation(host);
      setMessages(existingMessages);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setCurrentHost('unknown-host');
      setIsInitialized(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || !currentHost) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    // Add user message to state and storage
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    // Save user message to storage
    try {
      await ChatStorageManager.addMessage(currentHost, userMessage);
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    // Simulate processing delay and bot response
    setTimeout(async () => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Unavailable right now',
        isUser: false,
        timestamp: new Date()
      };

      // Add bot response to state and storage
      const finalMessages = [...updatedMessages, botResponse];
      setMessages(finalMessages);
      setIsLoading(false);

      // Save bot response to storage
      try {
        await ChatStorageManager.addMessage(currentHost, botResponse);
      } catch (error) {
        console.error('Failed to save bot response:', error);
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearCurrentConversation = async () => {
    if (!currentHost || !confirm('Are you sure you want to clear this conversation?')) return;
    
    try {
      await ChatStorageManager.clearConversation(currentHost);
      // Reload the conversation (will get default welcome message)
      await initializeChat();
    } catch (error) {
      console.error('Failed to clear conversation:', error);
    }
  };

  const getDisplayHost = (host: string) => {
    if (host === 'unknown-host') return 'Extension';
    if (host.startsWith('www.')) return host.substring(4);
    return host;
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🛍️</div>
          <div style={{ color: '#666' }}>Loading chat...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderBottom: '1px solid #e9ecef',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            🛍️
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600'
            }}>
              shopAI Assistant
            </h1>
            <p style={{
              margin: '2px 0 0 0',
              fontSize: '12px',
              opacity: 0.8
            }}>
              {getDisplayHost(currentHost)}
            </p>
          </div>
          <button
            onClick={clearCurrentConversation}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '4px',
              padding: '6px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
            title="Clear conversation"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              flexDirection: message.isUser ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
              gap: '8px'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: message.isUser 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#e9ecef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              flexShrink: 0
            }}>
              {message.isUser ? '👤' : '🤖'}
            </div>
            
            <div style={{
              maxWidth: '70%',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{
                background: message.isUser ? '#667eea' : 'white',
                color: message.isUser ? 'white' : '#333',
                padding: '12px 16px',
                borderRadius: message.isUser 
                  ? '18px 18px 4px 18px'
                  : '18px 18px 18px 4px',
                fontSize: '14px',
                lineHeight: '1.4',
                border: message.isUser ? 'none' : '1px solid #e9ecef',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                {message.text}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#6c757d',
                textAlign: message.isUser ? 'right' : 'left',
                paddingLeft: message.isUser ? '0' : '4px',
                paddingRight: message.isUser ? '4px' : '0'
              }}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#e9ecef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              flexShrink: 0
            }}>
              🤖
            </div>
            <div style={{
              background: 'white',
              padding: '12px 16px',
              borderRadius: '18px 18px 18px 4px',
              border: '1px solid #e9ecef',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'flex',
                gap: '4px',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#6c757d',
                  animation: 'pulse 1.4s infinite ease-in-out'
                }} />
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#6c757d',
                  animation: 'pulse 1.4s infinite ease-in-out 0.2s'
                }} />
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#6c757d',
                  animation: 'pulse 1.4s infinite ease-in-out 0.4s'
                }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 20px',
        background: 'white',
        borderTop: '1px solid #e9ecef',
        flexShrink: 0
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            style={{
              flex: 1,
              minHeight: '40px',
              maxHeight: '120px',
              padding: '10px 12px',
              border: '1px solid #e9ecef',
              borderRadius: '20px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              background: isLoading ? '#f8f9fa' : 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: (!inputText.trim() || isLoading) 
                ? '#e9ecef' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              cursor: (!inputText.trim() || isLoading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </form>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 60%, 100% { 
              transform: scale(0.8);
              opacity: 0.5;
            }
            30% { 
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

// Initialize the side panel
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<SidePanel />);
}