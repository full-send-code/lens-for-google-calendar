import React, { useEffect, useState, useMemo, useCallback } from 'react';
import * as Logger from '../../utils/logger';

// Styles for the performance monitor
const styles = {
  container: {
    position: 'fixed' as const,
    bottom: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    zIndex: 9999,
    maxWidth: '300px',
    maxHeight: '200px',
    overflow: 'auto' as const
  },
  title: {
    fontWeight: 'bold' as const,
    marginBottom: '4px'
  },
  entry: {
    margin: '2px 0',
    display: 'flex',
    justifyContent: 'space-between' as const
  },
  label: {
    marginRight: '8px'
  },
  time: {
    color: '#4caf50'
  },
  slowTime: {
    color: '#f44336'
  },
  averageTime: {
    color: '#ff9800'
  },
  fastTime: {
    color: '#00bcd4'
  }
};

interface PerformanceData {
  [key: string]: {
    time: number;
    count: number;
    avg: number;
    recent: number;
    min: number;
    max: number;
  };
}

/**
 * Get color style based on performance duration
 */
const getPerformanceColor = (avg: number, recent: number): React.CSSProperties => {
  const duration = Math.max(avg, recent);
  if (duration > 100) return styles.slowTime;
  if (duration > 50) return styles.averageTime;
  if (duration > 10) return styles.time;
  return styles.fastTime;
};

/**
 * Performance monitoring component for development
 * Shows render times and performance metrics with enhanced analytics
 */
export const PerformanceMonitor: React.FC<{ enabled?: boolean }> = ({ enabled = false }) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({});
  const [visible, setVisible] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  
  // Memoize the performance data collection function
  const collectData = useCallback(() => {
    if (typeof Logger.getRecentPerformanceMeasurements === 'function') {
      const recentMeasurements = Logger.getRecentPerformanceMeasurements();
      const data: PerformanceData = {};
      
      // Group measurements by label and calculate statistics
      recentMeasurements.forEach(measurement => {
        const { label, duration } = measurement;
        
        if (!data[label]) {
          data[label] = {
            time: duration,
            count: 1,
            avg: duration,
            recent: duration,
            min: duration,
            max: duration
          };
        } else {
          const existing = data[label];
          existing.time += duration;
          existing.count += 1;
          existing.avg = existing.time / existing.count;
          existing.recent = duration;
          existing.min = Math.min(existing.min, duration);
          existing.max = Math.max(existing.max, duration);
        }
      });
      
      setPerformanceData(data);
      setUpdateCount(prev => prev + 1);
    }
  }, []);
  
  // Memoize the keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.altKey && e.key === 'p') {
      setVisible(prev => !prev);
      e.preventDefault();
    }
  }, []);

  useEffect(() => {    if (!enabled) return;
    
    // Collect data periodically
    const intervalId = setInterval(collectData, 1000);
    
    // Add keyboard listener
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, collectData, handleKeyDown]);
  
  // Memoize sorted performance entries
  const sortedEntries = useMemo(() => {
    return Object.entries(performanceData)
      .sort(([, a], [, b]) => b.avg - a.avg) // Sort by average time, slowest first
      .slice(0, 10); // Show only top 10 slowest operations
  }, [performanceData]);
  
  // Don't render anything if not enabled or not visible
  if (!enabled || !visible) return null;
  
  return (
    <div style={styles.container}>
      <div style={styles.title}>
        Performance Monitor (Ctrl+Alt+P) - Updates: {updateCount}
      </div>
      {sortedEntries.length === 0 ? (
        <div>No performance data available</div>
      ) : (
        sortedEntries.map(([key, data]) => (
          <div key={key} style={styles.entry}>
            <span style={styles.label} title={`Min: ${data.min.toFixed(2)}ms, Max: ${data.max.toFixed(2)}ms`}>
              {key}:
            </span>
            <span style={getPerformanceColor(data.avg, data.recent)}>
              {data.avg.toFixed(2)}ms avg ({data.recent.toFixed(2)}ms) x{data.count}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

export default React.memo(PerformanceMonitor);
