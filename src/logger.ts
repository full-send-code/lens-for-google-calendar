// Logger system for Lens for Google Calendar using loglevel
import log from 'loglevel';

// Configure the logger
log.setDefaultLevel('info');

// Create a prefixed logger for this extension
const logger = {
    error: (message: string, ...args: any[]) => log.error(`[LENS] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => log.warn(`[LENS] ${message}`, ...args),
    info: (message: string, ...args: any[]) => log.info(`[LENS] ${message}`, ...args),
    debug: (message: string, ...args: any[]) => log.debug(`[LENS] ${message}`, ...args),
    setLevel: (level: 'error' | 'warn' | 'info' | 'debug') => log.setLevel(level)
};

export default logger;