import { Message, MessageResponse, ProductInfo } from '@/types/messages';

/**
 * Content script for shopAI extension
 * Detects products on shopping pages and provides AI assistance
 */

class ContentScript {
  private productInfo: ProductInfo | null = null;
  private sidebar: HTMLElement | null = null;
  private isSidebarOpen = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Check if we're on a shopping page
      if (this.isShoppingPage()) {
        await this.setupProductDetection();
        await this.setupUI();
        console.log('shopAI: Content script initialized on shopping page');
      } else {
        console.log('shopAI: Not a shopping page, content script disabled');
      }
    } catch (error) {
      console.error('shopAI: Failed to initialize content script:', error);
    }
  }

  private isShoppingPage(): boolean {
    // For testing, let's enable on all pages
    return true;
    
    // Original logic (commented out for testing)
    /*
    const url = window.location.href.toLowerCase();
    const shoppingDomains = [
      'amazon.com', 'amazon.co.uk', 'amazon.ca', 'amazon.de', 'amazon.fr', 'amazon.it', 'amazon.es', 'amazon.co.jp',
      'ebay.com', 'ebay.co.uk', 'ebay.ca', 'ebay.de', 'ebay.fr', 'ebay.it', 'ebay.es',
      'walmart.com', 'target.com', 'bestbuy.com', 'newegg.com',
      'etsy.com', 'shopify.com'
    ];
    
    return shoppingDomains.some(domain => url.includes(domain));
    */
  }

  private async setupProductDetection(): Promise<void> {
    // Wait for page to load
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve);
      });
    }

    // Extract product information
    this.productInfo = this.extractProductInfo();
    
    if (this.productInfo) {
      console.log('shopAI: Detected product:', this.productInfo);
    }
  }

  private extractProductInfo(): ProductInfo | null {
    const url = window.location.href;
    
    // Try to extract product info from common selectors
    const selectors = {
      name: [
        'h1[data-testid="product-title"]',
        'h1.product-title',
        'h1[class*="title"]',
        'h1',
        '[data-testid="product-name"]',
        '.product-name'
      ],
      price: [
        '[data-testid="price"]',
        '.price',
        '[class*="price"]',
        '.product-price',
        '.current-price'
      ],
      description: [
        '[data-testid="product-description"]',
        '.product-description',
        '[class*="description"]',
        '.description'
      ],
      image: [
        '[data-testid="product-image"] img',
        '.product-image img',
        '.main-image img',
        'img[alt*="product"]'
      ]
    };

    const name = this.findElementText(selectors.name);
    const priceText = this.findElementText(selectors.price);
    const description = this.findElementText(selectors.description);
    const imageUrl = this.findElementAttribute(selectors.image, 'src');

    if (!name || !priceText) {
      return null;
    }

    const price = this.extractPrice(priceText);
    if (!price) {
      return null;
    }

    const productInfo: ProductInfo = {
      name: name.trim(),
      price: price.value,
      currency: price.currency,
      url,
    };
    
    if (description?.trim()) {
      productInfo.description = description.trim();
    }
    
    if (imageUrl) {
      productInfo.imageUrl = imageUrl;
    }
    
    return productInfo;
  }

  private findElementText(selectors: string[]): string | null {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        return element.textContent.trim();
      }
    }
    return null;
  }

  private findElementAttribute(selectors: string[], attribute: string): string | null {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const value = element.getAttribute(attribute);
        if (value) {
          return value;
        }
      }
    }
    return null;
  }

  private extractPrice(priceText: string): { value: number; currency: string } | null {
    // Remove common price text and extract numeric value
    const cleanText = priceText.replace(/[^\d.,]/g, '');
    const match = cleanText.match(/(\d+[.,]\d+|\d+)/);
    
    if (!match) {
      return null;
    }

    const value = parseFloat(match[1].replace(',', '.'));
    if (isNaN(value)) {
      return null;
    }

    // Try to detect currency from original text
    const currencyMatch = priceText.match(/[\$€£¥₹]/);
    const currency = currencyMatch && currencyMatch[0] ? currencyMatch[0] : 'USD';

    return { value, currency };
  }

  private async setupUI(): Promise<void> {
    console.log('shopAI: Setting up UI...');
    
    // Create toggle button
    const toggleButton = this.createToggleButton();
    document.body.appendChild(toggleButton);
    console.log('shopAI: Toggle button created and added to page');

    // Create sidebar
    this.sidebar = this.createSidebar();
    if (this.sidebar) {
      document.body.appendChild(this.sidebar);
    }
    console.log('shopAI: Sidebar created and added to page');

    // Add click handler for toggle button
    toggleButton.addEventListener('click', () => {
      console.log('shopAI: Toggle button clicked');
      this.toggleSidebar();
    });

    // Add keyboard shortcut (Ctrl/Cmd + Shift + A)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        console.log('shopAI: Keyboard shortcut triggered');
        this.toggleSidebar();
      }
    });

    // Setup sidebar event listeners
    this.setupSidebarEventListeners();
    console.log('shopAI: UI setup complete');
  }

  private createToggleButton(): HTMLElement {
    const button = document.createElement('div');
    button.innerHTML = `
      <div id="shopai-toggle" style="
        position: fixed;
        top: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        cursor: pointer;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        font-weight: bold;
        transition: all 0.3s ease;
        border: 3px solid rgba(255,255,255,0.3);
        animation: pulse 2s infinite;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        AI
      </div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
          50% { box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); }
          100% { box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
        }
      </style>
    `;
    
    return button;
  }

  private createSidebar(): HTMLElement {
    const sidebar = document.createElement('div');
    sidebar.innerHTML = `
      <div id="shopai-sidebar" style="
        position: fixed;
        top: 0;
        right: -400px;
        width: 400px;
        height: 100vh;
        background: #ffffff;
        box-shadow: -4px 0 20px rgba(0,0,0,0.1);
        z-index: 10001;
        transition: right 0.3s ease;
        display: flex;
        flex-direction: column;
        border-left: 1px solid #e9ecef;
        overflow: hidden;
      ">
        <!-- Header -->
        <div style="
          padding: 20px;
          border-bottom: 1px solid #e9ecef;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="
              width: 32px;
              height: 32px;
              background: rgba(255,255,255,0.2);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
            ">AI</div>
            <div>
              <h3 style="margin: 0; font-size: 18px; font-weight: 600;">shopAI Assistant</h3>
              <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.8;">Shopping Intelligence</p>
            </div>
          </div>
          <button id="shopai-close" style="
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: background-color 0.2s ease;
          " onmouseover="this.style.backgroundColor='rgba(255,255,255,0.1)'" onmouseout="this.style.backgroundColor='transparent'">×</button>
        </div>

        <!-- Content -->
        <div id="shopai-content" style="
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: calc(100vh - 80px);
        ">
          <!-- Chat Messages -->
          <div id="shopai-chat-messages" style="
            flex: 1;
            background: #f8f9fa;
            border-radius: 12px;
            padding: 16px;
            border: 1px solid #e9ecef;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-height: 300px;
          ">
            <!-- Welcome message -->
            <div style="
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 16px;
              border-radius: 12px;
              font-size: 14px;
              line-height: 1.5;
              align-self: flex-start;
              max-width: 80%;
            ">
              <div style="font-weight: 600; margin-bottom: 4px;">🤖 shopAI Assistant</div>
              <div>Hi! I'm here to help you with shopping decisions. Ask me anything about products, prices, or recommendations!</div>
            </div>
          </div>

          <!-- Chat Input -->
          <div style="
            display: flex;
            gap: 8px;
            flex-shrink: 0;
            align-items: flex-end;
          ">
            <textarea id="shopai-chat-input" placeholder="Type your message here..." style="
              flex: 1;
              min-height: 40px;
              max-height: 120px;
              padding: 12px;
              border: 1px solid #e9ecef;
              border-radius: 20px;
              font-size: 14px;
              font-family: inherit;
              resize: none;
              outline: none;
              transition: border-color 0.2s ease;
            " onkeydown="if(event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); document.getElementById('shopai-send-btn').click(); }"></textarea>
            <button id="shopai-send-btn" style="
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
              flex-shrink: 0;
            " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
    
    return sidebar;
  }

  private toggleSidebar(): void {
    if (!this.sidebar) return;
    
    const sidebarElement = this.sidebar.querySelector('#shopai-sidebar') as HTMLElement;
    const toggleButton = document.querySelector('#shopai-toggle') as HTMLElement;
    
    if (this.isSidebarOpen) {
      sidebarElement.style.right = '-400px';
      toggleButton.style.right = '20px';
      this.isSidebarOpen = false;
    } else {
      sidebarElement.style.right = '0px';
      toggleButton.style.right = '420px';
      this.isSidebarOpen = true;
    }
  }

  private setupSidebarEventListeners(): void {
    if (!this.sidebar) return;

    // Close button
    const closeButton = this.sidebar.querySelector('#shopai-close') as HTMLElement;
    closeButton.addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Chat input and send button
    const chatInput = this.sidebar.querySelector('#shopai-chat-input') as HTMLTextAreaElement;
    const sendButton = this.sidebar.querySelector('#shopai-send-btn') as HTMLButtonElement;

    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
      const hasValue = chatInput.value.trim().length > 0;
      sendButton.disabled = !hasValue;
      
      // Auto-resize textarea
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    sendButton.addEventListener('click', () => {
      const message = chatInput.value.trim();
      if (message) {
        this.sendChatMessage(message);
        chatInput.value = '';
        chatInput.style.height = '40px';
        sendButton.disabled = true;
      }
    });
  }

  private async sendChatMessage(message: string): Promise<void> {
    if (!this.productInfo) {
      this.addChatMessage('No product detected on this page', 'error');
      return;
    }

    // Add user message to chat
    this.addChatMessage(message, 'user');

    // Show typing indicator
    this.addTypingIndicator();

    try {
      const response = await this.sendMessage({
        kind: 'CHAT_MESSAGE',
        productInfo: this.productInfo,
        message: message
      });

      // Remove typing indicator
      this.removeTypingIndicator();

      if (response.ok) {
        this.addChatMessage(response.data.text, 'assistant');
      } else {
        this.addChatMessage(`Error: ${(response as any).error}`, 'error');
      }
    } catch (error) {
      this.removeTypingIndicator();
      this.addChatMessage('Failed to send message', 'error');
    }
  }

  private addChatMessage(message: string, type: 'user' | 'assistant' | 'error'): void {
    const chatMessages = this.sidebar?.querySelector('#shopai-chat-messages') as HTMLElement;
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    const isUser = type === 'user';
    
    messageDiv.style.cssText = `
      background: ${isUser ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : type === 'error' ? '#ffebee' : '#ffffff'};
      color: ${isUser ? 'white' : type === 'error' ? '#c62828' : '#333333'};
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
      align-self: ${isUser ? 'flex-end' : 'flex-start'};
      max-width: 80%;
      border: ${type === 'error' ? '1px solid #f44336' : 'none'};
      margin-left: ${isUser ? 'auto' : '0'};
    `;

    if (type === 'user') {
      messageDiv.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">👤 You</div>
        <div>${message}</div>
      `;
    } else if (type === 'assistant') {
      messageDiv.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">🤖 shopAI Assistant</div>
        <div>${message}</div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">⚠️ Error</div>
        <div>${message}</div>
      `;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  private addTypingIndicator(): void {
    const chatMessages = this.sidebar?.querySelector('#shopai-chat-messages') as HTMLElement;
    if (!chatMessages) return;

    const typingDiv = document.createElement('div');
    typingDiv.id = 'shopai-typing';
    typingDiv.style.cssText = `
      background: #ffffff;
      color: #333333;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
      align-self: flex-start;
      max-width: 80%;
      border: 1px solid #e9ecef;
    `;
    typingDiv.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">🤖 shopAI Assistant</div>
      <div style="display: flex; align-items: center; gap: 4px;">
        <span>Typing</span>
        <div style="display: flex; gap: 2px;">
          <div style="width: 4px; height: 4px; background: #999; border-radius: 50%; animation: typing 1.4s infinite ease-in-out;"></div>
          <div style="width: 4px; height: 4px; background: #999; border-radius: 50%; animation: typing 1.4s infinite ease-in-out 0.2s;"></div>
          <div style="width: 4px; height: 4px; background: #999; border-radius: 50%; animation: typing 1.4s infinite ease-in-out 0.4s;"></div>
        </div>
      </div>
      <style>
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      </style>
    `;

    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  private removeTypingIndicator(): void {
    const typingDiv = this.sidebar?.querySelector('#shopai-typing') as HTMLElement;
    if (typingDiv) {
      typingDiv.remove();
    }
  }





  private async sendMessage(message: Message): Promise<MessageResponse> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response: MessageResponse) => {
        resolve(response);
      });
    });
  }
}

// Initialize content script
new ContentScript(); 