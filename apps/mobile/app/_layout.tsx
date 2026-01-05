import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, headerBackTitleVisible: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" options={{ headerBackTitle: '' }} />
        <Stack.Screen
          name="bank-accounts"
          options={{
            headerShown: true,
            title: 'Bank Accounts',
            presentation: 'card',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
                <Ionicons name="chevron-back" size={28} color="#007AFF" />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="achievements"
          options={{
            headerShown: true,
            title: 'Achievements',
            presentation: 'card',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
                <Ionicons name="chevron-back" size={28} color="#007AFF" />
              </TouchableOpacity>
            ),
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
