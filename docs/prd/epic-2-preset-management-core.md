# Epic 2: Preset Management Core

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
