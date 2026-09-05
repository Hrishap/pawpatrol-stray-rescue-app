import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { useReportDraft } from '@/hooks/useReportDraft';
import { supabase } from '@/lib/supabase';
import { uploadPhoto } from '@/lib/uploadPhoto';
import { colors, fonts, spacing } from '@/theme';

export default function ReportStep5() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { draft, reset } = useReportDraft();
  const [status, setStatus] = useState<'submitting' | 'done' | 'error'>('submitting');
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseCode, setCaseCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!session) throw new Error('Not signed in');
        let photoUrl: string | null = null;
        if (draft.photoUri) {
          photoUrl = await uploadPhoto(draft.photoUri, session.user.id);
        }
        const { data, error } = await supabase
          .from('cases')
          .insert({
            reporter_id: session.user.id,
            species: draft.species,
            breed: draft.breed || null,
            tags: draft.tags,
            urgency: draft.urgency!,
            note: draft.note,
            photo_url: photoUrl,
            lat: draft.lat,
            lng: draft.lng,
            address: draft.address,
          })
          .select('id, code')
          .single();
        if (error) throw error;
        if (!cancelled) {
          setCaseId(data.id);
          setCaseCode(data.code);
          setStatus('done');
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : String(err));
          setStatus('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'submitting') {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.brand} size="large" />
        <Text style={styles.loadingLabel}>{t('loading')}</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>{t('somethingWentWrong')}</Text>
        <Text style={styles.errorBody}>{errorMessage}</Text>
        <Button label={t('backToMap')} onPress={() => router.replace('/(reporter)/map')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeCheck}>✓</Text>
      </View>
      <Text style={styles.title}>
        {t('caseReportedPrefix')} {caseCode} {t('caseReportedSuffix')}
      </Text>
      <Text style={styles.body}>{t('caseReportedBody')}</Text>

      <Button
        label={t('viewCase')}
        onPress={() => {
          reset();
          router.replace(`/case/${caseId}`);
        }}
      />
      <View style={{ height: 10 }} />
      <Button
        label={t('backToMap')}
        variant="ghost"
        onPress={() => {
          reset();
          router.replace('/(reporter)/map');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 32,
  },
  loadingLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textMuted60,
    marginTop: 12,
    alignSelf: 'center',
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.monitoringBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    alignSelf: 'center',
  },
  badgeCheck: { fontSize: 32, color: colors.monitoringAlt },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 21,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted60,
    textAlign: 'center',
    marginBottom: 28,
  },
  errorTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.critical,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted60,
    textAlign: 'center',
    marginBottom: 20,
  },
});
