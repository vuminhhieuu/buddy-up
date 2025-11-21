/**
 * Animation configuration constants
 * Used for Reanimated spring animations
 */

import type { WithSpringConfig } from 'react-native-reanimated';

/**
 * Thresholds for spring animation rest conditions (in pixels)
 */
export const REST_DISPLACEMENT_THRESHOLD_PX = 0.5;
export const REST_SPEED_THRESHOLD_PX = 0.5;
export const REST_DISPLACEMENT_THRESHOLD_SWIPE_OUT_PX = 1;
export const REST_SPEED_THRESHOLD_SWIPE_OUT_PX = 1;

/**
 * Spring config for resetting card position after incomplete swipe
 * restDisplacementThreshold and restSpeedThreshold are in pixels
 */
export const SPRING_RESET_CONFIG: WithSpringConfig = {
  damping: 16,
  stiffness: 180,
  mass: 0.7,
  restDisplacementThreshold: REST_DISPLACEMENT_THRESHOLD_PX,
  restSpeedThreshold: REST_SPEED_THRESHOLD_PX,
};
/**
 * Spring config for swiping card out of view
 * restDisplacementThreshold and restSpeedThreshold are in pixels
 */
export const SPRING_SWIPE_OUT_CONFIG: WithSpringConfig = {
  damping: 18,
  stiffness: 150,
  mass: 0.85,
  restDisplacementThreshold: REST_DISPLACEMENT_THRESHOLD_SWIPE_OUT_PX,
  restSpeedThreshold: REST_SPEED_THRESHOLD_SWIPE_OUT_PX,
};
