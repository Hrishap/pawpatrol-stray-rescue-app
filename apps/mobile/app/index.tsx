import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme';

// Auth-state gate: onboarding -> role select -> signup/login -> role-gated
// home. Each role's screens (M2 reporter, M3 volunteer/ngo) land here once
// built; for now each group has a placeholder landing route.
export default function Index() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!profile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
