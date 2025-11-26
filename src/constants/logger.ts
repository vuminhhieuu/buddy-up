/**
 * Logger configuration constants
 */

/**
 * Log levels in order of severity (lower number = more verbose)
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Default log level (only log WARN and ERROR in production)
 */
export const DEFAULT_LOG_LEVEL = __DEV__ ? LogLevel.DEBUG : LogLevel.WARN;

/**
 * Enable logging in production (set to true to enable all logs in production)
 * WARNING: Only enable for debugging purposes
 */
export const ENABLE_LOGGING_IN_PRODUCTION = false;

/**
 * Enable scoped logging with prefix [scope]
 */
export const ENABLE_SCOPED_LOGGING = true;

/**
 * Enable stack traces for errors
 */
export const ENABLE_STACK_TRACES = __DEV__;

/**
 * Enable performance logging (time/timeEnd)
 */
export const ENABLE_PERFORMANCE_LOGGING = __DEV__;

/**
 * Error codes to ignore (don't log these errors)
 */
import { POSTGREST_ERROR_CODES, POSTGRES_ERROR_CODES } from './errors';

export const IGNORED_ERROR_CODES = [
  POSTGREST_ERROR_CODES.NO_ROWS_RETURNED,
  POSTGRES_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION,
] as const;

/**
 * Error message patterns to ignore (don't log if message contains these)
 */
export const IGNORED_ERROR_PATTERNS = [
  'infinite recursion detected',
  'infinite recursion',
] as const;
