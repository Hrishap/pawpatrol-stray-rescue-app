import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { useAdoptableAnimal } from '@/hooks/useShelters';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function AdoptDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: animal } = useAdoptableAnimal(id);

  if (!animal) return <Loading />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.photoHeader}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.name}>{animal.name}</Text>
        <View style={styles.chipsRow}>
          <Chip label={animal.age_text} />
          <Chip label={animal.gender} />
          {!!animal.breed && <Chip label={animal.breed} />}
          {animal.vaccinated && <Chip label={t('vaccinated')} accent />}
          {animal.sterilized && <Chip label={t('sterilized')} accent />}
        </View>

        <Text style={styles.sectionLabel}>{t('story')}</Text>
        <Text style={styles.story}>{animal.story}</Text>

        <Button
          label={t('contactShelter')}
          onPress={() => Alert.alert(t('toastInterestSent'))}
        />
      </View>
    </ScrollView>
  );
}

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <View style={[styles.chip, accent && styles.chipAccent]}>
      <Text style={[styles.chipLabel, accent && styles.chipLabelAccent]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  photoHeader: { height: 220, backgroundColor: colors.hairline12 },
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
  name: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.textPrimary, marginBottom: 10 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingVertical: 6, paddingHorizontal: 13, borderRadius: 14, backgroundColor: colors.hairline06 },
  chipAccent: { backgroundColor: colors.monitoringBg },
  chipLabel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textPrimary },
  chipLabelAccent: { color: colors.monitoringDark },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textMuted50,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  story: { fontFamily: fonts.regular, fontSize: fontSize.body, lineHeight: 21, color: colors.textPrimary, marginBottom: 24 },
});
