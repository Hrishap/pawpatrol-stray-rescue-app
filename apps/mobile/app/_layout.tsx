import '@/lib/i18n';

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';
import { colors } from '@/theme';
import type { UserRole } from '@/types/database';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Each role group's first tab. The bare group path (e.g. '/(reporter)') does
// not resolve — those groups have no index route, only named tab screens — so
// redirecting there lands on Expo Router's "unmatched route" screen.
const HOME_ROUTE: Record<UserRole, '/(reporter)/map' | '/(volunteer)/queue' | '/(ngo)/dashboard'> = {
  reporter: '/(reporter)/map',
  volunteer: '/(volunteer)/queue',
  ngo: '/(ngo)/dashboard',
};

// Keeps navigation in sync with auth state from anywhere in the app. Without
// this, signing up or logging in left the user sitting on the auth screen:
// the session was created but only the index route knew how to redirect, and
// it isn't mounted while an (auth) screen is on top.
function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const group = segments[0] as string | undefined;
    // The index route ('/') has no group and does its own redirecting.
    if (!group) return;

    const inAuthFlow = group === '(auth)' || group === '(onboarding)';
    const signedIn = !!session && !!profile;

    if (signedIn && inAuthFlow) {
      router.replace(HOME_ROUTE[profile.role]);
    } else if (!signedIn && !inAuthFlow) {
      router.replace('/(onboarding)');
    }
  }, [session, profile, loading, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Never let font loading gate the whole app. Fonts that error (or hang
  // without ever resolving) previously left this returning null forever,
  // which presents as a permanently black screen; now the UI comes up on
  // system fonts instead and swaps in the real ones if they arrive late.
  const [fontTimedOut, setFontTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setFontTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const fontsSettled = fontsLoaded || !!fontError || fontTimedOut;

  useEffect(() => {
    if (fontsSettled) SplashScreen.hideAsync().catch(() => {});
  }, [fontsSettled]);

  if (!fontsSettled) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AuthGate>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                }}
              />
            </AuthGate>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
