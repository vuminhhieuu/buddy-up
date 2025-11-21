import type { ReactNode } from 'react';

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

export type Subject = {
  id: string;
  name: string;
  badgeColor: 'blue' | 'orange' | 'green';
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
