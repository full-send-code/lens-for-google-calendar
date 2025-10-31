# TypeScript Build and Test Guide

## Overview

This project has been converted from JavaScript to TypeScript. All source files are now in TypeScript (.ts) and are compiled to JavaScript for the Chrome extension.

## Project Structure

```
├── src/                    # TypeScript source files
│   ├── background.ts       # Service worker (8 lines)
│   ├── calendar_manager.ts # Core calendar logic (~900 lines)
│   ├── inject/
│   │   ├── inject.ts       # UI components (~960 lines)
│   │   └── inject.css      # Styles
│   └── logger.js           # JSON config (not TypeScript)
├── dist/                   # Compiled JavaScript (generated)
│   ├── background.js
│   ├── calendar_manager.js
│   └── inject/
│       └── inject.js
├── tests/                  # Jest test files
│   ├── setup.ts
│   ├── background.test.ts  # 4 tests
│   ├── calendar_manager.test.ts # 21 tests
│   └── inject.test.ts      # 21 tests
├── lib/                    # Third-party libraries (not compiled)
├── manifest.json           # Chrome extension manifest (uses dist/ files)
├── package.json            # npm dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── jest.config.js          # Jest test configuration
```

## Build Commands

### Install Dependencies
```bash
npm install
```

### Build TypeScript to JavaScript
```bash
npm run build
```
This compiles all TypeScript files from `src/` to JavaScript in `dist/`.

### Clean Build Artifacts
```bash
npm run clean
```
Removes the `dist/` directory.

### Watch Mode (Auto-rebuild on changes)
```bash
npm run build:watch
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Test Summary

- **Total Tests**: 46 passing
- **Test Suites**: 3
  - `background.test.ts`: 4 tests for service worker message handling
  - `calendar_manager.test.ts`: 21 tests for calendar operations, storage, filtering
  - `inject.test.ts`: 21 tests for UI utilities, shortcuts, storage integration

## TypeScript Configuration

The project uses the following TypeScript settings (`tsconfig.json`):

- **Target**: ES2020
- **Module**: ES2020
- **Strict Mode**: Disabled (for Vue 2 component compatibility)
- **Output**: `dist/` directory
- **Source Maps**: Enabled
- **Declaration Files**: Generated for better IDE support

## Key Changes from JavaScript

1. **Type Annotations**: Added types to function parameters, return values, and variables
2. **Interfaces**: Created interfaces for complex data structures (CalendarGroups, OverlayOptions, etc.)
3. **Strict Null Checks**: Handled nullable values with proper type guards
4. **Module System**: Added ES module exports for better code organization
5. **Global Declarations**: Declared global types for libraries (jQuery, Vue, Chrome APIs)

## Development Workflow

1. Edit TypeScript files in `src/`
2. Run `npm run build` to compile
3. Run `npm test` to verify changes
4. Load the extension in Chrome from the root directory (manifest.json uses dist/ files)

## Chrome Extension Loading

The extension loads compiled JavaScript from `dist/`:

```json
{
  "background": {
    "service_worker": "dist/background.js"
  },
  "content_scripts": [{
    "js": [
      "lib/jquery/jquery.min.js",
      "lib/mdl/material.js",
      "dist/calendar_manager.js",
      "lib/vue/vue.js",
      "lib/vue/vuetify.js",
      "lib/mousetrap/mousetrap.min.js",
      "lib/mousetrap/mousetrap-global-bind.min.js",
      "dist/inject/inject.js"
    ]
  }]
}
```

## Troubleshooting

### Build Errors
- Check TypeScript version: `npx tsc --version` (should be 5.5.3+)
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

### Test Failures
- Ensure Chrome APIs are mocked in `tests/setup.ts`
- Check that jQuery is properly mocked for tests

### Extension Not Working
- Verify `npm run build` completed successfully
- Check that `dist/` directory contains compiled .js files
- Reload extension in Chrome after rebuilding

## Migration Notes

All JavaScript files have been converted to TypeScript while preserving exact logic:

- **background.js → background.ts**: Minimal changes, added parameter types
- **calendar_manager.js → calendar_manager.ts**: Added comprehensive type annotations for classes
- **inject/inject.js → inject/inject.ts**: Added types to utility functions, kept Vue components mostly as-is

No business logic was modified during the conversion.
