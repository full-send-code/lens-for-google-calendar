// Settings page logic for Lens for Google Calendar
(function() {
  'use strict';
  
  // DOM elements
  let logCountElement;
  let downloadLogsBtn;
  let clearLogsBtn;
  let statusMessage;
  let versionElement;
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    logCountElement = document.getElementById('logCount');
    downloadLogsBtn = document.getElementById('downloadLogsBtn');
    clearLogsBtn = document.getElementById('clearLogsBtn');
    statusMessage = document.getElementById('statusMessage');
    versionElement = document.getElementById('version');
    
    // Load version from manifest
    if (chrome && chrome.runtime) {
      const manifest = chrome.runtime.getManifest();
      if (manifest && manifest.version) {
        versionElement.textContent = manifest.version;
      }
    }
    
    // Load log count
    updateLogCount();
    
    // Add event listeners
    downloadLogsBtn.addEventListener('click', handleDownloadLogs);
    clearLogsBtn.addEventListener('click', handleClearLogs);
    
    // Initialize Material Design Lite components
    if (window.componentHandler) {
      window.componentHandler.upgradeDom();
    }
  });
  
  /**
   * Update the log count display
   */
  function updateLogCount() {
    if (typeof LensLogger === 'undefined') {
      logCountElement.textContent = '0';
      downloadLogsBtn.disabled = true;
      clearLogsBtn.disabled = true;
      return;
    }
    
    LensLogger.getLogs(function(logs) {
      const count = logs.length;
      logCountElement.textContent = count;
      
      // Disable buttons if no logs
      if (count === 0) {
        downloadLogsBtn.disabled = true;
        clearLogsBtn.disabled = true;
      } else {
        downloadLogsBtn.disabled = false;
        clearLogsBtn.disabled = false;
      }
    });
  }
  
  /**
   * Show a status message
   * @param {string} message - The message to display
   * @param {string} type - Type of message ('success' or 'error')
   */
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;
    
    // Hide after 5 seconds
    setTimeout(function() {
      statusMessage.className = 'status-message';
    }, 5000);
  }
  
  /**
   * Handle download logs button click
   */
  function handleDownloadLogs() {
    if (typeof LensLogger === 'undefined') {
      showStatus('Logger not available', 'error');
      return;
    }
    
    // Disable button during export
    downloadLogsBtn.disabled = true;
    downloadLogsBtn.textContent = 'Exporting...';
    
    LensLogger.exportLogs(
      function() {
        // Success
        showStatus('Logs exported successfully', 'success');
        
        // Clear logs after successful export
        LensLogger.clearLogs(function() {
          console.log('Logs cleared after export');
          updateLogCount();
        });
        
        // Re-enable button
        downloadLogsBtn.disabled = false;
        downloadLogsBtn.innerHTML = '<i class="material-icons" style="vertical-align: middle; margin-right: 4px;">file_download</i>Download Logs';
      },
      function(error) {
        // Error
        showStatus(error.message || 'Failed to export logs', 'error');
        console.error('Failed to export logs:', error);
        
        // Re-enable button
        downloadLogsBtn.disabled = false;
        downloadLogsBtn.innerHTML = '<i class="material-icons" style="vertical-align: middle; margin-right: 4px;">file_download</i>Download Logs';
      }
    );
  }
  
  /**
   * Handle clear logs button click
   */
  function handleClearLogs() {
    if (typeof LensLogger === 'undefined') {
      showStatus('Logger not available', 'error');
      return;
    }
    
    // Confirm before clearing
    if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      return;
    }
    
    // Disable button during clear
    clearLogsBtn.disabled = true;
    clearLogsBtn.textContent = 'Clearing...';
    
    LensLogger.clearLogs(function() {
      showStatus('Logs cleared successfully', 'success');
      updateLogCount();
      
      // Re-enable button
      clearLogsBtn.disabled = false;
      clearLogsBtn.innerHTML = '<i class="material-icons" style="vertical-align: middle; margin-right: 4px;">delete</i>Clear Logs';
    });
  }
})();
