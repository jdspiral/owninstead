import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const mockRules = [
  {
    id: '1',
    category: 'delivery',
    categoryLabel: 'Food Delivery',
    targetSpend: 50,
    investType: 'difference',
    active: true,
    streakEnabled: true,
    currentStreak: 12,
  },
  {
    id: '2',
    category: 'coffee',
    categoryLabel: 'Coffee Shops',
    targetSpend: 20,
    investType: 'fixed',
    investAmount: 10,
    active: true,
    streakEnabled: false,
    currentStreak: 0,
  },
];

export default function RulesScreen() {
  const renderRule = ({ item }: { item: (typeof mockRules)[0] }) => (
    <View style={styles.ruleCard}>
      <View style={styles.ruleHeader}>
        <View style={styles.ruleInfo}>
          <Text style={styles.ruleName}>{item.categoryLabel}</Text>
          <Text style={styles.ruleTarget}>Target: ${item.targetSpend}/week</Text>
          {item.investType === 'fixed' ? (
            <Text style={styles.ruleInvest}>Invest ${item.investAmount} when met</Text>
          ) : (
            <Text style={styles.ruleInvest}>Invest the difference</Text>
          )}
        </View>
        <Switch
          value={item.active}
          onValueChange={() => {}}
          trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
          thumbColor={item.active ? '#4F46E5' : '#f4f3f4'}
        />
      </View>
      {item.streakEnabled && item.currentStreak > 0 && (
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={16} color="#F59E0B" />
          <Text style={styles.streakText}>{item.currentStreak} week streak</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={mockRules}
        renderItem={renderRule}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.description}>
            When you spend less than your target, we invest the savings automatically.
          </Text>
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
  list: {
    padding: 16,
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
