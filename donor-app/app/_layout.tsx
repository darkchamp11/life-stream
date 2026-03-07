/**
 * Root Layout — Entry Point
 * 
 * Simple Stack layout with (tabs) as the initial route.
 * Registration check is done within the tabs index page.
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0c0a09' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="register" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}
