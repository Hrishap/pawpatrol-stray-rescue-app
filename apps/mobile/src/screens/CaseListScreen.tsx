import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { CaseRow } from '@/components/CaseRow';
import { FilterChip } from '@/components/FilterChip';
import { useAuth } from '@/hooks/useAuth';
import { useCases } from '@/hooks/useCases';
import { colors, fonts, spacing } from '@/theme';

type ReporterTab = 'reported' | 'claimed' | 'resolved';
type VolunteerTab = 'nearby' | 'claimed' | 'resolved';

interface CaseListScreenProps {
  variant: 'reporter' | 'volunteer';
}

export function CaseListScreen({ variant }: CaseListScreenProps) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { data: cases = [] } = useCases();
  const [reporterTab, setReporterTab] = useState<ReporterTab>('reported');
  const [volunteerTab, setVolunteerTab] = useState<VolunteerTab>('nearby');

  const uid = session?.user.id;

  const filtered = useMemo(() => {
    if (variant === 'volunteer') {
      switch (volunteerTab) {
        case 'nearby':
          return cases.filter((c) => c.status === 'open');
        case 'claimed':
          return cases.filter((c) => c.claimed_by === uid && c.status !== 'resolved');
        case 'resolved':
          return cases.filter((c) => c.status === 'resolved');
      }
    }
    switch (reporterTab) {
      case 'reported':
        return cases.filter((c) => c.reporter_id === uid);
      case 'claimed':
        return cases.filter((c) => c.claimed_by === uid && c.status !== 'resolved');
      case 'resolved':
        return cases.filter((c) => c.status === 'resolved');
    }
  }, [cases, variant, reporterTab, volunteerTab, uid]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{variant === 'volunteer' ? t('caseQueue') : t('myActivity')}</Text>

      {variant === 'volunteer' ? (
        <View style={styles.tabs}>
          <FilterChip label={t('tabNearby')} selected={volunteerTab === 'nearby'} onPress={() => setVolunteerTab('nearby')} />
          <FilterChip label={t('tabClaimed')} selected={volunteerTab === 'claimed'} onPress={() => setVolunteerTab('claimed')} />
          <FilterChip label={t('tabResolved')} selected={volunteerTab === 'resolved'} onPress={() => setVolunteerTab('resolved')} />
        </View>
      ) : (
        <View style={styles.tabs}>
          <FilterChip label={t('tabReported')} selected={reporterTab === 'reported'} onPress={() => setReporterTab('reported')} />
          <FilterChip label={t('tabClaimed')} selected={reporterTab === 'claimed'} onPress={() => setReporterTab('claimed')} />
          <FilterChip label={t('tabResolved')} selected={reporterTab === 'resolved'} onPress={() => setReporterTab('resolved')} />
        </View>
      )}

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 58 },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    marginBottom: 12,
  },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.xl, marginBottom: 14 },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 100, gap: 12 },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.textMuted55,
    textAlign: 'center',
    marginTop: 40,
  },
});
