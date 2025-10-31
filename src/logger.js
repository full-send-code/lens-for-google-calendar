/**
 * Logger System for Lens for Google Calendar
 * Captures console logs and stores them in chrome.storage.local for support purposes
 * Anonymizes sensitive data (calendar IDs, names) before storage
 */

;(function() {
  'use strict';

  // Configuration
  const LOGGER_CONFIG = {
    storageKey: 'extension_logs',
    maxLogs: 500,  // Maximum number of log entries to store
    maxLogAge: 24 * 60 * 60 * 1000,  // 24 hours in milliseconds
    anonymize: true,  // Whether to anonymize calendar data
  };

  // Store for anonymization mapping (session-only, not persisted)
  const anonymizationMap = new Map();
  let anonymizationCounter = 0;

  /**
   * Anonymizes calendar IDs and names in log messages
   * @param {*} data - Data to anonymize
   * @returns {*} - Anonymized data
   */
  function anonymizeData(data) {
    if (!LOGGER_CONFIG.anonymize) {
      return data;
    }

    // Convert to string for processing
    let str;
    if (typeof data === 'string') {
      str = data;
    } else {
      try {
        str = JSON.stringify(data);
      } catch (e) {
        str = '[Unserializable object]';
      }
    }
    
    // Email pattern (likely calendar IDs)
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    
    str = str.replace(emailPattern, (match) => {
      if (!anonymizationMap.has(match)) {
        anonymizationMap.set(match, `calendar_${++anonymizationCounter}@example.com`);
      }
      return anonymizationMap.get(match);
    });

    // Try to parse back to original type
    if (typeof data === 'object' && data !== null) {
      try {
        return JSON.parse(str);
      } catch (e) {
        return str;
      }
    }
    
    return str;
  }

  /**
   * Formats log arguments for storage
   * @param {Array} args - Console arguments
   * @returns {string} - Formatted log message
   */
  function formatLogArgs(args) {
    return Array.from(args).map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(anonymizeData(arg), null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return anonymizeData(String(arg));
    }).join(' ');
  }

  /**
   * Creates a log entry
   * @param {string} level - Log level (log, error, warn, info, debug)
   * @param {Array} args - Console arguments
   * @returns {Object} - Log entry object
   */
  function createLogEntry(level, args) {
    return {
      timestamp: new Date().toISOString(),
      level: level,
      message: formatLogArgs(args),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  /**
   * Stores a log entry in chrome.storage.local
   * @param {Object} logEntry - Log entry to store
   */
  function storeLog(logEntry) {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      return; // Not in extension environment
    }

    // Check if logging is enabled before storing
    chrome.storage.local.get('logging_enabled', (settingsResult) => {
      const loggingEnabled = settingsResult.logging_enabled !== false; // Default to true for backward compatibility
      
      if (!loggingEnabled) {
        return; // Don't store logs when logging is disabled
      }

      chrome.storage.local.get(LOGGER_CONFIG.storageKey, (result) => {
        let logs = result[LOGGER_CONFIG.storageKey] || [];
        
        // Add new log entry
        logs.push(logEntry);
        
        // Remove old logs (older than maxLogAge)
        const now = Date.now();
        logs = logs.filter(log => {
          const logTime = new Date(log.timestamp).getTime();
          return (now - logTime) < LOGGER_CONFIG.maxLogAge;
        });
        
        // Trim to max logs if needed
        if (logs.length > LOGGER_CONFIG.maxLogs) {
          logs = logs.slice(-LOGGER_CONFIG.maxLogs);
        }
        
        // Save back to storage
        const data = {};
        data[LOGGER_CONFIG.storageKey] = logs;
        
        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            // Can't log to console here as it would cause recursion
            // Silently fail
          }
        });
      });
    });
  }

  /**
   * Wraps a console method to capture logs
   * @param {string} level - Log level
   * @param {Function} originalMethod - Original console method
   * @returns {Function} - Wrapped method
   */
  function wrapConsoleMethod(level, originalMethod) {
    return function(...args) {
      // Call original method first
      originalMethod.apply(console, args);
      
      // Create and store log entry
      const logEntry = createLogEntry(level, args);
      storeLog(logEntry);
    };
  }

  /**
   * Initializes the logger by wrapping console methods
   */
  function initLogger() {
    // Check if we're in an extension environment
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      console.log('Lens Logger: Not in extension environment, skipping console wrapping');
      return;
    }

    // Store original console methods
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };

    // Wrap console methods
    console.log = wrapConsoleMethod('log', originalConsole.log);
    console.error = wrapConsoleMethod('error', originalConsole.error);
    console.warn = wrapConsoleMethod('warn', originalConsole.warn);
    console.info = wrapConsoleMethod('info', originalConsole.info);
    console.debug = wrapConsoleMethod('debug', originalConsole.debug);

    // Store original methods for potential restoration
    console._original = originalConsole;
  }

  /**
   * Gets all stored logs
   * @param {Function} callback - Callback with logs array
   */
  function getLogs(callback) {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      callback([]);
      return;
    }

    chrome.storage.local.get(LOGGER_CONFIG.storageKey, (result) => {
      const logs = result[LOGGER_CONFIG.storageKey] || [];
      callback(logs);
    });
  }

  /**
   * Clears all stored logs
   * @param {Function} callback - Callback when done
   */
  function clearLogs(callback) {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      if (callback) callback();
      return;
    }

    chrome.storage.local.remove(LOGGER_CONFIG.storageKey, () => {
      if (callback) callback();
    });
  }

  /**
   * Exports logs as a ZIP file
   * @param {Function} onSuccess - Success callback
   * @param {Function} onError - Error callback
   */
  function exportLogs(onSuccess, onError) {
    // Check if JSZip is available
    if (typeof JSZip === 'undefined') {
      if (onError) onError(new Error('JSZip library not loaded'));
      return;
    }

    getLogs((logs) => {
      if (logs.length === 0) {
        if (onError) onError(new Error('No logs to export'));
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
          extensionVersion: (chrome && chrome.runtime) ? chrome.runtime.getManifest().version : 'unknown',
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
          a.download = `lens-calendar-logs-${new Date().toISOString().split('T')[0]}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          if (onSuccess) onSuccess();
        }).catch((error) => {
          if (onError) onError(error);
        });
      } catch (error) {
        if (onError) onError(error);
      }
    });
  }

  // Initialize logger
  initLogger();

  // Export API to global scope
  window.LensLogger = {
    getLogs: getLogs,
    clearLogs: clearLogs,
    exportLogs: exportLogs,
    config: LOGGER_CONFIG,
  };

  // Only log initialization message if we're in extension environment
  if (chrome && chrome.storage && chrome.storage.local) {
    console.log('Lens Logger initialized');
  }
})();
