import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { DEFAULT_MAX_PER_TRADE, DEFAULT_MAX_PER_MONTH } from '@owninstead/shared';
import { apiClient } from '@/services/api/client';

export default function SetLimitsScreen() {
  const [maxPerTrade, setMaxPerTrade] = useState(DEFAULT_MAX_PER_TRADE.toString());
  const [maxPerMonth, setMaxPerMonth] = useState(DEFAULT_MAX_PER_MONTH.toString());
  const [isLoading, setIsLoading] = useState(false);
  const { setOnboardingComplete } = useAuthStore();

  const handleComplete = async () => {
    const tradeLimit = parseFloat(maxPerTrade) || DEFAULT_MAX_PER_TRADE;
    const monthLimit = parseFloat(maxPerMonth) || DEFAULT_MAX_PER_MONTH;

    if (tradeLimit <= 0 || monthLimit <= 0) {
      Alert.alert('Invalid Limits', 'Please enter valid amounts greater than 0.');
      return;
    }

    if (tradeLimit > monthLimit) {
      Alert.alert('Invalid Limits', 'Per-trade limit cannot exceed monthly limit.');
      return;
    }

    setIsLoading(true);
    try {
      // Save limits to profile
      await apiClient.patch('/profile', {
        maxPerTrade: tradeLimit,
        maxPerMonth: monthLimit,
      });

      // Mark onboarding as complete
      await apiClient.post('/profile/complete-onboarding');

      setOnboardingComplete();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to save limits:', error);
      Alert.alert('Error', 'Failed to save your settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.step}>Step 4 of 4</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Set Safety Limits</Text>

        <Text style={styles.description}>
          These limits help you stay in control of your automatic investments.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Maximum per trade</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              style={styles.input}
              value={maxPerTrade}
              onChangeText={setMaxPerTrade}
              keyboardType="numeric"
              placeholder="100"
            />
          </View>
          <Text style={styles.hint}>No single investment will exceed this amount</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Maximum per month</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              style={styles.input}
              value={maxPerMonth}
              onChangeText={setMaxPerMonth}
              keyboardType="numeric"
              placeholder="500"
            />
          </View>
          <Text style={styles.hint}>Total monthly investments won't exceed this</Text>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#4F46E5" />
          <Text style={styles.infoText}>
            You can pause all investing at any time from Settings. Your first trade will always
            require manual confirmation.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Complete Setup</Text>
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
  },
  step: {
    color: '#6B7280',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  currency: {
    fontSize: 18,
    color: '#6B7280',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 16,
  },
  hint: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4338CA',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
