import { View, Text, StyleSheet } from 'react-native';

interface XPProgressBarProps {
  currentXP: number;
  neededXP: number;
  progress: number;
  level: number;
}

export function XPProgressBar({ currentXP, neededXP, progress, level }: XPProgressBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.xpText}>{currentXP} / {neededXP} XP</Text>
        <Text style={styles.nextLevel}>Level {level + 1}</Text>
      </View>
      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  nextLevel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  barContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
});
