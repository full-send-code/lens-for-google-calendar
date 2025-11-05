# Lens for Google Calendar - Clean Architecture Refactor Plan

## 🎯 Project Goals

Transform the existing Vue.js Chrome extension into a clean, testable architecture using React and SOLID principles.

## 🚀 Technology Migration

### Current Stack → New Stack
- **Vue 2.x + Vuetify** → **React 18 + Ant Design**
- **jQuery DOM manipulation** → **Native DOM APIs + TypeScript utilities**
- **Material Design Lite** → **Ant Design Notification system**
- **Scattered architecture** → **Clean Architecture with SOLID principles**
- **Mixed concerns** → **Separated layers with clear boundaries**
- **Vue instance conflicts** → **Stable React ecosystem**

### Dependencies Strategy
| Current Library | Status | Action | New Solution |
|----------------|--------|--------|--------------|
| **Vue 2.x (34KB)** | ❌ Replace | Remove | **React 18** |
| **Vuetify (800KB)** | ❌ Replace | Remove | **Ant Design (~200KB)** |
| **jQuery (91KB)** | ❌ Replace | Remove | **Native DOM APIs** |
| **Material Design Lite (1KB)** | ❌ Deprecated | Remove | **Ant Design Notification** |
| **loglevel (2KB)** | ✅ Keep | Keep | **loglevel** (perfect for extensions) |
| **mousetrap (6KB)** | ✅ Keep | Keep | **mousetrap** (works great) |

**Bundle Size Impact**: 926KB → 242KB = **74% reduction**

### Why React?
1. ✅ **Better TypeScript integration** - First-class TS support
2. ✅ **More Chrome extension examples** - Larger community
3. ✅ **Modern hooks architecture** - Cleaner than Vue 2 composition
4. ✅ **No framework conflicts** - Eliminates current Vue/Vuetify issues
5. ✅ **Future-proof** - Active development and long-term support
6. ✅ **Better testing ecosystem** - React Testing Library + Jest

### Why Remove jQuery?
1. ✅ **Bundle size reduction** - Eliminates 91KB overhead
2. ✅ **Modern browser APIs** - Native DOM methods are well-supported
3. ✅ **Better TypeScript integration** - Native APIs have better type safety
4. ✅ **Performance** - No jQuery abstraction layer
5. ✅ **Clean architecture** - Aligns with modern development practices
6. ✅ **Maintainability** - Fewer dependencies to manage

### Why Choose Ant Design?
1. ✅ **Professional appearance** - Enterprise-grade design system
2. ✅ **Complete component library** - 50+ React components
3. ✅ **Excellent TypeScript support** - Built with TypeScript
4. ✅ **Chrome extension friendly** - Used by many extensions
5. ✅ **Good documentation** - Easy to learn and implement
6. ✅ **Proven in production** - Used by Alibaba and thousands of companies

### Library Retention Strategy
**Keep loglevel**: Perfect for Chrome extensions, small (2KB), excellent TypeScript support
**Keep mousetrap**: Well-maintained, small (6KB), works great for keyboard shortcuts

## 🏗️ Clean Architecture Structure

