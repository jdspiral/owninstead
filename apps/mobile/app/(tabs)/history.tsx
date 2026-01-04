import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/services/api/client';

interface Transaction {
  id: string;
  amount: number;
  merchant_name: string | null;
  category: string[] | null;
  date: string;
  excluded: boolean;
}

interface TransactionSection {
  title: string;
  data: Transaction[];
}

type TabType = 'transactions' | 'investments';

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get('/transactions', {
        params: { pageSize: 100 },
      });
      setTransactions(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchTransactions();
  }, [fetchTransactions]);

  const toggleExcluded = async (transaction: Transaction) => {
    try {
      await apiClient.patch(`/transactions/${transaction.id}`, {
        excluded: !transaction.excluded,
      });
      // Update local state
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transaction.id ? { ...t, excluded: !t.excluded } : t
        )
      );
    } catch (err) {
      console.error('Failed to update transaction:', err);
    }
  };

  // Group transactions by month
  const groupedTransactions: TransactionSection[] = transactions.reduce(
    (sections: TransactionSection[], tx) => {
      const date = new Date(tx.date);
      const monthYear = date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });

      const existingSection = sections.find((s) => s.title === monthYear);
      if (existingSection) {
        existingSection.data.push(tx);
      } else {
        sections.push({ title: monthYear, data: [tx] });
      }
      return sections;
    },
    []
  );

  // Calculate totals
  const totalSpend = transactions
    .filter((t) => !t.excluded)
    .reduce((sum, t) => sum + t.amount, 0);

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={[styles.transactionItem, item.excluded && styles.excludedItem]}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={item.excluded ? 'close-circle' : 'card'}
          size={20}
          color={item.excluded ? '#9CA3AF' : '#4F46E5'}
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.merchantName, item.excluded && styles.excludedText]}>
          {item.merchant_name || 'Unknown Merchant'}
        </Text>
        <Text style={styles.categoryText}>
          {item.category?.[0] || 'Uncategorized'} •{' '}
          {new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.amountText, item.excluded && styles.excludedText]}>
          ${item.amount.toFixed(2)}
        </Text>
        <Switch
          value={!item.excluded}
          onValueChange={() => toggleExcluded(item)}
          trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
          thumbColor={item.excluded ? '#9CA3AF' : '#4F46E5'}
          style={styles.switch}
        />
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Transactions Yet</Text>
      <Text style={styles.emptyText}>
        Connect your bank account to start tracking spending
      </Text>
    </View>
  );

  const renderInvestmentsTab = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trending-up-outline" size={48} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Investments Yet</Text>
      <Text style={styles.emptyText}>
        Set up rules and beat your targets to trigger investments
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          {activeTab === 'transactions' ? 'Total Spending (30 days)' : 'Total Invested'}
        </Text>
        <Text style={styles.summaryValue}>
          ${activeTab === 'transactions' ? totalSpend.toFixed(2) : '0.00'}
        </Text>
        <Text style={styles.summarySubtext}>
          {activeTab === 'transactions'
            ? `${transactions.filter((t) => !t.excluded).length} transactions`
            : '0 investments'}
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
          onPress={() => setActiveTab('transactions')}
        >
          <Text
            style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}
          >
            Transactions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'investments' && styles.activeTab]}
          onPress={() => setActiveTab('investments')}
        >
          <Text
            style={[styles.tabText, activeTab === 'investments' && styles.activeTabText]}
          >
            Investments
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchTransactions}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'transactions' ? (
        <SectionList
          sections={groupedTransactions}
          renderItem={renderTransaction}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            transactions.length === 0 && styles.emptyList,
          ]}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#4F46E5"
            />
          }
        />
      ) : (
        renderInvestmentsTab()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  summaryCard: {
    backgroundColor: '#4F46E5',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#E0E7FF',
    fontSize: 14,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  summarySubtext: {
    color: '#A5B4FC',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4F46E5',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  retryText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyList: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  transactionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  excludedItem: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  excludedText: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  switch: {
    marginTop: 4,
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});
