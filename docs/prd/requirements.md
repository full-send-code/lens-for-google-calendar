# Requirements

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
