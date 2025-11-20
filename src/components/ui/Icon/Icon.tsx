import React from 'react';
import type { ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';
import {
  Home,
  Users,
  MessageCircle,
  User,
  Bell,
  Calendar,
  Plus,
  Search,
  Trophy,
  Flame,
  BookOpen,
  ChartLine,
  Settings,
  UserCog,
  Lock,
  Globe,
  HelpCircle,
  LogOut,
  Pencil,
  ChevronRight,
  Star,
  type LucideIcon,
} from 'lucide-react-native';

export type IconName =
  | 'home'
  | 'buddy'
  | 'chat'
  | 'profile'
  | 'bell'
  | 'calendar'
  | 'plus'
  | 'search'
  | 'trophy'
  | 'flame'
  | 'book'
  | 'chart'
  | 'settings'
  | 'userEdit'
  | 'lock'
  | 'globe'
  | 'help'
  | 'logout'
  | 'pencil'
  | 'chevronRight'
  | 'star';

const NAME_TO_ICON: Record<IconName, LucideIcon> = {
  home: Home,
  buddy: Users,
  chat: MessageCircle,
  profile: User,
  bell: Bell,
  calendar: Calendar,
  plus: Plus,
  search: Search,
  trophy: Trophy,
  flame: Flame,
  book: BookOpen,
  chart: ChartLine,
  settings: Settings,
  userEdit: UserCog,
  lock: Lock,
  globe: Globe,
  help: HelpCircle,
  logout: LogOut,
  pencil: Pencil,
  chevronRight: ChevronRight,
  star: Star,
};

export type IconProps = {
  name: IconName;
  size?: number; // defaults to 24
  color?: string; // defaults to text primary
  strokeWidth?: number; // defaults to 2
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export const Icon: React.FC<IconProps> = ({
  name,
  size,
  color,
  strokeWidth = 2,
  style,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const resolvedSize = size ?? theme.sizes.icon.lg;
  const resolvedColor = color ?? theme.colors.text.primary;
  const Cmp = NAME_TO_ICON[name];
  return (
    <Cmp
      accessibilityLabel={accessibilityLabel || name}
      color={resolvedColor}
      size={resolvedSize}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
};
