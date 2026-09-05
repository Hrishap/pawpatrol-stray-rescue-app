import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import { colors, fonts, spacing } from '@/theme';

// Auth-state gate: onboarding -> role select -> signup/login -> role-gated home.
export default function Index() {
  const { t } = useTranslation();
  const { session, profile, loading, error, retry } = useAuth();

  if (loading) return <Loading />;

  // Surfaced instead of spinning forever when the backend is unreachable —
  // on a dev build that usually means the device can't see the machine
  // running Supabase (wrong LAN IP, different network, or it isn't running).
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>{t('cannotReachServer')}</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <Button label={t('retry')} onPress={retry} />
      </View>
    );
  }

  if (!session || !profile) {
    return <Redirect href="/(onboarding)" />;
  }

  switch (profile.role) {
    case 'volunteer':
      return <Redirect href="/(volunteer)" />;
    case 'ngo':
      return <Redirect href="/(ngo)" />;
    default:
      return <Redirect href="/(reporter)" />;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },
  errorTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted60,
    textAlign: 'center',
    marginBottom: 24,
  },
});
