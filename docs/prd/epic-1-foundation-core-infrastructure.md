# Epic 1: Foundation & Core Infrastructure

Establish the Chrome extension setup, UI injection into Google Calendar, and basic calendar visibility controls (enable specific calendar and clear all) to enable reliable manual toggling without presets. This provides the foundational layer for all subsequent calendar management features, ensuring the extension can interact with Google Calendar's dynamic sidebar and deliver immediate value through basic controls. It focuses on creating a stable base that handles virtual scrolling and DOM manipulation, allowing users to manually adjust calendar visibility as a stepping stone to automated presets.

### Story 1.1: Set up Chrome Extension Infrastructure
As a developer, I want to configure the Manifest V3 setup, background service worker, and content script injection, so that the extension can load and inject UI into Google Calendar.

#### Acceptance Criteria
1.1.1: Manifest.json is valid and includes necessary permissions for storage and activeTab.  
1.1.2: Background service worker initializes without errors.  
1.1.3: Content script successfully injects React component into calendar.google.com.

### Story 1.2: Implement Calendar Discovery
As a busy professional managing multiple calendars, I want the extension to discover all available calendars in the sidebar, so that I can interact with them reliably.

#### Acceptance Criteria
1.2.1: Extension scans the sidebar and lists all calendar names/emails.  
1.2.2: Handles virtual scrolling to load all calendars.  
1.2.3: Updates list dynamically if calendars change.

### Story 1.3: Enable Specific Calendar Toggle
As a busy professional managing multiple calendars, I want to input a calendar name/email and toggle its visibility, so that I can manually adjust views without scrolling.

#### Acceptance Criteria
1.3.1: Input field accepts calendar identifier.  
1.3.2: Scrolls to and toggles the matching calendar's checkbox.  
1.3.3: Provides feedback on success/failure.

### Story 1.4: Clear All Calendars
As a busy professional managing multiple calendars, I want a button to uncheck all calendars, so that I can start from a clean state.

#### Acceptance Criteria
1.4.1: Button triggers scrolling through all calendars and unchecking them.  
1.4.2: Handles unlimited calendars without performance issues.  
1.4.3: Confirms action with a dialog.

## Dev Agent Record

### Tasks / Subtasks Checkboxes
- [x] **Story 1.1: Set up Chrome Extension Infrastructure**
  - [x] Configure Manifest V3 setup with storage and activeTab permissions
  - [x] Implement background service worker initialization
  - [x] Set up content script injection for calendar.google.com
- [x] **Story 1.2: Implement Calendar Discovery**
  - [x] Implement sidebar scanning for calendar names/emails
  - [x] Add virtual scrolling support to load all calendars
  - [x] Enable dynamic updates when calendars change
- [x] **Story 1.3: Enable Specific Calendar Toggle**
  - [x] Create input field for calendar identifier
  - [x] Implement scroll-to and toggle functionality
  - [x] Add success/failure feedback system
- [x] **Story 1.4: Clear All Calendars**
  - [x] Implement scrolling through all calendars for unchecking
  - [x] Optimize for unlimited calendars without performance issues
  - [x] Add confirmation dialog for clear action

### Debug Log References
- Virtual scrolling optimization implemented in `applyCalendarVisibilityByScrolling`
- DOMUtils consolidated into specialized services (CalendarDOMSelector, CalendarDataExtractor, CalendarVisibilityManager, VirtualScrollHandler)
- SOLID architecture applied with single responsibility principle

### Completion Notes List
- ✅ All acceptance criteria met for all 4 stories
- ✅ 276 unit/integration tests passing
- ✅ Build succeeds without errors
- ✅ Clean Architecture implemented with proper separation of concerns
- ✅ DOM utilities consolidated following SOLID principles
- ✅ Optimized clear calendars operation handles unlimited calendars via scrolling

### File List
**Source Files Created/Modified:**
- `src/infrastructure/background.ts` - Chrome service worker
- `src/infrastructure/CalendarDOMSelector.service.ts` - DOM selection logic
- `src/infrastructure/CalendarDataExtractor.service.ts` - Data extraction from DOM
- `src/infrastructure/CalendarVisibilityManager.service.ts` - Visibility changes
- `src/infrastructure/VirtualScrollHandler.service.ts` - Scrolling operations
- `src/infrastructure/GoogleCalendarRepository.repository.ts` - Calendar operations
- `src/infrastructure/ChromeStorageRepository.repository.ts` - Storage operations
- `src/core/entities/Calendar.entity.ts` - Domain entity
- `src/core/entities/CalendarPreset.entity.ts` - Domain entity
- `src/usecases/ClearCalendars.usecase.ts` - Clear calendars use case
- `src/usecases/EnableCalendar.usecase.ts` - Enable calendar use case
- `src/presentation/CalendarExtensionApp.tsx` - Main React component
- `src/presentation/components/` - UI components
- `manifest.json` - Chrome extension manifest

**Test Files:**
- 46 test files covering all domain, infrastructure, and presentation layers
- Integration tests for repository operations
- Unit tests for all services and use cases

### Change Log
- **2025-11-22**: Epic 1 completed with all acceptance criteria met
- **2025-11-22**: DOMUtils consolidated into specialized services
- **2025-11-22**: Optimized clear calendars operation with scrolling
- **2025-11-22**: SOLID architecture fully implemented

### Status
**Ready for Review** ✅

### Agent Model Used
James (Dev Agent) - Full Stack Developer specializing in implementation with comprehensive testing and SOLID architecture principles.

