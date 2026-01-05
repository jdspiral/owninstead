import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORTED_ASSETS } from '@owninstead/shared';
import { apiClient } from '@/services/api/client';

export default function SelectAssetScreen() {
  const [selectedAsset, setSelectedAsset] = useState('VTI');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      await apiClient.patch('/profile', { selectedAsset });
      router.push('/(onboarding)/set-limits');
    } catch (error) {
      console.error('Failed to save asset selection:', error);
      Alert.alert('Error', 'Failed to save your selection. Please try again.');
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
        <Text style={styles.step}>Step 3 of 4</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Choose Your Investment</Text>

        <Text style={styles.description}>
          Select which ETF you'd like to invest in when you beat your spending targets.
        </Text>

        <View style={styles.assetList}>
          {SUPPORTED_ASSETS.map((asset) => (
            <TouchableOpacity
              key={asset.symbol}
              style={[styles.assetCard, selectedAsset === asset.symbol && styles.assetCardSelected]}
              onPress={() => setSelectedAsset(asset.symbol)}
            >
              <View style={styles.assetInfo}>
                <Text style={styles.assetSymbol}>{asset.symbol}</Text>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetDescription}>{asset.description}</Text>
              </View>
              {selectedAsset === asset.symbol && (
                <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.note}>
          You can change this later in settings. Long-only market buys only.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
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
    marginBottom: 24,
  },
  assetList: {
    gap: 12,
  },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  assetCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  assetInfo: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  assetName: {
    fontSize: 14,
    color: '#374151',
    marginTop: 2,
  },
  assetDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  note: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
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
