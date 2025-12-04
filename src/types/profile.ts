import type { ReactNode } from 'react';
import type { SUBJECT_COLORS } from '../constants/profile';

/**
 * Profile-related types and interfaces
 */

export type UserProfile = {
  id: string;
  name: string;
  email?: string;
  avatarUri?: string;
  level: number;
  subtitle?: string;
  streak: number;
  totalTime: number;
  xp: number;
  bio?: string;
  interests?: string[];
};

export type EditProfileData = {
  displayName: string;
  bio: string;
  availableTimes?: string[];
  learningStyle?: string;
  interests?: string[];
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  progress: number;
  completed: boolean;
  completedAt?: Date;
};

/**
 * Subject badge color type
 * Derived from SUBJECT_COLORS constant
 */
export type SubjectBadgeColor = (typeof SUBJECT_COLORS)[number];

export type Subject = {
  id: string;
  name: string;
  badgeColor: SubjectBadgeColor;
  progress: number;
  totalHours: number;
};

export type WeeklyActivity = {
  day: string;
  value: number;
};

export type StudyStats = {
  weeklyActivity: WeeklyActivity[];
  completedSessions: number;
  averagePerDay: string;
};

export type SettingsItem = {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
  subtitle?: string;
  rightElement?: ReactNode;
};
