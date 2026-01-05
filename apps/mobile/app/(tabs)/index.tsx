import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_LABELS } from '@owninstead/shared';
import { apiClient } from '@/services/api/client';

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

export default function DashboardScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [pendingData, setPendingData] = useState<PendingData | null>(null);
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
      const [profileRes, rulesRes, pendingRes] = await Promise.all([
        apiClient.get('/profile'),
        apiClient.get('/rules'),
        apiClient.get('/evaluations/pending'),
      ]);
      setProfile(profileRes.data?.data);
      setRules((rulesRes.data?.data || []).filter((r: Rule) => r.active));
      setPendingData(pendingRes.data?.data);
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

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color="#059669" />
          <Text style={styles.statValue}>$0</Text>
          <Text style={styles.statLabel}>Total Invested</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={24} color="#F59E0B" />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Week Streak</Text>
        </View>
      </View>

      {/* Active Rules */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Rules</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/rules')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {rules.length === 0 ? (
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
          rules.slice(0, 3).map((rule) => (
            <TouchableOpacity
              key={rule.id}
              style={styles.ruleCard}
              onPress={() => router.push('/(tabs)/rules')}
            >
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleName}>
                  {CATEGORY_LABELS[rule.category] || rule.category}
                </Text>
                <Text style={styles.ruleTarget}>
                  Target: ${rule.target_spend}/{rule.period === 'weekly' ? 'wk' : 'mo'}
                </Text>
              </View>
              <View style={styles.ruleStatus}>
                <Text style={styles.ruleStatusText}>Tracking</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/create-rule')}
          >
            <Ionicons name="add" size={24} color="#4F46E5" />
            <Text style={styles.actionLabel}>Add Rule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/history')}
          >
            <Ionicons name="receipt" size={24} color="#4F46E5" />
            <Text style={styles.actionLabel}>Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Ionicons name="settings" size={24} color="#4F46E5" />
            <Text style={styles.actionLabel}>Settings</Text>
          </TouchableOpacity>
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
  ruleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 13,
    color: '#374151',
    marginTop: 8,
    fontWeight: '500',
  },
});
