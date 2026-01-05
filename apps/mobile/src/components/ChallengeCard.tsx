import { View, Text, StyleSheet } from 'react-native';

interface ChallengeCardProps {
  title: string;
  description: string;
  progress: number;
  xpReward: number;
  endsAt: string;
}

export function ChallengeCard({ title, description, progress, xpReward, endsAt }: ChallengeCardProps) {
  const daysLeft = Math.ceil((new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>+{xpReward} XP</Text>
        </View>
        <Text style={styles.timeLeft}>
          {daysLeft > 0 ? `${daysLeft}d left` : 'Ends today'}
        </Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginRight: 12,
    width: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  timeLeft: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
    width: 35,
    textAlign: 'right',
  },
});
