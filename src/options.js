/**
 * Options/Settings Page for Lens for Google Calendar
 * Manages logging settings and log downloads
 */

;(function() {
  'use strict';

  // Logger storage configuration
  const LOGGER_STORAGE_KEY = 'extension_logs';
  const LOGGING_ENABLED_KEY = 'logging_enabled';

  // State
  let logs = [];
  let loggingEnabled = false;
  let extensionVersion = '';

  /**
   * Show a snackbar notification
   */
  function showSnackbar(message) {
    const snackbar = document.querySelector('#snackbar');
    if (snackbar && snackbar.MaterialSnackbar) {
      snackbar.MaterialSnackbar.showSnackbar({
        message: message,
        timeout: 3000,
      });
    }
  }

  /**
   * Update the UI based on current state
   */
  function updateUI() {
    // Update version
    document.querySelector('.version').textContent = `Version ${extensionVersion}`;
    
    // Update logging toggle
    const toggle = document.querySelector('#logging-toggle');
    if (toggle) {
      toggle.checked = loggingEnabled;
    }
    
    // Update download button state
    const downloadBtn = document.querySelector('#export-btn');
    if (downloadBtn) {
      downloadBtn.disabled = !loggingEnabled || logs.length === 0;
    }
    
    // Update status text
    const statusEl = document.querySelector('#log-status');
    if (statusEl) {
      if (!loggingEnabled) {
        statusEl.textContent = 'Logging disabled';
      } else if (logs.length === 0) {
        statusEl.textContent = 'No logs available';
      } else {
        statusEl.textContent = `${logs.length} log entries available`;
      }
    }
    
    // Upgrade MDL components
    if (typeof componentHandler !== 'undefined') {
      componentHandler.upgradeDom();
    }
  }

  /**
   * Load logs and logging settings from storage
   */
  function loadData() {
    // Check if chrome.storage is available (extension context)
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      // Mock data for testing outside extension context
      logs = [
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          level: 'log',
          message: 'Lens Logger initialized',
          userAgent: navigator.userAgent,
          url: 'https://calendar.google.com/',
        },
        {
          timestamp: new Date(Date.now() - 3500000).toISOString(),
          level: 'info',
          message: 'CalendarList discovered 5 calendars',
          userAgent: navigator.userAgent,
          url: 'https://calendar.google.com/',
        },
      ];
      loggingEnabled = false; // Default to disabled for privacy
      console.log('Using mock data - chrome.storage not available');
      updateUI();
      return;
    }
    
    // Load both logs and logging setting
    chrome.storage.local.get([LOGGER_STORAGE_KEY, LOGGING_ENABLED_KEY], (result) => {
      logs = result[LOGGER_STORAGE_KEY] || [];
      loggingEnabled = result[LOGGING_ENABLED_KEY] === true; // Default to false (disabled)
      
      // Sync logger state with saved preference
      if (window.LensLogger) {
        if (loggingEnabled && !window.LensLogger.isLoggingActive()) {
          window.LensLogger.enableLogging();
        } else if (!loggingEnabled && window.LensLogger.isLoggingActive()) {
          window.LensLogger.disableLogging();
        }
      }
      
      console.log('Loaded', logs.length, 'log entries, logging enabled:', loggingEnabled);
      updateUI();
    });
  }

  /**
   * Save logging setting to storage
   */
  function saveLoggingSetting(enabled) {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      loggingEnabled = enabled;
      if (!enabled) {
        logs = []; // Clear logs when disabling
      }
      updateUI();
      return;
    }
    
    if (enabled) {
      // Just save the setting when enabling
      chrome.storage.local.set({ [LOGGING_ENABLED_KEY]: enabled }, () => {
        loggingEnabled = enabled;
        
        // Enable logging in the logger if available
        if (window.LensLogger && window.LensLogger.enableLogging) {
          window.LensLogger.enableLogging();
        }
        
        updateUI();
        showSnackbar('Logging enabled');
      });
    } else {
      // Clear logs and save setting when disabling
      chrome.storage.local.remove(LOGGER_STORAGE_KEY, () => {
        chrome.storage.local.set({ [LOGGING_ENABLED_KEY]: enabled }, () => {
          logs = [];
          loggingEnabled = enabled;
          
          // Disable logging in the logger if available
          if (window.LensLogger && window.LensLogger.disableLogging) {
            window.LensLogger.disableLogging();
          }
          
          updateUI();
          showSnackbar('Logging disabled - existing logs cleared');
        });
      });
    }
  }

  /**
   * Download logs as a ZIP file
   */
  function downloadLogs() {
    if (logs.length === 0) {
      showSnackbar('No logs to download');
      return;
    }
    
    try {
      // Create ZIP file
      const zip = new JSZip();
      
      // Add logs as JSON
      const logsJson = JSON.stringify(logs, null, 2);
      zip.file('logs.json', logsJson);
      
      // Add metadata file
      const metadata = {
        exportDate: new Date().toISOString(),
        extensionVersion: extensionVersion,
        totalLogs: logs.length,
        oldestLog: logs.length > 0 ? logs[0].timestamp : null,
        newestLog: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
      };
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));
      
      // Generate ZIP file
      zip.generateAsync({ type: 'blob' }).then((blob) => {
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = `lens-calendar-logs-${date}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSnackbar('Logs downloaded successfully');
      }).catch((error) => {
        console.error('Error generating ZIP file:', error);
        showSnackbar('Error downloading logs');
      });
    } catch (error) {
      console.error('Error downloading logs:', error);
      showSnackbar('Error downloading logs');
    }
  }

  /**
   * Refresh logs from storage
   */
  function refreshLogs() {
    loadLogs();
    showSnackbar('Logs refreshed');
  }  /**
   * Get extension version from manifest
   */
  function getExtensionVersion() {
    if (chrome && chrome.runtime && chrome.runtime.getManifest) {
      const manifest = chrome.runtime.getManifest();
      extensionVersion = manifest.version;
    } else {
      // Mock version for testing
      extensionVersion = '1.0.1';
    }
  }

  /**
   * Initialize the page
   */
  function init() {
    getExtensionVersion();
    loadData();
    
    // Add event listener to download button
    const downloadBtn = document.querySelector('#export-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', downloadLogs);
    }
    
    // Add event listener to logging toggle
    const loggingToggle = document.querySelector('#logging-toggle');
    if (loggingToggle) {
      loggingToggle.addEventListener('change', (e) => {
        saveLoggingSetting(e.target.checked);
      });
    }
  }

  /**
   * Sync logger state when it becomes available
   */
  function syncLoggerState() {
    if (window.LensLogger && window.LensLogger.isLoggingActive) {
      const loggerActive = window.LensLogger.isLoggingActive();
      
      // If states are mismatched, sync them
      if (loggingEnabled && !loggerActive) {
        window.LensLogger.enableLogging();
        console.log('Enabled logger to match saved preference');
      } else if (!loggingEnabled && loggerActive) {
        window.LensLogger.disableLogging();
        console.log('Disabled logger to match saved preference');
      }
    }
  }

  // Check for logger availability periodically for the first few seconds
  let loggerCheckCount = 0;
  const loggerCheckInterval = setInterval(() => {
    syncLoggerState();
    loggerCheckCount++;
    
    // Stop checking after 10 attempts (5 seconds)
    if (loggerCheckCount >= 10 || (window.LensLogger && window.LensLogger.isLoggingActive)) {
      clearInterval(loggerCheckInterval);
    }
  }, 500);

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
