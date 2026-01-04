import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="connect-bank" />
      <Stack.Screen name="connect-brokerage" />
      <Stack.Screen name="select-asset" />
      <Stack.Screen name="set-limits" />
    </Stack>
  );
}
