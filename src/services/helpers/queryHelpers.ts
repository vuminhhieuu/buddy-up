/**
 * Safe query helpers for Supabase services
 * Wrappers that handle errors gracefully and return safe defaults
 */

import type { PostgrestError } from '@supabase/supabase-js';
import { logger } from '../../utils/logger';
import { isPgrst116Error } from './errorHelpers';

// ============================================================================
// Types
// ============================================================================

/**
 * Result type for maybeSingle() queries
 */
export type MaybeSingleResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

/**
 * Result type for list queries
 */
export type ListResult<T> = {
  data: T[] | null;
  error: PostgrestError | null;
};

/**
 * Result type for single() queries
 */
export type SingleResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

// ============================================================================
// Safe Query Wrappers
// ============================================================================

/**
 * Safely extract data from maybeSingle() query result
 * Ignores PGRST116 errors (no rows found is not an error)
 * Logs warnings for other errors
 * @param result - Query result from maybeSingle()
 * @param scope - Scope name for logging (e.g., 'fetchProfile')
 * @returns Data if available, null otherwise
 */
export const safeMaybeSingle = <T>(result: MaybeSingleResult<T>, scope: string): T | null => {
  const { data, error } = result;
  if (error) {
    // PGRST116 means no rows found - this is expected and not an error
    if (!isPgrst116Error(error)) {
      logger.warnOnce('QueryHelper', `${scope}: ${error.message}`, error);
    }
    return null;
  }
  return data;
};

/**
 * Safely extract data from list query result
 * Returns empty array on error
 * Logs warnings for errors (except PGRST116)
 * @param result - Query result from select()
 * @param scope - Scope name for logging (e.g., 'fetchSessions')
 * @returns Array of data, empty array on error
 */
export const safeList = <T>(result: ListResult<T>, scope: string): T[] => {
  if (result.error) {
    // PGRST116 means no rows found - this is expected and not an error
    if (!isPgrst116Error(result.error)) {
      logger.warnOnce('QueryHelper', `${scope}: ${result.error.message}`, result.error);
    }
    return [];
  }
  return (result.data || []) as T[];
};

/**
 * Safely extract data from single() query result
 * Returns null on error
 * Logs errors (single() should always return data, so any error is significant)
 * @param result - Query result from single()
 * @param scope - Scope name for logging (e.g., 'fetchProfile')
 * @returns Data if available, null on error
 */
export const safeSingle = <T>(result: SingleResult<T>, scope: string): T | null => {
  const { data, error } = result;
  if (error) {
    // single() should always return data, so any error is significant
    logger.error('QueryHelper', `${scope}: ${error.message}`, error);
    return null;
  }
  return data;
};
