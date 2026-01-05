import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { apiClient } from '@/services/api/client';

// Use mock in Expo Go, real SDK in development builds
const isExpoGo = Constants.appOwnership === 'expo';

// Conditional imports
import * as MockPlaid from '@/mocks/plaid-link';
import * as RealPlaid from 'react-native-plaid-link-sdk';

const PlaidSDK = isExpoGo ? MockPlaid : RealPlaid;

type LinkSuccess = MockPlaid.LinkSuccess;
type LinkExit = MockPlaid.LinkExit;

const { create, open, dismissLink } = PlaidSDK as typeof MockPlaid;

interface BankConnection {
  id: string;
  institutionName: string | null;
  lastSynced: string | null;
}

export default function BankAccountsScreen() {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);

  const fetchConnections = async () => {
    try {
      const response = await apiClient.get('/plaid/status');
      setConnections(response.data?.data?.connections || []);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConnections();
    }, [])
  );

  const fetchLinkToken = async () => {
    try {
      const response = await apiClient.post('/plaid/link-token');
      const token = response.data.data.linkToken;
      setLinkToken(token);
      create({ token });
      return token;
    } catch (error) {
      console.error('Failed to fetch link token:', error);
      return null;
    }
  };

  // Pre-fetch link token
  useEffect(() => {
    fetchLinkToken();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchConnections();
  };

  const handleSuccess = useCallback(async (success: LinkSuccess) => {
    setIsConnecting(true);
    try {
      await apiClient.post('/plaid/exchange-token', {
        publicToken: success.publicToken,
      });
      await apiClient.post('/plaid/sync');
      await fetchConnections();
      // Get new link token for next connection
      await fetchLinkToken();
      Alert.alert('Success', 'Account connected successfully!');
    } catch (error) {
      console.error('Failed to exchange token:', error);
      Alert.alert('Error', 'Failed to connect account. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const handleExit = useCallback((exit: LinkExit) => {
    if (exit.error) {
      Alert.alert('Connection Failed', exit.error.displayMessage || 'Please try again.');
    }
    dismissLink();
  }, []);

  const handleAddAccount = async () => {
    if (!linkToken) {
      Alert.alert('Please wait', 'Setting up secure connection...');
      const token = await fetchLinkToken();
      if (!token) {
        Alert.alert('Error', 'Failed to set up connection. Please try again.');
        return;
      }
    }

    try {
      open({
        onSuccess: handleSuccess,
        onExit: handleExit,
      });
    } catch (error) {
      console.error('Failed to open Plaid Link:', error);
      Alert.alert('Error', 'Failed to open bank connection. Please try again.');
    }
  };

  const handleRemoveAccount = (connection: BankConnection) => {
    Alert.alert(
      'Remove Account',
      `Are you sure you want to remove ${connection.institutionName || 'this account'}? Transactions from this account will no longer sync.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/plaid/connections/${connection.id}`);
              await fetchConnections();
              Alert.alert('Removed', 'Account has been disconnected.');
            } catch (error) {
              console.error('Failed to remove connection:', error);
              Alert.alert('Error', 'Failed to remove account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const response = await apiClient.post('/plaid/sync');
      const { synced, accounts } = response.data?.data || {};
      Alert.alert(
        'Sync Complete',
        `Synced ${synced} transactions from ${accounts} account${accounts !== 1 ? 's' : ''}.`
      );
      await fetchConnections();
    } catch (error) {
      console.error('Failed to sync:', error);
      Alert.alert('Error', 'Failed to sync transactions. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSynced = (dateStr: string | null) => {
    if (!dateStr) return 'Never synced';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#4F46E5" />
          <Text style={styles.infoText}>
            Connect all accounts you use for spending (checking, credit cards) to get complete
            transaction coverage.
          </Text>
        </View>

        {/* Connected Accounts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Connected Accounts</Text>
            {connections.length > 0 && (
              <TouchableOpacity
                style={styles.syncButton}
                onPress={handleSyncAll}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                  <>
                    <Ionicons name="sync" size={16} color="#4F46E5" />
                    <Text style={styles.syncButtonText}>Sync All</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {connections.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No accounts connected</Text>
              <Text style={styles.emptyText}>
                Connect your bank accounts and credit cards to start tracking spending.
              </Text>
            </View>
          ) : (
            connections.map((connection) => (
              <View key={connection.id} style={styles.connectionCard}>
                <View style={styles.connectionIcon}>
                  <Ionicons name="business" size={24} color="#4F46E5" />
                </View>
                <View style={styles.connectionInfo}>
                  <Text style={styles.connectionName}>
                    {connection.institutionName || 'Bank Account'}
                  </Text>
                  <Text style={styles.connectionSync}>
                    {formatLastSynced(connection.lastSynced)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveAccount(connection)}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Add Account Button */}
        <TouchableOpacity
          style={[styles.addButton, isConnecting && styles.addButtonDisabled]}
          onPress={handleAddAccount}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Add Bank or Credit Card</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={20} color="#059669" />
          <Text style={styles.securityText}>
            Secured by Plaid. We never store your login credentials and only have read-only access
            to your transactions.
          </Text>
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
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    margin: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4338CA',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
  },
  syncButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  connectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  connectionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  connectionSync: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 32,
    gap: 10,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});
