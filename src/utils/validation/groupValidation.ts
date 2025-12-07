/**
 * Group Validation Schemas
 * Validation schemas for group creation and management
 */

import * as Yup from 'yup';
import { VALIDATION_MESSAGES } from '../../constants/validation';

/**
 * Validation constants for groups
 */
export const GROUP_NAME_MIN_LENGTH = 3;
export const GROUP_NAME_MAX_LENGTH = 100;
export const GROUP_DESCRIPTION_MIN_LENGTH = 10;
export const GROUP_DESCRIPTION_MAX_LENGTH = 500;
export const GROUP_TOPICS_MIN_COUNT = 1;
export const GROUP_TOPICS_MAX_COUNT = 3;
export const GROUP_SLUG_MIN_LENGTH = 3;
export const GROUP_SLUG_MAX_LENGTH = 50;
export const GROUP_RULE_MIN_LENGTH = 5;
export const GROUP_RULE_MAX_LENGTH = 200;
export const GROUP_RULES_MAX_COUNT = 10;

/**
 * Step 1: Basic Info Schema
 * Validates group name, description, cover image, and icon
 */
export const groupStep1Schema = Yup.object().shape({
  name: Yup.string()
    .min(GROUP_NAME_MIN_LENGTH, VALIDATION_MESSAGES.groupNameMin)
    .max(GROUP_NAME_MAX_LENGTH, VALIDATION_MESSAGES.groupNameMax)
    .required(VALIDATION_MESSAGES.groupNameRequired),
  description: Yup.string()
    .min(GROUP_DESCRIPTION_MIN_LENGTH, VALIDATION_MESSAGES.groupDescriptionMin)
    .max(GROUP_DESCRIPTION_MAX_LENGTH, VALIDATION_MESSAGES.groupDescriptionMax)
    .required(VALIDATION_MESSAGES.groupDescriptionRequired),
  cover_image_url: Yup.string().nullable().optional(),
  icon_emoji: Yup.string().nullable().optional(),
});

/**
 * Step 2: Topics & Fields Schema
 * Validates topics, student level, language, and activity frequency
 */
export const groupStep2Schema = Yup.object().shape({
  topics: Yup.array()
    .of(Yup.string())
    .min(GROUP_TOPICS_MIN_COUNT, VALIDATION_MESSAGES.groupTopicsMin)
    .max(GROUP_TOPICS_MAX_COUNT, VALIDATION_MESSAGES.groupTopicsMax)
    .required(VALIDATION_MESSAGES.groupTopicsRequired),
  student_level: Yup.string()
    .oneOf(
      ['all', 'beginner', 'intermediate', 'advanced'],
      VALIDATION_MESSAGES.groupStudentLevelInvalid,
    )
    .required(VALIDATION_MESSAGES.groupStudentLevelRequired),
  expected_activity_frequency: Yup.string()
    .oneOf(
      ['daily', 'few_times_week', 'weekly', 'flexible'],
      VALIDATION_MESSAGES.groupActivityFrequencyInvalid,
    )
    .required(VALIDATION_MESSAGES.groupActivityFrequencyRequired),
});

/**
 * Step 3: Rules & Settings Schema
 * Validates rules, settings, and slug
 */
export const groupStep3Schema = Yup.object().shape({
  slug: Yup.string()
    .matches(/^[a-z0-9-]+$/, VALIDATION_MESSAGES.groupSlugFormat)
    .min(GROUP_SLUG_MIN_LENGTH, VALIDATION_MESSAGES.groupSlugMin)
    .max(GROUP_SLUG_MAX_LENGTH, VALIDATION_MESSAGES.groupSlugMax)
    .required(VALIDATION_MESSAGES.groupSlugRequired),
  rules: Yup.array()
    .of(
      Yup.string()
        .min(GROUP_RULE_MIN_LENGTH, VALIDATION_MESSAGES.groupRuleMin)
        .max(GROUP_RULE_MAX_LENGTH, VALIDATION_MESSAGES.groupRuleMax),
    )
    .max(GROUP_RULES_MAX_COUNT, VALIDATION_MESSAGES.groupRulesMax)
    .optional()
    .default([]),
  requires_approval: Yup.boolean().default(false),
  posting_permission: Yup.string()
    .oneOf(
      ['all_members', 'admin_moderator_only'],
      VALIDATION_MESSAGES.groupPostingPermissionInvalid,
    )
    .required(VALIDATION_MESSAGES.groupPostingPermissionRequired),
});

/**
 * Step 4: Preview & Invite Schema
 * Validates invited friends (optional)
 */
export const groupStep4Schema = Yup.object().shape({
  invited_friend_ids: Yup.array().of(Yup.string().uuid()).optional(),
});

/**
 * Complete group creation schema
 * Combines all steps
 */
export const createPublicGroupSchema = groupStep1Schema
  .concat(groupStep2Schema)
  .concat(groupStep3Schema)
  .concat(groupStep4Schema);

/**
 * Group rule validation schema
 */
export const groupRuleSchema = Yup.object().shape({
  rule_text: Yup.string()
    .min(GROUP_RULE_MIN_LENGTH, VALIDATION_MESSAGES.groupRuleMin)
    .max(GROUP_RULE_MAX_LENGTH, VALIDATION_MESSAGES.groupRuleMax)
    .required(VALIDATION_MESSAGES.groupRuleRequired),
});
