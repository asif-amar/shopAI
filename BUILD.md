# shopAI Build Configuration Guide

## Overview

The shopAI extension now uses **Webpack** for production-ready builds with advanced optimizations, code splitting, and performance enhancements.

## Build Scripts

### Development
```bash
# Watch mode with hot reload
npm run dev

# Development build
npm run build:dev
```

### Production
```bash
# Production build with optimizations
npm run build

# Bundle analysis
npm run analyze
```

### Utilities
```bash
# Clean dist folder
npm run clean

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix
```

## Build Configurations

### 1. Base Configuration (`webpack.config.js`)
- **Entry Points**: background, content, popup, options
- **TypeScript Support**: Full TS/TSX compilation
- **CSS Processing**: PostCSS with autoprefixer and cssnano
- **Asset Handling**: Images, fonts, SVGs
- **Code Splitting**: Vendor and common chunks
- **Development Tools**: Source maps, watch mode

### 2. Production Configuration (`webpack.prod.js`)
- **Minification**: Terser with console removal
- **Compression**: Gzip compression for assets
- **Optimizations**: 
  - Deterministic module IDs
  - Runtime chunk splitting
  - React-specific chunk optimization
- **Performance**: Bundle size warnings

### 3. Analysis Configuration (`webpack.analyze.js`)
- **Bundle Analyzer**: Visual bundle size analysis
- **Dependency Tracking**: Module relationship visualization
- **Size Optimization**: Identify large dependencies

## Build Features

### Code Splitting
```javascript
// Automatic vendor chunk splitting
vendor: {
  test: /[\\/]node_modules[\\/]/,
  name: 'vendors',
  chunks: 'all',
  priority: 10,
}

// React-specific optimization
react: {
  test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
  name: 'react',
  chunks: 'all',
  priority: 20,
}
```

### CSS Processing
- **PostCSS Pipeline**: Autoprefixer + CSSNano
- **Extraction**: Separate CSS files in production
- **Minification**: Remove comments and whitespace
- **Vendor Prefixing**: Automatic browser compatibility

### Asset Optimization
- **Images**: Automatic optimization and hashing
- **Fonts**: Proper loading and caching
- **SVGs**: Inline or external loading
- **Compression**: Gzip for all text assets

### Performance Optimizations
- **Tree Shaking**: Remove unused code
- **Minification**: Terser with aggressive settings
- **Caching**: Content hash for cache busting
- **Bundle Analysis**: Size monitoring and alerts

## Build Output

### Development
```
dist/
├── background.js
├── content.js
├── popup.js
├── options.js
├── popup.html
├── options.html
├── manifest.json
└── icons/
```

### Production
```
dist/
├── background.js
├── content.js
├── popup.js
├── options.js
├── vendors.js
├── common.js
├── react.js
├── popup.html
├── options.html
├── manifest.json
├── assets/
│   ├── css/
│   ├── images/
│   └── fonts/
└── icons/
```

## Performance Metrics

### Target Bundle Sizes
- **Background**: < 100KB
- **Content**: < 150KB
- **Popup**: < 200KB
- **Options**: < 250KB
- **Vendors**: < 500KB

### Optimization Features
- **Code Splitting**: Reduces initial load time
- **Tree Shaking**: Removes unused code
- **Minification**: Reduces file sizes by 60-80%
- **Compression**: Additional 70-90% size reduction
- **Caching**: Content hash for optimal caching

## Development Workflow

### 1. Development Mode
```bash
npm run dev
```
- Watch mode with hot reload
- Source maps for debugging
- Unminified code for readability
- Fast rebuild times

### 2. Testing Build
```bash
npm run build:dev
```
- Development-optimized build
- Source maps included
- Unminified for debugging
- Load in Chrome for testing

### 3. Production Build
```bash
npm run build
```
- Full optimization pipeline
- Minified and compressed
- No source maps
- Ready for distribution

### 4. Bundle Analysis
```bash
npm run analyze
```
- Opens bundle analyzer
- Identifies large dependencies
- Optimizes chunk splitting
- Performance insights

## Configuration Files

### Webpack Configs
- `webpack.config.js` - Base configuration
- `webpack.prod.js` - Production optimizations
- `webpack.analyze.js` - Bundle analysis

### PostCSS
- `postcss.config.js` - CSS processing pipeline
- `.browserslistrc` - Browser compatibility targets

### TypeScript
- `tsconfig.json` - TypeScript compilation settings
- Strict mode enabled
- Path mapping for clean imports

## Troubleshooting

### Common Issues

**Build Fails**
```bash
# Check TypeScript errors
npm run typecheck

# Check linting issues
npm run lint

# Clean and rebuild
npm run clean && npm run build
```

**Large Bundle Size**
```bash
# Analyze bundle
npm run analyze

# Check for duplicate dependencies
npm ls
```

**Performance Issues**
- Use bundle analyzer to identify large chunks
- Consider code splitting for large components
- Optimize images and assets
- Review vendor dependencies

### Performance Tips

1. **Code Splitting**: Split large components into separate chunks
2. **Tree Shaking**: Use ES6 imports for better tree shaking
3. **Asset Optimization**: Compress images and use appropriate formats
4. **Dependency Management**: Keep dependencies minimal and up-to-date
5. **Bundle Analysis**: Regularly analyze bundle size and composition

## Deployment

### Chrome Web Store
1. Run production build: `npm run build`
2. Zip the `dist` folder
3. Upload to Chrome Web Store
4. Verify bundle sizes meet requirements

### Local Testing
1. Run development build: `npm run build:dev`
2. Load unpacked extension in Chrome
3. Test all functionality
4. Run production build for final testing

## Monitoring

### Bundle Size Tracking
- Monitor bundle sizes in CI/CD
- Set size limits in webpack config
- Use bundle analyzer for optimization
- Track performance metrics

### Performance Budget
```javascript
performance: {
  hints: 'warning',
  maxEntrypointSize: 512000, // 500KB
  maxAssetSize: 512000,
}
```

This build configuration provides a robust, production-ready setup for the shopAI Chrome extension with modern web development best practices and performance optimizations. 