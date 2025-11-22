# Lens for Google Calendar - AI Coding Agent Instructions

## Project Overview
A Chrome Manifest V3 extension for Google Calendar that allows users to save/restore calendar groups. Built with React, TypeScript, and Ant Design, it injects UI into Google Calendar's DOM to provide calendar management functionality following Domain-Driven Design and Clean Architecture principles.

## Current Epic: Foundation & Core Infrastructure

Refer to `docs/prd/epic-1-foundation-core-infrastructure.md` for detailed requirements.

This epic establishes the Chrome extension setup, UI injection into Google Calendar, and basic calendar visibility controls (enable specific calendar and clear all) to enable reliable manual toggling without presets. It focuses on creating a stable base that handles virtual scrolling and DOM manipulation, allowing users to manually adjust calendar visibility as a stepping stone to automated presets.

Key stories include:
- Story 1.1: Set up Chrome Extension Infrastructure (Manifest V3, background service worker, content script injection with React component)
- Story 1.2: Implement Calendar Discovery (scan sidebar, handle virtual scrolling, dynamic updates)
- Story 1.3: Enable Specific Calendar Toggle (input field, scroll and toggle, feedback)
- Story 1.4: Clear All Calendars (button to uncheck all, handle unlimited calendars, confirmation)

## Architecture & Key Components

### Core Entities (`src/core/entities/`)
- **Calendar**: Immutable entity representing an individual calendar with email, name, and visibility state
- **CalendarPreset**: Immutable entity representing a named collection of calendar emails

### Content Script Architecture
- **Entry Point**: `src/react-inject.tsx` - React app that injects into Google Calendar
- **Main Component**: `src/presentation/CalendarExtensionApp.tsx` - Root React component
- **Dependency Injection**: Composition root in `src/main.ts` wires up dependencies

### Google Calendar DOM Integration
- **Virtual Scrolling**: Google Calendar destroys/recreates calendar list items offscreen. Always call `ensureValidDOM()` before DOM operations.
- **Scroll Container**: Use `CalendarList.getScrollContainer()` for calendar list operations
- **UI Injection Point**: `header > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)`

### Repository Pattern
```typescript
// Infrastructure layer implementations
class GoogleCalendarRepository implements ICalendarRepository {
  // DOM-based implementation for calendar discovery and manipulation
}

class ChromeStorageRepository implements IPresetRepository {
  // Chrome storage sync implementation for preset persistence
}
```

### Use Case Pattern
```typescript
// Clean business logic with dependency injection
class ApplyPresetUseCase {
  constructor(
    private calendarRepo: ICalendarRepository,
    private presetRepo: IPresetRepository
  ) {}
  
  async execute(presetName: string): Promise<void> {
    // Business logic here
  }
}
```

### Storage Structure
Chrome sync storage uses this format:
```typescript
interface PresetData {
  [presetName: string]: string[]  // Calendar emails
  __metadata?: PresetMetadata
}
```

### React Component Pattern
- **Functional Components**: Modern React with hooks
- **Ant Design**: Consistent UI component library
- **Dependency Injection**: Props-based DI for use cases

### Keyboard Shortcuts
- Handled via Mousetrap library in React components
- Modifier pattern: `Ctrl+Alt+[key]`

## Critical Development Considerations

### Google Calendar Compatibility
- **Virtual Scrolling**: Calendar list items are destroyed when offscreen. Cache calendar data, not DOM references.
- **Dynamic Content**: Google Calendar updates DOM frequently. Always refresh calendar discovery.
- **Theme Support**: Extension auto-detects light/dark themes via CSS custom properties.

### Chrome Extension Manifest V3
- **Service Worker**: `src/infrastructure/background.ts` handles extension lifecycle
- **Content Scripts**: Auto-inject `src/react-inject.tsx` into `https://calendar.google.com/*`
- **Vite Build**: Uses Vite with CRX plugin for modern build pipeline
- **Storage**: Uses `chrome.storage.sync` through repository pattern

### Performance Patterns
- **Event-Driven Architecture**: Domain events for loose coupling
- **Immutable Entities**: Functional programming patterns for state
- **Async/Await**: Promise-based operations throughout
- **React Optimization**: Proper state management and re-rendering

## Build & Development Workflow

### TypeScript Development
```powershell
# Install dependencies
npm install

# Build with Vite
npm run build

# Development with watch mode
npm run dev

# Run Jest tests
npm test
```

### Release Process
```powershell
# Build production version
npm run build

# Load unpacked extension from project root (uses manifest.json)
# Vite outputs to dist/ automatically
```

### Testing Considerations
- **Jest Test Suite**: 46 tests across domain, infrastructure, and presentation
- **Test Coverage**: Run `npm run test:coverage` for coverage reports
- **Domain Testing**: Unit tests for entities and use cases
- **Integration Testing**: Repository and service integration tests

## File Organization
```
src/
├── main.ts                     # Dependency injection composition root
├── react-inject.tsx           # React app entry point
├── core/                      # Domain layer (entities, events, interfaces)
│   ├── entities/              # Domain entities (Calendar, CalendarPreset)
│   ├── events/                # Domain events
│   ├── repositories/          # Repository interfaces
│   └── errors/                # Domain-specific errors
├── usecases/                  # Application services layer
│   ├── ApplyPreset.usecase.ts
│   ├── SavePreset.usecase.ts
│   └── dependencies.ts        # Use case DI container
├── infrastructure/            # External concerns layer
│   ├── background.ts          # Chrome service worker
│   ├── ChromeStorageRepository.repository.ts
│   ├── GoogleCalendarRepository.repository.ts
│   └── dependencies.ts        # Infrastructure DI container
└── presentation/              # UI layer
    ├── CalendarExtensionApp.tsx  # Main React component
    ├── components/            # React UI components
    └── dependencies.ts        # Presentation DI container
```

## Key Integration Points
- **Domain-Driven Design**: Clear separation of business logic from infrastructure
- **Dependency Injection**: Composition root pattern for clean architecture
- **React Integration**: Modern React with TypeScript and Ant Design
- **Chrome Extension APIs**: Abstracted through repository pattern
- **Event System**: Domain events for decoupled component communication
- **Testing**: Comprehensive Jest test coverage across all layers
