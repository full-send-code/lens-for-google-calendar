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
    maxLogAge: 24 * 60 * 60 * 1000,  // 24 hours (1 day) in milliseconds
    anonymize: true,  // Whether to anonymize calendar data
    storageDebounce: 1000, // Debounce storage writes by 1 second
  };

  // Check if we're in a Chrome extension environment
  const isExtensionEnvironment = !!(typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local);

  // Store for anonymization mapping (session-only, not persisted)
  const anonymizationMap = new Map();
  let anonymizationCounter = 0;
  
  // Buffer for pending logs to batch writes
  let logBuffer = [];
  let storageTimer = null;

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
    let str = typeof data === 'string' ? data : safeStringify(data);
    
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
   * Safely stringify objects, handling circular references
   * @param {*} obj - Object to stringify
   * @returns {string} - Stringified object
   */
  function safeStringify(obj) {
    const seen = new WeakSet();
    try {
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        return value;
      }, 2);
    } catch (e) {
      return String(obj);
    }
  }

  /**
   * Formats log arguments for storage
   * @param {Array} args - Console arguments
   * @returns {string} - Formatted log message
   */
  function formatLogArgs(args) {
    return Array.from(args).map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        return anonymizeData(safeStringify(arg));
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
   * Flushes the log buffer to storage
   */
  function flushLogBuffer() {
    if (logBuffer.length === 0) {
      return;
    }

    const logsToStore = [...logBuffer];
    logBuffer = [];

    chrome.storage.local.get(LOGGER_CONFIG.storageKey, (result) => {
      let logs = result[LOGGER_CONFIG.storageKey] || [];
      
      // Add new log entries
      logs.push(...logsToStore);
      
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
  }

  /**
   * Stores a log entry in chrome.storage.local (buffered)
   * @param {Object} logEntry - Log entry to store
   */
  function storeLog(logEntry) {
    logBuffer.push(logEntry);
    
    // Clear any existing timer
    if (storageTimer) {
      clearTimeout(storageTimer);
    }
    
    // Set new timer to flush buffer
    storageTimer = setTimeout(flushLogBuffer, LOGGER_CONFIG.storageDebounce);
  }

  /**
   * Wraps a console method to capture logs
   * @param {string} level - Log level
   * @param {Function} originalMethod - Original console method
   * @returns {Function} - Wrapped method
   */
  function wrapConsoleMethod(level, originalMethod) {
    return function(...args) {
      // Call original method first with try-catch for error resilience
      try {
        originalMethod.apply(console, args);
      } catch (e) {
        // If original method fails, continue with logging anyway
      }
      
      // Create and store log entry (only in extension environment)
      if (isExtensionEnvironment) {
        const logEntry = createLogEntry(level, args);
        storeLog(logEntry);
      }
    };
  }

  /**
   * Initializes the logger by wrapping console methods
   */
  function initLogger() {
    // Only initialize if in extension environment
    if (!isExtensionEnvironment) {
      console.warn('LensLogger: Not in Chrome extension environment, logging disabled');
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
    
    // Flush any pending logs when page unloads
    window.addEventListener('beforeunload', () => {
      if (logBuffer.length > 0) {
        flushLogBuffer();
      }
    });
  }

  /**
   * Gets all stored logs
   * @param {Function} callback - Callback with logs array
   */
  function getLogs(callback) {
    if (!isExtensionEnvironment) {
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
    if (!isExtensionEnvironment) {
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
        const logsJson = safeStringify(logs);
        zip.file('logs.json', logsJson);
        
        // Add metadata file
        let extensionVersion = 'unknown';
        try {
          if (chrome && chrome.runtime) {
            extensionVersion = chrome.runtime.getManifest().version;
          }
        } catch (e) {
          // Ignore errors getting manifest
        }
        
        const metadata = {
          exportDate: new Date().toISOString(),
          extensionVersion: extensionVersion,
          totalLogs: logs.length,
          oldestLog: logs.length > 0 ? logs[0].timestamp : null,
          newestLog: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
        };
        zip.file('metadata.json', safeStringify(metadata));
        
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

  if (isExtensionEnvironment) {
    console.log('Lens Logger initialized');
  }
})();
