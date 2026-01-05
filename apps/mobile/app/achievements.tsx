import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { apiClient } from '@/services/api/client';
import { LevelBadge, XPProgressBar, AchievementBadge } from '@/components';

interface Achievement {
  type: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
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

export default function AchievementsScreen() {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, achievementsRes] = await Promise.all([
        apiClient.get('/gamification/stats'),
        apiClient.get('/gamification/achievements/all'),
      ]);
      setStats(statsRes.data?.data);
      setAchievements(achievementsRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
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

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Summary */}
        {stats && (
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <LevelBadge
                level={stats.level}
                title={stats.levelTitle}
                size="large"
              />
              <View style={styles.statsInfo}>
                <Text style={styles.xpTotal}>{stats.xp.toLocaleString()} XP</Text>
                <Text style={styles.achievementCount}>
                  {unlockedCount} of {achievements.length} achievements
                </Text>
              </View>
            </View>
            <View style={styles.xpProgress}>
              <XPProgressBar
                currentXP={stats.nextLevelProgress.current}
                neededXP={stats.nextLevelProgress.needed}
                progress={stats.nextLevelProgress.progress}
                level={stats.level}
              />
            </View>
          </View>
        )}

        {/* Unlocked Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unlocked</Text>
          {achievements.filter(a => a.unlocked).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No achievements unlocked yet. Keep saving!
              </Text>
            </View>
          ) : (
            achievements
              .filter(a => a.unlocked)
              .map((achievement) => (
                <AchievementBadge
                  key={achievement.type}
                  icon={achievement.icon}
                  title={achievement.name}
                  description={achievement.description}
                  unlocked={true}
                  unlockedAt={achievement.unlockedAt}
                />
              ))
          )}
        </View>

        {/* Locked Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locked</Text>
          {achievements.filter(a => !a.unlocked).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                You've unlocked all achievements!
              </Text>
            </View>
          ) : (
            achievements
              .filter(a => !a.unlocked)
              .map((achievement) => (
                <AchievementBadge
                  key={achievement.type}
                  icon={achievement.icon}
                  title={achievement.name}
                  description={achievement.description}
                  unlocked={false}
                />
              ))
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
  statsCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsInfo: {
    marginLeft: 16,
    flex: 1,
  },
  xpTotal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  achievementCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  xpProgress: {
    marginTop: 8,
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
