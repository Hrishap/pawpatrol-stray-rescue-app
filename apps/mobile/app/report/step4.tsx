import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { ReportHeader } from '@/components/ReportHeader';
import { useReportDraft } from '@/hooks/useReportDraft';
import { colors, fonts, fontSize, spacing, urgencyColor } from '@/theme';
import type { CaseUrgency } from '@/types/database';

const URGENCY_OPTIONS: { id: CaseUrgency; labelKey: string; descKey: string }[] = [
  { id: 'critical', labelKey: 'urgencyCriticalLabel', descKey: 'urgencyCriticalDesc' },
  { id: 'attention', labelKey: 'urgencyAttentionLabel', descKey: 'urgencyAttentionDesc' },
  { id: 'monitoring', labelKey: 'urgencyMonitoringLabel', descKey: 'urgencyMonitoringDesc' },
];

export default function ReportStep4() {
  const { t } = useTranslation();
  const { draft, update } = useReportDraft();

  return (
    <View style={styles.container}>
      <ReportHeader step={4} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>{t('howUrgent')}</Text>
        <Text style={styles.subtitle}>{t('urgentSub')}</Text>

        <View style={styles.options}>
          {URGENCY_OPTIONS.map((opt) => {
            const selected = draft.urgency === opt.id;
            const { color, bg } = urgencyColor(opt.id);
            return (
              <Pressable
                key={opt.id}
                onPress={() => update({ urgency: opt.id })}
                style={[
                  styles.option,
                  { borderColor: selected ? color : colors.hairline15 },
                  selected && { backgroundColor: bg },
                ]}
              >
                <View style={[styles.dot, { backgroundColor: color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{t(opt.labelKey)}</Text>
                  <Text style={styles.optionDesc}>{t(opt.descKey)}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>{t('addNote')}</Text>
        <TextInput
          value={draft.note}
          onChangeText={(v) => update({ note: v })}
          placeholder={t('notePlaceholder')}
          placeholderTextColor={colors.textMuted45}
          multiline
          style={styles.noteInput}
        />
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label={t('submitReport')}
          onPress={() => router.push('/report/step5')}
          disabled={!draft.urgency}
        />
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
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.textMuted60,
    marginBottom: 16,
  },
  options: { gap: 10, marginBottom: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  optionLabel: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.textPrimary },
  optionDesc: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted55, marginTop: 2 },
  label: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textMuted50,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  noteInput: {
    minHeight: 72,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.hairline15,
    padding: 12,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    textAlignVertical: 'top',
  },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: 8, paddingTop: 12 },
});
