import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_LABELS } from '@owninstead/shared';
import { apiClient } from '@/services/api/client';

interface Rule {
  id: string;
  category: string;
  merchant_pattern: string | null;
  period: string;
  target_spend: number;
  invest_type: string;
  invest_amount: number | null;
  streak_enabled: boolean;
  active: boolean;
  created_at: string;
}

export default function RulesScreen() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRules = async () => {
    try {
      const response = await apiClient.get('/rules');
      setRules(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRules();
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRules();
  };

  const toggleRule = async (rule: Rule) => {
    try {
      await apiClient.patch(`/rules/${rule.id}`, { active: !rule.active });
      setRules(rules.map(r =>
        r.id === rule.id ? { ...r, active: !r.active } : r
      ));
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const renderRule = ({ item }: { item: Rule }) => (
    <TouchableOpacity
      style={styles.ruleCard}
      onPress={() => router.push(`/edit-rule/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.ruleHeader}>
        <View style={styles.ruleInfo}>
          <Text style={styles.ruleName}>
            {CATEGORY_LABELS[item.category] || item.category}
          </Text>
          <Text style={styles.ruleTarget}>
            Target: ${item.target_spend}/{item.period === 'weekly' ? 'week' : 'month'}
          </Text>
          {item.invest_type === 'fixed' ? (
            <Text style={styles.ruleInvest}>Invest ${item.invest_amount} when met</Text>
          ) : (
            <Text style={styles.ruleInvest}>Invest the difference</Text>
          )}
        </View>
        <Switch
          value={item.active}
          onValueChange={() => toggleRule(item)}
          trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
          thumbColor={item.active ? '#4F46E5' : '#f4f3f4'}
        />
      </View>
      {item.streak_enabled && (
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={16} color="#F59E0B" />
          <Text style={styles.streakText}>Streak bonus enabled</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={rules}
        renderItem={renderRule}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <Text style={styles.description}>
            When you spend less than your target, we invest the savings automatically.
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No rules yet</Text>
            <Text style={styles.emptyText}>
              Create your first spending rule to start investing your savings automatically.
            </Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/create-rule')}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Create Rule</Text>
      </TouchableOpacity>
    </View>
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
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  ruleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ruleInfo: {
    flex: 1,
  },
  ruleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  ruleTarget: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  ruleInvest: {
    fontSize: 14,
    color: '#4F46E5',
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    marginLeft: 4,
    color: '#92400E',
    fontWeight: '500',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});
