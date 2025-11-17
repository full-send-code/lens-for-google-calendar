# Lens for Google Calendar - AI Coding Agent Instructions

## Project Overview
A Chrome Manifest V3 extension for Google Calendar that allows users to save/restore calendar groups. Built with TypeScript, React, and Ant Design, it uses a Domain-Driven Design architecture with clean separation of concerns.

## Architecture Overview

This project follows **Domain-Driven Design (DDD)** principles with **Clean Architecture** patterns:

### Core Layer (`src/core/`)
- **Entities**: Domain objects (`Calendar`, `CalendarPreset`) with business logic
- **Events**: Domain events for decoupled communication
- **Repositories**: Abstract interfaces for data access
- **Errors**: Domain-specific error types

### Use Cases Layer (`src/usecases/`)
- **Application Services**: Business workflows (Apply Preset, Save Preset, etc.)
- **Dependency Injection**: Clean interfaces between layers

### Infrastructure Layer (`src/infrastructure/`)
- **Concrete Repositories**: Chrome storage and DOM implementations
- **External Services**: Background service worker, DOM utilities
- **Framework Adapters**: Chrome API integrations

### Presentation Layer (`src/presentation/`)
- **React Components**: Modern UI with Ant Design
- **Event Handlers**: User interaction logic
- **Theme Management**: Light/dark mode support

### Domain Entities
- **Calendar Entity**: Immutable calendar representation with business methods
- **CalendarPreset Entity**: Named collections of calendar states
- **Domain Events**: `CalendarVisibilityChanged`, `PresetApplied`, etc.

### Repository Pattern
```typescript
// Abstract interface (core layer)
interface ICalendarRepository {
  findAll(): Promise<Calendar[]>
  updateVisibility(email: string, visible: boolean): Promise<void>
}

// Concrete implementation (infrastructure layer)
class GoogleCalendarRepository implements ICalendarRepository {
  // DOM-based implementation
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