```
src/
├── core/                          # Domain layer (no external deps)
│   ├── entities/
│   │   ├── Calendar.entity.ts           # Calendar domain entity
│   │   ├── CalendarState.interface.ts   # Calendar data structure
│   │   ├── CalendarPreset.entity.ts     # Calendar preset entity
│   │   └── PresetState.interface.ts     # Preset data structure
│   ├── repositories/
│   │   ├── Calendar.repository.ts       # Calendar repository interface
│   │   └── Preset.repository.ts         # Preset repository interface
│   ├── events/
│   │   ├── DomainEvent.interface.ts           # Base domain event interface
│   │   ├── CalendarDiscovered.event.ts        # Calendar discovery event
│   │   ├── CalendarVisibilityChanged.event.ts # Visibility change event
│   │   ├── CalendarsApplied.event.ts          # Bulk calendar changes
│   │   ├── PresetSaved.event.ts               # Preset save event
│   │   ├── PresetLoaded.event.ts              # Preset load event
│   │   ├── PresetDeleted.event.ts             # Preset deletion event
│   │   ├── PresetApplied.event.ts             # Preset application event
│   │   ├── ExtensionInitialized.event.ts      # Extension startup event
│   │   ├── ErrorOccurred.event.ts             # Error handling event
│   │   ├── DomainEventPublisher.interface.ts  # Event publisher interface
│   │   └── DomainEventFactory.factory.ts      # Event creation factory
│   ├── errors/
│   │   ├── CalendarNotFound.error.ts          # Calendar not found domain error
│   │   ├── PresetNotFound.error.ts            # Preset not found domain error
│   │   ├── InvalidPresetData.error.ts         # Invalid preset data domain error
│   │   └── index.ts                           # Domain errors exports
│   └── index.ts                   # Core domain exports
├── usecases/                      # Application logic
│   ├── ClearCalendars.usecase.ts        # Clear all calendars use case
│   ├── EnableCalendar.usecase.ts        # Enable specific calendar use case
│   ├── ApplyPreset.usecase.ts           # Apply preset use case
│   ├── ImportPresets.usecase.ts         # Import presets use case
│   └── ExportPresets.usecase.ts         # Export presets use case
├── infrastructure/                # External integrations
│   ├── GoogleCalendarRepository.repository.ts # Google Calendar DOM interaction
│   ├── ChromeStorageRepository.repository.ts  # Chrome storage implementation
│   ├── DOMUtils.util.ts                       # Native DOM utility functions
│   └── JsonImportExport.service.ts            # JSON import/export service
├── presentation/                  # UI layer
│   ├── components/               # React components
│   │   ├── CalendarToolbar.component.tsx
│   │   ├── PresetSelector.component.tsx
│   │   └── EnableCalendarModal.component.tsx
│   └── CalendarExtensionApp.tsx   # Main React app
└── main.ts                       # Entry point and dependency injection
```

## 📋 Functional Requirements

### 1. **Extension Initialization**
- When `calendar.google.com` loads, initialize the extension
- Inject toolbar/button set into Google Calendar's header
- Maintain current UI location if possible

### 2. **Core Functionality**

#### **Clear Button**
- Scroll through calendar sidebar list
- Set all calendar checkboxes to `false` (unchecked)

#### **Enable Button**
- Prompt user to enter calendar email/address
- Scroll through calendar sidebar to find matching calendar
- Set found calendar checkbox to `true`
- Leave all other calendars unchanged

#### **Preset Selection**
- Get list of calendar IDs from selected preset
- Scroll through calendar sidebar
- For each calendar: set checked status based on preset inclusion

#### **Import/Export**
- **Import**: Load JSON preset definitions and save to Chrome storage
- **Export**: Export all presets from Chrome storage to JSON format
- Follow existing codebase logic patterns

### 3. **Data Format**

#### **Calendar Identification**
- Use email/address as primary identifier
- Abstract as `id` in core domain
- Repository handles specific Google Calendar implementation

#### **Preset Format**
```typescript
{
  "work": ["john@gmail.com", "team@company.com"],
  "personal": ["john@gmail.com", "family@gmail.com"],
  "minimal": ["john@gmail.com"]
}
```

## 🔧 Implementation Phases

### Phase 0: Minimal Working Extension ✅ **COMPLETED**
**Goal**: Replace Vue with minimal React that just renders "Hello World" in the same location, with zero console errors.

**Manual Testing Checkpoint**: 
- ✅ Extension loads without console errors
- ✅ React renders in correct Google Calendar location
- ✅ No Vue/Vuetify conflicts
- ✅ Chrome extension APIs working
- ✅ **VERIFIED**: Logs show successful React mounting

**Tasks**:
1. ✅ Install React dependencies
2. ✅ Create minimal React component that renders "Lens Extension Loaded"
3. ✅ Replace Vue initialization with React rendering
4. ✅ Remove Vue/Vuetify dependencies and imports
5. ✅ Test in Chrome: Load unpacked extension, verify no errors in console
6. ✅ **MANUAL VERIFICATION PASSED** - Ready for Phase 1

### Phase 1: Dependencies & Setup ✅ **COMPLETED**
```bash
# Install Ant Design UI library
npm install antd @ant-design/icons

# Update testing dependencies for React
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Remove legacy dependencies
npm uninstall jquery @types/jquery vue vuetify material-design-lite

# Keep these dependencies (still valuable):
# - loglevel (perfect for Chrome extensions)
# - mousetrap (excellent keyboard shortcuts)
```

