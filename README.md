# Lens for Google Calendar

A Chrome extension that allows you to save and restore groups of calendar selections in Google Calendar, making it easy to switch between different sets of visible calendars.

![Extension Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Manifest](https://img.shields.io/badge/manifest-v3-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)

## 🚀 Features

- **Save Calendar Groups**: Create named presets of your currently selected calendars
- **Quick Restore**: Instantly switch between different calendar group configurations
- **Keyboard Shortcuts**: Use `Ctrl+Alt+T` to toggle calendar visibility and other shortcuts
- **Import/Export**: Backup and restore your calendar groups across devices
- **Auto-save**: Automatically saves your last 3 calendar selections for easy restoration
- **Dark Mode Support**: Seamlessly adapts to Google Calendar's dark theme
- **Local Storage**: All data is stored locally in your browser with Chrome sync support
- **TypeScript**: Fully typed codebase with comprehensive test coverage

## 📦 Installation

### From Source

1. Clone or download this repository
2. Install dependencies: `npm install`
3. Build the TypeScript code: `npm run build`
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable "Developer mode" in the top right
6. Click "Load unpacked" and select the extension directory
7. Navigate to [Google Calendar](https://calendar.google.com) to start using the extension

### Building a Release Package

Use the included PowerShell script to create a distributable package:

```powershell
.\release.ps1
```

This creates a ZIP file in the `dist/` directory that can be loaded as an unpacked extension.

## 🛠️ Development

### Modern Build System

The project uses Vite with TypeScript and React for a modern development experience:

```bash
# Install dependencies
npm install

# Build for production (outputs to dist/)
npm run build

# Development mode with hot reloading
npm run dev

# Watch mode (auto-rebuild on changes)
npm run build:watch
```

The build system uses:
- **Vite**: Fast build tool with hot module reloading
- **@crxjs/vite-plugin**: Chrome extension support for Vite
- **TypeScript**: Strict type checking and modern JavaScript features
- **React**: Component-based UI with TypeScript integration

### Testing

The project includes comprehensive Jest tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### TypeScript Configuration

The project uses strict TypeScript settings for maximum type safety:
- **Strict Type Checking**: Full strict mode enabled
- **Interface-Driven Design**: Extensive use of interfaces for contracts
- **Generics**: Type-safe repository and use case patterns
- **Union Types**: Comprehensive error handling with discriminated unions

**Test Coverage**: 46 tests across multiple layers covering:
- **Domain Layer**: Entity behavior and business rules
- **Infrastructure Layer**: Repository implementations and external services
- **Use Cases Layer**: Application service workflows
- **Presentation Layer**: UI components and user interactions

## 🎯 How to Use

### Basic Operations

1. **Save a Calendar Group**: 
   - Select the calendars you want to include in a group
   - Click the "Save As" button
   - Enter a name for your group

2. **Load a Calendar Group**:
   - Use the dropdown menu to select a saved group
   - All calendars in that group will be enabled, others will be disabled

3. **Quick Actions**:
   - **Enable**: Enable calendars by name or regex pattern
   - **Restore**: Restore your previous calendar selection
   - **Clear**: Hide all calendars (while saving current state for restoration)

### Keyboard Shortcuts

- `Ctrl+Alt`: **Open Lens Menu** - Opens the floating action button menu
- `Ctrl+Alt+P`: **Focus Preset Dropdown** - Opens menu and focuses on preset selector
- `Ctrl+Alt+E`: **Enable Calendar** - Search and enable calendar by name or email
- `Ctrl+Alt+S`: **Save Preset** - Save current calendar selection as a named preset
- `Ctrl+Alt+C`: **Clear All** - Hide all calendars (saves current state for restoration)

### Import/Export

- **Export**: Backup your calendar groups to a JSON file
- **Import**: Restore calendar groups from a previously exported file

## 🏗️ Architecture

### Domain-Driven Design Architecture

This extension follows **Domain-Driven Design (DDD)** principles with **Clean Architecture** patterns:

#### Core Layer (`src/core/`)
- **Entities**: Domain objects (`Calendar`, `CalendarPreset`) with business logic
- **Events**: Domain events for decoupled communication
- **Repositories**: Abstract interfaces for data access
- **Errors**: Domain-specific error types

#### Use Cases Layer (`src/usecases/`)
- **Application Services**: Business workflows (Apply Preset, Save Preset, etc.)
- **Dependency Injection**: Clean interfaces between layers

#### Infrastructure Layer (`src/infrastructure/`)
- **Concrete Repositories**: Chrome storage and DOM implementations
- **External Services**: Background service worker, DOM utilities
- **Framework Adapters**: Chrome API integrations

#### Presentation Layer (`src/presentation/`)
- **React Components**: Modern UI with Ant Design
- **Event Handlers**: User interaction logic
- **Theme Management**: Light/dark mode support

### Key Components

- **CalendarExtensionApp** (`src/presentation/CalendarExtensionApp.tsx`): Main React component with floating action button UI
- **Calendar Entity** (`src/core/entities/Calendar.entity.ts`): Immutable domain object representing a calendar
- **Use Cases** (`src/usecases/`): Business logic services like ApplyPreset, SavePreset
- **Repositories** (`src/infrastructure/`): Data access implementations for Chrome storage and DOM
- **Background Service Worker** (`src/infrastructure/background.ts`): Handles extension lifecycle

### Technology Stack

- **TypeScript**: Type-safe JavaScript development with strict typing
- **React 19**: Modern functional components with hooks
- **Ant Design**: Comprehensive UI component library
- **Vite**: Fast build tool with Chrome extension support
- **Jest**: Testing framework with comprehensive coverage
- **Mousetrap**: Keyboard shortcut handling

## 🔧 Development

### File Structure

```
├── manifest.json                    # Extension manifest (Manifest V3)
├── package.json                     # Dependencies and build scripts
├── vite.config.ts                   # Vite build configuration
├── tsconfig.json                    # TypeScript configuration
├── jest.config.js                   # Jest test configuration
├── icons/                           # Extension icons
├── src/                            # TypeScript source files
│   ├── main.ts                     # Dependency injection composition root
│   ├── react-inject.tsx            # React app entry point
│   ├── core/                       # Domain layer
│   │   ├── entities/               # Domain entities (Calendar, CalendarPreset)
│   │   ├── events/                 # Domain events
│   │   ├── repositories/           # Repository interfaces
│   │   └── errors/                 # Domain-specific errors
│   ├── usecases/                   # Application services layer
│   │   ├── ApplyPreset.usecase.ts
│   │   ├── SavePreset.usecase.ts
│   │   └── dependencies.ts         # Use case DI container
│   ├── infrastructure/             # External concerns layer
│   │   ├── background.ts           # Chrome service worker
│   │   ├── ChromeStorageRepository.repository.ts
│   │   ├── GoogleCalendarRepository.repository.ts
│   │   └── dependencies.ts         # Infrastructure DI container
│   └── presentation/               # UI layer
│       ├── CalendarExtensionApp.tsx # Main React component
│       ├── components/             # React UI components
│       └── dependencies.ts         # Presentation DI container
├── dist/                           # Built extension files (generated by Vite)
└── screenshots/                    # Extension screenshots
```

### Architecture Principles

The extension follows these architectural principles:

- **Domain-Driven Design**: Business logic is isolated in the core domain layer
- **Clean Architecture**: Dependencies point inward toward the domain
- **Dependency Injection**: Loose coupling through constructor injection
- **Immutable Entities**: Functional programming patterns for state management
- **Event-Driven**: Domain events enable decoupled communication
- **Repository Pattern**: Abstract data access behind interfaces

### Troubleshooting

**Build Issues:**
- Verify TypeScript version: `npx tsc --version` (should be 5.5.3+)
- Clean install: `rm -rf node_modules package-lock.json && npm install`

**Extension Issues:**
- Ensure `npm run build` completed successfully
- Check that `dist/` directory contains compiled files
- Reload extension in Chrome after rebuilding

### Browser Permissions

- `storage`: Save calendar groups to Chrome sync storage
- Content script access to `https://calendar.google.com/*`

## 📊 Data Management

### Storage Format

Calendar groups are stored using Chrome's sync storage API in this format:

```javascript
{
  "work": ["user@example.com", "team@company.com"],
  "personal": ["personal@gmail.com", "family@example.org"],
  "saved_1640995200000": ["user@example.com"],  // Auto-saved groups
  "__last_saved": ["saved_1640995200000", "work", "personal"],  // Restore history
  "__v": 1  // Storage format version for future migrations
}
```

- **Group names**: User-defined preset names (stored as lowercase)
- **Calendar IDs**: Arrays of calendar email addresses (the unique identifier)
- **Auto-saves**: Groups with `saved_` prefix and timestamp for quick restore
- **`__last_saved`**: Array tracking recent saves for the restore function
- **`__v`**: Version number for handling storage format migrations

### Privacy

- **Local Only**: All data is stored locally using Chrome's secure storage APIs
- **No Network**: No data is transmitted to external servers
- **Sync Support**: Data syncs across Chrome browsers signed into the same Google account
- **Limited Retention**: Only the 3 most recent auto-saves are kept

## 🎨 Theming

The extension automatically adapts to Google Calendar's theme:

- **Light Mode**: Clean, bright interface matching Google's design
- **Dark Mode**: Automatically detected and styled for dark themes
- **High Contrast**: Proper contrast ratios for accessibility

## 🚨 Error Handling

- **Calendar Discovery**: Handles Google Calendar's virtual scrolling by scanning through the calendar list
- **DOM Changes**: Automatically refreshes calendar DOM references when Google Calendar updates
- **Storage Failures**: Graceful fallback when Chrome storage is unavailable
- **Migration**: Automatic data format migration for older storage versions

## 🧪 Testing

The extension includes a standalone test page (`index.html`) for development and testing outside of Google Calendar.

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

**Initial implementation**: Copyright 2021 Bluenexa LLC  
**Fork and subsequent modifications**: Copyright 2025 full-send-coding

This project is a fork of the original Lens for Google Calendar extension created by Bluenexa LLC. The original source code can be found at: https://gitlab.com/bluenexa/google-calendar-selector

All modifications and enhancements from 2025 onwards are the work of full-send-coding.

## 🔒 Privacy Policy

See [PRIVACY.md](PRIVACY.md) for detailed information about data collection and privacy practices.

## 🤝 Contributing

This is a browser extension for Google Calendar. When contributing:

1. Ensure changes work with Google Calendar's dynamic content loading
2. Test keyboard shortcuts don't conflict with existing Google Calendar shortcuts
3. Verify dark mode compatibility
4. Test Chrome sync storage functionality
5. Maintain backward compatibility for existing user data

## 🐛 Known Issues

- Calendar discovery requires the calendar drawer to be visible
- Some operations may require brief UI overlays during DOM manipulation
- Virtual scrolling in Google Calendar requires special handling for calendar detection

## 📈 Version History

- **v1.0.0**: Initial release with core calendar group management features
