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
│   │   ├── Calendar.ts           # Calendar domain entity
│   │   └── Preset.ts             # Preset domain entity
│   ├── repositories/
│   │   ├── CalendarRepository.ts # Calendar data access interface
│   │   └── PresetRepository.ts   # Preset storage interface
│   └── errors/
│       └── DomainErrors.ts       # Custom error types
├── usecases/                      # Application logic
│   ├── ClearCalendars.ts         # Clear all calendars use case
│   ├── EnableCalendar.ts         # Enable specific calendar use case
│   ├── ApplyPreset.ts            # Apply preset use case
│   ├── ImportPresets.ts          # Import presets use case
│   └── ExportPresets.ts          # Export presets use case
├── infrastructure/                # External integrations
│   ├── GoogleCalendarRepository.ts # Google Calendar DOM interaction (Native APIs)
│   ├── ChromeStorageRepository.ts  # Chrome storage implementation
│   ├── DOMUtils.ts                # Native DOM utility functions (replaces jQuery)
│   └── JsonImportExport.ts        # JSON import/export implementation
├── presentation/                  # UI layer
│   ├── components/               # React components
│   └── CalendarExtensionApp.ts   # Main presentation coordinator
└── main.ts                       # Entry point that wires everything together
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

### Phase 2: Core Domain Layer ⭐ **CURRENT PHASE**
Create domain entities and repository interfaces:

**Manual Testing Checkpoint**:
- ✅ Core entities compile without errors
- ✅ Repository interfaces are properly typed
- ✅ No external dependencies in core layer
- ✅ Unit tests pass for domain entities

**Calendar Entity:**
```typescript
// core/entities/Calendar.ts
export interface Calendar {
  id: string;           // Email/address identifier
  name: string;         // Display name
  isEnabled: boolean;   // Current checked status
}
```

**Preset Entity:**
```typescript
// core/entities/Preset.ts
export interface Preset {
  name: string;
  calendarIds: string[];
}

export interface PresetCollection {
  [presetName: string]: string[];
}
```

**Repository Interfaces:**
```typescript
// core/repositories/CalendarRepository.ts
export interface CalendarRepository {
  getAllCalendars(): Promise<Calendar[]>;
  findCalendarById(id: string): Promise<Calendar | null>;
  updateCalendarStatus(id: string, enabled: boolean): Promise<void>;
  clearAllCalendars(): Promise<void>;
}

// core/repositories/PresetRepository.ts  
export interface PresetRepository {
  getAllPresets(): Promise<PresetCollection>;
  savePresets(presets: PresetCollection): Promise<void>;
  exportPresets(): Promise<string>; // JSON string
  importPresets(json: string): Promise<void>;
}
```

### Phase 3: Use Cases Layer
Implement business logic without external dependencies:

**Manual Testing Checkpoint**:
- ✅ Use cases compile and type-check correctly
- ✅ All use case unit tests pass
- ✅ Mock repositories work properly in tests
- ✅ Business logic is isolated from external concerns

```typescript
// usecases/ClearCalendars.ts
export class ClearCalendars {
  constructor(private calendarRepo: CalendarRepository) {}
  
  async execute(): Promise<void> {
    await this.calendarRepo.clearAllCalendars();
  }
}

// usecases/EnableCalendar.ts
export class EnableCalendar {
  constructor(private calendarRepo: CalendarRepository) {}
  
  async execute(calendarId: string): Promise<void> {
    const calendar = await this.calendarRepo.findCalendarById(calendarId);
    if (!calendar) {
      throw new CalendarNotFoundError(calendarId);
    }
    await this.calendarRepo.updateCalendarStatus(calendarId, true);
  }
}

// usecases/ApplyPreset.ts
export class ApplyPreset {
  constructor(
    private calendarRepo: CalendarRepository,
    private presetRepo: PresetRepository
  ) {}
  
  async execute(presetName: string): Promise<void> {
    const presets = await this.presetRepo.getAllPresets();
    const calendarIds = presets[presetName];
    
    if (!calendarIds) {
      throw new PresetNotFoundError(presetName);
    }
    
    // Clear all calendars first
    await this.calendarRepo.clearAllCalendars();
    
    // Enable calendars in preset
    for (const id of calendarIds) {
      await this.calendarRepo.updateCalendarStatus(id, true);
    }
  }
}
```

### Phase 4: Infrastructure Layer
Implement repository interfaces with Google Calendar DOM and Chrome storage:

**Manual Testing Checkpoint**:
- ✅ GoogleCalendarRepository can find and interact with calendar DOM elements
- ✅ ChromeStorageRepository can read/write to Chrome storage
- ✅ Native DOM utilities work correctly (no jQuery dependencies)
- ✅ Virtual scrolling handling works correctly
- ✅ **Test on real Google Calendar**: Verify calendar detection and manipulation

