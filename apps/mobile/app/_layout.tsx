import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="bank-accounts"
          options={{
            headerShown: true,
            title: 'Bank Accounts',
            headerBackTitle: 'Settings',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="achievements"
          options={{
            headerShown: true,
            title: 'Achievements',
            headerBackTitle: 'Back',
            presentation: 'card',
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
