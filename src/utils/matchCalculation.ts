/**
 * Match Calculation Utilities
 * Functions to calculate match percentage and common points between two users
 */

import type {
  BuddyProfile,
  LearningGoal,
  AvailableTime,
  LearningStyle,
  Level,
} from '../types/buddy';

/**
 * User progress data for match calculation
 */
export interface UserProgress {
  streak: number;
}

/**
 * Match calculation weights
 */
const WEIGHTS = {
  learningGoals: 0.3, // 30%
  availableTimes: 0.25, // 25%
  learningStyle: 0.2, // 20%
  level: 0.15, // 15%
  location: 0.05, // 5%
  learningInterests: 0.03, // 3%
  streak: 0.02, // 2% (bonus if both > 7)
} as const;

/**
 * Calculate match percentage between two users
 * @param user1 - First user's profile
 * @param user2 - Second user's profile
 * @param user1Progress - First user's progress (streak)
 * @param user2Progress - Second user's progress (streak)
 * @returns Match percentage (0-100)
 */
export function calculateMatchPercentage(
  user1: BuddyProfile,
  user2: BuddyProfile,
  user1Progress?: UserProgress,
  user2Progress?: UserProgress,
): number {
  // Calculate score for each factor
  const learningGoalsScore = calculateLearningGoalsScore(
    user1.learning_goals,
    user2.learning_goals,
  );
  const availableTimesScore = calculateAvailableTimesScore(
    user1.available_times,
    user2.available_times,
  );
  const learningStyleScore = calculateLearningStyleScore(
    user1.learning_style,
    user2.learning_style,
  );
  const levelScore = calculateLevelScore(user1.level, user2.level);
  const locationScore = calculateLocationScore(user1.location, user2.location);
  const learningInterestsScore = calculateLearningInterestsScore(
    user1.learning_interests,
    user2.learning_interests,
  );
  const streakScore = calculateStreakScore(user1Progress?.streak ?? 0, user2Progress?.streak ?? 0);

  // Calculate weighted average
  const totalScore =
    learningGoalsScore * WEIGHTS.learningGoals +
    availableTimesScore * WEIGHTS.availableTimes +
    learningStyleScore * WEIGHTS.learningStyle +
    levelScore * WEIGHTS.level +
    locationScore * WEIGHTS.location +
    learningInterestsScore * WEIGHTS.learningInterests +
    streakScore * WEIGHTS.streak;

  // Round to nearest integer
  return Math.round(totalScore);
}

/**
 * Calculate learning goals match score (0-100)
 */
function calculateLearningGoalsScore(goals1: LearningGoal[], goals2: LearningGoal[]): number {
  if (goals1.length === 0 && goals2.length === 0) return 50; // Neutral if both empty
  if (goals1.length === 0 || goals2.length === 0) return 0;

  const set1 = new Set(goals1);
  const set2 = new Set(goals2);
  let matches = 0;

  set1.forEach((goal) => {
    if (set2.has(goal)) matches++;
  });

  const maxGoals = Math.max(goals1.length, goals2.length);
  return (matches / maxGoals) * 100;
}

/**
 * Calculate available times match score (0-100)
 */
function calculateAvailableTimesScore(times1: AvailableTime[], times2: AvailableTime[]): number {
  if (times1.length === 0 && times2.length === 0) return 50; // Neutral if both empty
  if (times1.length === 0 || times2.length === 0) return 0;

  const set1 = new Set(times1);
  const set2 = new Set(times2);
  let matches = 0;

  set1.forEach((time) => {
    if (set2.has(time)) matches++;
  });

  const maxTimes = Math.max(times1.length, times2.length);
  return (matches / maxTimes) * 100;
}

/**
 * Calculate learning style match score (0-100)
 */
function calculateLearningStyleScore(
  style1: LearningStyle | null,
  style2: LearningStyle | null,
): number {
  if (!style1 || !style2) return 50; // Neutral if either is null
  if (style1 === style2) return 100;
  return 0;
}

/**
 * Calculate level match score (0-100)
 * - Same level: 100
 * - Adjacent levels (beginner-intermediate, intermediate-advanced): 50
 * - Far apart (beginner-advanced): 0
 */
function calculateLevelScore(level1: Level | null, level2: Level | null): number {
  if (!level1 || !level2) return 50; // Neutral if either is null
  if (level1 === level2) return 100;

  const levels: Level[] = ['beginner', 'intermediate', 'advanced'];
  const index1 = levels.indexOf(level1);
  const index2 = levels.indexOf(level2);

  if (index1 === -1 || index2 === -1) return 50; // Unknown level

  const diff = Math.abs(index1 - index2);
  if (diff === 1) return 50; // Adjacent
  return 0; // Far apart
}

