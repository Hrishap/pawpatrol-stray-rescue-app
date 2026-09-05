import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, personBadgeColor, statusColor, urgencyColor } from '@/theme';
import type { Case, CaseSpecies, CaseStatus } from '@/types/database';

export const SPECIES_ICON: Record<CaseSpecies, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Dog: 'dog',
  Cat: 'cat',
  Cattle: 'cow',
};

export const STATUS_LABEL_KEY: Record<CaseStatus, string> = {
  open: 'statusOpen',
  claimed: 'statusClaimed',
  in_progress: 'statusInProgress',
  pending_verification: 'statusPendingVerification',
  resolved: 'statusResolved',
};

export function CaseRow({ item, onPress }: { item: Case; onPress: () => void }) {
  const { t } = useTranslation();
  const urgency = urgencyColor(item.urgency);
  const status = statusColor(item.status);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.badge, { backgroundColor: personBadgeColor(item.id) }]}>
        <MaterialCommunityIcons
          name={SPECIES_ICON[item.species]}
          size={22}
          color={colors.white}
        />
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
          <Text style={[styles.statusLabel, { color: status.color }]}>
            {t(STATUS_LABEL_KEY[item.status])}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
  },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowSpecies: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.textPrimary },
  rowMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted55, marginBottom: 6 },
  statusPill: { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 10 },
  statusLabel: { fontFamily: fonts.bold, fontSize: 11 },
});