**Manual Testing Checkpoint**:
- ✅ All dependencies install correctly
- ✅ Build system works with new dependencies
- ✅ Extension still loads without errors
- ✅ jQuery removal doesn't break basic functionality
- ✅ Vue/Vuetify completely removed
- ✅ Ant Design available for use
- ✅ **VERIFIED**: Professional Ant Design component renders correctly
- ✅ **MANUAL VERIFICATION PASSED** - Ready for Phase 2

### Phase 2: Core Domain Layer ✅ **COMPLETED**

**Files Created:**
- `src/core/entities/Calendar.entity.ts` - Simple calendar representation
- `src/core/entities/CalendarState.interface.ts` - Calendar data structure
- `src/core/entities/CalendarPreset.entity.ts` - Calendar preset entity
- `src/core/entities/PresetState.interface.ts` - Preset data structure
- `src/core/repositories/Calendar.repository.ts` - Calendar repository interface
- `src/core/repositories/Preset.repository.ts` - Preset repository interface

**Domain Events (Individual Files):**
- `src/core/events/DomainEvent.interface.ts` - Base event interface
- `src/core/events/CalendarDiscovered.event.ts` - Calendar discovery event
- `src/core/events/CalendarVisibilityChanged.event.ts` - Visibility change event
- `src/core/events/CalendarsApplied.event.ts` - Bulk calendar changes event
- `src/core/events/PresetSaved.event.ts` - Preset save event
- `src/core/events/PresetLoaded.event.ts` - Preset load event
- `src/core/events/PresetDeleted.event.ts` - Preset deletion event
- `src/core/events/PresetApplied.event.ts` - Preset application event
- `src/core/events/ExtensionInitialized.event.ts` - Extension startup event
- `src/core/events/ErrorOccurred.event.ts` - Error handling event
- `src/core/events/DomainEventPublisher.interface.ts` - Event publisher interface
- `src/core/events/DomainEventFactory.factory.ts` - Event creation factory

**Core Domain Tests (100% Coverage):**
- `src/core/entities/Calendar.entity.test.ts` - Comprehensive Calendar entity tests
- `src/core/entities/CalendarPreset.entity.test.ts` - Comprehensive CalendarPreset entity tests  
- `src/core/events/DomainEventFactory.factory.test.ts` - Complete event factory tests

**🛑 MANDATORY TESTING CHECKPOINT**:
- ✅ `npm run build` - Build succeeds without errors
- ✅ `npm test` - All tests pass (100% coverage on core domain)
- ✅ Core entities compile without errors
- ✅ Repository interfaces are properly typed
- ✅ No external dependencies in core layer
- ✅ Individual file naming convention followed: `{Entity}.{type}.ts`
- ✅ Domain events split into individual files: `{EventType}.event.ts`
- ✅ Clean separation of concerns
- ✅ Immutable entities with simple state management
- ✅ **MANUAL CHROME TEST**: Extension still loads without errors
- ✅ **MANUAL CHROME TEST**: React component still renders correctly

### Phase 3: Use Cases Layer ⭐ **CURRENT PHASE**
Implement business logic without external dependencies using the established naming convention:

**Files to Create:**
- `src/usecases/ClearCalendars.usecase.ts` - Clear all calendars business logic
- `src/usecases/EnableCalendar.usecase.ts` - Enable specific calendar business logic  
- `src/usecases/ApplyPreset.usecase.ts` - Apply preset business logic
- `src/usecases/ImportPresets.usecase.ts` - Import presets business logic
- `src/usecases/ExportPresets.usecase.ts` - Export presets business logic

**🛑 MANDATORY TESTING CHECKPOINT**:
- ✅ `npm run build` - Build succeeds without errors
- ✅ `npm test` - All tests pass (100% coverage on use cases)
- ✅ Use cases compile and type-check correctly
- ✅ All use case unit tests pass with mocked repositories
- ✅ Mock repositories work properly in tests
- ✅ Business logic is isolated from external concerns
- ✅ Follows naming convention: `{UseCase}.usecase.ts`
- ✅ Co-located tests: `{UseCase}.usecase.test.ts`
- ✅ **MANUAL CHROME TEST**: Extension still loads without errors
- ✅ **MANUAL CHROME TEST**: No regression in existing functionality

