import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Loading } from '@/components/Loading';
import { useShelter } from '@/hooks/useShelters';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function ShelterDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: shelter } = useShelter(id);

  if (!shelter) return <Loading />;

  const call = () => {
    if (!shelter.phone) {
      Alert.alert(t('somethingWentWrong'));
      return;
    }
    Linking.openURL(`tel:${shelter.phone}`);
  };

  const directions = () => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${shelter.lat},${shelter.lng}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.photoHeader}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.name}>{shelter.name}</Text>
        <Text style={styles.meta}>
          ★ {shelter.rating.toFixed(1)} · {shelter.review_count} reviews
        </Text>
        <Text style={[styles.hours, { color: shelter.is_open ? colors.monitoring : colors.attention }]}>
          {shelter.hours_text}
        </Text>

        <View style={styles.actionsRow}>
          <Pressable style={styles.actionButton} onPress={call}>
            <Text style={styles.actionLabel}>{t('call')}</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={directions}>
            <Text style={styles.actionLabel}>{t('directions')}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>{t('services')}</Text>
        <View style={styles.chipsRow}>
          {shelter.services.map((s) => (
            <View key={s} style={styles.chip}>
              <Text style={styles.chipLabel}>{s}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t('address')}</Text>
        <Text style={styles.address}>{shelter.address}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  photoHeader: { height: 150, backgroundColor: colors.hairline12, justifyContent: 'flex-start' },
  iconButton: {
    marginTop: 56,
    marginLeft: 16,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: { fontSize: 20, color: colors.textPrimary, marginTop: -2 },
  body: { padding: spacing.xl },
  name: { fontFamily: fonts.extrabold, fontSize: 21, color: colors.textPrimary, marginBottom: 4 },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted60, marginBottom: 2 },
  hours: { fontFamily: fonts.semibold, fontSize: 13, marginBottom: 16 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.background },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textMuted50,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
    marginTop: 4,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingVertical: 6, paddingHorizontal: 13, borderRadius: 14, backgroundColor: colors.hairline06 },
  chipLabel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textPrimary },
  address: { fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textPrimary, lineHeight: 20 },
});
