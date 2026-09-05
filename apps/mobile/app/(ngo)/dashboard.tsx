import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { CaseRow } from '@/components/CaseRow';
import { useAuth } from '@/hooks/useAuth';
import { useCases } from '@/hooks/useCases';
import { useVolunteers } from '@/hooks/useProfile';
import { colors, fonts, fontSize, spacing } from '@/theme';

const URGENCY_RANK: Record<string, number> = { critical: 0, attention: 1, monitoring: 2 };

export default function NgoDashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { data: cases = [] } = useCases();
  const { data: volunteers = [] } = useVolunteers();

  const stats = useMemo(
    () => ({
      open: cases.filter((c) => c.status === 'open').length,
      claimed: cases.filter((c) => ['claimed', 'in_progress', 'pending_verification'].includes(c.status)).length,
      resolved: cases.filter((c) => c.status === 'resolved').length,
    }),
    [cases],
  );

  const urgentList = useMemo(
    () =>
      cases
        .filter((c) => c.status !== 'resolved')
        .sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency])
        .slice(0, 4),
    [cases],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('dashboard')}</Text>
      <Text style={styles.orgName}>{profile?.org_name ?? profile?.full_name}</Text>

      <View style={styles.statsGrid}>
        <StatTile value={stats.open} label={t('openCases')} color={colors.critical} />
        <StatTile value={stats.claimed} label={t('claimedCases')} color={colors.attention} />
        <StatTile value={stats.resolved} label={t('resolvedCases')} color={colors.monitoring} />
        <StatTile value={volunteers.length} label={t('volunteerLabel')} color={colors.inProgress} />
      </View>

      <Text style={styles.sectionLabel}>{t('mostUrgent')}</Text>
      <FlatList
        data={urgentList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t('nothingHere')}</Text>}
        renderItem={({ item }) => <CaseRow item={item} onPress={() => router.push(`/case/${item.id}`)} />}
      />
    </View>
  );
}

function StatTile({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 58 },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.textPrimary, paddingHorizontal: spacing.xl },
  orgName: { fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textMuted60, paddingHorizontal: spacing.xl, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: spacing.xl, marginBottom: 20 },
  statTile: { width: '47%', backgroundColor: colors.white, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  statValue: { fontFamily: fonts.extrabold, fontSize: 24 },
  statLabel: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted55, marginTop: 4, textAlign: 'center' },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textMuted50,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: spacing.xl,
    marginBottom: 10,
  },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 100, gap: 12 },
  empty: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.textMuted55, textAlign: 'center', marginTop: 20 },
});
