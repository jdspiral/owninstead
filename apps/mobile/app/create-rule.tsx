import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RULE_CATEGORIES, CATEGORY_LABELS } from '@owninstead/shared';
import { apiClient } from '@/services/api/client';

type Category = (typeof RULE_CATEGORIES)[keyof typeof RULE_CATEGORIES];
type InvestType = 'difference' | 'fixed';
type Period = 'weekly' | 'monthly';

const CATEGORIES = Object.entries(CATEGORY_LABELS)
  .filter(([key]) => key !== 'custom')
  .map(([value, label]) => ({ value, label }));

export default function CreateRuleScreen() {
  const [category, setCategory] = useState<Category | null>(null);
  const [period, setPeriod] = useState<Period>('weekly');
  const [targetSpend, setTargetSpend] = useState('');
  const [investType, setInvestType] = useState<InvestType>('difference');
  const [investAmount, setInvestAmount] = useState('');
  const [streakEnabled, setStreakEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!category) {
      Alert.alert('Select Category', 'Please select a spending category.');
      return;
    }

    const target = parseFloat(targetSpend);
    if (!target || target <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid spending target.');
      return;
    }

    if (investType === 'fixed') {
      const amount = parseFloat(investAmount);
      if (!amount || amount <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid investment amount.');
        return;
      }
    }

    setIsLoading(true);
    try {
      await apiClient.post('/rules', {
        category,
        period,
        targetSpend: target,
        investType,
        investAmount: investType === 'fixed' ? parseFloat(investAmount) : null,
        streakEnabled,
      });

      router.back();
    } catch (error) {
      console.error('Failed to create rule:', error);
      Alert.alert('Error', 'Failed to create rule. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Rule</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category Selection */}
        <Text style={styles.sectionTitle}>What do you want to spend less on?</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryCard,
                category === cat.value && styles.categoryCardSelected,
              ]}
              onPress={() => setCategory(cat.value as Category)}
            >
              <Text
                style={[
                  styles.categoryLabel,
                  category === cat.value && styles.categoryLabelSelected,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period Selection */}
        <Text style={styles.sectionTitle}>Evaluation period</Text>
        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[styles.periodOption, period === 'weekly' && styles.periodOptionSelected]}
            onPress={() => setPeriod('weekly')}
          >
            <Text style={[styles.periodText, period === 'weekly' && styles.periodTextSelected]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodOption, period === 'monthly' && styles.periodOptionSelected]}
            onPress={() => setPeriod('monthly')}
          >
            <Text style={[styles.periodText, period === 'monthly' && styles.periodTextSelected]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Target Spend */}
        <Text style={styles.sectionTitle}>
          {period === 'weekly' ? 'Weekly' : 'Monthly'} spending target
        </Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.currency}>$</Text>
          <TextInput
            style={styles.input}
            value={targetSpend}
            onChangeText={setTargetSpend}
            keyboardType="numeric"
            placeholder={period === 'weekly' ? '50' : '200'}
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.inputSuffix}>/{period === 'weekly' ? 'week' : 'month'}</Text>
        </View>
        <Text style={styles.hint}>
          If you spend less than this, we'll invest the savings.
        </Text>

        {/* Investment Type */}
        <Text style={styles.sectionTitle}>How much to invest?</Text>
        <View style={styles.investTypeOptions}>
          <TouchableOpacity
            style={[
              styles.investTypeCard,
              investType === 'difference' && styles.investTypeCardSelected,
            ]}
            onPress={() => setInvestType('difference')}
          >
            <View style={styles.radioOuter}>
              {investType === 'difference' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.investTypeContent}>
              <Text style={styles.investTypeTitle}>The Difference</Text>
              <Text style={styles.investTypeDesc}>
                Invest exactly what you saved
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.investTypeCard,
              investType === 'fixed' && styles.investTypeCardSelected,
            ]}
            onPress={() => setInvestType('fixed')}
          >
            <View style={styles.radioOuter}>
              {investType === 'fixed' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.investTypeContent}>
              <Text style={styles.investTypeTitle}>Fixed Amount</Text>
              <Text style={styles.investTypeDesc}>
                Invest a set amount when you beat the target
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {investType === 'fixed' && (
          <View style={[styles.inputWrapper, { marginTop: 12 }]}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              style={styles.input}
              value={investAmount}
              onChangeText={setInvestAmount}
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        )}

        {/* Streak Bonus */}
        <View style={styles.streakSection}>
          <View style={styles.streakInfo}>
            <Ionicons name="flame" size={24} color="#F59E0B" />
            <View style={styles.streakText}>
              <Text style={styles.streakTitle}>Streak Bonus</Text>
              <Text style={styles.streakDesc}>
                Invest 10% more for each consecutive {period === 'weekly' ? 'week' : 'month'} you beat your target
              </Text>
            </View>
          </View>
          <Switch
            value={streakEnabled}
            onValueChange={setStreakEnabled}
            trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
            thumbColor={streakEnabled ? '#4F46E5' : '#f4f3f4'}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Rule</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    marginTop: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  categoryLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  categoryLabelSelected: {
    color: '#4F46E5',
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  periodOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  periodOptionSelected: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
  },
  currency: {
    fontSize: 20,
    color: '#6B7280',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 20,
    paddingVertical: 16,
    color: '#111827',
  },
  inputSuffix: {
    fontSize: 16,
    color: '#6B7280',
  },
  hint: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  investTypeOptions: {
    gap: 12,
  },
  investTypeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  investTypeCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
  },
  investTypeContent: {
    flex: 1,
  },
  investTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  investTypeDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  streakSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  streakInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 16,
  },
  streakText: {
    marginLeft: 12,
    flex: 1,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  streakDesc: {
    fontSize: 13,
    color: '#A16207',
    marginTop: 2,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  createButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