**Domain Model (Simplified):**
```typescript
// core/entities/CalendarState.interface.ts
interface CalendarState {
  email: string;        // Primary identifier (calendar email)
  name: string;         // Display name
  isVisible: boolean;   // Current visibility state
}

// core/entities/PresetState.interface.ts
interface PresetState {
  name: string;           // Preset name
  calendarEmails: string[]; // Array of calendar emails in preset
  createdAt: Date;       // Creation timestamp
  lastUsedAt?: Date;     // Last usage timestamp
}
```

**Repository Interfaces (Updated Paths):**
```typescript
// core/repositories/Calendar.repository.ts
export interface CalendarRepository {
  discoverCalendars(): Promise<Calendar[]>;
  applyCalendarVisibility(calendars: Calendar[]): Promise<void>;
  getCurrentCalendarStates(): Promise<Calendar[]>;
}

// core/repositories/Preset.repository.ts  
export interface PresetRepository {
  savePreset(preset: CalendarPreset): Promise<void>;
  loadPreset(name: string): Promise<CalendarPreset | undefined>;
  getAllPresets(): Promise<CalendarPreset[]>;
  deletePreset(name: string): Promise<void>;
  presetExists(name: string): Promise<boolean>;
}
```

```typescript
// usecases/ClearCalendars.usecase.ts
export class ClearCalendarsUseCase {
  constructor(private calendarRepo: CalendarRepository) {}
  
  async execute(): Promise<void> {
    const calendars = await this.calendarRepo.getCurrentCalendarStates();
    const hiddenCalendars = calendars.map(cal => cal.hide());
    await this.calendarRepo.applyCalendarVisibility(hiddenCalendars);
  }
}

// usecases/EnableCalendar.usecase.ts
export class EnableCalendarUseCase {
  constructor(private calendarRepo: CalendarRepository) {}
  
  async execute(calendarEmail: string): Promise<void> {
    const calendars = await this.calendarRepo.getCurrentCalendarStates();
    const targetCalendar = calendars.find(cal => cal.email === calendarEmail);
    
    if (!targetCalendar) {
      throw new CalendarNotFoundError(calendarEmail);
    }
    
    const enabledCalendar = targetCalendar.show();
    await this.calendarRepo.applyCalendarVisibility([enabledCalendar]);
  }
}

// usecases/ApplyPreset.usecase.ts
export class ApplyPresetUseCase {
  constructor(
    private calendarRepo: CalendarRepository,
    private presetRepo: PresetRepository
  ) {}
  
  async execute(presetName: string): Promise<void> {
    const preset = await this.presetRepo.loadPreset(presetName);
    if (!preset) {
      throw new PresetNotFoundError(presetName);
    }
    
    const availableCalendars = await this.calendarRepo.getCurrentCalendarStates();
    const updatedCalendars = availableCalendars.map(calendar => {
      return preset.containsCalendar(calendar.email) 
        ? calendar.show() 
        : calendar.hide();
    });
    
    await this.calendarRepo.applyCalendarVisibility(updatedCalendars);
    
    // Mark preset as used
    const usedPreset = preset.markAsUsed();
    await this.presetRepo.savePreset(usedPreset);
  }
}
```

### Phase 4: Infrastructure Layer
Implement repository interfaces with Google Calendar DOM and Chrome storage, following naming convention:

**Files to Create:**
- `src/infrastructure/GoogleCalendarRepository.repository.ts` - Google Calendar DOM integration
- `src/infrastructure/ChromeStorageRepository.repository.ts` - Chrome storage implementation  
- `src/infrastructure/DOMUtils.util.ts` - Native DOM utility functions
- `src/infrastructure/JsonImportExport.service.ts` - JSON import/export service

