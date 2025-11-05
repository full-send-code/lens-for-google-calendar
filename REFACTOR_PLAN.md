# Lens for Google Calendar - Clean Architecture Refactor Plan

## 🎯 Project Goals

Transform the existing Vue.js Chrome extension into a clean, testable architecture using React and SOLID principles.

## 🚀 Technology Migration

### Current Stack → New Stack
- **Vue 2.x + Vuetify** → **React 18 + Ant Design**
- **Scattered architecture** → **Clean Architecture with SOLID principles**
- **Mixed concerns** → **Separated layers with clear boundaries**
- **Vue instance conflicts** → **Stable React ecosystem**

### Why React?
1. ✅ **Better TypeScript integration** - First-class TS support
2. ✅ **More Chrome extension examples** - Larger community
3. ✅ **Modern hooks architecture** - Cleaner than Vue 2 composition
4. ✅ **No framework conflicts** - Eliminates current Vue/Vuetify issues
5. ✅ **Future-proof** - Active development and long-term support
6. ✅ **Better testing ecosystem** - React Testing Library + Jest

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
│   ├── GoogleCalendarRepository.ts # Google Calendar DOM interaction
│   ├── ChromeStorageRepository.ts  # Chrome storage implementation
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

### Phase 1: Dependencies & Setup
```bash
# Install React ecosystem
npm install react react-dom @types/react @types/react-dom

# Install UI library and utilities  
npm install antd @ant-design/icons

# Update testing dependencies for React
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Phase 2: Core Domain Layer
Create domain entities and repository interfaces:

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

```typescript
// infrastructure/GoogleCalendarRepository.ts
export class GoogleCalendarRepository implements CalendarRepository {
  async getAllCalendars(): Promise<Calendar[]> {
    // DOM scraping logic to find all calendars
    // Handle virtual scrolling
    // Extract email IDs and names
  }
  
  async findCalendarById(id: string): Promise<Calendar | null> {
    // Scroll through calendar list to find specific calendar
    // Return calendar data or null
  }
  
  async updateCalendarStatus(id: string, enabled: boolean): Promise<void> {
    // Find calendar checkbox and update status
    // Handle scrolling to bring calendar into view
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

```typescript
// presentation/components/CalendarToolbar.tsx
export const CalendarToolbar: React.FC = () => {
  const [enableInputVisible, setEnableInputVisible] = useState(false);
  const [presets, setPresets] = useState<string[]>([]);
  
  const handleClear = async () => {
    await clearCalendarsUseCase.execute();
  };
  
  const handleEnable = async (calendarId: string) => {
    await enableCalendarUseCase.execute(calendarId);
  };
  
  const handlePresetSelect = async (presetName: string) => {
    await applyPresetUseCase.execute(presetName);
  };
  
  return (
    <div className="lens-calendar-toolbar">
      <Button onClick={handleClear}>Clear</Button>
      <Button onClick={() => setEnableInputVisible(true)}>Enable</Button>
      <Select placeholder="Select Preset" onChange={handlePresetSelect}>
        {presets.map(name => (
          <Select.Option key={name} value={name}>{name}</Select.Option>
        ))}
      </Select>
      <Button>Import</Button>
      <Button>Export</Button>
    </div>
  );
};
```

### Phase 6: Dependency Injection & Main Entry
Wire everything together:

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
- ❌ Scattered business logic mixed with UI concerns  
- ❌ Difficult to unit test due to tight coupling
- ❌ Vuetify compatibility issues with Chrome extensions
- ❌ Hard to extend or modify functionality

### After (Clean Architecture)
- ✅ **Separation of Concerns**: Clear boundaries between layers
- ✅ **Testability**: Each layer independently testable
- ✅ **Maintainability**: Changes isolated to specific layers
- ✅ **Extensibility**: Easy to add new features or change implementations
- ✅ **Reliability**: No framework conflicts, stable React ecosystem
- ✅ **Type Safety**: Full TypeScript support across all layers

## 🎯 Success Criteria

1. ✅ **All existing functionality preserved** - No feature regression
2. ✅ **Zero Vue/Vuetify conflicts** - Stable runtime execution  
3. ✅ **100% unit test coverage** - All use cases and components tested
4. ✅ **Clean separation** - No cross-layer dependencies
5. ✅ **Easy to extend** - Adding new features follows clear patterns
6. ✅ **Performance maintained** - No significant slowdown in calendar operations

## 🚀 Next Steps

1. **Install React dependencies** and update build configuration
2. **Create core domain layer** with entities and repository interfaces
3. **Implement use cases** with full unit test coverage
4. **Build infrastructure layer** with Google Calendar DOM integration
5. **Create React presentation layer** with Ant Design components
6. **Wire everything together** with dependency injection
7. **Comprehensive testing** at all layers
8. **Deploy and validate** functionality matches existing behavior

---

*This refactor represents a complete modernization of the extension architecture while preserving all user-facing functionality.*