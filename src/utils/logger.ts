import {
  LogLevel,
  DEFAULT_LOG_LEVEL,
  ENABLE_LOGGING_IN_PRODUCTION,
  ENABLE_SCOPED_LOGGING,
  ENABLE_STACK_TRACES,
  ENABLE_PERFORMANCE_LOGGING,
  IGNORED_ERROR_CODES,
  IGNORED_ERROR_PATTERNS,
} from '../constants/logger';

/**
 * Current log level (can be changed at runtime)
 */
let currentLogLevel = DEFAULT_LOG_LEVEL;

/**
 * Performance timers map
 */
const timers = new Map<string, number>();

/**
 * Track logged scopes to prevent duplicates (similar to loggedWarningScopes in home.ts)
 */
const loggedScopes = new Set<string>();

/**
 * Check if logging is enabled
 */
const isLoggingEnabled = (): boolean => {
  if (!__DEV__ && !ENABLE_LOGGING_IN_PRODUCTION) {
    return false;
  }
  return true;
};

/**
 * Check if error should be ignored
 */
const shouldIgnoreError = (error: any): boolean => {
  if (!error) return false;

  // Check error code
  if (error.code && IGNORED_ERROR_CODES.includes(error.code as any)) {
    return true;
  }

  // Check error message patterns
  const message = error.message || String(error);
  if (typeof message === 'string') {
    const lowerMessage = message.toLowerCase();
    return IGNORED_ERROR_PATTERNS.some((pattern) => lowerMessage.includes(pattern.toLowerCase()));
  }

  return false;
};

/**
 * Format log message with scope prefix
 */
const formatMessage = (level: string, scope: string, message: string): string => {
  if (ENABLE_SCOPED_LOGGING) {
    return `[${scope}] ${message}`;
  }
  return message;
};

/**
 * Format log with timestamp (optional, for debugging)
 */
const formatLog = (level: string, scope: string, message: string, ...args: any[]): void => {
  const formattedMessage = formatMessage(level, scope, message);
  const logArgs = args.length > 0 ? [formattedMessage, ...args] : [formattedMessage];
  return logArgs;
};

/**
 * Logger utility with configurable log levels and scoped logging
 */
export const logger = {
  /**
   * Set log level at runtime
   */
  setLevel: (level: LogLevel): void => {
    currentLogLevel = level;
  },

  /**
   * Get current log level
   */
  getLevel: (): LogLevel => {
    return currentLogLevel;
  },

  /**
   * Debug level logging (most verbose)
   */
  debug: (scope: string, message: string, ...args: any[]): void => {
    if (!isLoggingEnabled() || currentLogLevel > LogLevel.DEBUG) return;
    const logArgs = formatLog('DEBUG', scope, message, ...args);
    console.log(...logArgs);
  },

  /**
   * Info level logging
   */
  info: (scope: string, message: string, ...args: any[]): void => {
    if (!isLoggingEnabled() || currentLogLevel > LogLevel.INFO) return;
    const logArgs = formatLog('INFO', scope, message, ...args);
    console.log(...logArgs);
  },

  /**
   * Warn level logging
   */
  warn: (scope: string, message: string, ...args: any[]): void => {
    if (!isLoggingEnabled() || currentLogLevel > LogLevel.WARN) return;
    const logArgs = formatLog('WARN', scope, message, ...args);
    console.warn(...logArgs);
  },

  /**
   * Error level logging (most important)
   */
  error: (scope: string, message: string, ...args: any[]): void => {
    if (!isLoggingEnabled() || currentLogLevel > LogLevel.ERROR) return;

    // Check if error should be ignored
    const errorArg = args.find((arg) => arg instanceof Error || arg?.code || arg?.message);
    if (errorArg && shouldIgnoreError(errorArg)) {
      return;
    }

    const formattedMessage = formatMessage('ERROR', scope, message);
    const logArgs = [formattedMessage, ...args];

    if (ENABLE_STACK_TRACES && errorArg instanceof Error) {
      console.error(...logArgs, '\n', errorArg.stack);
    } else {
      console.error(...logArgs);
    }
  },

  /**
   * Log alias (same as info)
   */
  log: (scope: string, message: string, ...args: any[]): void => {
    logger.info(scope, message, ...args);
  },

  /**
   * Conditional logging - only log if condition is true
   */
  warnIf: (condition: boolean, scope: string, message: string, ...args: any[]): void => {
    if (condition) {
      logger.warn(scope, message, ...args);
    }
  },

  /**
   * Conditional logging - only log if condition is false
   */
  warnUnless: (condition: boolean, scope: string, message: string, ...args: any[]): void => {
    if (!condition) {
      logger.warn(scope, message, ...args);
    }
  },

  /**
   * Conditional error logging
   */
  errorIf: (condition: boolean, scope: string, message: string, ...args: any[]): void => {
    if (condition) {
      logger.error(scope, message, ...args);
    }
  },

  /**
   * Log error with stack trace
   */
  errorWithStack: (scope: string, message: string, error: Error, ...args: any[]): void => {
    logger.error(scope, message, error, ...args);
    if (ENABLE_STACK_TRACES) {
      console.error(`[${scope}] Stack trace:`, error.stack);
    }
  },

  /**
   * Start performance timer
   */
  time: (scope: string, label: string): void => {
    if (!ENABLE_PERFORMANCE_LOGGING) return;
    const key = `${scope}:${label}`;
    timers.set(key, Date.now());
  },

  /**
   * End performance timer and log duration
   */
  timeEnd: (scope: string, label: string): void => {
    if (!ENABLE_PERFORMANCE_LOGGING) return;
    const key = `${scope}:${label}`;
    const startTime = timers.get(key);
    if (startTime) {
      const duration = Date.now() - startTime;
      logger.debug(scope, `${label} took ${duration}ms`);
      timers.delete(key);
    }
  },

  /**
   * Prevent duplicate logs for the same scope (useful for warnings)
   */
  warnOnce: (scope: string, message: string, ...args: any[]): void => {
    const key = `${scope}:${message}`;
    if (loggedScopes.has(key)) return;
    loggedScopes.add(key);
    logger.warn(scope, message, ...args);
  },

  /**
   * Clear logged scopes (useful for testing)
   */
  clearLoggedScopes: (): void => {
    loggedScopes.clear();
  },
};
