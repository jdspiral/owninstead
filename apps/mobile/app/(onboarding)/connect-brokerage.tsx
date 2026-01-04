import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ConnectBrokerageScreen() {
  const handleConnectBrokerage = async () => {
    // TODO: Implement SnapTrade OAuth
    // For now, skip to next step
    router.push('/(onboarding)/select-asset');
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
        <TouchableOpacity style={styles.button} onPress={handleConnectBrokerage}>
          <Text style={styles.buttonText}>Connect Brokerage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.push('/(onboarding)/select-asset')}
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