**🛑 MANDATORY TESTING CHECKPOINT**:
- ✅ `npm run build` - Build succeeds without errors
- ✅ `npm test` - All tests pass (infrastructure layer tests)
- ✅ GoogleCalendarRepository can discover and interact with calendar DOM elements
- ✅ ChromeStorageRepository can read/write to Chrome storage
- ✅ Native DOM utilities work correctly (no jQuery dependencies)
- ✅ Virtual scrolling handling works correctly
- ✅ Follows naming convention: `{Name}.{type}.ts`
- ✅ Co-located tests: `{Name}.{type}.test.ts`
- ✅ **MANUAL CHROME TEST ON REAL GOOGLE CALENDAR**: Verify calendar detection and manipulation
- ✅ **MANUAL CHROME TEST**: Extension functionality works end-to-end

```typescript
// infrastructure/DOMUtils.util.ts
export class DOMUtils {
  static query(selector: string): Element | null {
    return document.querySelector(selector);
  }
  
  static queryAll(selector: string): NodeListOf<Element> {
    return document.querySelectorAll(selector);
  }
  
  static waitForElement(selector: string, timeout = 5000): Promise<Element> {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }
}

// infrastructure/GoogleCalendarRepository.repository.ts
export class GoogleCalendarRepository implements CalendarRepository {
  async discoverCalendars(): Promise<Calendar[]> {
    // Use native DOM APIs instead of jQuery
    const calendarElements = DOMUtils.queryAll('[data-id][aria-label*="Calendar"]');
    return Array.from(calendarElements).map(element => {
      // Extract calendar data using native APIs
      const email = this.extractEmailFromElement(element);
      const name = this.extractNameFromElement(element);
      const isVisible = this.extractVisibilityFromElement(element);
      
      return new Calendar({ email, name, isVisible });
    });
  }
  
  async applyCalendarVisibility(calendars: Calendar[]): Promise<void> {
    for (const calendar of calendars) {
      const element = await this.findCalendarElement(calendar.email);
      if (element) {
        const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
        if (checkbox && checkbox.checked !== calendar.isVisible) {
          checkbox.checked = calendar.isVisible;
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }
  }
}

// infrastructure/ChromeStorageRepository.repository.ts  
export class ChromeStorageRepository implements PresetRepository {
  async savePreset(preset: CalendarPreset): Promise<void> {
    const key = `preset_${preset.name}`;
    const data = preset.toJSON();
    
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: data }, resolve);
    });
  }
  
  async getAllPresets(): Promise<CalendarPreset[]> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (data) => {
        const presets = Object.entries(data)
          .filter(([key]) => key.startsWith('preset_'))
          .map(([_, value]) => CalendarPreset.fromJSON(value as PresetState));
        resolve(presets);
      });
    });
  }
}
```

### Phase 5: Presentation Layer
Create React components and coordinate with use cases, following naming convention:

**Files to Create:**
- `src/presentation/components/CalendarToolbar.component.tsx` - Main toolbar component
- `src/presentation/components/PresetSelector.component.tsx` - Preset selection dropdown
- `src/presentation/components/EnableCalendarModal.component.tsx` - Enable calendar dialog
- `src/presentation/CalendarExtensionApp.tsx` - Main React application

**🛑 MANDATORY TESTING CHECKPOINT**:
- ✅ `npm run build` - Build succeeds without errors
- ✅ `npm test` - All tests pass (React component tests)
- ✅ React components render without errors
- ✅ Button clicks trigger correct use cases
- ✅ UI appears in correct Google Calendar location
- ✅ Follows naming convention: `{Component}.component.tsx`
- ✅ Co-located tests: `{Component}.component.test.tsx`
- ✅ **MANUAL CHROME TEST**: Clear, Enable, Preset selection all work
- ✅ **MANUAL CHROME TEST**: Import/Export functionality works
- ✅ **MANUAL CHROME TEST**: Professional UI appearance confirmed

