/**
 * Application configuration
 * Centralized app metadata and configuration
 */

// ============================================================================
// App Metadata
// ============================================================================

/**
 * Application name
 */
export const APP_NAME = 'buddy-up';

/**
 * Application display name (shown to users)
 */
export const APP_DISPLAY_NAME = 'Buddy Up';

/**
 * Application version
 */
export const APP_VERSION = '1.0.0';

/**
 * Application slug (used for Expo)
 */
export const APP_SLUG = 'buddy-up';

// ============================================================================
// Bundle Identifiers
// ============================================================================

/**
 * iOS bundle identifier
 */
export const IOS_BUNDLE_IDENTIFIER = 'com.anonymous.buddyup';

/**
 * Android package name
 */
export const ANDROID_PACKAGE_NAME = 'com.anonymous.buddyup';

// ============================================================================
// App Configuration
// ============================================================================

/**
 * App orientation
 */
export const APP_ORIENTATION = 'portrait' as const;

/**
 * User interface style
 */
export const USER_INTERFACE_STYLE = 'light' as const;

// ============================================================================
// Feature Flags (if needed in the future)
// ============================================================================

/**
 * Enable new architecture (React Native)
 */
export const NEW_ARCH_ENABLED = true;

/**
 * Enable edge-to-edge on Android
 */
export const ANDROID_EDGE_TO_EDGE_ENABLED = true;

/**
 * Enable predictive back gesture on Android
 */
export const ANDROID_PREDICTIVE_BACK_GESTURE_ENABLED = false;

/**
 * iOS supports tablet
 */
export const IOS_SUPPORTS_TABLET = true;
