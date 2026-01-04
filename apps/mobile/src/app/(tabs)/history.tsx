import { View, Text, StyleSheet, SectionList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const mockHistory = [
  {
    title: 'January 2024',
    data: [
      {
        id: '1',
        type: 'investment',
        category: 'Food Delivery',
        amount: 38,
        date: 'Jan 8',
        status: 'filled',
      },
      {
        id: '2',
        type: 'investment',
        category: 'Coffee Shops',
        amount: 10,
        date: 'Jan 8',
        status: 'filled',
      },
      {
        id: '3',
        type: 'investment',
        category: 'Food Delivery',
        amount: 42,
        date: 'Jan 1',
        status: 'filled',
      },
    ],
  },
  {
    title: 'December 2023',
    data: [
      {
        id: '4',
        type: 'investment',
        category: 'Food Delivery',
        amount: 35,
        date: 'Dec 25',
        status: 'filled',
      },
    ],
  },
];

export default function HistoryScreen() {
  const renderItem = ({ item }: { item: (typeof mockHistory)[0]['data'][0] }) => (
    <View style={styles.historyItem}>
      <View style={styles.iconContainer}>
        <Ionicons name="trending-up" size={20} color="#4F46E5" />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemCategory}>{item.category}</Text>
        <Text style={styles.itemDate}>{item.date}</Text>
      </View>
      <View style={styles.itemAmount}>
        <Text style={styles.amountText}>+${item.amount}</Text>
        <View style={[styles.statusBadge, item.status === 'filled' && styles.statusFilled]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  );

  return (
    <View style={styles.container}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Invested</Text>
        <Text style={styles.summaryValue}>$234.00</Text>
        <Text style={styles.summarySubtext}>across 8 investments</Text>
      </View>

      <SectionList
        sections={mockHistory}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  list: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  itemCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  itemDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  itemAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  statusBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  statusFilled: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    color: '#059669',
    textTransform: 'capitalize',
  },
});
