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
