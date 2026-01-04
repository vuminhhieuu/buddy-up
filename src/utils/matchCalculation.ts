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
 * Priority: University > Major > Subjects > Projects > Level > Others
 * Total weight: 1.0 (100%)
 */
const WEIGHTS = {
  // Academic matching (highest priority)
  university: 0.25, // 25% - Same university is very important
  major: 0.2, // 20% - Same major is important
  subjects: 0.15, // 15% - Common subjects
  projects: 0.1, // 10% - Common projects
  level: 0.1, // 10% - Same level

  // Learning preferences
  learningGoals: 0.08, // 8% - General learning goals
  availableTimes: 0.06, // 6% - Available times
  learningStyle: 0.03, // 3% - Learning style

  // Other factors
  location: 0.015, // 1.5% - Location
  learningInterests: 0.01, // 1% - Learning interests
  streak: 0.005, // 0.5% - Streak bonus
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
  // Academic factors (highest priority)
  const universityScore = calculateUniversityScore(user1.university, user2.university);
  const majorScore = calculateMajorScore(user1.major, user2.major);
  const subjectsScore = calculateSubjectsScore(user1.current_subjects, user2.current_subjects);
  const projectsScore = calculateProjectsScore(user1.current_projects, user2.current_projects);
  const levelScore = calculateLevelScore(user1.level, user2.level);

  // Learning preferences
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

  // Other factors
  const locationScore = calculateLocationScore(user1.location, user2.location);
  const learningInterestsScore = calculateLearningInterestsScore(
    user1.learning_interests,
    user2.learning_interests,
  );
  const streakScore = calculateStreakScore(user1Progress?.streak ?? 0, user2Progress?.streak ?? 0);

  // Calculate weighted average
  const totalScore =
    universityScore * WEIGHTS.university +
    majorScore * WEIGHTS.major +
    subjectsScore * WEIGHTS.subjects +
    projectsScore * WEIGHTS.projects +
    levelScore * WEIGHTS.level +
    learningGoalsScore * WEIGHTS.learningGoals +
    availableTimesScore * WEIGHTS.availableTimes +
    learningStyleScore * WEIGHTS.learningStyle +
    locationScore * WEIGHTS.location +
    learningInterestsScore * WEIGHTS.learningInterests +
    streakScore * WEIGHTS.streak;

  // Round to nearest integer
  return Math.round(totalScore);
}

// ============================================================================
// Academic Matching Functions (NEW)
// ============================================================================

/**
 * Calculate university match score (0-100)
 * Same university = 100, different = 0
 */
function calculateUniversityScore(uni1: string | null, uni2: string | null): number {
  if (!uni1 || !uni2) return 50; // Neutral if either is null

  // Normalize for comparison (lowercase, trim)
  const normalized1 = uni1.toLowerCase().trim();
  const normalized2 = uni2.toLowerCase().trim();

  if (normalized1 === normalized2) return 100;

  // Partial match bonus (e.g., "UIT" matches "Đại học Công nghệ Thông tin")
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 80;
  }

  return 0;
}

/**
 * Calculate major match score (0-100)
 * Same major = 100, related majors = 50, different = 0
 */
function calculateMajorScore(major1: string | null, major2: string | null): number {
  if (!major1 || !major2) return 50; // Neutral if either is null

  // Normalize for comparison
  const normalized1 = major1.toLowerCase().trim();
  const normalized2 = major2.toLowerCase().trim();

  if (normalized1 === normalized2) return 100;

  // Related majors (IT-related fields)
  const itRelated = [
    'công nghệ thông tin',
    'khoa học máy tính',
    'kỹ thuật phần mềm',
    'hệ thống thông tin',
    'an toàn thông tin',
    'trí tuệ nhân tạo',
    'khoa học dữ liệu',
  ];

  const isIT1 = itRelated.some((major) => normalized1.includes(major));
  const isIT2 = itRelated.some((major) => normalized2.includes(major));

  if (isIT1 && isIT2) return 60; // Related IT majors

  // Partial match bonus
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 50;
  }

  return 0;
}

/**
 * Calculate subjects match score (0-100)
 * Based on number of common subjects
 */
