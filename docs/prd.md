# Lens for Google Calendar Product Requirements Document (PRD)

## Goals and Background Context

### Goals
- Ensure the extension reliably solves calendar visibility management problems (e.g., accurate preset application without errors) within 6 months of launch, measured by user-reported issue resolution rates.
- Minimize future updates by designing for long-term compatibility with Google Calendar's UI, targeting no major breaking changes in the first 12 months post-launch.
- Users will experience 100% reliability in preset saving, applying, and scrolling workflows, with no reported failures in core functionality.
- Future updates will be minimal, requiring users to update only for critical fixes, ensuring uninterrupted use over time.

### Background Context
The Lens for Google Calendar is a Chrome Manifest V3 extension that enables users to save, restore, and manage groups of calendar visibility states in Google Calendar. It addresses the frustration of manually toggling multiple calendars in a dynamic, scrollable sidebar, allowing quick switching between presets for personal, work, or project-specific views. Targeted at power users and teams reliant on Google Calendar for scheduling, the extension's value proposition lies in its seamless integration with Google Calendar's UI, reducing time spent on repetitive visibility adjustments and improving productivity through preset-based workflows.

This solves the problem of wasted time (potentially 5-10 minutes per switch for heavy users), frustration from repetitive tasks, and reduced productivity in scheduling workflows. Existing solutions, like Google Calendar's basic filters or manual note-taking, fall short by not preserving custom groups or automating state changes, leaving users without a scalable way to handle complex calendar ecosystems. Solving this now is urgent as calendar usage grows with remote work and team collaboration, where quick access to relevant views directly impacts daily efficiency and decision-making.

### Change Log

| Date              | Version | Description                          | Author |
|-------------------|---------|--------------------------------------|--------|
| November 21, 2025 | 1.0     | Initial PRD creation based on Project Brief | Agent (John)   |

## Requirements

### Functional
- FR1: Allow users to input a calendar name/email and toggle only that calendar's visibility via sidebar scrolling and state setting.
- FR2: Provide a button to uncheck all calendars by scrolling the sidebar and setting each to unchecked.
- FR3: Enable saving the current checked calendars as a new preset, with user naming and overwrite confirmation.
- FR4: Offer a dropdown to select and apply a saved preset, scrolling to match calendar states.
- FR5: After applying a preset, allow manual adjustments and saving as a new or updated preset with confirmation.
- FR6: Enable preset deletion with confirmation after selection.
- FR7: Allow downloading all presets as a JSON file.
- FR8: Permit uploading and validating a JSON file to overwrite presets with confirmation.

### Non Functional
- NFR1: Achieve 99% reliability in workflow executions (e.g., no failures in "Apply Preset" or "Save Current State").
- NFR2: Require no major updates in the first year post-launch.
- NFR3: Support unlimited number of calendars by setting state on-demand as we scroll to the bottom of the calendar list, ensuring no lag in dynamic loading.
- NFR4: Compatible with Chrome 88+ for Manifest V3.

## User Interface Design Goals

### Overall UX Vision
A streamlined, intuitive interface integrated seamlessly into Google Calendar for quick preset management, emphasizing speed, reliability, and minimal disruption to reduce user friction in calendar visibility toggling. The vision prioritizes power users who need instant access to personalized views without manual scrolling or errors, fostering a sense of control and efficiency in scheduling workflows.

### Key Interaction Paradigms
- Dropdown-based preset selection for quick application.
- One-click buttons for core actions (save, clear, delete) with confirmation dialogs to prevent errors.
- Real-time feedback on preset application, including progress indicators during scrolling and state setting.

### Core Screens and Views
- **Main Calendar View**: Injected extension UI overlaying Google Calendar's sidebar, featuring a preset dropdown, save/clear buttons, and status messages.
- **Preset Management Modal**: Accessible via a settings icon, allowing users to view, rename, delete, or export/import presets with a list view.
- **Confirmation Dialogs**: Pop-ups for saves, deletes, and imports to ensure user intent and prevent data loss.

