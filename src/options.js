/**
 * Options/Settings Page for Lens for Google Calendar
 * Displays extension logs and settings
 */

;(function() {
  'use strict';

  // Logger storage configuration
  const LOGGER_STORAGE_KEY = 'extension_logs';

  // State
  let logs = [];
  let selectedLevel = 'all';
  let searchQuery = '';
  let extensionVersion = '';

  /**
   * Get filtered logs based on level and search query
   */
  function getFilteredLogs() {
    let filtered = logs;
    
    // Filter by level
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => {
        return log.message.toLowerCase().includes(query) ||
               log.level.toLowerCase().includes(query) ||
               log.timestamp.toLowerCase().includes(query);
      });
    }
    
    return filtered;
  }

  /**
   * Get count of logs by level
   */
  function getLevelCounts() {
    const counts = {
      all: logs.length,
      log: 0,
      info: 0,
      warn: 0,
      error: 0,
      debug: 0,
    };
    
    logs.forEach(log => {
      if (counts.hasOwnProperty(log.level)) {
        counts[log.level]++;
      }
    });
    
    return counts;
  }

  /**
   * Format timestamp for display
   */
  function formatTimestamp(timestamp, short = false) {
    const date = new Date(timestamp);
    
    if (short) {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

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
   * Render the UI
   */
  function render() {
    const filteredLogs = getFilteredLogs();
    const levelCounts = getLevelCounts();
    
    // Update version
    document.querySelector('.version').textContent = `Version ${extensionVersion}`;
    
    // Update stats
    if (logs.length > 0) {
      document.querySelector('.logs-stats').style.display = 'flex';
      document.querySelector('.stat-value').textContent = `${filteredLogs.length} / ${logs.length}`;
      document.querySelectorAll('.stat-value')[1].textContent = 
        logs.length > 0 ? formatTimestamp(logs[0].timestamp, true) : '-';
      document.querySelectorAll('.stat-value')[2].textContent = 
        logs.length > 0 ? formatTimestamp(logs[logs.length - 1].timestamp, true) : '-';
    } else {
      document.querySelector('.logs-stats').style.display = 'none';
    }
    
    // Update buttons disabled state
    document.querySelectorAll('button').forEach(btn => {
      if (btn.textContent.includes('Export') || btn.textContent.includes('Clear')) {
        btn.disabled = logs.length === 0;
      }
    });
    
    // Update filter chips
    const filterContainer = document.querySelector('.filter-container');
    if (logs.length > 0) {
      filterContainer.style.display = 'flex';
      
      // Clear existing content
      filterContainer.innerHTML = '';
      
      // Add label
      const label = document.createElement('span');
      label.style.color = '#5f6368';
      label.style.fontSize = '14px';
      label.style.marginRight = '8px';
      label.textContent = 'Filter by level:';
      filterContainer.appendChild(label);
      
      // Helper function to create filter chip
      const createChip = (level, count, colorClass) => {
        const chip = document.createElement('span');
        chip.className = `mdl-chip mdl-chip--contact filter-chip ${selectedLevel === level ? 'active' : ''}`;
        chip.dataset.level = level;
        chip.style.cursor = 'pointer';
        
        const contact = document.createElement('span');
        contact.className = `mdl-chip__contact mdl-color--${colorClass} mdl-color-text--white`;
        contact.textContent = String(count);
        
        const text = document.createElement('span');
        text.className = 'mdl-chip__text';
        text.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        
        chip.appendChild(contact);
        chip.appendChild(text);
        
        chip.addEventListener('click', () => {
          selectedLevel = level;
          render();
        });
        
        return chip;
      };
      
      // Add filter chips
      filterContainer.appendChild(createChip('all', levelCounts.all, 'blue'));
      if (levelCounts.log > 0) {
        filterContainer.appendChild(createChip('log', levelCounts.log, 'blue'));
      }
      if (levelCounts.info > 0) {
        filterContainer.appendChild(createChip('info', levelCounts.info, 'green'));
      }
      if (levelCounts.warn > 0) {
        filterContainer.appendChild(createChip('warn', levelCounts.warn, 'amber'));
      }
      if (levelCounts.error > 0) {
        filterContainer.appendChild(createChip('error', levelCounts.error, 'red'));
      }
      if (levelCounts.debug > 0) {
        filterContainer.appendChild(createChip('debug', levelCounts.debug, 'purple'));
      }
    } else {
      filterContainer.style.display = 'none';
    }
    
    // Render logs
    const logsContainer = document.querySelector('.logs-container');
    const emptyState = document.querySelector('.empty-state');
    
    if (filteredLogs.length > 0) {
      logsContainer.style.display = 'block';
      emptyState.style.display = 'none';
      
      // Clear existing content
      logsContainer.innerHTML = '';
      
      // Create log entries using DOM methods for security
      filteredLogs.forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const header = document.createElement('div');
        header.className = 'log-entry-header';
        
        const timestamp = document.createElement('span');
        timestamp.className = 'log-timestamp';
        timestamp.textContent = formatTimestamp(log.timestamp);
        
        const level = document.createElement('span');
        level.className = `log-level ${escapeHtml(log.level)}`;
        level.textContent = log.level;
        
        header.appendChild(timestamp);
        header.appendChild(level);
        
        const message = document.createElement('div');
        message.className = 'log-message';
        message.textContent = log.message;
        
        logEntry.appendChild(header);
        logEntry.appendChild(message);
        logsContainer.appendChild(logEntry);
      });
    } else {
      logsContainer.style.display = 'none';
      emptyState.style.display = 'block';
      const emptyMessage = emptyState.querySelector('div:nth-child(2)');
      if (emptyMessage) {
        if (logs.length === 0) {
          emptyMessage.textContent = 'Extension logs will appear here as you use the extension';
        } else {
          emptyMessage.textContent = 'Try adjusting your search or filter criteria';
        }
      }
    }
    
    // Upgrade MDL components
    if (typeof componentHandler !== 'undefined') {
      componentHandler.upgradeDom();
    }
  }

  /**
   * Escape HTML for safe rendering
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Load logs from chrome.storage.local
   */
  function loadLogs() {
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
        {
          timestamp: new Date(Date.now() - 3400000).toISOString(),
          level: 'warn',
          message: 'Calendar DOM invalidated, refreshing references',
          userAgent: navigator.userAgent,
          url: 'https://calendar.google.com/',
        },
        {
          timestamp: new Date(Date.now() - 3300000).toISOString(),
          level: 'error',
          message: 'Failed to toggle calendar: calendar_123@example.com - DOM element not found',
          userAgent: navigator.userAgent,
          url: 'https://calendar.google.com/',
        },
        {
          timestamp: new Date(Date.now() - 3200000).toISOString(),
          level: 'debug',
          message: 'Storage sync operation completed',
          userAgent: navigator.userAgent,
          url: 'https://calendar.google.com/',
        },
      ];
      console.log('Using mock data - chrome.storage not available');
      render();
      return;
    }
    
    chrome.storage.local.get(LOGGER_STORAGE_KEY, (result) => {
      logs = result[LOGGER_STORAGE_KEY] || [];
      console.log('Loaded', logs.length, 'log entries');
      render();
    });
  }

  /**
   * Refresh logs from storage
   */
  function refreshLogs() {
    loadLogs();
    showSnackbar('Logs refreshed');
  }

  /**
   * Export logs as a ZIP file
   */
  function exportLogs() {
    if (logs.length === 0) {
      showSnackbar('No logs to export');
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
        
        showSnackbar('Logs exported successfully');
        
        // Clear logs after successful export
        setTimeout(() => {
          clearLogs();
        }, 1000);
      }).catch((error) => {
        console.error('Error generating ZIP file:', error);
        showSnackbar('Error exporting logs');
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      showSnackbar('Error exporting logs');
    }
  }

  /**
   * Clear all logs from storage
   */
  function clearLogs() {
    if (logs.length === 0) {
      showSnackbar('No logs to clear');
      return;
    }
    
    if (!confirm('Are you sure you want to clear all logs?')) {
      return;
    }
    
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      // Mock clear for testing
      logs = [];
      showSnackbar('Logs cleared (mock)');
      render();
      return;
    }
    
    chrome.storage.local.remove(LOGGER_STORAGE_KEY, () => {
      logs = [];
      showSnackbar('Logs cleared');
      console.log('Logs cleared from storage');
      render();
    });
  }

  /**
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
    loadLogs();
    
    // Add event listeners to buttons by their text content
    const buttons = document.querySelectorAll('.logs-toolbar button');
    buttons.forEach(btn => {
      if (btn.textContent.includes('Export')) {
        btn.addEventListener('click', exportLogs);
      } else if (btn.textContent.includes('Clear')) {
        btn.addEventListener('click', clearLogs);
      } else if (btn.textContent.includes('Refresh')) {
        btn.addEventListener('click', refreshLogs);
      }
    });
    
    // Add event listener to search input
    const searchInput = document.querySelector('#search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