function calculateSubjectsScore(subjects1: string[], subjects2: string[]): number {
  if (subjects1.length === 0 && subjects2.length === 0) return 50; // Neutral if both empty
  if (subjects1.length === 0 || subjects2.length === 0) return 0;

  // Normalize subjects for comparison
  const normalized1 = subjects1.map((s) => s.toLowerCase().trim());
  const normalized2 = subjects2.map((s) => s.toLowerCase().trim());

  const set1 = new Set(normalized1);
  const set2 = new Set(normalized2);
  let matches = 0;

  // Exact matches
  set1.forEach((subject) => {
    if (set2.has(subject)) matches++;
  });

  // Partial matches (e.g., "IE307" matches "IE307 - Phát triển ứng dụng di động")
  if (matches === 0) {
    normalized1.forEach((s1) => {
      normalized2.forEach((s2) => {
        if (s1.includes(s2) || s2.includes(s1)) {
          matches += 0.5; // Partial match counts as 0.5
        }
      });
    });
  }

  const maxSubjects = Math.max(subjects1.length, subjects2.length);
  return Math.min(100, (matches / maxSubjects) * 100);
}

/**
 * Calculate projects match score (0-100)
 * Based on number of common projects or project types
 */
function calculateProjectsScore(projects1: string[], projects2: string[]): number {
  if (projects1.length === 0 && projects2.length === 0) return 50; // Neutral if both empty
  if (projects1.length === 0 || projects2.length === 0) return 0;

  // Normalize projects for comparison
  const normalized1 = projects1.map((p) => p.toLowerCase().trim());
  const normalized2 = projects2.map((p) => p.toLowerCase().trim());

  const set1 = new Set(normalized1);
  const set2 = new Set(normalized2);
  let matches = 0;

  // Exact matches
  set1.forEach((project) => {
    if (set2.has(project)) matches++;
  });

  // Partial matches (e.g., both have "đồ án tốt nghiệp")
  // Only check if no exact matches found, and track which pairs we've already counted
  if (matches === 0) {
    const countedPairs = new Set<string>();
    const projectTypes = ['đồ án', 'dự án', 'hackathon', 'nghiên cứu'];

    normalized1.forEach((p1, idx1) => {
      normalized2.forEach((p2, idx2) => {
        const pairKey = `${idx1}-${idx2}`;
        if (countedPairs.has(pairKey)) return;

        // Check for common project types
        const hasCommonType = projectTypes.some((type) => p1.includes(type) && p2.includes(type));
        if (hasCommonType) {
          matches += 0.3; // Common type counts as 0.3
          countedPairs.add(pairKey);
        }
      });
    });
  }

  const maxProjects = Math.max(projects1.length, projects2.length);
  return Math.min(100, (matches / maxProjects) * 100);
}

// ============================================================================
// Existing Matching Functions
// ============================================================================

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
    | 'university'
    | 'major'
    | 'subject'
    | 'project'
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

  // ============================================================================
  // Academic Common Points (HIGHEST PRIORITY)
  // ============================================================================

  // Same university
  if (user1.university && user2.university) {
    const normalized1 = user1.university.toLowerCase().trim();
    const normalized2 = user2.university.toLowerCase().trim();
    if (normalized1 === normalized2) {
      points.push({
        type: 'university',
        label: `Cùng trường ${user1.university}`,
        icon: '🏫',
        value: user1.university,
      });
    }
  }

  // Same major
  if (user1.major && user2.major) {
    const normalized1 = user1.major.toLowerCase().trim();
    const normalized2 = user2.major.toLowerCase().trim();
    if (normalized1 === normalized2) {
      points.push({
        type: 'major',
        label: `Cùng ngành ${user1.major}`,
        icon: '📚',
        value: user1.major,
      });
    }
  }

  // Common subjects
  if (user1.current_subjects.length > 0 && user2.current_subjects.length > 0) {
    const normalized1 = user1.current_subjects.map((s) => s.toLowerCase().trim());
    const normalized2 = user2.current_subjects.map((s) => s.toLowerCase().trim());

    user1.current_subjects.forEach((subject, index) => {
      const normalizedSubject = normalized1[index];
      if (normalized2.includes(normalizedSubject)) {
        points.push({
          type: 'subject',
          label: `Cùng học ${subject}`,
          icon: '📖',
          value: subject,
        });
      }
    });
  }

  // Common projects
  if (user1.current_projects.length > 0 && user2.current_projects.length > 0) {
    const normalized1 = user1.current_projects.map((p) => p.toLowerCase().trim());
    const normalized2 = user2.current_projects.map((p) => p.toLowerCase().trim());

    user1.current_projects.forEach((project, index) => {
      const normalizedProject = normalized1[index];
      if (normalized2.includes(normalizedProject)) {
        points.push({
          type: 'project',
          label: `Cùng làm ${project}`,
          icon: '💼',
          value: project,
        });
      }
    });
  }

  // ============================================================================
  // Learning Common Points
  // ============================================================================

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
