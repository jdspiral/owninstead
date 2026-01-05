import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CURATED_ETFS, ETFAsset } from '@owninstead/shared';
import { apiClient } from '@/services/api/client';
import debounce from 'lodash.debounce';

interface SearchResult {
  symbol: string;
  name: string;
  description: string;
  universalSymbolId: string;
}

export default function SelectAssetScreen() {
  const [selectedAsset, setSelectedAsset] = useState('VTI');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchSymbols = useCallback(
    debounce(async (query: string) => {
      if (query.length < 1) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await apiClient.get<{ symbols: SearchResult[] }>(
          `/snaptrade/symbols/search?q=${encodeURIComponent(query)}`
        );
        setSearchResults(response.data.symbols);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    searchSymbols(text);
  };

  const handleSelectAsset = (symbol: string) => {
    setSelectedAsset(symbol);
    setSearchQuery('');
    setSearchResults([]);
  };

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

  const renderAssetCard = (asset: ETFAsset | SearchResult, isSelected: boolean) => (
    <TouchableOpacity
      key={asset.symbol}
      style={[styles.assetCard, isSelected && styles.assetCardSelected]}
      onPress={() => handleSelectAsset(asset.symbol)}
    >
      <View style={styles.assetInfo}>
        <Text style={styles.assetSymbol}>{asset.symbol}</Text>
        <Text style={styles.assetName}>{asset.name}</Text>
        <Text style={styles.assetDescription}>{asset.description}</Text>
      </View>
      {isSelected && <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.step}>Step 3 of 4</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Choose Your Investment</Text>

          <Text style={styles.description}>
            Select which ETF you'd like to invest in when you beat your spending targets.
          </Text>

          {/* Search input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for an ETF..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {isSearching && <ActivityIndicator size="small" color="#4F46E5" />}
            {searchQuery.length > 0 && !isSearching && (
              <TouchableOpacity onPress={() => handleSearchChange('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search results */}
          {searchQuery.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Search Results</Text>
              {searchResults.length === 0 && !isSearching ? (
                <Text style={styles.noResults}>No ETFs found</Text>
              ) : (
                <View style={styles.assetList}>
                  {searchResults.map((result) =>
                    renderAssetCard(result, selectedAsset === result.symbol)
                  )}
                </View>
              )}
            </View>
          )}

          {/* Curated categories - only show when not searching */}
          {searchQuery.length === 0 && (
            <>
              {CURATED_ETFS.map((category) => (
                <View key={category.id} style={styles.section}>
                  <Text style={styles.sectionTitle}>{category.label}</Text>
                  <View style={styles.assetList}>
                    {category.assets.map((asset) =>
                      renderAssetCard(asset, selectedAsset === asset.symbol)
                    )}
                  </View>
                </View>
              ))}
            </>
          )}

          <Text style={styles.note}>
            You can change this later in settings. Long-only market buys only.
          </Text>
        </ScrollView>

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
      </KeyboardAvoidingView>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    marginTop: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assetList: {
    gap: 10,
  },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  assetName: {
    fontSize: 13,
    color: '#374151',
    marginTop: 2,
  },
  assetDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  noResults: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },
  note: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
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
