import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_LABELS } from '@owninstead/shared';
import { apiClient } from '@/services/api/client';

interface Evaluation {
  id: string;
  rule_id: string;
  period_start: string;
  period_end: string;
  actual_spend: number;
  target_spend: number;
  calculated_invest: number;
  final_invest: number;
  status: string;
  streak_count: number;
  rules: {
    category: string;
    invest_type: string;
    invest_amount: number | null;
  };
}

interface PendingData {
  evaluations: Evaluation[];
  totalPending: number;
  count: number;
}

export default function WeeklyReviewScreen() {
  const [data, setData] = useState<PendingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isFirstTrade, setIsFirstTrade] = useState(false);
  const [showFirstTradeModal, setShowFirstTradeModal] = useState(false);
  const [pendingEvaluationId, setPendingEvaluationId] = useState<string | null>(null);
  const [isConfirmingFirstTrade, setIsConfirmingFirstTrade] = useState(false);

  const fetchData = async () => {
    try {
      const [evalResponse, profileResponse] = await Promise.all([
        apiClient.get('/evaluations/pending'),
        apiClient.get('/profile'),
      ]);
      setData(evalResponse.data?.data);

      // Check if this is user's first trade
      const profile = profileResponse.data?.data;
      const needsFirstTradeConfirmation =
        !profile?.first_trade_confirmed && !profile?.hasCompletedOrders;
      setIsFirstTrade(needsFirstTradeConfirmation);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Failed to load pending evaluations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirm = async (evaluationId: string) => {
    // If this is the first trade, show confirmation modal
    if (isFirstTrade) {
      setPendingEvaluationId(evaluationId);
      setShowFirstTradeModal(true);
      return;
    }

    await executeConfirm(evaluationId);
  };

  const executeConfirm = async (evaluationId: string) => {
    setProcessingId(evaluationId);
    try {
      await apiClient.post(`/evaluations/${evaluationId}/confirm`);
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Failed to confirm evaluation:', error);
      Alert.alert('Error', 'Failed to confirm investment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleFirstTradeConfirm = async () => {
    if (!pendingEvaluationId) return;

    setIsConfirmingFirstTrade(true);
    try {
      // Mark first trade as confirmed in profile
      await apiClient.post('/profile/confirm-first-trade');
      setIsFirstTrade(false);

      // Now confirm the evaluation
      await apiClient.post(`/evaluations/${pendingEvaluationId}/confirm`);

      setShowFirstTradeModal(false);
      setPendingEvaluationId(null);

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Failed to confirm first trade:', error);
      Alert.alert('Error', 'Failed to confirm investment');
    } finally {
      setIsConfirmingFirstTrade(false);
    }
  };

  const handleSkip = async (evaluationId: string) => {
    setProcessingId(evaluationId);
    try {
      await apiClient.post(`/evaluations/${evaluationId}/skip`);
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Failed to skip evaluation:', error);
      Alert.alert('Error', 'Failed to skip investment');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </SafeAreaView>
    );
  }

  const hasEvaluations = data && data.evaluations.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Review</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!hasEvaluations ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyDesc}>
              No pending investments to review. Check back after your next weekly evaluation.
            </Text>
          </View>
        ) : (
          <>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Savings</Text>
                <Text style={styles.summaryValue}>
                  ${data.totalPending.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.summaryHint}>
                {data.count} rule{data.count !== 1 ? 's' : ''} to review
              </Text>
            </View>

            {/* Evaluations List */}
            {data.evaluations.map((evaluation) => (
              <View key={evaluation.id} style={styles.evaluationCard}>
                <View style={styles.evalHeader}>
                  <Text style={styles.evalCategory}>
                    {CATEGORY_LABELS[evaluation.rules.category] ||
                      evaluation.rules.category}
                  </Text>
                  {evaluation.streak_count > 0 && (
                    <View style={styles.streakBadge}>
                      <Ionicons name="flame" size={14} color="#F59E0B" />
                      <Text style={styles.streakText}>
                        {evaluation.streak_count} week streak
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.evalPeriod}>
                  {formatDate(evaluation.period_start)} -{' '}
                  {formatDate(evaluation.period_end)}
                </Text>

                <View style={styles.spendingRow}>
                  <View style={styles.spendingItem}>
                    <Text style={styles.spendingLabel}>Target</Text>
                    <Text style={styles.spendingValue}>
                      ${evaluation.target_spend.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.spendingItem}>
                    <Text style={styles.spendingLabel}>Actual</Text>
                    <Text
                      style={[
                        styles.spendingValue,
                        evaluation.actual_spend < evaluation.target_spend
                          ? styles.spendingGood
                          : styles.spendingBad,
                      ]}
                    >
                      ${evaluation.actual_spend.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.spendingItem}>
                    <Text style={styles.spendingLabel}>Saved</Text>
                    <Text style={[styles.spendingValue, styles.spendingGood]}>
                      $
                      {Math.max(
                        0,
                        evaluation.target_spend - evaluation.actual_spend
                      ).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.investSection}>
                  <View style={styles.investInfo}>
                    <Text style={styles.investLabel}>Investment Amount</Text>
                    <Text style={styles.investValue}>
                      ${evaluation.final_invest.toFixed(2)}
                    </Text>
                    {evaluation.calculated_invest !== evaluation.final_invest && (
                      <Text style={styles.cappedNote}>
                        (capped from ${evaluation.calculated_invest.toFixed(2)})
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => handleSkip(evaluation.id)}
                    disabled={processingId === evaluation.id}
                  >
                    {processingId === evaluation.id ? (
                      <ActivityIndicator size="small" color="#6B7280" />
                    ) : (
                      <Text style={styles.skipButtonText}>Skip This Week</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => handleConfirm(evaluation.id)}
                    disabled={processingId === evaluation.id}
                  >
                    {processingId === evaluation.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.confirmButtonText}>
                        Invest ${evaluation.final_invest.toFixed(2)}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* First Trade Confirmation Modal */}
      <Modal visible={showFirstTradeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.firstTradeModal}>
            <View style={styles.firstTradeIconContainer}>
              <Ionicons name="rocket" size={48} color="#4F46E5" />
            </View>

            <Text style={styles.firstTradeTitle}>Your First Investment!</Text>

            <Text style={styles.firstTradeDesc}>
              This is your first trade with OwnInstead. Here's what will happen:
            </Text>

            <View style={styles.firstTradeSteps}>
              <View style={styles.firstTradeStep}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.firstTradeStepText}>
                  We'll place a market order through your connected brokerage
                </Text>
              </View>
              <View style={styles.firstTradeStep}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.firstTradeStepText}>
                  Funds will be withdrawn from your brokerage cash balance
                </Text>
              </View>
              <View style={styles.firstTradeStep}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.firstTradeStepText}>
                  You'll own shares in your selected ETF
                </Text>
              </View>
            </View>

            <Text style={styles.firstTradeNote}>
              After this, future investments from your rules will be confirmed with a single tap.
            </Text>

            <View style={styles.firstTradeButtons}>
              <TouchableOpacity
                style={styles.firstTradeCancelButton}
                onPress={() => {
                  setShowFirstTradeModal(false);
                  setPendingEvaluationId(null);
                }}
                disabled={isConfirmingFirstTrade}
              >
                <Text style={styles.firstTradeCancelText}>Not Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.firstTradeConfirmButton,
                  isConfirmingFirstTrade && styles.buttonDisabled,
                ]}
                onPress={handleFirstTradeConfirm}
                disabled={isConfirmingFirstTrade}
              >
                {isConfirmingFirstTrade ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.firstTradeConfirmText}>
                    Confirm Investment
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
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
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  evaluationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  evalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  evalCategory: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400E',
  },
  evalPeriod: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  spendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  spendingItem: {
    alignItems: 'center',
  },
  spendingLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  spendingValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  spendingGood: {
    color: '#059669',
  },
  spendingBad: {
    color: '#DC2626',
  },
  investSection: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  investInfo: {
    alignItems: 'center',
  },
  investLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  investValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  cappedNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // First Trade Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  firstTradeModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  firstTradeIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  firstTradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  firstTradeDesc: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  firstTradeSteps: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  firstTradeStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  firstTradeStepText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  firstTradeNote: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  firstTradeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  firstTradeCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  firstTradeCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  firstTradeConfirmButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  firstTradeConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
