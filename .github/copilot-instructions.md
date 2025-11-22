# Lens for Google Calendar - AI Coding Agent Instructions

## Project Overview
A Chrome Manifest V3 extension for Google Calendar that allows users to save/restore calendar groups. Built with jQuery, Vue.js (scoped), and Material Design Lite, it injects UI into Google Calendar's DOM to provide calendar management functionality.

## Current Epic: Foundation & Core Infrastructure

Refer to `docs/prd/epic-1-foundation-core-infrastructure.md` for detailed requirements.

This epic establishes the Chrome extension setup, UI injection into Google Calendar, and basic calendar visibility controls (enable specific calendar and clear all) to enable reliable manual toggling without presets. It focuses on creating a stable base that handles virtual scrolling and DOM manipulation, allowing users to manually adjust calendar visibility as a stepping stone to automated presets.

Key stories include:
- Story 1.1: Set up Chrome Extension Infrastructure (Manifest V3, background service worker, content script injection with Vue.js component)
- Story 1.2: Implement Calendar Discovery (scan sidebar, handle virtual scrolling, dynamic updates)
- Story 1.3: Enable Specific Calendar Toggle (input field, scroll and toggle, feedback)
- Story 1.4: Clear All Calendars (button to uncheck all, handle unlimited calendars, confirmation)

Note: The acceptance criteria in the PRD incorrectly reference "React component"; it should be "Vue.js component" as per the project guidelines.

## Architecture & Key Components

### Core Classes (`src/calendar_manager.js`)
- **CalendarList**: Singleton array extension managing calendar collections. Use `CalendarList.getInstance()` to access.
- **Calendar**: Individual calendar representation with DOM manipulation methods
- **CalendarDOM**: Handles DOM-specific operations for calendar elements with virtual scrolling awareness
- **Overlay**: Visual feedback system during calendar operations

### Content Script Architecture
- **Entry Point**: `src/inject/inject.js` - Vue.js app that injects into Google Calendar
- **Centralized Config**: `CALENDAR_SELECTOR_CONFIG` object controls all timing, selectors, and UI text
- **CSS Variables**: `src/inject/inject.css` uses CSS custom properties for theming (light/dark mode support)

### Google Calendar DOM Integration
- **Virtual Scrolling**: Google Calendar destroys/recreates calendar list items offscreen. Always call `ensureValidDOM()` before DOM operations.
- **Scroll Container**: Use `CalendarList.getScrollContainer()` for calendar list operations
- **UI Injection Point**: `header > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)`

## Development Patterns

### Async Operations with DOM Validation
```javascript
// Always ensure DOM validity before calendar operations
const result = await calendarList.ensureValidDOM(calendar, {restoreScroll: true})
await calendar.toggle()
```

### Storage Structure
Chrome sync storage uses this format:
```javascript
{
  "group_name": ["email1@domain.com", "email2@domain.com"],
  "saved_1640995200000": [...],  // Auto-saved with timestamp
  "__last_saved": ["saved_1640995200000", "work"],  // Restore history
  "__v": 1  // Version for migrations
}
```

### Vue.js Component Pattern
- Components defined globally: `Vue.component('name', {...})`
- Main app: Single Vue instance in `vm` variable
- Use Vuetify scoped to avoid Google Calendar conflicts

### Keyboard Shortcuts
- Handled via Mousetrap library
- Modifier pattern: `Ctrl+Alt+[key]`
- Global binds using `mousetrap-global-bind.min.js`

## Critical Development Considerations

### Google Calendar Compatibility
- **Virtual Scrolling**: Calendar list items are destroyed when offscreen. Cache calendar data, not DOM references.
- **Dynamic Content**: Google Calendar updates DOM frequently. Always refresh calendar discovery.
- **Theme Support**: Extension auto-detects light/dark themes via CSS custom properties.

### Chrome Extension Manifest V3
- **Service Worker**: `src/background.js` handles extension lifecycle
- **Content Scripts**: Auto-inject into `https://calendar.google.com/*`
- **Storage**: Uses `chrome.storage.sync` with 3 auto-save limit

### Performance Patterns
- **Overlay System**: Show/hide loading overlays during calendar operations
- **Batch Operations**: Use `toggleAll()` for multiple calendar changes
- **Scroll Position**: Save/restore scroll positions during DOM operations

## Build & Development Workflow

### Local Development
```powershell
# Load unpacked extension at chrome://extensions/
# Test on https://calendar.google.com
```

### Release Process
```powershell
.\release.ps1 [-Version <version>] [-Force]
# Creates ZIP in dist/ directory
```

### Testing Considerations
- Use `index.html` for standalone testing outside Google Calendar
- Test calendar discovery with drawer visible/hidden
- Verify keyboard shortcuts don't conflict with Google Calendar
- Test Chrome sync storage functionality

## File Organization
- `manifest.json`: Extension configuration (Manifest V3)
- `src/calendar_manager.js`: Core calendar logic and DOM handling
- `src/inject/`: Vue.js UI components and CSS
- `lib/`: Third-party dependencies (jQuery, Vue, MDL, Mousetrap)
- `icons/`: Extension icons (16, 19, 48, 128px)

## Key Integration Points
- **Calendar Discovery**: Scans Google Calendar's virtual-scrolled list
- **DOM Injection**: Insert Vue.js UI into Google Calendar header
- **Chrome APIs**: Uses storage.sync for cross-device calendar groups
- **Theming**: CSS custom properties automatically adapt to Google Calendar themes

## Documentation References

For additional context and detailed specifications, refer to the following documentation files:

- **Project Brief**: `docs/brief.md` - Executive summary, problem statement, solution overview, target users, goals, and MVP scope
- **Product Requirements Document (PRD)**: `docs/prd/` - Complete requirements including goals, functional/non-functional requirements, technical assumptions, UI design goals, and epic breakdowns
  - `docs/prd/index.md` - PRD table of contents
  - `docs/prd/goals-and-background-context.md` - Project goals and background
  - `docs/prd/requirements.md` - Functional and non-functional requirements
  - `docs/prd/technical-assumptions.md` - Technical constraints and assumptions
  - `docs/prd/user-interface-design-goals.md` - UI/UX design principles
  - `docs/prd/epic-list.md` - List of development epics
  - `docs/prd/epic-1-foundation-core-infrastructure.md` - Current epic details
  - `docs/prd/epic-2-preset-management-core.md` - Preset management epic
  - `docs/prd/epic-3-importexport-refinements.md` - Import/export refinements epic
- **Architecture Document**: `docs/architecture.md` - Detailed technical architecture (Note: This document references React/Ant Design, but the project uses Vue.js/Material Design Lite as per the current implementation)
- **Workflows**: `docs/Workflows.md` - Detailed user workflows for the 8 core MVP features
- **Additional PRD Sections**:
  - `docs/prd/checklist-results-report.md` - Architecture checklist results
  - `docs/prd/next-steps.md` - Implementation next steps
  - `docs/prd/ui-design-goals.md` - UI design goals (duplicate of user-interface-design-goals.md)