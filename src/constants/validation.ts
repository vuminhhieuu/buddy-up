/**
 * Validation rules constants
 * Centralized validation rules for forms and inputs
 */

// ============================================================================
// Display Name Validation
// ============================================================================

/**
 * Minimum length for display name
 */
export const DISPLAY_NAME_MIN_LENGTH = 2;

/**
 * Maximum length for display name
 */
export const DISPLAY_NAME_MAX_LENGTH = 50;

// ============================================================================
// Email Validation
// ============================================================================

/**
 * Email validation is handled by Yup's built-in email() validator
 * No custom constants needed, but we can add custom regex if needed
 */

// ============================================================================
// Password Validation
// ============================================================================

/**
 * Minimum length for password
 */
export const PASSWORD_MIN_LENGTH = 6;

/**
 * Maximum length for password
 */
export const PASSWORD_MAX_LENGTH = 128;

// ============================================================================
// Study Goal Validation
// ============================================================================

/**
 * Minimum length for study goal
 */
export const STUDY_GOAL_MIN_LENGTH = 2;

/**
 * Maximum length for study goal
 */
export const STUDY_GOAL_MAX_LENGTH = 200;

// ============================================================================
// Available Times Validation
// ============================================================================

/**
 * Minimum number of available times required
 */
export const AVAILABLE_TIMES_MIN_COUNT = 1;

// ============================================================================
// Learning Style Validation
// ============================================================================

/**
 * Learning style is required (no min/max needed as it's a selection)
 */

// ============================================================================
// Validation Messages (i18n keys)
// ============================================================================

/**
 * i18n translation keys for validation error messages
 * These keys should exist in the i18n translation files
 */
export const VALIDATION_MESSAGES = {
  // Auth namespace
  required: 'auth:required',
  invalidEmail: 'auth:invalidEmail',
  nameMin: 'auth:nameMin',
  passwordMin: 'auth:passwordMin',
  passwordMismatch: 'auth:passwordMismatch',

  // Profile Setup namespace
  displayNameMin: 'common:profileSetup.displayNameMin',
  displayNameMax: 'common:profileSetup.displayNameMax',
  displayNameRequired: 'common:profileSetup.displayNameRequired',
  studyGoalMin: 'common:profileSetup.studyGoalMin',
  studyGoalMax: 'common:profileSetup.studyGoalMax',
  studyGoalRequired: 'common:profileSetup.studyGoalRequired',
  availableTimesRequired: 'common:profileSetup.availableTimesRequired',
  learningStyleRequired: 'common:profileSetup.learningStyleRequired',

  // Groups namespace
  groupNameMin: 'groups:validation.nameMin',
  groupNameMax: 'groups:validation.nameMax',
  groupNameRequired: 'groups:validation.nameRequired',
  groupDescriptionMin: 'groups:validation.descriptionMin',
  groupDescriptionMax: 'groups:validation.descriptionMax',
  groupDescriptionRequired: 'groups:validation.descriptionRequired',
  groupTopicsMin: 'groups:validation.topicsMin',
  groupTopicsMax: 'groups:validation.topicsMax',
  groupTopicsRequired: 'groups:validation.topicsRequired',
  groupStudentLevelRequired: 'groups:validation.studentLevelRequired',
  groupStudentLevelInvalid: 'groups:validation.studentLevelInvalid',
  groupActivityFrequencyRequired: 'groups:validation.activityFrequencyRequired',
  groupActivityFrequencyInvalid: 'groups:validation.activityFrequencyInvalid',
  groupSlugFormat: 'groups:validation.slugFormat',
  groupSlugMin: 'groups:validation.slugMin',
  groupSlugMax: 'groups:validation.slugMax',
  groupSlugRequired: 'groups:validation.slugRequired',
  groupRuleMin: 'groups:validation.ruleMin',
  groupRuleMax: 'groups:validation.ruleMax',
  groupRuleRequired: 'groups:validation.ruleRequired',
  groupRulesMax: 'groups:validation.rulesMax',
  groupPostingPermissionRequired: 'groups:validation.postingPermissionRequired',
  groupPostingPermissionInvalid: 'groups:validation.postingPermissionInvalid',
} as const;
