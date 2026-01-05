import { View, Text, StyleSheet } from 'react-native';

interface AchievementBadgeProps {
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export function AchievementBadge({ icon, title, description, unlocked, unlockedAt }: AchievementBadgeProps) {
  return (
    <View style={[styles.container, !unlocked && styles.locked]}>
      <View style={[styles.iconContainer, !unlocked && styles.iconLocked]}>
        <Text style={styles.icon}>{unlocked ? icon : '🔒'}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !unlocked && styles.textLocked]}>{title}</Text>
        <Text style={[styles.description, !unlocked && styles.textLocked]}>{description}</Text>
        {unlocked && unlockedAt && (
          <Text style={styles.date}>
            Unlocked {new Date(unlockedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locked: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconLocked: {
    backgroundColor: '#F3F4F6',
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
  },
  textLocked: {
    color: '#9CA3AF',
  },
  date: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
