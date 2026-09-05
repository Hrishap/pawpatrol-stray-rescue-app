import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { FilterChip } from '@/components/FilterChip';
import { useAuth } from '@/hooks/useAuth';
import { useCases } from '@/hooks/useCases';
import { colors, fonts, personBadgeColor, spacing, statusColor, urgencyColor } from '@/theme';
import type { Case, CaseStatus } from '@/types/database';

const STATUS_LABEL_KEY: Record<CaseStatus, string> = {
  open: 'statusOpen',
  claimed: 'statusClaimed',
  in_progress: 'statusInProgress',
  pending_verification: 'statusPendingVerification',
  resolved: 'statusResolved',
};

type Tab = 'reported' | 'claimed' | 'resolved';

export default function CasesScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { data: cases = [] } = useCases();
  const [tab, setTab] = useState<Tab>('reported');

  const filtered = useMemo(() => {
    const uid = session?.user.id;
    switch (tab) {
      case 'reported':
        return cases.filter((c) => c.reporter_id === uid);
      case 'claimed':
        return cases.filter((c) => c.claimed_by === uid && c.status !== 'resolved');
      case 'resolved':
        return cases.filter((c) => c.status === 'resolved' && (c.reporter_id === uid || c.claimed_by === uid));
    }
  }, [cases, tab, session]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('myActivity')}</Text>
      <View style={styles.tabs}>
        <FilterChip label={t('tabReported')} selected={tab === 'reported'} onPress={() => setTab('reported')} />
        <FilterChip label={t('tabClaimed')} selected={tab === 'claimed'} onPress={() => setTab('claimed')} />
        <FilterChip label={t('tabResolved')} selected={tab === 'resolved'} onPress={() => setTab('resolved')} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t('nothingHere')}</Text>}
        renderItem={({ item }) => <CaseRow item={item} onPress={() => router.push(`/case/${item.id}`)} />}
      />
    </View>
  );
}

function CaseRow({ item, onPress }: { item: Case; onPress: () => void }) {
  const { t } = useTranslation();
  const urgency = urgencyColor(item.urgency);
  const status = statusColor(item.status);
  const initial = (item.reporter_id || '?').charAt(0).toUpperCase();

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.badge, { backgroundColor: personBadgeColor(item.id) }]}>
        <Text style={styles.badgeLabel}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowTop}>
          <View style={[styles.dot, { backgroundColor: urgency.color }]} />
          <Text style={styles.rowSpecies}>{item.species}</Text>
        </View>
        <Text style={styles.rowMeta}>
          {item.code} · {item.address ?? `${item.lat.toFixed(3)}, ${item.lng.toFixed(3)}`}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusLabel, { color: status.color }]}>{t(STATUS_LABEL_KEY[item.status])}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 58 },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.textPrimary, paddingHorizontal: spacing.xl, marginBottom: 12 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.xl, marginBottom: 14 },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 100, gap: 12 },
  empty: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.textMuted55, textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
  },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  badgeLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.white },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowSpecies: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.textPrimary },
  rowMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted55, marginBottom: 6 },
  statusPill: { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 10 },
  statusLabel: { fontFamily: fonts.bold, fontSize: 11 },
});
