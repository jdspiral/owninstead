import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_LABELS } from '@owninstead/shared';
import { apiClient } from '@/services/api/client';
import { LevelBadge, XPProgressBar, ChallengeCard } from '@/components';

interface Rule {
  id: string;
  category: string;
  target_spend: number;
  period: string;
  active: boolean;
}

interface Profile {
  selected_asset: string;
  max_per_trade: number;
  max_per_month: number;
  plaidConnected: boolean;
  snaptradeConnected: boolean;
}

interface PendingData {
  totalPending: number;
  count: number;
}

interface WeekProgress {
  ruleId: string;
  category: string;
  targetSpend: number;
  currentSpend: number;
  projectedInvest: number;
  onTrack: boolean;
}

interface GamificationStats {
  xp: number;
  level: number;
  totalInvested: number;
  totalSaved: number;
  levelTitle: string;
  nextLevelProgress: {
    current: number;
    needed: number;
    progress: number;
  };
  achievementCount: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  xpReward: number;
  endsAt: string;
}

export default function DashboardScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [pendingData, setPendingData] = useState<PendingData | null>(null);
  const [weekProgress, setWeekProgress] = useState<WeekProgress[]>([]);
  const [gamificationStats, setGamificationStats] = useState<GamificationStats | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 18) return 'Good afternoon!';
    return 'Good evening!';
  };

  const fetchData = async () => {
    try {
      // Fetch core data that's essential for the dashboard
      const [profileRes, rulesRes, pendingRes, previewRes] = await Promise.all([
        apiClient.get('/profile'),
        apiClient.get('/rules'),
        apiClient.get('/evaluations/pending'),
        apiClient.get('/evaluations/preview'),
      ]);
      setProfile(profileRes.data?.data);
      setRules((rulesRes.data?.data || []).filter((r: Rule) => r.active));
      setPendingData(pendingRes.data?.data);
      setWeekProgress(previewRes.data?.data?.rules || []);

      // Fetch gamification data separately so failures don't break dashboard
      try {
        const [statsRes, challengesRes] = await Promise.all([
          apiClient.get('/gamification/stats'),
          apiClient.get('/gamification/challenges'),
        ]);
        setGamificationStats(statsRes.data?.data);
        setChallenges(challengesRes.data?.data || []);
      } catch (gamificationError) {
        console.log('Gamification data not available yet');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const needsSetup = !profile?.plaidConnected || !profile?.snaptradeConnected;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.subtitle}>
          {rules.length > 0
            ? `You have ${rules.length} active rule${rules.length > 1 ? 's' : ''}`
            : 'Set up your first spending rule'}
        </Text>
      </View>

      {/* Pending Evaluations Banner */}
      {pendingData && pendingData.count > 0 && (
        <TouchableOpacity
          style={styles.reviewCard}
          onPress={() => router.push('/review')}
        >
          <View style={styles.reviewIconContainer}>
            <Ionicons name="wallet" size={24} color="#fff" />
          </View>
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewTitle}>Weekly Review Ready</Text>
            <Text style={styles.reviewDesc}>
              ${pendingData.totalPending.toFixed(2)} ready to invest
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#4F46E5" />
        </TouchableOpacity>
      )}

      {/* Setup Prompts */}
      {needsSetup && (
        <View style={styles.setupCard}>
          <Ionicons name="construct" size={24} color="#4F46E5" />
          <View style={styles.setupInfo}>
            <Text style={styles.setupTitle}>Complete Your Setup</Text>
            <Text style={styles.setupDesc}>
              {!profile?.plaidConnected && !profile?.snaptradeConnected
                ? 'Connect your bank and brokerage to start'
                : !profile?.plaidConnected
                ? 'Connect your bank to track spending'
                : 'Connect your brokerage to invest'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.setupButton}
            onPress={() => router.push(
              !profile?.plaidConnected
                ? '/(onboarding)/connect-bank'
                : '/(onboarding)/connect-brokerage'
            )}
          >
            <Text style={styles.setupButtonText}>Set Up</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Level & Progress */}
      {gamificationStats && (
        <View style={styles.levelSection}>
          <View style={styles.levelHeader}>
            <LevelBadge
              level={gamificationStats.level}
              title={gamificationStats.levelTitle}
              size="large"
            />
            <TouchableOpacity
              style={styles.achievementsButton}
              onPress={() => router.push('/achievements')}
            >
              <Ionicons name="trophy" size={18} color="#4F46E5" />
              <Text style={styles.achievementsButtonText}>Achievements</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.xpContainer}>
            <XPProgressBar
              currentXP={gamificationStats.nextLevelProgress.current}
              neededXP={gamificationStats.nextLevelProgress.needed}
              progress={gamificationStats.nextLevelProgress.progress}
              level={gamificationStats.level}
            />
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color="#059669" />
          <Text style={styles.statValue}>
            ${gamificationStats?.totalInvested?.toFixed(0) || '0'}
          </Text>
          <Text style={styles.statLabel}>Total Invested</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="flash" size={24} color="#4F46E5" />
          <Text style={styles.statValue}>
            {gamificationStats?.xp?.toLocaleString() || '0'}
          </Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
      </View>

      {/* Active Challenges */}
      {challenges.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Challenges</Text>
          </View>
          <FlatList
            horizontal
            data={challenges}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <ChallengeCard
                title={item.title}
                description={item.description}
                progress={Math.min((item.currentValue / item.targetValue) * 100, 100)}
                xpReward={item.xpReward}
                endsAt={item.endsAt}
              />
            )}
          />
        </View>
      )}

      {/* This Week's Progress */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/rules')}>
            <Text style={styles.seeAllText}>Manage Rules</Text>
          </TouchableOpacity>
        </View>

        {weekProgress.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyRulesCard}
            onPress={() => router.push('/create-rule')}
          >
            <Ionicons name="add-circle-outline" size={32} color="#4F46E5" />
            <Text style={styles.emptyRulesTitle}>Create Your First Rule</Text>
            <Text style={styles.emptyRulesDesc}>
              Choose a category and set a spending target
            </Text>
          </TouchableOpacity>
        ) : (
          weekProgress.map((progress) => {
            const percentUsed = Math.min((progress.currentSpend / progress.targetSpend) * 100, 100);
            const remaining = Math.max(progress.targetSpend - progress.currentSpend, 0);

            return (
              <View key={progress.ruleId} style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressCategory}>
                    {CATEGORY_LABELS[progress.category] || progress.category}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    progress.onTrack ? styles.statusOnTrack : styles.statusOver
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      progress.onTrack ? styles.statusOnTrackText : styles.statusOverText
                    ]}>
                      {progress.onTrack ? 'On Track' : 'Over Budget'}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${percentUsed}%` },
                      progress.onTrack ? styles.progressBarGreen : styles.progressBarRed
                    ]}
                  />
                </View>

                <View style={styles.progressDetails}>
                  <Text style={styles.progressSpent}>
                    ${progress.currentSpend.toFixed(0)} of ${progress.targetSpend.toFixed(0)}
                  </Text>
                  {progress.onTrack && remaining > 0 && (
                    <Text style={styles.progressRemaining}>
                      ${remaining.toFixed(0)} left
                    </Text>
                  )}
                </View>

                {progress.onTrack && progress.projectedInvest > 0 && (
                  <View style={styles.projectedInvest}>
                    <Ionicons name="trending-up" size={14} color="#059669" />
                    <Text style={styles.projectedInvestText}>
                      Projected: ${progress.projectedInvest.toFixed(2)} to invest
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  reviewIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  reviewDesc: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
    marginTop: 2,
  },
  setupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  setupInfo: {
    flex: 1,
    marginLeft: 12,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4338CA',
  },
  setupDesc: {
    fontSize: 13,
    color: '#6366F1',
    marginTop: 2,
  },
  setupButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  setupButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
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
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  emptyRulesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyRulesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  emptyRulesDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOnTrack: {
    backgroundColor: '#D1FAE5',
  },
  statusOver: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusOnTrackText: {
    color: '#059669',
  },
  statusOverText: {
    color: '#DC2626',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarGreen: {
    backgroundColor: '#10B981',
  },
  progressBarRed: {
    backgroundColor: '#EF4444',
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressSpent: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressRemaining: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  projectedInvest: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 6,
  },
  projectedInvestText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  levelSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  achievementsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  xpContainer: {
    marginTop: 4,
  },
});