```typescript
// presentation/components/CalendarToolbar.component.tsx
import React, { useState } from 'react';
import { Button, Select, notification } from 'antd';
import { ClearOutlined, PlusOutlined, ImportOutlined, ExportOutlined } from '@ant-design/icons';

interface CalendarToolbarProps {
  clearCalendarsUseCase: ClearCalendarsUseCase;
  enableCalendarUseCase: EnableCalendarUseCase;
  applyPresetUseCase: ApplyPresetUseCase;
  presets: CalendarPreset[];
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  clearCalendarsUseCase,
  enableCalendarUseCase, 
  applyPresetUseCase,
  presets
}) => {
  const [enableInputVisible, setEnableInputVisible] = useState(false);
  
  const handleClear = async () => {
    try {
      await clearCalendarsUseCase.execute();
      notification.success({ message: 'All calendars cleared' });
    } catch (error) {
      notification.error({ message: 'Failed to clear calendars' });
    }
  };
  
  const handlePresetSelect = async (presetName: string) => {
    try {
      await applyPresetUseCase.execute(presetName);
      notification.success({ message: `Applied preset: ${presetName}` });
    } catch (error) {
      notification.error({ message: `Failed to apply preset: ${presetName}` });
    }
  };
  
  return (
    <div className="lens-calendar-toolbar" style={{ padding: '8px', display: 'flex', gap: '8px' }}>
      <Button icon={<ClearOutlined />} onClick={handleClear}>
        Clear
      </Button>
      <Button icon={<PlusOutlined />} onClick={() => setEnableInputVisible(true)}>
        Enable
      </Button>
      <Select 
        placeholder="Select Preset" 
        style={{ minWidth: 120 }}
        onChange={handlePresetSelect}
      >
        {presets.map(preset => (
          <Select.Option key={preset.name} value={preset.name}>
            {preset.name}
          </Select.Option>
        ))}
      </Select>
      <Button icon={<ImportOutlined />}>Import</Button>
      <Button icon={<ExportOutlined />}>Export</Button>
      
      <EnableCalendarModal
        visible={enableInputVisible}
        onCancel={() => setEnableInputVisible(false)}
        enableCalendarUseCase={enableCalendarUseCase}
      />
    </div>
  );
};
```

### Phase 6: Dependency Injection & Main Entry
Wire everything together with proper dependency injection:

**Files to Update/Create:**
- `src/main.ts` - Entry point with dependency injection container
- `src/react-inject.tsx` - React injection logic (update to use DI)

**🛑 MANDATORY TESTING CHECKPOINT**:
- ✅ `npm run build` - Build succeeds without errors
- ✅ `npm test` - All tests pass (100% test coverage across all layers)
- ✅ All dependency injection works correctly
- ✅ Extension loads and initializes properly
- ✅ **MANUAL CHROME TEST**: Full regression test - All original features work exactly as before
- ✅ **MANUAL CHROME TEST**: Performance test - No significant slowdown in calendar operations
- ✅ **MANUAL CHROME TEST**: Error handling - Graceful handling of edge cases
- ✅ **MANUAL CHROME TEST**: Final acceptance - Extension ready for production use
- ✅ **FINAL BUILD**: Create production-ready extension package

```typescript
// main.ts - Dependency Injection Container
import { CalendarRepository, PresetRepository } from './core';
import { GoogleCalendarRepository } from './infrastructure/GoogleCalendarRepository.repository';
import { ChromeStorageRepository } from './infrastructure/ChromeStorageRepository.repository';
import { ClearCalendarsUseCase } from './usecases/ClearCalendars.usecase';
import { EnableCalendarUseCase } from './usecases/EnableCalendar.usecase';
import { ApplyPresetUseCase } from './usecases/ApplyPreset.usecase';
import { CalendarExtensionApp } from './presentation/CalendarExtensionApp';
import { createRoot } from 'react-dom/client';

// Initialize repositories
const calendarRepo: CalendarRepository = new GoogleCalendarRepository();
const presetRepo: PresetRepository = new ChromeStorageRepository();

// Initialize use cases
const clearCalendarsUseCase = new ClearCalendarsUseCase(calendarRepo);
const enableCalendarUseCase = new EnableCalendarUseCase(calendarRepo);
const applyPresetUseCase = new ApplyPresetUseCase(calendarRepo, presetRepo);

// Initialize React app with dependencies
export function initializeExtension() {
  const container = createExtensionContainer();
  const root = createRoot(container);
  
  root.render(
    <CalendarExtensionApp
      clearCalendarsUseCase={clearCalendarsUseCase}
      enableCalendarUseCase={enableCalendarUseCase}
      applyPresetUseCase={applyPresetUseCase}
      presetRepository={presetRepo}
    />
  );
}

function createExtensionContainer(): HTMLElement {
  // Find Google Calendar header and inject our container
  const header = document.querySelector('header > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)');
  if (!header) {
    throw new Error('Google Calendar header not found');
  }
  
  const container = document.createElement('div');
  container.id = 'lens-calendar-extension';
  header.appendChild(container);
  
  return container;
}
```

