/**
 * Popup UI for Lens for Google Calendar Extension Settings
 * Handles log export and management from the extension popup
 */

(function() {
  'use strict';

  // DOM elements
  const logCountElement = document.getElementById('logCount');
  const downloadBtn = document.getElementById('downloadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const messageElement = document.getElementById('message');
  const downloadText = document.getElementById('downloadText');

  /**
   * Shows a message to the user
   * @param {string} text - Message text
   * @param {string} type - Message type (success, error, info)
   */
  function showMessage(text, type = 'info') {
    messageElement.className = `alert alert-${type}`;
    messageElement.textContent = text;
    messageElement.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        messageElement.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Updates the log count display
   */
  function updateLogCount() {
    if (!window.LensLogger) {
      logCountElement.textContent = 'Logger not initialized';
      return;
    }

    window.LensLogger.getLogs((logs) => {
      const count = logs.length;
      logCountElement.textContent = count === 0 ? 'No logs' : `${count} entries`;
      
      // Enable/disable buttons based on log count
      const hasLogs = count > 0;
      downloadBtn.disabled = !hasLogs;
      clearBtn.disabled = !hasLogs;
      
      if (count === 0) {
        showMessage('No logs available. Logs are captured automatically as you use the extension.', 'info');
      } else {
        messageElement.style.display = 'none';
      }
    });
  }

  /**
   * Downloads logs as a ZIP file
   */
  function downloadLogs() {
    if (!window.LensLogger) {
      showMessage('Logger not initialized', 'error');
      return;
    }

    // Disable button and show loading
    downloadBtn.disabled = true;
    downloadText.innerHTML = 'Downloading<span class="loading"></span>';

    window.LensLogger.exportLogs(
      () => {
        // Success
        downloadText.textContent = 'Download Logs';
        downloadBtn.disabled = false;
        showMessage('Logs exported successfully!', 'success');
        
        // Note: We no longer auto-clear logs after export as per feedback
      },
      (error) => {
        // Error
        downloadText.textContent = 'Download Logs';
        downloadBtn.disabled = false;
        showMessage(error.message || 'Failed to export logs', 'error');
        console.error('Failed to export logs:', error);
      }
    );
  }

  /**
   * Clears all stored logs
   */
  function clearLogs() {
    if (!window.LensLogger) {
      showMessage('Logger not initialized', 'error');
      return;
    }

    if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      return;
    }

    clearBtn.disabled = true;

    window.LensLogger.clearLogs(() => {
      clearBtn.disabled = false;
      showMessage('All logs cleared successfully', 'success');
      updateLogCount();
    });
  }

  // Event listeners
  downloadBtn.addEventListener('click', downloadLogs);
  clearBtn.addEventListener('click', clearLogs);

  // Initialize
  updateLogCount();
  
  // Refresh count every 5 seconds
  setInterval(updateLogCount, 5000);
})();
