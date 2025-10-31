# Lens for Google Calendar

A Chrome extension that allows you to save and restore groups of calendar selections in Google Calendar, making it easy to switch between different sets of visible calendars.

![Extension Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Manifest](https://img.shields.io/badge/manifest-v3-orange)

## 🚀 Features

- **Save Calendar Groups**: Create named presets of your currently selected calendars
- **Quick Restore**: Instantly switch between different calendar group configurations
- **Keyboard Shortcuts**: Use `Ctrl+Alt+T` to toggle calendar visibility and other shortcuts
- **Import/Export**: Backup and restore your calendar groups across devices
- **Auto-save**: Automatically saves your last 3 calendar selections for easy restoration
- **Dark Mode Support**: Seamlessly adapts to Google Calendar's dark theme
- **Local Storage**: All data is stored locally in your browser with Chrome sync support
- **Support Logs**: Download anonymized logs for troubleshooting (privacy-focused with no external data transmission)

## 📦 Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. Navigate to [Google Calendar](https://calendar.google.com) to start using the extension

### Building a Release Package

Use the included PowerShell script to create a distributable package:

```powershell
.\release.ps1
```

This creates a ZIP file in the `dist/` directory that can be loaded as an unpacked extension.

## 🎯 How to Use

### Basic Operations

1. **Save a Calendar Group**: 
   - Select the calendars you want to include in a group
   - Click the "Save As" button
   - Enter a name for your group

2. **Load a Calendar Group**:
   - Use the dropdown menu to select a saved group
   - All calendars in that group will be enabled, others will be disabled

3. **Quick Actions**:
   - **Enable**: Enable calendars by name or regex pattern
   - **Restore**: Restore your previous calendar selection
   - **Clear**: Hide all calendars (while saving current state for restoration)

### Keyboard Shortcuts

- `Ctrl+Alt+E`: **Enable** calendar by name or regex pattern (prompts for input)
- `Ctrl+Alt+S`: **Save As** - Save current calendar selection as a named preset
- `Ctrl+Alt+R`: **Restore** previous calendar selection 
- `Ctrl+Alt+C`: **Clear** all calendars (saves current state for restoration)
- `Ctrl+Alt+T`: **Toggle** calendar visibility by name (prompts for calendar name/regex)
- `Ctrl+Alt` (hold): Show keyboard shortcut hints overlay

### Import/Export

- **Export**: Backup your calendar groups to a JSON file
- **Import**: Restore calendar groups from a previously exported file

### Support Logs

- **Download Logs**: Export extension logs as a ZIP file for troubleshooting
  - Click "Presets" button, then click "Logs" in the import/export bar
  - Logs are automatically anonymized (calendar IDs and email addresses replaced)
  - Contains console messages from the last 24 hours (max 500 entries)
  - ZIP file includes logs.json and metadata.json
  - Logs are automatically cleared after successful export
  - No data is sent externally - everything stays on your computer

## 🏗️ Architecture

### Core Components

- **CalendarManager** (`src/calendar_manager.js`): Core logic for calendar discovery and manipulation
- **UI Components** (`src/inject/inject.js`): Vue.js-based user interface injected into Google Calendar
- **Content Scripts**: Automatically inject the extension into Google Calendar pages
- **Background Service Worker**: Handles extension lifecycle and messaging

### Key Classes

- `Calendar`: Represents individual calendar entries with DOM manipulation methods
- `CalendarList`: Manages collections of calendars with filtering and bulk operations
- `CalendarDOM`: Handles DOM-specific operations for calendar elements
- `Overlay`: Provides visual feedback during calendar operations

### Dependencies

- **jQuery**: DOM manipulation and utilities
- **Vue.js**: Reactive UI framework for the extension interface
- **Vuetify**: Material Design component library (scoped to avoid conflicts)
- **Material Design Lite**: Additional UI components and styling
- **Mousetrap**: Keyboard shortcut handling
- **JSZip**: ZIP file creation for log exports

## 🔧 Development

### File Structure

```
├── manifest.json           # Extension manifest (Manifest V3)
├── index.html             # Standalone test/demo page
├── icons/                 # Extension icons (16, 19, 48, 128px)
├── lib/                   # Third-party libraries
│   ├── jquery/
│   ├── vue/
│   ├── mdl/              # Material Design Lite
│   └── mousetrap/        # Keyboard shortcuts
├── src/
│   ├── background.js      # Service worker
│   ├── calendar_manager.js # Core calendar logic
│   └── inject/
│       ├── inject.js      # UI injection and Vue components
│       └── inject.css     # Extension-specific styles
├── docs/                  # Documentation
├── screenshots/           # Extension screenshots
└── release.ps1          # Build script
```

### Configuration

The extension uses a centralized configuration object (`CALENDAR_SELECTOR_CONFIG`) in `inject.js` that controls:

- Timing delays for various operations
- CSS selectors for UI injection
- Storage settings and limits
- UI text strings for internationalization
- Keyboard shortcut mappings

### Browser Permissions

- `storage`: Save calendar groups to Chrome sync storage
- Content script access to `https://calendar.google.com/*`

## 📊 Data Management

### Storage Format

Calendar groups are stored using Chrome's sync storage API in this format:

```javascript
{
  "work": ["user@example.com", "team@company.com"],
  "personal": ["personal@gmail.com", "family@example.org"],
  "saved_1640995200000": ["user@example.com"],  // Auto-saved groups
  "__last_saved": ["saved_1640995200000", "work", "personal"],  // Restore history
  "__v": 1  // Storage format version for future migrations
}
```

- **Group names**: User-defined preset names (stored as lowercase)
- **Calendar IDs**: Arrays of calendar email addresses (the unique identifier)
- **Auto-saves**: Groups with `saved_` prefix and timestamp for quick restore
- **`__last_saved`**: Array tracking recent saves for the restore function
- **`__v`**: Version number for handling storage format migrations

### Privacy

- **Local Only**: All data is stored locally using Chrome's secure storage APIs
- **No Network**: No data is transmitted to external servers
- **Sync Support**: Data syncs across Chrome browsers signed into the same Google account
- **Limited Retention**: Only the 3 most recent auto-saves are kept

## 🎨 Theming

The extension automatically adapts to Google Calendar's theme:

- **Light Mode**: Clean, bright interface matching Google's design
- **Dark Mode**: Automatically detected and styled for dark themes
- **High Contrast**: Proper contrast ratios for accessibility

## 🚨 Error Handling

- **Calendar Discovery**: Handles Google Calendar's virtual scrolling by scanning through the calendar list
- **DOM Changes**: Automatically refreshes calendar DOM references when Google Calendar updates
- **Storage Failures**: Graceful fallback when Chrome storage is unavailable
- **Migration**: Automatic data format migration for older storage versions

## 🧪 Testing

The extension includes a standalone test page (`index.html`) for development and testing outside of Google Calendar.

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

**Initial implementation**: Copyright 2021 Bluenexa LLC  
**Fork and subsequent modifications**: Copyright 2025 full-send-coding

This project is a fork of the original Lens for Google Calendar extension created by Bluenexa LLC. The original source code can be found at: https://gitlab.com/bluenexa/google-calendar-selector

All modifications and enhancements from 2025 onwards are the work of full-send-coding.

## 🔒 Privacy Policy

See [PRIVACY.md](PRIVACY.md) for detailed information about data collection and privacy practices.

## 🤝 Contributing

This is a browser extension for Google Calendar. When contributing:

1. Ensure changes work with Google Calendar's dynamic content loading
2. Test keyboard shortcuts don't conflict with existing Google Calendar shortcuts
3. Verify dark mode compatibility
4. Test Chrome sync storage functionality
5. Maintain backward compatibility for existing user data

## 🐛 Known Issues

- Calendar discovery requires the calendar drawer to be visible
- Some operations may require brief UI overlays during DOM manipulation
- Virtual scrolling in Google Calendar requires special handling for calendar detection

## 📈 Version History

- **v1.0.0**: Initial release with core calendar group management features
