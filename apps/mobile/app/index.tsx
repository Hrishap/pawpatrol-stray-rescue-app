import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { colors, fonts, fontSize, spacing } from '@/theme';

// Temporary placeholder landing screen for the M0 scaffold. M1 replaces this
// with real auth-state-based redirect logic (onboarding -> role select ->
// signup/login -> role-gated tabs).
export default function Index() {
  const { session, profile, loading } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PawPatrol</Text>
      <Text style={styles.subtitle}>
        {loading
          ? 'Connecting…'
          : session
            ? `Signed in as ${profile?.full_name ?? session.user.email}`
            : 'Scaffold ready — auth screens land in M1'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.onboardingHeadline,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.body,
    color: colors.textMuted60,
    textAlign: 'center',
  },
});
