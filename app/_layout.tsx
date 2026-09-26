import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { PreferencesProvider } from '@/context/PreferencesContext';
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { MemoryProvider } from '@/context/MemoryContext';
import { Colors } from '@/constants/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <PreferencesProvider>
      <AuthProvider>
        <ChatProvider>
          <MemoryProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: Colors.background },
                headerTintColor: Colors.textPrimary,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: Colors.background },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding/interests" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding/personality" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding/memory" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding/notifications" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding/complete" options={{ headerShown: false }} />
              <Stack.Screen name="auth/login" options={{ headerShown: false }} />
              <Stack.Screen name="auth/register" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="settings/notifications"
                options={{
                  title: 'Notification Preferences',
                  headerBackTitle: 'Settings',
                }}
              />
              <Stack.Screen
                name="settings/privacy"
                options={{
                  title: 'Privacy & Data Controls',
                  headerBackTitle: 'Settings',
                }}
              />
              <Stack.Screen
                name="settings/safety"
                options={{
                  title: 'Help & Emotional Safety',
                  headerBackTitle: 'Settings',
                }}
              />
              <Stack.Screen
                name="settings/about"
                options={{
                  title: 'About Sunny',
                  headerBackTitle: 'Settings',
                }}
              />
            </Stack>
          </MemoryProvider>
        </ChatProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}
