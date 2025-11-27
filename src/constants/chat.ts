/**
 * Chat feature constants
 */

// ============================================================================
// Retry & error handling
// ============================================================================

/**
 * Maximum number of retries for chat creation
 */
export const MAX_RETRY_COUNT = 3;

/**
 * Delay in milliseconds before retrying chat creation
 */
export const RETRY_DELAY_MS = 100;

/**
 * PostgreSQL error code for unique constraint violation
 */
export const POSTGRES_UNIQUE_CONSTRAINT_CODE = '23505';

// ============================================================================
// Participant roles
// ============================================================================

/**
 * Default participant role for chat members
 */
export const PARTICIPANT_ROLE_MEMBER = 'member';
