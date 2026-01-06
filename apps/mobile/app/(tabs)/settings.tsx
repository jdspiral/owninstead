import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { router } from 'expo-router';
import { apiClient } from '@/services/api/client';
import { CURATED_ETFS, SUPPORTED_ASSETS, ETFAsset } from '@owninstead/shared';
import debounce from 'lodash.debounce';

interface Profile {
  selected_asset: string;
  max_per_trade: number;
  max_per_month: number;
  investing_paused: boolean;
  plaidConnected: boolean;
  snaptradeConnected: boolean;
  plaidInstitutions: string[];
  brokerageName: string | null;
}

interface SearchResult {
  symbol: string;
  name: string;
  description: string;
  universalSymbolId: string;
}

type ModalType = 'asset' | 'maxPerTrade' | 'maxPerMonth' | null;

export default function SettingsScreen() {
  const { logout } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [editValue, setEditValue] = useState('');

  // Asset search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/profile');
      const profileData = response.data?.data;
      setProfile(profileData);

      // If user has brokerage connected but no account synced, trigger sync
      if (profileData?.brokerageName && !profileData?.snaptradeAccountId) {
        try {
          await apiClient.post('/snaptrade/sync');
          // Refetch profile to get updated account info
          const refreshed = await apiClient.get('/profile');
          setProfile(refreshed.data?.data);
        } catch (syncError) {
          console.error('Failed to sync brokerage:', syncError);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProfile();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const toggleInvestingPaused = async () => {
    if (!profile) return;
    const newValue = !profile.investing_paused;
    setProfile({ ...profile, investing_paused: newValue });

    try {
      await apiClient.patch('/profile', { investingPaused: newValue });
    } catch (error) {
      console.error('Failed to update:', error);
      setProfile({ ...profile, investing_paused: !newValue });
      Alert.alert('Error', 'Failed to update setting.');
    }
  };

  const handleBrokerageTap = () => {
    if (profile?.snaptradeConnected) {
      Alert.alert(
        'Brokerage Connected',
        `Your ${profile.brokerageName || 'brokerage'} account is connected.`,
        [
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              try {
                await apiClient.delete('/snaptrade/connection');
                setProfile({ ...profile, snaptradeConnected: false, brokerageName: null });
                Alert.alert('Disconnected', 'Your brokerage has been disconnected.');
              } catch (error) {
                console.error('Failed to disconnect:', error);
                Alert.alert('Error', 'Failed to disconnect brokerage.');
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      router.push('/(onboarding)/connect-brokerage');
    }
  };

  const openModal = (type: ModalType) => {
    if (!profile) return;
    setActiveModal(type);
    if (type === 'asset') {
      setEditValue(profile.selected_asset || 'VTI');
      setSearchQuery('');
      setSearchResults([]);
    } else if (type === 'maxPerTrade') {
      setEditValue(profile.max_per_trade.toString());
    } else if (type === 'maxPerMonth') {
      setEditValue(profile.max_per_month.toString());
    }
  };

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
        setSearchResults(response.data.data?.symbols || []);
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
    setEditValue(symbol);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSaveModal = async () => {
    if (!profile || !activeModal) return;

    setIsSaving(true);
    try {
      let updateData: Record<string, unknown> = {};

      if (activeModal === 'asset') {
        updateData = { selectedAsset: editValue };
      } else if (activeModal === 'maxPerTrade') {
        const value = parseFloat(editValue);
        if (isNaN(value) || value < 1) {
          Alert.alert('Invalid Amount', 'Please enter a valid amount.');
          setIsSaving(false);
          return;
        }
        updateData = { maxPerTrade: value };
      } else if (activeModal === 'maxPerMonth') {
        const value = parseFloat(editValue);
        if (isNaN(value) || value < 1) {
          Alert.alert('Invalid Amount', 'Please enter a valid amount.');
          setIsSaving(false);
          return;
        }
        updateData = { maxPerMonth: value };
      }

      await apiClient.patch('/profile', updateData);
      await fetchProfile();
      setActiveModal(null);
    } catch (error) {
      console.error('Failed to save:', error);
      Alert.alert('Error', 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const getAssetName = (symbol: string) => {
    const asset = SUPPORTED_ASSETS.find((a) => a.symbol === symbol);
    return asset ? `${symbol} (${asset.name})` : symbol;
  };

  const renderAssetCard = (asset: ETFAsset | SearchResult, isSelected: boolean) => (
    <TouchableOpacity
      key={asset.symbol}
      style={[styles.assetOption, isSelected && styles.assetOptionSelected]}
      onPress={() => handleSelectAsset(asset.symbol)}
    >
      <View style={styles.assetInfo}>
        <Text style={styles.assetSymbol}>{asset.symbol}</Text>
        <Text style={styles.assetName}>{asset.name}</Text>
        <Text style={styles.assetDesc}>{asset.description}</Text>
      </View>
      {isSelected && <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />}
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
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Investment Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment Settings</Text>

          <TouchableOpacity style={styles.settingItem} onPress={() => openModal('asset')}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Default Asset</Text>
              <Text style={styles.settingValue}>
                {getAssetName(profile?.selected_asset || 'VTI')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => openModal('maxPerTrade')}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Max Per Trade</Text>
              <Text style={styles.settingValue}>${profile?.max_per_trade || 100}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => openModal('maxPerMonth')}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Max Per Month</Text>
              <Text style={styles.settingValue}>${profile?.max_per_month || 500}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Pause All Investing</Text>
              {profile?.investing_paused && (
                <Text style={styles.settingValueWarning}>Investing is paused</Text>
              )}
            </View>
            <Switch
              value={profile?.investing_paused || false}
              onValueChange={toggleInvestingPaused}
              trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
              thumbColor={profile?.investing_paused ? '#EF4444' : '#fff'}
            />
          </View>
        </View>

        {/* Connections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connections</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/bank-accounts')}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Bank Accounts</Text>
              {profile?.plaidConnected ? (
                <Text style={styles.settingValueGreen}>
                  {profile.plaidInstitutions?.length || 1} connected
                </Text>
              ) : (
                <Text style={styles.settingValueRed}>Not connected</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleBrokerageTap}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Brokerage</Text>
              {profile?.snaptradeConnected ? (
                <Text style={styles.settingValueGreen}>
                  Connected ({profile.brokerageName})
                </Text>
              ) : (
                <Text style={styles.settingValueRed}>Not connected</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Subscription</Text>
              <Text style={styles.settingValue}>Free Plan</Text>
            </View>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>

      {/* Asset Selection Modal */}
      <Modal visible={activeModal === 'asset'} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.assetModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Asset</Text>
                <TouchableOpacity onPress={() => setActiveModal(null)}>
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>

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

              <ScrollView style={styles.assetScrollView} showsVerticalScrollIndicator={false}>
                {/* Search results */}
                {searchQuery.length > 0 && (
                  <View style={styles.assetSection}>
                    <Text style={styles.assetSectionTitle}>Search Results</Text>
                    {(searchResults?.length || 0) === 0 && !isSearching ? (
                      <Text style={styles.noResults}>No ETFs found</Text>
                    ) : (
                      searchResults?.map((result) => renderAssetCard(result, editValue === result.symbol))
                    )}
                  </View>
                )}

                {/* Curated categories */}
                {searchQuery.length === 0 &&
                  CURATED_ETFS.map((category) => (
                    <View key={category.id} style={styles.assetSection}>
                      <Text style={styles.assetSectionTitle}>{category.label}</Text>
                      {category.assets.map((asset) => renderAssetCard(asset, editValue === asset.symbol))}
                    </View>
                  ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSaveModal}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Amount Input Modal */}
      <Modal
        visible={activeModal === 'maxPerTrade' || activeModal === 'maxPerMonth'}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeModal === 'maxPerTrade' ? 'Max Per Trade' : 'Max Per Month'}
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              {activeModal === 'maxPerTrade'
                ? 'Maximum amount for a single trade'
                : 'Maximum total investment per month'}
            </Text>
            <View style={styles.amountInputWrapper}>
              <Text style={styles.currency}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="numeric"
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveModal}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#111827',
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  settingValueGreen: {
    fontSize: 14,
    color: '#059669',
    marginTop: 2,
  },
  settingValueRed: {
    fontSize: 14,
    color: '#DC2626',
    marginTop: 2,
  },
  settingValueWarning: {
    fontSize: 14,
    color: '#DC2626',
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 16,
  },
  version: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  assetModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  assetScrollView: {
    maxHeight: 400,
    marginBottom: 16,
  },
  assetSection: {
    marginBottom: 20,
  },
  assetSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  assetOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  assetInfo: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  assetName: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  assetDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  noResults: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  currency: {
    fontSize: 24,
    color: '#6B7280',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    paddingVertical: 16,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
