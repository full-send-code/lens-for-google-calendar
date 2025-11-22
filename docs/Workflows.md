# Workflows
1. Enable Calendar:
   - ask for user input
   - scroll the side bar until you find the matching calendar
   - set desired checked state of ONLY that calendar
2. Clear all calendars:
   - User clicks button to clear calendars
   - Scroll the side bar and set each calendar item to unchecked
3. Save Current State 
   - User clicks button to save current state
   - Scroll the sidebar gathering the state of each calendar and keeping track of all of the checked calendars
   - Ask user for name of the new preset.
   - If the name matches a current preset we should confirm with user if they want to overwrite it.
   - Save preset to storage 
4. Apply Preset
   - User selects dropdown from the list
   - Get desired state from selected preset
   - Scroll through the calendar list and set the state of each calendar against the presets desired state
5. Save Preset
   - User selects preset and the Apply Preset usecase is executed.
   - User selects/deselects calendars
   - User clicks the save button next to preset drop down.
   - Ask for confirmation
   - If yes:
     - Scroll through the calendar list taking note of all of the checked calendars
     - Save the checked calendars as the desired state for the selected preset
6. Delete Preset
   - User selects preset and the Apply Preset usecase is executed.
   - User clicks the delete button next to preset drop down.
   - Ask for confirmation
   - If yes:
     - delete the preset from storage
7. Export Presets
   - User clicks Export button
   - We get all presets from storage
   - Export as json file
8. Import Presets
   - User clicks Import button
   - Ask for file
   - Validate preset data
   - Ask for confirmation that will overwrite all preset data
   - If yes:
     - Overwrite preset data in storage