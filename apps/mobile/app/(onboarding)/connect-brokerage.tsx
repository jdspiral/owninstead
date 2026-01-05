import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { apiClient } from '@/services/api/client';

export default function ConnectBrokerageScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnectBrokerage = async () => {
    setIsLoading(true);

    try {
      // Get the SnapTrade redirect URL from our backend
      const response = await apiClient.get('/snaptrade/redirect-uri');
      const redirectUri = response.data?.data?.redirectUri;

      if (!redirectUri) {
        throw new Error('Failed to get brokerage connection URL');
      }

      // Open the SnapTrade connection portal in a browser
      const result = await WebBrowser.openAuthSessionAsync(
        redirectUri,
        'owninstead://snaptrade/callback'
      );

      if (result.type === 'success' && result.url) {
        // Parse the callback URL for authorization ID
        const url = new URL(result.url);
        const authorizationId = url.searchParams.get('authorization_id');

        if (authorizationId) {
          // Complete the connection on our backend
          await apiClient.post('/snaptrade/callback', { authorizationId });

          Alert.alert('Success', 'Brokerage connected successfully!', [
            { text: 'Continue', onPress: () => router.push('/(onboarding)/select-asset') },
          ]);
        } else {
          // User completed flow but no authorization - may have cancelled in portal
          router.push('/(onboarding)/select-asset');
        }
      } else if (result.type === 'cancel') {
        // User cancelled the browser session
        Alert.alert(
          'Connection Cancelled',
          'Would you like to try again or skip for now?',
          [
            { text: 'Try Again', onPress: handleConnectBrokerage },
            { text: 'Skip', onPress: () => router.push('/(onboarding)/select-asset') },
          ]
        );
      }
    } catch (error) {
      console.error('Brokerage connection error:', error);
      Alert.alert(
        'Connection Failed',
        'Unable to connect to your brokerage. Please try again.',
        [
          { text: 'Try Again', onPress: handleConnectBrokerage },
          { text: 'Skip', onPress: () => router.push('/(onboarding)/select-asset') },
        ]
      );
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
        <Text style={styles.step}>Step 2 of 4</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.illustration}>
          <Ionicons name="trending-up" size={80} color="#4F46E5" />
        </View>

        <Text style={styles.title}>Connect Your Brokerage</Text>

        <Text style={styles.description}>
          This is where we'll execute your automated investments when you beat your spending
          targets.
        </Text>

        <View style={styles.brokerages}>
          <Text style={styles.brokeragesTitle}>Supported brokerages</Text>
          <View style={styles.brokerageList}>
            <Text style={styles.brokerageItem}>Fidelity</Text>
            <Text style={styles.brokerageItem}>Schwab</Text>
            <Text style={styles.brokerageItem}>TD Ameritrade</Text>
            <Text style={styles.brokerageItem}>+20 more</Text>
          </View>
        </View>

        <View style={styles.benefits}>
          <View style={styles.benefit}>
            <Ionicons name="shield-checkmark" size={20} color="#059669" />
            <Text style={styles.benefitText}>Your broker executes all trades</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="lock-closed" size={20} color="#059669" />
            <Text style={styles.benefitText}>We never hold your money</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleConnectBrokerage}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Connect Brokerage</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.push('/(onboarding)/select-asset')}
          disabled={isLoading}
        >
          <Text style={styles.skipText}>Skip for now</Text>
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
    justifyContent: 'center',
  },
  illustration: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  brokerages: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  brokeragesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  brokerageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  brokerageItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 14,
    color: '#4B5563',
  },
  benefits: {
    gap: 12,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 15,
    color: '#374151',
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
  skipButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  skipText: {
    color: '#6B7280',
    fontSize: 16,
  },
});
