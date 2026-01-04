import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning!</Text>
        <Text style={styles.subtitle}>Here's your weekly summary</Text>
      </View>

      {/* Weekly Review Card */}
      <TouchableOpacity style={styles.reviewCard} onPress={() => router.push('/review')}>
        <Text style={styles.cardTitle}>Weekly Review Ready</Text>
        <Text style={styles.cardDescription}>
          You've saved $38 on delivery this week. Tap to review and confirm your investment.
        </Text>
        <View style={styles.cardAction}>
          <Text style={styles.cardActionText}>Review Now</Text>
        </View>
      </TouchableOpacity>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>$234</Text>
          <Text style={styles.statLabel}>Total Invested</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Week Streak</Text>
        </View>
      </View>

      {/* Active Rules */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Rules</Text>
        <View style={styles.ruleCard}>
          <View style={styles.ruleInfo}>
            <Text style={styles.ruleName}>Food Delivery</Text>
            <Text style={styles.ruleTarget}>Target: $50/week</Text>
          </View>
          <View style={styles.ruleStatus}>
            <Text style={styles.ruleStatusText}>$12 spent</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: '#4F46E5',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#E0E7FF',
    lineHeight: 20,
  },
  cardAction: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cardActionText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  ruleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleInfo: {},
  ruleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  ruleTarget: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  ruleStatus: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ruleStatusText: {
    color: '#059669',
    fontWeight: '500',
    fontSize: 14,
  },
});