## 🧪 Testing Strategy

### Unit Tests
- **Core entities**: Test business logic without external dependencies
- **Use cases**: Test with mocked repositories
- **Infrastructure**: Test with mocked Chrome APIs and DOM
- **Components**: Test with React Testing Library

### Test Structure
### Test Structure (Co-located with Source Files)
```
src/
├── core/
│   ├── entities/
│   │   ├── Calendar.entity.ts
│   │   ├── Calendar.entity.test.ts              # 100% coverage tests
│   │   ├── CalendarState.interface.ts
│   │   ├── CalendarPreset.entity.ts
│   │   ├── CalendarPreset.entity.test.ts        # 100% coverage tests
│   │   └── PresetState.interface.ts
│   ├── repositories/
│   │   ├── Calendar.repository.ts
│   │   └── Preset.repository.ts
│   ├── events/
│   │   ├── DomainEvent.interface.ts
│   │   ├── CalendarDiscovered.event.ts
│   │   ├── CalendarVisibilityChanged.event.ts
│   │   ├── CalendarsApplied.event.ts
│   │   ├── PresetSaved.event.ts
│   │   ├── PresetLoaded.event.ts
│   │   ├── PresetDeleted.event.ts
│   │   ├── PresetApplied.event.ts
│   │   ├── ExtensionInitialized.event.ts
│   │   ├── ErrorOccurred.event.ts
│   │   ├── DomainEventPublisher.interface.ts
│   │   ├── DomainEventFactory.factory.ts
│   │   └── DomainEventFactory.factory.test.ts   # 100% coverage tests
│   └── index.ts
├── usecases/
│   ├── ClearCalendars.usecase.ts
│   ├── ClearCalendars.usecase.test.ts           # Co-located tests
│   ├── EnableCalendar.usecase.ts
│   ├── EnableCalendar.usecase.test.ts           # Co-located tests
│   ├── ApplyPreset.usecase.ts
│   ├── ApplyPreset.usecase.test.ts              # Co-located tests
│   ├── ImportPresets.usecase.ts
│   ├── ImportPresets.usecase.test.ts            # Co-located tests
│   └── ExportPresets.usecase.ts
│   └── ExportPresets.usecase.test.ts            # Co-located tests
├── infrastructure/
│   ├── GoogleCalendarRepository.repository.ts
│   ├── GoogleCalendarRepository.repository.test.ts  # Co-located tests
│   ├── ChromeStorageRepository.repository.ts
│   ├── ChromeStorageRepository.repository.test.ts   # Co-located tests
│   ├── DOMUtils.util.ts
│   ├── DOMUtils.util.test.ts                    # Co-located tests
│   └── JsonImportExport.service.ts
│   └── JsonImportExport.service.test.ts         # Co-located tests
├── presentation/
│   ├── components/
│   │   ├── CalendarToolbar.component.tsx
│   │   ├── CalendarToolbar.component.test.tsx   # Co-located tests
│   │   ├── PresetSelector.component.tsx
│   │   ├── PresetSelector.component.test.tsx    # Co-located tests
│   │   ├── EnableCalendarModal.component.tsx
│   │   └── EnableCalendarModal.component.test.tsx # Co-located tests
│   └── CalendarExtensionApp.tsx
│   └── CalendarExtensionApp.test.tsx            # Co-located tests
└── main.ts
└── main.test.ts                                 # Co-located tests
```

