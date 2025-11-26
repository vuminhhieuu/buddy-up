/**
 * Error handling helpers for Supabase services
 * Centralized error detection and formatting utilities
 */

import type { PostgrestError } from '@supabase/supabase-js';
import {
  POSTGRES_ERROR_CODES,
  POSTGREST_ERROR_CODES,
  UNKNOWN_ERROR_MESSAGE,
} from '../../constants/errors';

/**
 * Check if error is a Row-Level Security (RLS) policy violation
 * @param error - Error object to check
 * @returns true if error is RLS violation
 */
export const isRlsError = (
  error: { code?: string; message?: string } | null | undefined,
): boolean => {
  if (!error) return false;
  return (
    error.code === POSTGRES_ERROR_CODES.RLS_POLICY_VIOLATION ||
    error.message?.includes('row-level security')
  );
};

/**
 * Check if error is a policy recursion error
 * @param error - Error object to check
 * @returns true if error is policy recursion
 */
export const isPolicyRecursion = (
  error: { code?: string; message?: string } | null | undefined,
): boolean => {
  if (!error) return false;
  return (
    error.code === POSTGRES_ERROR_CODES.POLICY_RECURSION ||
    error.message?.includes('infinite recursion')
  );
};

/**
 * Check if error is PGRST116 (no rows returned - not really an error)
 * @param error - PostgrestError to check
 * @returns true if error is PGRST116
 */
export const isPgrst116Error = (error: PostgrestError | null | undefined): boolean => {
  return error?.code === POSTGREST_ERROR_CODES.NO_ROWS_RETURNED;
};

/**
 * Format error message from unknown error type
 * @param error - Error of unknown type
 * @returns Formatted error message string
 */
export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return UNKNOWN_ERROR_MESSAGE;
};
