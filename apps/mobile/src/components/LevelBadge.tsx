import { View, Text, StyleSheet } from 'react-native';

interface LevelBadgeProps {
  level: number;
  title: string;
  size?: 'small' | 'medium' | 'large';
}

const LEVEL_COLORS = [
  '#9CA3AF', // Level 1 - Gray
  '#10B981', // Level 2 - Green
  '#3B82F6', // Level 3 - Blue
  '#8B5CF6', // Level 4 - Purple
  '#F59E0B', // Level 5 - Amber
  '#EF4444', // Level 6 - Red
  '#EC4899', // Level 7 - Pink
  '#14B8A6', // Level 8 - Teal
  '#F97316', // Level 9 - Orange
  '#FBBF24', // Level 10 - Gold
];

export function LevelBadge({ level, title, size = 'medium' }: LevelBadgeProps) {
  const color = LEVEL_COLORS[Math.min(level - 1, LEVEL_COLORS.length - 1)];

  const sizeStyles = {
    small: { badge: styles.badgeSmall, level: styles.levelSmall, title: styles.titleSmall },
    medium: { badge: styles.badgeMedium, level: styles.levelMedium, title: styles.titleMedium },
    large: { badge: styles.badgeLarge, level: styles.levelLarge, title: styles.titleLarge },
  };

  return (
    <View style={[styles.container, sizeStyles[size].badge, { borderColor: color }]}>
      <Text style={[sizeStyles[size].level, { color }]}>LVL {level}</Text>
      <Text style={sizeStyles[size].title} numberOfLines={1}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  levelSmall: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  levelMedium: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  levelLarge: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleSmall: {
    fontSize: 9,
    color: '#6B7280',
  },
  titleMedium: {
    fontSize: 11,
    color: '#6B7280',
  },
  titleLarge: {
    fontSize: 13,
    color: '#6B7280',
  },
});
