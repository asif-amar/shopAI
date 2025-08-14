# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

shopAI is a Chrome extension (Manifest V3) that provides AI-powered shopping assistance. It helps users make informed purchase decisions by analyzing products, prices, and providing personalized recommendations on major e-commerce sites.

## Development Commands

### Build & Development
```bash
# Development mode with watch (use this for active development)
npm run dev

# Development build (single build for testing)
npm run build:dev

# Production build (optimized for distribution)
npm run build

# Preview built extension
npm run preview

# Clean build artifacts
npm run clean
```

### Code Quality
```bash
# TypeScript type checking (run before committing)
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Tests
npm run test
```

### Analysis & Debugging
```bash
# Use browser dev tools or vite preview for debugging
npm run preview
```

## Architecture

### Core Structure
- **Manifest V3 Chrome Extension** using service worker architecture
- **TypeScript** with strict mode enabled
- **Vite** for building and development
- **React** for UI components (popup and options pages)
- **Provider-agnostic AI** through AIProvider interface

### Entry Points
- `src/background/index.ts` - Service worker (handles AI requests, message routing)
- `src/content/index.ts` - Content script (product detection, UI injection)
- `src/ui/popup/index.tsx` - Extension popup interface
- `src/ui/options/index.tsx` - Extension settings/options page

### Key Components

#### Message System (`src/types/messages.ts`)
All communication between content scripts and background uses typed messages:
- `PING` - Health check
- `RUN_AI` - General AI completion
- `GET_PRODUCT_INFO` - Extract product data
- `ANALYZE_PRICE` - Price analysis
- `GET_RECOMMENDATIONS` - Product recommendations
- `CHAT_MESSAGE` - Conversational AI interface

#### AI Provider System (`src/lib/ai/`)
- `provider.ts` - Abstract AIProvider interface with base functionality
- `openai-provider.ts` - OpenAI implementation with streaming support
- Supports cancellation via AbortController, 10s timeout by default
- Configuration stored in chrome.storage.local

#### Content Script Features
- Automatic product detection on shopping pages (Amazon, eBay, Walmart, etc.)
- Floating AI button injection
- Sidebar chat interface with product-aware conversation
- Keyboard shortcut (Ctrl/Cmd + Shift + A)

### File Organization
```
src/
├── background/     # Service worker
├── content/        # Page injection scripts  
├── ui/            # React components
│   ├── popup/     # Extension popup
│   └── options/   # Settings page
├── lib/           # Shared utilities
│   └── ai/        # AI provider implementations
├── types/         # TypeScript definitions
└── styles/        # Global CSS
```

## Development Guidelines

### Code Style (.cursorrules compliance)
- TypeScript strict mode ON, no `any` types except with TODO
- Functions ≤ 40 lines, single responsibility
- All public functions documented with JSDoc
- Provider-agnostic AI: only call through AIProvider interface
- Message contracts in `/types/messages.ts` - never repurpose existing message kinds
- No hardcoded API keys - use chrome.storage for user configuration

### Chrome Extension Specifics
- Service worker architecture (no DOM access in background)
- Use chrome.runtime.onMessage for content ↔ background communication
- Minimal permissions in manifest.json
- No eval() or dynamic code generation (CSP compliant)
- Version bump required when changing manifest/permissions

### Testing Extension
After building, load unpacked extension:
1. Build: `npm run build` or `npm run build:dev`
2. Go to `chrome://extensions/`
3. Enable Developer mode
4. Click "Load unpacked" → select `dist` folder

### AI Configuration
Users provide OpenAI API key through options page, stored via chrome.storage.local. Configuration format:
```typescript
{
  apiKey: string;
  model?: string;
  organization?: string;
}
```

## Important Notes

- Build artifacts go to `dist/` folder (never commit this)
- Product detection currently enabled on all pages for testing (see content/index.ts:34)
- AI features require valid OpenAI API key configuration
- Bundle size targets: background <100KB, content <150KB, popup <200KB
- Vite provides faster development builds and hot module replacement for UI components
- Uses Vite for fast builds and development (as preferred in .cursorrules)
- Settings stored locally, no external data collection/tracking
- Custom vite plugin handles Chrome extension specific needs (manifest copying, HTML processing)

## Common Tasks

When adding AI features: only touch `/lib/ai/` and call through AIProvider interface. Support timeout + cancellation.

When editing manifest.json: ensure MV3 compliance, minimal permissions, version bump if permissions change. The vite config will automatically copy manifest.json to the dist folder.

When adding message types: add to `/types/messages.ts`, never reuse existing kinds, maintain forward compatibility.

Vite configuration includes a custom Chrome extension plugin that:
- Copies manifest.json and icons to dist folder
- Processes HTML files and injects appropriate script tags
- Handles development vs production builds with appropriate optimizations