### Accessibility: WCAG AA
Chosen to ensure the extension is usable by a broad audience, including those with disabilities, aligning with modern web standards for inclusivity.

### Branding
Minimal branding to match Google Calendar's clean, professional aesthetic—using neutral colors, sans-serif fonts, and avoiding custom logos to maintain a native feel within the calendar interface.

### Target Device and Platforms: Desktop Only
Focused on Chrome browser on desktop (Windows, macOS, Linux) for Manifest V3 compatibility and performance, with no mobile support as per technical constraints.

## Technical Assumptions

### Repository Structure: Monorepo
A single repository to house the entire extension codebase, aligning with the project's self-contained nature and limited resources.

### Service Architecture
Serverless architecture leveraging Chrome extension APIs for DOM manipulation and storage, with no backend services required.

### Testing Requirements: Unit + Integration
Focus on unit tests for core logic (entities, use cases) and integration tests for repository interactions and DOM operations to ensure 99% reliability without over-testing for a simple extension.

### Additional Technical Assumptions and Requests
- Use Chrome storage sync for preset data persistence, ensuring cross-device availability.
- Implement DOM selectors and virtual scrolling handlers to interact with Google Calendar's dynamic sidebar reliably.
- Ensure full Manifest V3 compliance for Chrome Web Store distribution.
- No external APIs or databases beyond Chrome's built-in storage.
- Prioritize performance for unlimited calendars via on-demand state setting during scrolling.

## Epic List

- **Epic 1: Foundation & Core Infrastructure**  
  Establish the Chrome extension setup, UI injection into Google Calendar, and basic calendar visibility controls (enable specific calendar and clear all) to enable reliable manual toggling without presets.

- **Epic 2: Preset Management Core**  
  Implement saving current states as presets, applying presets via dropdown, and deleting presets with confirmations, delivering the primary user value of instant state switching.

- **Epic 3: Import/Export & Refinements**  
  Add JSON import/export for presets, along with any UI/UX refinements (e.g., status messages, modal improvements) to complete the MVP and ensure full reliability.

## Epic 1: Foundation & Core Infrastructure

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

## Epic 2: Preset Management Core

Implement saving current states as presets, applying presets via dropdown, and deleting presets with confirmations, delivering the primary user value of instant state switching. This builds on the infrastructure to enable users to capture and restore personalized calendar views, reducing manual effort and improving productivity. It ensures presets are managed reliably with user confirmations to prevent errors, focusing on the core workflows that differentiate the extension from basic calendar filters.

### Story 2.1: Save Current State as Preset
As a busy professional managing multiple calendars, I want to save the current checked calendars as a new preset with a name, so that I can recall custom views later.

#### Acceptance Criteria
2.1.1: Button captures current state.  
2.1.2: Prompts for preset name.  
2.1.3: Saves to storage with overwrite confirmation if name exists.

### Story 2.2: Apply Preset
As a busy professional managing multiple calendars, I want a dropdown to select and apply a saved preset, so that I can instantly switch to a desired view.

#### Acceptance Criteria
2.2.1: Dropdown lists all presets.  
2.2.2: Applies selected preset by scrolling and setting states.  
2.2.3: Shows progress and success feedback.

### Story 2.3: Delete Preset
As a busy professional managing multiple calendars, I want to delete a preset with confirmation, so that I can manage my saved views.

#### Acceptance Criteria
2.3.1: Option to select preset for deletion.  
2.3.2: Confirmation dialog prevents accidental deletion.  
2.3.3: Removes from storage and updates UI.

## Epic 3: Import/Export & Refinements

Add JSON import/export for presets, along with any UI/UX refinements (e.g., status messages, modal improvements) to complete the MVP and ensure full reliability. This finalizes the extension with data portability and polish, allowing users to backup/share presets and enjoy a seamless experience. It addresses the remaining MVP features while enhancing usability through better feedback and design consistency with Google Calendar.