/**
 * Calculate location match score (0-100)
 */
function calculateLocationScore(location1: string | null, location2: string | null): number {
  if (!location1 || !location2) return 50; // Neutral if either is null
  if (location1 === location2) return 100;
  return 0;
}

/**
 * Calculate learning interests match score (0-100)
 */
function calculateLearningInterestsScore(interests1: string[], interests2: string[]): number {
  if (interests1.length === 0 && interests2.length === 0) return 50; // Neutral if both empty
  if (interests1.length === 0 || interests2.length === 0) return 0;

  const set1 = new Set(interests1);
  const set2 = new Set(interests2);
  let matches = 0;

  set1.forEach((interest) => {
    if (set2.has(interest)) matches++;
  });

  const maxInterests = Math.max(interests1.length, interests2.length);
  return (matches / maxInterests) * 100;
}

/**
 * Calculate streak match score (0-100)
 * Bonus if both users have streak > 7
 */
function calculateStreakScore(streak1: number, streak2: number): number {
  if (streak1 > 7 && streak2 > 7) return 100;
  return 0;
}

/**
 * Common point type for display
 */
export interface CommonPoint {
  type:
    | 'learning_goal'
    | 'available_time'
    | 'learning_style'
    | 'location'
    | 'streak'
    | 'schedule_overlap';
  label: string;
  icon?: string;
  value: string;
}

/**
 * Get common points between two users
 * @param user1 - First user's profile
 * @param user2 - Second user's profile
 * @param user1Progress - First user's progress (streak)
 * @param user2Progress - Second user's progress (streak)
 * @returns Array of common points
 */
export function getCommonPoints(
  user1: BuddyProfile,
  user2: BuddyProfile,
  user1Progress?: UserProgress,
  user2Progress?: UserProgress,
): CommonPoint[] {
  const points: CommonPoint[] = [];

  // Common learning goals
  const commonGoals = user1.learning_goals.filter((goal) => user2.learning_goals.includes(goal));
  commonGoals.forEach((goal) => {
    points.push({
      type: 'learning_goal',
      label: goal,
      icon: '🎯',
      value: goal,
    });
  });

  // Common available times
  const commonTimes = user1.available_times.filter((time) => user2.available_times.includes(time));
  commonTimes.forEach((time) => {
    const timeLabels: Record<AvailableTime, string> = {
      morning: 'Buổi sáng',
      afternoon: 'Buổi chiều',
      evening: 'Buổi tối',
      late_night: 'Đêm khuya',
      weekend: 'Cuối tuần',
      flexible: 'Linh hoạt',
    };
    const timeIcons: Record<AvailableTime, string> = {
      morning: '🌅',
      afternoon: '☀️',
      evening: '🌆',
      late_night: '🌙',
      weekend: '📅',
      flexible: '🕐',
    };
    points.push({
      type: 'available_time',
      label: timeLabels[time] || time,
      icon: timeIcons[time] || '🕐',
      value: time,
    });
  });

  // Same learning style
  if (
    user1.learning_style &&
    user2.learning_style &&
    user1.learning_style === user2.learning_style
  ) {
    const styleLabels: Record<LearningStyle, string> = {
      serious: 'Nghiêm túc',
      relaxed: 'Thoải mái',
      balanced: 'Cân bằng',
      not_important: 'Không quan trọng',
    };
    points.push({
      type: 'learning_style',
      label: 'Cùng phong cách',
      icon: '📄',
      value: styleLabels[user1.learning_style] || user1.learning_style,
    });
  }

  // Same location
  if (user1.location && user2.location && user1.location === user2.location) {
    points.push({
      type: 'location',
      label: `Cùng ở ${user1.location}`,
      icon: '📍',
      value: user1.location,
    });
  }

  // Both have streak > 7
  const streak1 = user1Progress?.streak ?? 0;
  const streak2 = user2Progress?.streak ?? 0;
  if (streak1 > 7 && streak2 > 7) {
    points.push({
      type: 'streak',
      label: 'Cả hai có streak >7 ngày',
      icon: '🔥',
      value: `${streak1} và ${streak2} ngày`,
    });
  }

  // Schedule overlap feature temporarily disabled
  // TODO: Implement proper time parsing logic to calculate actual overlap hours
  // For now, we skip this feature to avoid showing inaccurate data
  // const overlapCount = calculateScheduleOverlap(
  //   user1.available_times_detail,
  //   user2.available_times_detail,
  // );
  // if (overlapCount > 0) {
  //   points.push({
  //     type: 'schedule_overlap',
  //     label: `${overlapCount}h trùng lịch`,
  //     icon: '🕐',
  //     value: `${overlapCount}h`,
  //   });
  // }

  return points;
}
