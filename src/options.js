/**
 * Options/Settings Page for Lens for Google Calendar
 * Displays extension logs and settings
 */

;(function() {
  'use strict';

  // Logger storage configuration
  const LOGGER_STORAGE_KEY = 'extension_logs';

  // Initialize Vue app
  const app = new Vue({
    el: '#app',
    data: {
      logs: [],
      selectedLevel: 'all',
      searchQuery: '',
      extensionVersion: '',
      isLoading: false,
    },
    
    computed: {
      /**
       * Filtered logs based on level and search query
       */
      filteredLogs() {
        let filtered = this.logs;
        
        // Filter by level
        if (this.selectedLevel !== 'all') {
          filtered = filtered.filter(log => log.level === this.selectedLevel);
        }
        
        // Filter by search query
        if (this.searchQuery.trim()) {
          const query = this.searchQuery.toLowerCase();
          filtered = filtered.filter(log => {
            return log.message.toLowerCase().includes(query) ||
                   log.level.toLowerCase().includes(query) ||
                   log.timestamp.toLowerCase().includes(query);
          });
        }
        
        return filtered;
      },
      
      /**
       * Count of logs by level
       */
      levelCounts() {
        const counts = {
          all: this.logs.length,
          log: 0,
          info: 0,
          warn: 0,
          error: 0,
          debug: 0,
        };
        
        this.logs.forEach(log => {
          if (counts.hasOwnProperty(log.level)) {
            counts[log.level]++;
          }
        });
        
        return counts;
      },
      
      /**
       * Formatted oldest log timestamp
       */
      oldestLog() {
        if (this.logs.length === 0) return '-';
        return this.formatTimestamp(this.logs[0].timestamp, true);
      },
      
      /**
       * Formatted newest log timestamp
       */
      newestLog() {
        if (this.logs.length === 0) return '-';
        return this.formatTimestamp(this.logs[this.logs.length - 1].timestamp, true);
      },
    },
    
    methods: {
      /**
       * Load logs from chrome.storage.local
       */
      loadLogs() {
        this.isLoading = true;
        
        chrome.storage.local.get(LOGGER_STORAGE_KEY, (result) => {
          this.logs = result[LOGGER_STORAGE_KEY] || [];
          this.isLoading = false;
          console.log('Loaded', this.logs.length, 'log entries');
        });
      },
      
      /**
       * Refresh logs from storage
       */
      refreshLogs() {
        this.loadLogs();
        this.showSnackbar('Logs refreshed');
      },
      
      /**
       * Export logs as a ZIP file
       */
      exportLogs() {
        if (this.logs.length === 0) {
          this.showSnackbar('No logs to export');
          return;
        }
        
        try {
          // Create ZIP file
          const zip = new JSZip();
          
          // Add logs as JSON
          const logsJson = JSON.stringify(this.logs, null, 2);
          zip.file('logs.json', logsJson);
          
          // Add metadata file
          const metadata = {
            exportDate: new Date().toISOString(),
            extensionVersion: this.extensionVersion,
            totalLogs: this.logs.length,
            oldestLog: this.logs.length > 0 ? this.logs[0].timestamp : null,
            newestLog: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null,
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
            
            this.showSnackbar('Logs exported successfully');
            
            // Clear logs after successful export
            setTimeout(() => {
              this.clearLogs();
            }, 1000);
          }).catch((error) => {
            console.error('Error generating ZIP file:', error);
            this.showSnackbar('Error exporting logs');
          });
        } catch (error) {
          console.error('Error exporting logs:', error);
          this.showSnackbar('Error exporting logs');
        }
      },
      
      /**
       * Clear all logs from storage
       */
      clearLogs() {
        if (this.logs.length === 0) {
          this.showSnackbar('No logs to clear');
          return;
        }
        
        if (!confirm('Are you sure you want to clear all logs?')) {
          return;
        }
        
        chrome.storage.local.remove(LOGGER_STORAGE_KEY, () => {
          this.logs = [];
          this.showSnackbar('Logs cleared');
          console.log('Logs cleared from storage');
        });
      },
      
      /**
       * Format timestamp for display
       * @param {string} timestamp - ISO timestamp
       * @param {boolean} short - Use short format
       * @returns {string} - Formatted timestamp
       */
      formatTimestamp(timestamp, short = false) {
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
      },
      
      /**
       * Show a snackbar notification
       * @param {string} message - Message to display
       */
      showSnackbar(message) {
        const snackbar = document.querySelector('#snackbar');
        if (snackbar && snackbar.MaterialSnackbar) {
          snackbar.MaterialSnackbar.showSnackbar({
            message: message,
            timeout: 3000,
          });
        }
      },
      
      /**
       * Get extension version from manifest
       */
      getExtensionVersion() {
        if (chrome && chrome.runtime) {
          const manifest = chrome.runtime.getManifest();
          this.extensionVersion = manifest.version;
        }
      },
    },
    
    /**
     * Vue lifecycle: mounted
     */
    mounted() {
      this.getExtensionVersion();
      this.loadLogs();
      
      // Upgrade MDL components after Vue renders
      this.$nextTick(() => {
        if (typeof componentHandler !== 'undefined') {
          componentHandler.upgradeDom();
        }
      });
    },
    
    /**
     * Vue lifecycle: updated
     */
    updated() {
      // Upgrade any new MDL components
      this.$nextTick(() => {
        if (typeof componentHandler !== 'undefined') {
          componentHandler.upgradeDom();
        }
      });
    },
  });
})();
