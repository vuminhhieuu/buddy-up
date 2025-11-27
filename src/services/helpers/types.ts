/**
 * Standard Service Response Types
 * Common types for service function responses
 */

import type { PostgrestError } from '@supabase/supabase-js';
import { APP_ERROR_CODES, POSTGRES_ERROR_CODES } from '../../constants/errors';
import { isRlsError, formatErrorMessage } from './errorHelpers';

/**
 * Standard error codes used across all services
 * Extends APP_ERROR_CODES with service-specific codes
 */
export type ServiceErrorCode =
  | (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES]
  | 'ALREADY_EXISTS'
  | 'INVALID_USER'
  | 'SELF_CONNECTION'
  | 'INVALID_CONNECTION'
  | 'INVALID_CHAT'
  | 'UNAUTHORIZED'
  | 'BADGE_NOT_FOUND';

/**
 * Standard success response
 * T is the data type returned on success
 */
export type ServiceSuccessResponse<T> = {
  success: true;
  data: T;
};

/**
 * Standard error response
 */
export type ServiceErrorResponse = {
  success: false;
  error: string;
  errorCode: ServiceErrorCode;
};

/**
 * Standard service response (union of success and error)
 * T is the data type returned on success
 */
export type ServiceResponse<T> = ServiceSuccessResponse<T> | ServiceErrorResponse;

/**
 * Helper type guard to check if response is success
 */
export function isSuccessResponse<T>(
  response: ServiceResponse<T>,
): response is ServiceSuccessResponse<T> {
  return response.success === true;
}

/**
 * Helper type guard to check if response is error
 */
export function isErrorResponse(
  response: ServiceResponse<unknown>,
): response is ServiceErrorResponse {
  return response.success === false;
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(data: T): ServiceSuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(
  error: string,
  errorCode: ServiceErrorCode,
): ServiceErrorResponse {
  return {
    success: false,
    error,
    errorCode,
  };
}

/**
 * Convert Supabase PostgrestError to standard error response
 * Automatically maps common error codes to appropriate error codes
 */
export function handleSupabaseError(
  error: PostgrestError | null | undefined,
  defaultMessage = 'An error occurred',
): ServiceErrorResponse {
  if (!error) {
    return createErrorResponse(defaultMessage, 'NETWORK_ERROR');
  }

  // Map RLS errors
  if (isRlsError(error)) {
    return createErrorResponse('Permission denied', 'PERMISSION_DENIED');
  }

  // Map unique constraint violations
  if (error.code === POSTGRES_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION) {
    return createErrorResponse('Resource already exists', 'ALREADY_EXISTS');
  }

  // Map PostgreSQL error codes
  if (error.code === POSTGRES_ERROR_CODES.RLS_POLICY_VIOLATION) {
    return createErrorResponse('Permission denied', 'PERMISSION_DENIED');
  }

  // Default: use error message or default
  const message = error.message || defaultMessage;
  return createErrorResponse(message, 'NETWORK_ERROR');
}

/**
 * Handle unknown errors (catch blocks)
 */
export function handleUnknownError(
  error: unknown,
  defaultMessage = 'An unexpected error occurred',
): ServiceErrorResponse {
  const message = formatErrorMessage(error);
  return createErrorResponse(message || defaultMessage, 'NETWORK_ERROR');
}