### Example Tests
```typescript
// tests/unit/usecases/ClearCalendars.usecase.test.ts
describe('ClearCalendarsUseCase', () => {
  it('should clear all calendars through repository', async () => {
    const mockRepo = createMockCalendarRepository();
    const mockCalendars = [
      new Calendar({ email: 'test@example.com', name: 'Test', isVisible: true })
    ];
    mockRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);
    
    const useCase = new ClearCalendarsUseCase(mockRepo);
    await useCase.execute();
    
    expect(mockRepo.applyCalendarVisibility).toHaveBeenCalledWith([
      expect.objectContaining({ isVisible: false })
    ]);
  });
});

// tests/unit/presentation/components/CalendarToolbar.component.test.tsx
describe('CalendarToolbar', () => {
  it('should call clear use case when Clear button clicked', async () => {
    const mockClearUseCase = { execute: jest.fn() };
    const mockEnableUseCase = { execute: jest.fn() };
    const mockApplyUseCase = { execute: jest.fn() };
    
    render(
      <CalendarToolbar 
        clearCalendarsUseCase={mockClearUseCase}
        enableCalendarUseCase={mockEnableUseCase}
        applyPresetUseCase={mockApplyUseCase}
        presets={[]}
      />
    );
    
    fireEvent.click(screen.getByText('Clear'));
    
    expect(mockClearUseCase.execute).toHaveBeenCalled();
  });
});

// tests/unit/core/entities/Calendar.entity.test.ts
describe('Calendar Entity', () => {
  it('should toggle visibility correctly', () => {
    const calendar = new Calendar({ 
      email: 'test@example.com', 
      name: 'Test', 
      isVisible: true 
    });
    
    const toggled = calendar.toggle();
    
    expect(toggled.isVisible).toBe(false);
    expect(calendar.isVisible).toBe(true); // Original unchanged
  });
});
```

## 📊 Migration Benefits

### Before (Current Issues)
- ❌ Vue instance conflicts causing runtime errors
- ❌ jQuery dependency adding 91KB bundle overhead
- ❌ Material Design Lite deprecated and unmaintained
- ❌ Vuetify adding 800KB+ bundle size
- ❌ Scattered business logic mixed with UI concerns  
- ❌ Difficult to unit test due to tight coupling
- ❌ Hard to extend or modify functionality

### After (Clean Architecture)
- ✅ **Separation of Concerns**: Clear boundaries between layers
- ✅ **Modern Dependencies**: React + Ant Design + Native DOM APIs
- ✅ **Massive Bundle Reduction**: 926KB → 242KB (74% smaller)
- ✅ **Professional UI**: Enterprise-grade Ant Design components
- ✅ **Testability**: Each layer independently testable
- ✅ **Maintainability**: Changes isolated to specific layers
- ✅ **Extensibility**: Easy to add new features or change implementations
- ✅ **Reliability**: No framework conflicts, stable React ecosystem
- ✅ **Type Safety**: Full TypeScript support across all layers
- ✅ **Future-Proof**: All dependencies actively maintained

## 🎯 Success Criteria

1. ✅ **All existing functionality preserved** - No feature regression
2. ✅ **Zero Vue/Vuetify conflicts** - Stable runtime execution  
3. ✅ **100% unit test coverage** - All use cases and components tested
4. ✅ **Clean separation** - No cross-layer dependencies
5. ✅ **Easy to extend** - Adding new features follows clear patterns
6. ✅ **Performance maintained** - No significant slowdown in calendar operations

## 🚀 Next Steps

### **IMMEDIATE NEXT STEP: Phase 0 Implementation**

1. **Install React dependencies** - `npm install react react-dom @types/react @types/react-dom`
2. **Create minimal React component** - Simple "Lens Extension Loaded" message
3. **Replace Vue initialization** - Remove Vue/Vuetify, add React rendering
4. **Update Vite config** - Remove Vue chunking, add React support
5. **Manual Chrome test** - Load extension, verify no console errors
6. **🛑 CHECKPOINT**: Must pass manual testing before proceeding to Phase 1

### **SUBSEQUENT PHASES**:
1. **Phase 1**: Dependencies & Setup with manual verification
2. **Phase 2**: Core domain layer with unit tests
3. **Phase 3**: Use cases with mock testing
4. **Phase 4**: Infrastructure with Google Calendar integration testing  
5. **Phase 5**: React presentation layer with UI testing
6. **Phase 6**: Final integration with full regression testing

### **MANUAL TESTING PROTOCOL**:
- After each phase: `npm run build`
- Load unpacked extension in Chrome
- Navigate to https://calendar.google.com
- Check console for errors
- Verify expected behavior
- ✅ **Phase complete only after manual verification**

---

*Each phase must pass manual testing in Chrome before proceeding to ensure we maintain a working extension throughout the refactor.*