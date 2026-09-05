import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { colors, fonts, fontSize, spacing } from '@/theme';

// Temporary landing screen for a role's tab group. Replaced by the real
// tab-bar screens in M2 (reporter), M3 (volunteer/ngo).
export function RolePlaceholder({ title }: { title: string }) {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        Signed in as {profile?.full_name} ({profile?.role})
      </Text>
      <View style={styles.spacer} />
      <Button label={t('signOut')} variant="ghost" onPress={signOut} />
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
    fontSize: fontSize.sectionTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.body,
    color: colors.textMuted60,
    textAlign: 'center',
  },
  spacer: {
    height: spacing.xxl,
  },
});
