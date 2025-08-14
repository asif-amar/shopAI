import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

interface AIProviderConfig {
  apiKey: string;
  model: string;
  organization?: string;
}

interface UserPreferences {
  budget?: number;
  priorities: string[];
  preferredBrands: string[];
  enableNotifications: boolean;
}

const Options: React.FC = () => {
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>({
    apiKey: '',
    model: 'gpt-3.5-turbo'
  });
  
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    priorities: [],
    preferredBrands: [],
    enableNotifications: true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get(['aiProviderConfig', 'userPreferences']);
      
      if (result.aiProviderConfig) {
        setAiConfig(result.aiProviderConfig);
      }
      
      if (result.userPreferences) {
        setUserPrefs(result.userPreferences);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      await chrome.storage.local.set({
        aiProviderConfig: aiConfig,
        userPreferences: userPrefs
      });
      
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIConfigChange = (field: keyof AIProviderConfig, value: string) => {
    setAiConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleUserPrefsChange = (field: keyof UserPreferences, value: any) => {
    setUserPrefs(prev => ({ ...prev, [field]: value }));
  };

  const addPriority = () => {
    const newPriority = prompt('Enter a shopping priority:');
    if (newPriority && !userPrefs.priorities.includes(newPriority)) {
      handleUserPrefsChange('priorities', [...userPrefs.priorities, newPriority]);
    }
  };

  const removePriority = (index: number) => {
    handleUserPrefsChange('priorities', userPrefs.priorities.filter((_, i) => i !== index));
  };

  const addBrand = () => {
    const newBrand = prompt('Enter a preferred brand:');
    if (newBrand && !userPrefs.preferredBrands.includes(newBrand)) {
      handleUserPrefsChange('preferredBrands', [...userPrefs.preferredBrands, newBrand]);
    }
  };

  const removeBrand = (index: number) => {
    handleUserPrefsChange('preferredBrands', userPrefs.preferredBrands.filter((_, i) => i !== index));
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '24px',
          margin: '0 auto 16px'
        }}>
          AI
        </div>
        <h1 style={{
          margin: 0,
          fontSize: '32px',
          fontWeight: '700',
          color: '#333'
        }}>
          shopAI Settings
        </h1>
        <p style={{
          margin: '8px 0 0 0',
          fontSize: '16px',
          color: '#666'
        }}>
          Configure your AI assistant and preferences
        </p>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          background: message.includes('success') ? '#d4edda' : '#f8d7da',
          color: message.includes('success') ? '#155724' : '#721c24',
          borderRadius: '8px',
          marginBottom: '24px',
          border: `1px solid ${message.includes('success') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '40px',
        marginBottom: '40px'
      }}>
        {/* AI Configuration */}
        <div style={{
          background: '#f8f9fa',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#333'
          }}>
            AI Configuration
          </h2>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              OpenAI API Key *
            </label>
            <input
              type="password"
              value={aiConfig.apiKey}
              onChange={(e) => handleAIConfigChange('apiKey', e.target.value)}
              placeholder="sk-..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              Your API key is stored locally and never shared
            </small>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Model
            </label>
            <select
              value={aiConfig.model}
              onChange={(e) => handleAIConfigChange('model', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Organization ID (Optional)
            </label>
            <input
              type="text"
              value={aiConfig.organization || ''}
              onChange={(e) => handleAIConfigChange('organization', e.target.value)}
              placeholder="org-..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* User Preferences */}
        <div style={{
          background: '#f8f9fa',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#333'
          }}>
            Shopping Preferences
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Monthly Budget (Optional)
            </label>
            <input
              type="number"
              value={userPrefs.budget || ''}
              onChange={(e) => handleUserPrefsChange('budget', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="1000"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Shopping Priorities
            </label>
            <div style={{ marginBottom: '8px' }}>
              {userPrefs.priorities.map((priority, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span style={{ flex: 1, fontSize: '14px' }}>{priority}</span>
                  <button
                    onClick={() => removePriority(index)}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addPriority}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Add Priority
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Preferred Brands
            </label>
            <div style={{ marginBottom: '8px' }}>
              {userPrefs.preferredBrands.map((brand, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span style={{ flex: 1, fontSize: '14px' }}>{brand}</span>
                  <button
                    onClick={() => removeBrand(index)}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addBrand}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Add Brand
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={userPrefs.enableNotifications}
                onChange={(e) => handleUserPrefsChange('enableNotifications', e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Enable notifications
            </label>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={saveSettings}
          disabled={isLoading}
          style={{
            background: isLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '16px 32px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s ease'
          }}
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

// Initialize the options page
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
} 