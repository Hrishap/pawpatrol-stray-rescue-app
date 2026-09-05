import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { STATUS_LABEL_KEY } from '@/components/CaseRow';
import { assignCase, useCases } from '@/hooks/useCases';
import { useVolunteers } from '@/hooks/useProfile';
import { colors, fonts, spacing, statusColor, urgencyColor } from '@/theme';
import type { Case } from '@/types/database';

export default function NgoQueue() {
  const { t } = useTranslation();
  const { data: cases = [] } = useCases();
  const { data: volunteers = [] } = useVolunteers();
  const [assignTarget, setAssignTarget] = useState<Case | null>(null);

  const doAssign = async (volunteerId: string) => {
    if (!assignTarget) return;
    try {
      await assignCase(assignTarget.id, volunteerId);
      const v = volunteers.find((x) => x.id === volunteerId);
      Alert.alert(t('toastAssigned', { name: v?.full_name ?? '' }));
    } catch (err) {
      Alert.alert(t('somethingWentWrong'), err instanceof Error ? err.message : String(err));
    } finally {
      setAssignTarget(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('caseQueue')}</Text>
      <FlatList
        data={cases}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const urgency = urgencyColor(item.urgency);
          const status = statusColor(item.status);
          const volunteerName = volunteers.find((v) => v.id === item.claimed_by)?.full_name;
          return (
            <Pressable style={styles.row} onPress={() => router.push(`/case/${item.id}`)}>
              <View style={[styles.dot, { backgroundColor: urgency.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowSpecies}>
                  {item.species} · {item.code}
                </Text>
                <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusLabel, { color: status.color }]}>
                    {t(STATUS_LABEL_KEY[item.status])}
                  </Text>
                </View>
                <Text style={styles.assignedText}>
                  {volunteerName ? `${t('assignedVolunteer')}: ${volunteerName}` : t('unassigned')}
                </Text>
              </View>
              <Pressable
                style={styles.assignButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setAssignTarget(item);
                }}
              >
                <Text style={styles.assignButtonLabel}>
                  {item.claimed_by ? t('reassign') : t('assign')}
                </Text>
              </Pressable>
            </Pressable>
          );
        }}
      />

      <BottomSheet visible={!!assignTarget} onClose={() => setAssignTarget(null)}>
        <Text style={styles.sheetTitle}>{t('assignedVolunteer')}</Text>
        {volunteers.map((v) => (
          <Pressable key={v.id} style={styles.sheetRow} onPress={() => doAssign(v.id)}>
            <Text style={styles.sheetRowLabel}>{v.full_name}</Text>
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 58 },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.textPrimary, paddingHorizontal: spacing.xl, marginBottom: 12 },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 100, gap: 12 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, padding: 14 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowSpecies: { fontFamily: fonts.bold, fontSize: 14, color: colors.textPrimary, marginBottom: 4 },
  statusPill: { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 10, marginBottom: 4 },
  statusLabel: { fontFamily: fonts.bold, fontSize: 11 },
  assignedText: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted55 },
  assignButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.hairline06 },
  assignButtonLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.textPrimary },
  sheetTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.textPrimary, textAlign: 'center', marginBottom: 14 },
  sheetRow: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14 },
  sheetRowLabel: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.textPrimary },
});
