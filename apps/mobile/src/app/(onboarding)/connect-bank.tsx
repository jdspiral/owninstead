import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ConnectBankScreen() {
  const handleConnectBank = async () => {
    // TODO: Implement Plaid Link
    // For now, skip to next step
    router.push('/(onboarding)/connect-brokerage');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.step}>Step 1 of 4</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.illustration}>
          <Ionicons name="card" size={80} color="#4F46E5" />
        </View>

        <Text style={styles.title}>Connect Your Spending Account</Text>

        <Text style={styles.description}>
          We'll use this to track your spending behavior and trigger investments when you beat your
          targets.
        </Text>

        <View style={styles.benefits}>
          <View style={styles.benefit}>
            <Ionicons name="sync" size={20} color="#059669" />
            <Text style={styles.benefitText}>Automatic spending detection</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="lock-closed" size={20} color="#059669" />
            <Text style={styles.benefitText}>Bank-level security (Plaid)</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="eye-off" size={20} color="#059669" />
            <Text style={styles.benefitText}>Read-only access</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleConnectBank}>
          <Text style={styles.buttonText}>Connect Bank Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.push('/(onboarding)/connect-brokerage')}
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
    marginBottom: 32,
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