```typescript
// infrastructure/DOMUtils.ts
export class DOMUtils {
  static query(selector: string): Element | null {
    return document.querySelector(selector);
  }
  
  static queryAll(selector: string): NodeListOf<Element> {
    return document.querySelectorAll(selector);
  }
  
  static addClass(element: Element, className: string): void {
    element.classList.add(className);
  }
  
  static scrollIntoView(element: Element): void {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

// infrastructure/GoogleCalendarRepository.ts
export class GoogleCalendarRepository implements CalendarRepository {
  async getAllCalendars(): Promise<Calendar[]> {
    // Use native DOM APIs instead of jQuery
    const calendarElements = DOMUtils.queryAll('[data-id][aria-label*="Calendar"]');
    // Handle virtual scrolling
    // Extract email IDs and names using native APIs
  }
  
  async findCalendarById(id: string): Promise<Calendar | null> {
    // Scroll through calendar list using native scrolling APIs
    // Find specific calendar without jQuery
    const encodedId = btoa(id); // Base64 encode like Google Calendar does
    const element = DOMUtils.query(`[data-id="${encodedId}"]`);
    // Return calendar data or null
  }
  
  async updateCalendarStatus(id: string, enabled: boolean): Promise<void> {
    // Find calendar checkbox using native APIs
    const calendar = await this.findCalendarById(id);
    if (calendar) {
      const checkbox = calendar.querySelector('input[type="checkbox"]') as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = enabled;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }
}

// infrastructure/ChromeStorageRepository.ts  
export class ChromeStorageRepository implements PresetRepository {
  async getAllPresets(): Promise<PresetCollection> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (data) => {
        // Filter out internal keys and return presets
        resolve(data);
      });
    });
  }
  
  async savePresets(presets: PresetCollection): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set(presets, resolve);
    });
  }
}
```

### Phase 5: Presentation Layer
Create React components and coordinate with use cases:

**Manual Testing Checkpoint**:
- ✅ React components render without errors
- ✅ Button clicks trigger correct use cases
- ✅ UI appears in correct Google Calendar location
- ✅ **Full functionality test**: Clear, Enable, Preset selection all work
- ✅ Import/Export functionality works

```typescript
// presentation/components/CalendarToolbar.tsx
import React, { useState } from 'react';
import { Button, Select, Input, Modal, notification } from 'antd';
import { ClearOutlined, PlusOutlined, ImportOutlined, ExportOutlined } from '@ant-design/icons';

export const CalendarToolbar: React.FC = () => {
  const [enableInputVisible, setEnableInputVisible] = useState(false);
  const [presets, setPresets] = useState<string[]>([]);
  
  const handleClear = async () => {
    await clearCalendarsUseCase.execute();
    notification.success({ message: 'All calendars cleared' });
  };
  
  const handleEnable = async (calendarId: string) => {
    await enableCalendarUseCase.execute(calendarId);
    notification.success({ message: `Calendar ${calendarId} enabled` });
  };
  
  const handlePresetSelect = async (presetName: string) => {
    await applyPresetUseCase.execute(presetName);
    notification.success({ message: `Applied preset: ${presetName}` });
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
        {presets.map(name => (
          <Select.Option key={name} value={name}>{name}</Select.Option>
        ))}
      </Select>
      <Button icon={<ImportOutlined />}>Import</Button>
      <Button icon={<ExportOutlined />}>Export</Button>
      
      <Modal
        title="Enable Calendar"
        open={enableInputVisible}
        onCancel={() => setEnableInputVisible(false)}
        onOk={() => {/* handle enable */}}
      >
        <Input placeholder="Enter calendar email address" />
      </Modal>
    </div>
  );
};
```

### Phase 6: Dependency Injection & Main Entry
Wire everything together:

**Manual Testing Checkpoint**:
- ✅ All dependency injection works correctly
- ✅ Extension loads and initializes properly
- ✅ **Full regression test**: All original features work exactly as before
- ✅ **Performance test**: No significant slowdown in calendar operations
- ✅ **Error handling**: Graceful handling of edge cases
- ✅ **Final acceptance**: Extension ready for production use

```typescript
// main.ts
// Initialize repositories
const calendarRepo = new GoogleCalendarRepository();
const presetRepo = new ChromeStorageRepository();

// Initialize use cases
const clearCalendarsUseCase = new ClearCalendars(calendarRepo);
const enableCalendarUseCase = new EnableCalendar(calendarRepo);
const applyPresetUseCase = new ApplyPreset(calendarRepo, presetRepo);

// Initialize React app
const container = createExtensionContainer();
const root = createRoot(container);
root.render(<CalendarExtensionApp />);
```

## 🧪 Testing Strategy

### Unit Tests
- **Core entities**: Test business logic without external dependencies
- **Use cases**: Test with mocked repositories
- **Infrastructure**: Test with mocked Chrome APIs and DOM
- **Components**: Test with React Testing Library

### Test Structure
```
tests/
├── unit/
│   ├── core/
│   ├── usecases/
│   ├── infrastructure/
│   └── presentation/
└── integration/
    └── extension-workflow.test.ts
```

### Example Tests
```typescript
// tests/unit/usecases/ClearCalendars.test.ts
describe('ClearCalendars', () => {
  it('should clear all calendars through repository', async () => {
    const mockRepo = createMockCalendarRepository();
    const useCase = new ClearCalendars(mockRepo);
    
    await useCase.execute();
    
    expect(mockRepo.clearAllCalendars).toHaveBeenCalledOnce();
  });
});

// tests/unit/presentation/CalendarToolbar.test.tsx
describe('CalendarToolbar', () => {
  it('should call clear use case when Clear button clicked', async () => {
    const mockClearUseCase = jest.fn();
    render(<CalendarToolbar clearUseCase={mockClearUseCase} />);
    
    fireEvent.click(screen.getByText('Clear'));
    
    expect(mockClearUseCase.execute).toHaveBeenCalled();
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