# Lens for Google Calendar

A Chrome extension that allows you to save and quickly restore groups of selected calendars in Google Calendar, making it easy to switch between different perspectives with a single click.

![Lens for Google Calendar](screenshots/screenshot%201.png)

## Features

- Save your currently visible calendars as a named group
- Quickly switch between different calendar views
- Assign keyboard shortcuts for instant calendar switching
- Clean and intuitive Material Design interface
- Seamless integration with Google Calendar
- Perfect for managing multiple projects, teams, or aspects of your life

## Why Lens for Google Calendar?

Lens for Google Calendar helps you organize your calendar experience by creating different "views" or "perspectives" of your calendars. Just like looking through different lenses gives you different views of the world, this extension gives you different perspectives of your Google Calendar schedule.

## Installation

### From Chrome Web Store (Recommended)
*(Coming soon)*

### Manual Installation
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The extension icon should appear in your Chrome toolbar

## Usage

1. Navigate to [Google Calendar](https://calendar.google.com)
2. Click the Lens for Google Calendar icon in the extension toolbar
3. To save a group:
   - Select the calendars you want visible in Google Calendar
   - Click "Save Current" and enter a name for your group
4. To load a group:
   - Click on a saved group name to restore that calendar selection
   - Alternatively, use the assigned keyboard shortcut

## Keyboard Shortcuts

The extension supports keyboard shortcuts for quick access to your calendar groups. When you create a group, you can assign a shortcut by including an ampersand (`&`) in front of the letter you want to use as a shortcut.

Example: "Work &Calendars" allows you to activate this group by pressing the assigned key (in this case, "C").

## Development

### Project Structure

- `/src`: Extension source code
  - `/src/background.js`: Background script for Chrome extension
  - `/src/calendar_manager.js`: Core functionality for managing calendar groups
  - `/src/inject`: Files injected into the Google Calendar page
- `/lib`: Third-party libraries
  - jQuery, Vue.js, Vuetify, Material Design Lite, Mousetrap
- `/icons`: Extension icons

### Build and Release

Use the included PowerShell script to create a release:

```powershell
./release.ps1
```

## Credits

This project is a fork of the [original Calendar Selector for Google Calendar](https://gitlab.com/bluenexa/google-calendar-selector) by BlueNexa, provided under the MIT License. The project has been renamed and enhanced while maintaining the core functionality of the original.

## License

[MIT License](LICENSE)
