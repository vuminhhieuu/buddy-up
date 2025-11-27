export const STORAGE_KEYS = {
  onboardingStatus: '@buddy_up:has_seen_onboarding',
  language: '@buddy_up:language',
  buddySwipeHint: 'buddy_swipe_hint_seen',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
