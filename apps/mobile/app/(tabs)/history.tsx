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

interface Order {
  id: string;
  symbol: string;
  amount_dollars: number;
  shares: number | null;
  status: string;
  submitted_at: string | null;
  filled_at: string | null;
  filled_price: number | null;
  created_at: string;
  evaluations: {
    id: string;
    period_start: string;
    period_end: string;
    rules: {
      category: string;
    };
  } | null;
}

interface TransactionSection {
  title: string;
  data: Transaction[];
}

interface OrderSection {
  title: string;
  data: Order[];
}

type TabType = 'transactions' | 'investments';

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [txResponse, ordersResponse] = await Promise.all([
        apiClient.get('/transactions', { params: { pageSize: 100 } }),
        apiClient.get('/orders', { params: { pageSize: 50 } }),
      ]);
      setTransactions(txResponse.data.data || []);
      setOrders(ordersResponse.data.data || []);
    } catch (err: unknown) {
      console.error('Failed to fetch data:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

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

  // Calculate total invested
  const totalInvested = orders
    .filter((o) => o.status === 'filled')
    .reduce((sum, o) => sum + o.amount_dollars, 0);

  // Group orders by month
  const groupedOrders: OrderSection[] = orders.reduce(
    (sections: OrderSection[], order) => {
      const date = new Date(order.created_at);
      const monthYear = date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });

      const existingSection = sections.find((s) => s.title === monthYear);
      if (existingSection) {
        existingSection.data.push(order);
      } else {
        sections.push({ title: monthYear, data: [order] });
      }
      return sections;
    },
    []
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return '#059669';
      case 'submitted':
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'filled':
        return 'Completed';
      case 'submitted':
        return 'Processing';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const renderOrder = ({ item: order }: { item: Order }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderIconContainer}>
        <Ionicons
          name={order.status === 'filled' ? 'checkmark-circle' : 'time'}
          size={20}
          color={getStatusColor(order.status)}
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.merchantName}>{order.symbol}</Text>
        <Text style={styles.categoryText}>
          {order.evaluations?.rules?.category || 'Investment'} •{' '}
          {new Date(order.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.amountText}>${order.amount_dollars.toFixed(2)}</Text>
        <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
          {getStatusLabel(order.status)}
        </Text>
      </View>
    </View>
  );

  const renderOrderSectionHeader = ({ section }: { section: { title: string } }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  );

  const renderEmptyOrders = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trending-up-outline" size={48} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Investments Yet</Text>
      <Text style={styles.emptyText}>
        Set up rules and beat your targets to trigger investments
      </Text>
    </View>
  );

  const renderInvestmentsTab = () => (
    <SectionList
      sections={groupedOrders}
      renderItem={renderOrder}
      renderSectionHeader={renderOrderSectionHeader}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.list,
        orders.length === 0 && styles.emptyList,
      ]}
      stickySectionHeadersEnabled={false}
      ListEmptyComponent={renderEmptyOrders}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#4F46E5"
        />
      }
    />
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
          ${activeTab === 'transactions' ? totalSpend.toFixed(2) : totalInvested.toFixed(2)}
        </Text>
        <Text style={styles.summarySubtext}>
          {activeTab === 'transactions'
            ? `${transactions.filter((t) => !t.excluded).length} transactions`
            : `${orders.filter((o) => o.status === 'filled').length} investments`}
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
          <TouchableOpacity onPress={fetchData}>
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
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
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
