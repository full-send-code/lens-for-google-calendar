/**
 * Centralized logging system for the application
 * Controls log verbosity and provides consistent formatting
 */

// Log levels
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

// Current log level, can be changed at runtime
let currentLogLevel = LogLevel.INFO;

// External debug mode control
let debugModeEnabled = false;

// Store performance metrics
interface PerformanceEntry {
  startTime: number;
  label: string;
}

interface PerformanceMetric {
  duration: number;
  timestamp: number;
  count: number;
}

const performanceMarks: Record<string, PerformanceEntry> = {};
const performanceMetrics: Record<string, PerformanceMetric> = {};

// Keep limited history of recent performance measurements
const MAX_HISTORY_ENTRIES = 20;
const recentPerformanceMeasurements: Array<{
  label: string;
  duration: number;
  timestamp: number;
}> = [];

/**
 * Configure the logger
 * @param level The log level to set
 * @param debug Whether debug mode is enabled
 */
export function configureLogger(level: LogLevel, debug: boolean = false): void {
  currentLogLevel = level;
  debugModeEnabled = debug;
}

/**
 * Enable debug mode for detailed logging
 */
export function enableDebugMode(): void {
  debugModeEnabled = true;
  currentLogLevel = LogLevel.DEBUG;
  info('Debug mode enabled - verbose logging active');
}

/**
 * Disable debug mode
 */
export function disableDebugMode(): void {
  debugModeEnabled = false;
  currentLogLevel = LogLevel.INFO;
}

/**
 * Log a message at the debug level
 * @param message The message to log
 * @param data Optional data to include
 */
export function debug(message: string, data?: any): void {
  logWithLevel(LogLevel.DEBUG, message, data);
}

/**
 * Log a message at the info level
 * @param message The message to log
 * @param data Optional data to include
 */
export function info(message: string, data?: any): void {
  logWithLevel(LogLevel.INFO, message, data);
}

/**
 * Log a message at the warn level
 * @param message The message to log
 * @param data Optional data to include
 */
export function warn(message: string, data?: any): void {
  logWithLevel(LogLevel.WARN, message, data);
}

/**
 * Log a message at the error level
 * @param message The message to log
 * @param data Optional data to include
 */
export function error(message: string, data?: any): void {
  logWithLevel(LogLevel.ERROR, message, data);
}

/**
 * Log a message at a specific level
 * @param level The log level
 * @param message The message to log
 * @param data Optional data to include
 */
function logWithLevel(level: LogLevel, message: string, data?: any): void {
  if (level > currentLogLevel) return;

  const timestamp = new Date().toISOString();
  let levelString: string;
  let style: string;

  switch (level) {
    case LogLevel.ERROR:
      levelString = 'ERROR';
      style = 'color: #ff5252; font-weight: bold';
      break;
    case LogLevel.WARN:
      levelString = 'WARN';
      style = 'color: #fb8c00; font-weight: bold';
      break;
    case LogLevel.INFO:
      levelString = 'INFO';
      style = 'color: #2196f3';
      break;
    case LogLevel.DEBUG:
      levelString = 'DEBUG';
      style = 'color: #4caf50';
      break;
    default:
      levelString = 'LOG';
      style = 'color: #757575';
  }

  const prefix = `%c[${levelString}] [${timestamp.substring(11, 19)}]`;
  
  if (data !== undefined) {
    console.log(prefix, style, message, data);
  } else {
    console.log(prefix, style, message);
  }
}

/**
 * Check if debug mode is enabled
 * @returns Whether debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return debugModeEnabled;
}

/**
 * Start measuring performance for an operation
 * @param label Unique identifier for the operation
 */
export function startPerformanceTracking(label: string): void {
  if (currentLogLevel >= LogLevel.DEBUG) {
    performanceMarks[label] = {
      startTime: performance.now(),
      label
    };
    
    if (isDebugEnabled()) {
      debug(`Performance tracking started: ${label}`);
    }
  }
}

/**
 * End measuring performance for an operation and log the result
 * @param label Unique identifier for the operation (must match a previous startPerformanceTracking call)
 * @param thresholdMs Optional threshold in ms - only log if execution took longer than this
 * @returns The duration in milliseconds
 */
export function endPerformanceTracking(label: string, thresholdMs?: number): number {
  if (currentLogLevel >= LogLevel.DEBUG && performanceMarks[label]) {
    const endTime = performance.now();
    const startTime = performanceMarks[label].startTime;
    const duration = endTime - startTime;
    
    // Store in metrics for later analysis
    if (!performanceMetrics[label]) {
      performanceMetrics[label] = {
        duration,
        timestamp: Date.now(),
        count: 1
      };
    } else {
      // Update existing metric
      const metric = performanceMetrics[label];
      metric.duration = (metric.duration * metric.count + duration) / (metric.count + 1); // Running average
      metric.timestamp = Date.now();
      metric.count++;
    }
    
    // Add to recent measurements history
    recentPerformanceMeasurements.push({
      label,
      duration,
      timestamp: Date.now()
    });
    
    // Trim history if needed
    if (recentPerformanceMeasurements.length > MAX_HISTORY_ENTRIES) {
      recentPerformanceMeasurements.splice(0, recentPerformanceMeasurements.length - MAX_HISTORY_ENTRIES);
    }
    
    // Only log if no threshold or duration exceeds threshold
    if (isDebugEnabled() && (thresholdMs === undefined || duration > thresholdMs)) {
      console.log(
        `%c[PERF] ${label}: ${duration.toFixed(2)}ms`,
        duration > (thresholdMs || 100) ? 'color:#f44;font-weight:bold' : 'color:#094'
      );
    }
    
    delete performanceMarks[label];
    return duration;
  }
  return 0;
}

/**
 * Get recent performance metrics for monitoring
 * @returns Recent performance measurements
 */
export function getRecentPerformanceMeasurements(): Array<{
  label: string;
  duration: number;
  timestamp: number;
}> {
  return [...recentPerformanceMeasurements];
}

/**
 * Get collected performance metrics
 * @returns All performance metrics
 */
export function getPerformanceMetrics(): Record<string, number> {
  const result: Record<string, number> = {};
  
  // Convert to simpler format for external consumption
  Object.entries(performanceMetrics).forEach(([key, metric]) => {
    result[key] = metric.duration;
  });
  
  return result;
}

/**
 * Clear all performance metrics
 */
export function clearPerformanceMetrics(): void {
  Object.keys(performanceMetrics).forEach(key => {
    delete performanceMetrics[key];
  });
  
  recentPerformanceMeasurements.splice(0, recentPerformanceMeasurements.length);
}

/**
 * Wrap a function with performance tracking
 * @param fn Function to track
 * @param label Label for the performance tracking
 * @param thresholdMs Optional threshold in ms - only log if execution took longer than this
 * @returns Wrapped function with performance tracking
 */
export function trackPerformance<T extends (...args: any[]) => any>(
  fn: T,
  label: string,
  thresholdMs?: number
): (...args: Parameters<T>) => ReturnType<T> {
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    if (currentLogLevel < LogLevel.DEBUG) {
      return fn.apply(this, args);
    }
    
    startPerformanceTracking(label);
    try {
      return fn.apply(this, args);
    } finally {
      endPerformanceTracking(label, thresholdMs);
    }
  };
}

/**
 * Group several log entries together
 * @param label The label for the group
 * @param fn Function that will execute logs
 */
export function group(label: string, fn: () => void): void {
  if (currentLogLevel >= LogLevel.INFO) {
    console.group(`[GROUP] ${label}`);
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  } else {
    fn();
  }
}