### Story 3.1: Export Presets
As a busy professional managing multiple calendars, I want to download all presets as a JSON file, so that I can backup or share my configurations.

#### Acceptance Criteria
3.1.1: Button triggers download of JSON.  
3.1.2: File includes all preset data.  
3.1.3: Handles empty presets gracefully.

### Story 3.2: Import Presets
As a busy professional managing multiple calendars, I want to upload and validate a JSON file to overwrite presets, so that I can restore or load shared configurations.

#### Acceptance Criteria
3.2.1: File upload accepts JSON.  
3.2.2: Validates format and data integrity.  
3.2.3: Overwrites storage with confirmation.

### Story 3.3: UI/UX Refinements
As a busy professional managing multiple calendars, I want improved status messages and modal designs, so that the extension feels polished and reliable.

#### Acceptance Criteria
3.3.1: Add loading indicators for long operations.  
3.3.2: Improve error messages for failures.  
3.3.3: Ensure consistent styling with Google Calendar.

## Checklist Results Report

### Executive Summary
- **Overall PRD Completeness:** 95% - The PRD is comprehensive, well-structured, and directly derived from the Project Brief, covering all essential areas for MVP development.
- **MVP Scope Appropriateness:** Just Right - Scope is minimal yet viable, focusing on core workflows without unnecessary features.
- **Readiness for Architecture Phase:** Nearly Ready - All major requirements are defined; minor refinements in UX details would enhance clarity.
- **Most Critical Gaps or Concerns:** Limited depth in user journey edge cases and integration testing specifics; no blockers, but UX flows could benefit from more examples.

### Category Analysis Table

| Category                         | Status  | Critical Issues |
| -------------------------------- | ------- | --------------- |
| 1. Problem Definition & Context  | PASS    | None            |
| 2. MVP Scope Definition          | PASS    | None            |
| 3. User Experience Requirements  | PARTIAL | UX flows and edge cases could be more detailed |
| 4. Functional Requirements       | PASS    | None            |
| 5. Non-Functional Requirements   | PASS    | None            |
| 6. Epic & Story Structure        | PASS    | None            |
| 7. Technical Guidance            | PASS    | None            |
| 8. Cross-Functional Requirements | PARTIAL | Data migration and monitoring needs more detail |
| 9. Clarity & Communication       | PASS    | None            |

### Top Issues by Priority
- **BLOCKERS:** None - All essential elements are present.
- **HIGH:** Enhance UX requirements with more specific user journey examples and error recovery paths.
- **MEDIUM:** Add details on data retention, monitoring, and deployment for cross-functional completeness.
- **LOW:** Include diagrams for visual clarity in technical assumptions.

### MVP Scope Assessment
- Features that might be cut: None; all are essential for MVP.
- Missing features: None identified.
- Complexity concerns: Virtual scrolling and DOM manipulation are noted risks.
- Timeline realism: Feasible for single developer within brief's timeline.

### Technical Readiness
- Clarity of technical constraints: High - Manifest V3, Chrome-only, no backend.
- Identified technical risks: Google Calendar UI changes, performance with unlimited calendars.
- Areas needing architect investigation: DOM selector stability, storage sync limits.

### Recommendations
- Proceed to architecture phase with the PRD as-is; address UX details during design.
- Add a simple diagram for service architecture.
- Validate accessibility choices with a quick audit.

### Final Decision
- **READY FOR ARCHITECT**: The PRD and epics are comprehensive, properly structured, and ready for architectural design.

## Next Steps

### UX Expert Prompt
Design the UI/UX for the Lens for Google Calendar extension based on this PRD, focusing on seamless integration with Google Calendar's sidebar, preset management workflows, and WCAG AA accessibility.

### Architect Prompt
Design the architecture for the Lens for Google Calendar extension based on this PRD, using Domain-Driven Design, Chrome extension APIs, and the specified technical assumptions for reliable calendar state management.