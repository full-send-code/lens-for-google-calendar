import * as log from 'loglevel';

// Configure loglevel for Lens for Google Calendar
const logger = log.getLogger('LENS');
logger.setLevel('info'); // Default level

// Add prefix to all log messages
const originalFactory = logger.methodFactory;
logger.methodFactory = function (methodName, logLevel, loggerName) {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);
  
  return function (message, ...args) {
    rawMethod(`[${String(loggerName)}] ${message}`, ...args);
  };
};

// Apply the custom method factory
logger.setLevel(logger.getLevel());

export default logger;