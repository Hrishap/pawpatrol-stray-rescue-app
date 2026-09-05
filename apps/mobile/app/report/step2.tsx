import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { ReportHeader } from '@/components/ReportHeader';
import { TAG_POOL, useReportDraft } from '@/hooks/useReportDraft';
import { colors, fonts, fontSize, spacing } from '@/theme';
import type { CaseSpecies } from '@/types/database';

const SPECIES: CaseSpecies[] = ['Dog', 'Cat', 'Cattle'];

export default function ReportStep2() {
  const { t } = useTranslation();
  const { draft, update, toggleTag } = useReportDraft();

  return (
    <View style={styles.container}>
      <ReportHeader step={2} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>{t('confirmDetails')}</Text>

        <View style={styles.photoRow}>
          {draft.photoUri && (
            <Image source={{ uri: draft.photoUri }} style={styles.thumb} contentFit="cover" />
          )}
        </View>

        <Text style={styles.label}>{t('speciesLabel')}</Text>
        <View style={styles.speciesRow}>
          {SPECIES.map((sp) => {
            const selected = draft.species === sp;
            return (
              <Pressable
                key={sp}
                onPress={() => update({ species: sp })}
                style={[styles.speciesPill, selected && styles.speciesPillSelected]}
              >
                <Text style={[styles.speciesLabel, selected && styles.speciesLabelSelected]}>
                  {sp}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>{t('breedLabel')}</Text>
        <TextInput
          value={draft.breed}
          onChangeText={(v) => update({ breed: v })}
          placeholder={t('breedPlaceholder')}
          placeholderTextColor={colors.textMuted45}
          style={styles.breedInput}
        />

        <Text style={styles.label}>{t('conditionTags')}</Text>
        <View style={styles.tagsWrap}>
          {TAG_POOL.map((tag) => {
            const selected = draft.tags.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag)}
                style={[styles.tag, selected && styles.tagSelected]}
              >
                <Text style={[styles.tagLabel, selected && styles.tagLabelSelected]}>{tag}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button label={t('confirmContinue')} onPress={() => router.push('/report/step3')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.xl, paddingBottom: 20 },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.sectionTitle,
    color: colors.textPrimary,
    marginBottom: 14,
  },
  photoRow: { flexDirection: 'row', marginBottom: 8 },
  thumb: { width: 64, height: 64, borderRadius: 14 },
  label: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textMuted50,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
    marginTop: 14,
  },
  speciesRow: { flexDirection: 'row', gap: 8 },
  speciesPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.hairline15,
  },
  speciesPillSelected: {
    backgroundColor: colors.monitoringBg,
    borderColor: colors.brand,
  },
  speciesLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  speciesLabelSelected: {
    color: colors.brand,
  },
  breedInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.hairline15,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.hairline15,
    backgroundColor: colors.white,
  },
  tagSelected: {
    backgroundColor: colors.criticalBg,
    borderColor: colors.critical,
  },
  tagLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.textPrimary,
  },
  tagLabelSelected: {
    color: colors.critical,
  },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: 8, paddingTop: 12 },
});
