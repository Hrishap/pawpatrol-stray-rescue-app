import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { SPECIES_ICON } from '@/components/CaseRow';
import { Button } from '@/components/Button';
import { LeafletMap } from '@/components/LeafletMap';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import {
  advanceCase,
  assignCase,
  claimCase,
  setCaseNgoNotes,
  useCase,
  useCaseHistory,
  verifyCase,
} from '@/hooks/useCases';
import { useDeviceLocation } from '@/hooks/useDeviceLocation';
import { useProfile, useVolunteers } from '@/hooks/useProfile';
import { formatDistance, formatRelativeTime, haversineKm } from '@/lib/format';
import { colors, fonts, fontSize, personBadgeColor, spacing, urgencyColor } from '@/theme';
import type { CaseStatus } from '@/types/database';

const TIMELINE_STEPS: { status: CaseStatus | 'in_progress_or_pending'; labelKey: string }[] = [
  { status: 'open', labelKey: 'tabReported' },
  { status: 'claimed', labelKey: 'tabClaimed' },
  { status: 'in_progress_or_pending', labelKey: 'markInProgress' },
  { status: 'resolved', labelKey: 'tabResolved' },
];

function stepIndexForStatus(status: CaseStatus) {
  switch (status) {
    case 'open':
      return 0;
    case 'claimed':
      return 1;
    case 'in_progress':
    case 'pending_verification':
      return 2;
    case 'resolved':
      return 3;
  }
}

export default function CaseDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuth();
  const { coords } = useDeviceLocation();
  const { data: activeCase } = useCase(id);
  const { data: history = [] } = useCaseHistory(id);
  const { data: claimant } = useProfile(activeCase?.claimed_by);
  const { data: reporter } = useProfile(activeCase?.reporter_id);
  const { data: volunteers = [] } = useVolunteers();
  const [ngoNoteDraft, setNgoNoteDraft] = useState('');
  const [reassignOpen, setReassignOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const uid = session?.user.id;

  if (!activeCase || !profile) return <Loading />;

  const urgency = urgencyColor(activeCase.urgency);
  const currentStep = stepIndexForStatus(activeCase.status);
  const distanceKm = haversineKm(coords, { lat: activeCase.lat, lng: activeCase.lng });

  const isNgoRole = profile.role === 'ngo';
  const isReporterOwnCase = profile.role === 'reporter' && activeCase.reporter_id === uid;
  const claimedByMe = activeCase.claimed_by === uid && activeCase.status !== 'resolved';
  const canClaim = activeCase.status === 'open';
  const canAdvance =
    activeCase.claimed_by === uid &&
    (activeCase.status === 'claimed' || activeCase.status === 'in_progress');
  const canVerify = activeCase.status === 'pending_verification';
  const resolved = activeCase.status === 'resolved';

  const viewNgo = isNgoRole;
  const viewReadonly = !isNgoRole && isReporterOwnCase;
  const viewDefault = !isNgoRole && !isReporterOwnCase;

  const run = async (fn: () => Promise<void>, successMsg?: string) => {
    setBusy(true);
    try {
      await fn();
      if (successMsg) Alert.alert(successMsg);
    } catch (err) {
      Alert.alert(t('somethingWentWrong'), err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const advanceLabel = activeCase.status === 'in_progress' ? t('markResolved') : t('markInProgress');

  const readonlyLabel = resolved
    ? t('caseResolvedLabel')
    : activeCase.claimed_by
      ? `${t('contactedPrefix')} ${claimant?.full_name ?? ''}`
      : t('awaitingRescuer');

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.photoHeader}>
          {activeCase.photo_url ? (
            <Image source={{ uri: activeCase.photo_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.photoPlaceholder]}>
              <MaterialCommunityIcons
                name={SPECIES_ICON[activeCase.species]}
                size={72}
                color={colors.hairline15}
              />
            </View>
          )}
          <View style={styles.photoTopRow}>
            <Pressable onPress={() => router.back()} style={styles.iconButton}>
              <Text style={styles.backChevron}>‹</Text>
            </Pressable>
            {viewNgo && (
              <View style={styles.ngoBadge}>
                <Text style={styles.ngoBadgeLabel}>{t('ngoView')}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <View style={[styles.urgencyPill, { backgroundColor: urgency.bg }]}>
              <Text style={[styles.urgencyLabel, { color: urgency.color }]}>
                {t(`urgency${cap(activeCase.urgency)}Label`)}
              </Text>
            </View>
            <Text style={styles.metaText}>
              {activeCase.code} · {formatRelativeTime(activeCase.created_at)}
            </Text>
          </View>
          <Text style={styles.speciesTitle}>{activeCase.species}</Text>
          <Text style={styles.subMeta}>
            {activeCase.breed ?? ''} · {reporter?.full_name ?? '…'} · {formatDistance(distanceKm)}
          </Text>

          {activeCase.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {activeCase.tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagChipLabel}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.miniMap}>
            <LeafletMap
              center={{ lat: activeCase.lat, lng: activeCase.lng }}
              pins={[{ id: activeCase.id, lat: activeCase.lat, lng: activeCase.lng, color: urgency.color }]}
              interactive={false}
              zoom={14}
            />
          </View>

          {!!activeCase.note && (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>&ldquo;{activeCase.note}&rdquo;</Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>{t('statusSectionLabel')}</Text>
          <View style={styles.timeline}>
            {TIMELINE_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const isLast = i === TIMELINE_STEPS.length - 1;
              return (
                <View key={step.labelKey} style={styles.timelineRow}>
                  <View style={styles.timelineDotCol}>
                    <View style={[styles.timelineDot, done && styles.timelineDotDone]}>
                      {done && <Text style={styles.timelineCheck}>✓</Text>}
                    </View>
                    {!isLast && <View style={[styles.timelineLine, done && styles.timelineLineDone]} />}
                  </View>
                  <View style={{ paddingBottom: 20 }}>
                    <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]}>
                      {t(step.labelKey)}
                    </Text>
                    {i === 1 && activeCase.claimed_by && done && (
                      <Text style={styles.timelineSub}>by {claimant?.full_name ?? '…'}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {viewNgo && (
          <View>
            <Text style={styles.sectionLabel}>{t('assignedVolunteer')}</Text>
            <View style={styles.assignRow}>
              <View style={[styles.assignBadge, { backgroundColor: personBadgeColor(activeCase.claimed_by ?? activeCase.id) }]}>
                <Text style={styles.assignBadgeLabel}>{(claimant?.full_name ?? '?').charAt(0)}</Text>
              </View>
              <Text style={styles.assignName}>{claimant?.full_name ?? t('unassigned')}</Text>
              <Pressable style={styles.reassignButton} onPress={() => setReassignOpen(true)}>
                <Text style={styles.reassignLabel}>{activeCase.claimed_by ? t('reassign') : t('assign')}</Text>
              </Pressable>
            </View>
            <Text style={styles.sectionLabel}>{t('internalNotes')}</Text>
            <TextInput
              value={ngoNoteDraft || activeCase.ngo_notes}
              onChangeText={setNgoNoteDraft}
              onBlur={() => run(() => setCaseNgoNotes(activeCase.id, ngoNoteDraft))}
              placeholder={t('internalNotesPlaceholder')}
              multiline
              style={styles.notesInput}
            />
            {resolved ? (
              <View style={styles.disabledPill}>
                <Text style={styles.disabledPillLabel}>{t('caseResolvedLabel')}</Text>
              </View>
            ) : canVerify ? (
              <Button
                label={t('verifyResolution')}
                loading={busy}
                onPress={() => run(() => verifyCase(activeCase.id))}
              />
            ) : null}
          </View>
        )}

        {viewReadonly && (
          <View style={styles.footerRow}>
            <View style={[styles.disabledPill, { flex: 1 }]}>
              <Text style={styles.disabledPillLabel}>{readonlyLabel}</Text>
            </View>
            {activeCase.claimed_by && (
              <Pressable style={styles.chatButton} onPress={() => router.push(`/chat/${activeCase.id}`)}>
                <Text style={styles.chatGlyph}>💬</Text>
              </Pressable>
            )}
          </View>
        )}

        {viewDefault && (
          <View style={styles.footerRow}>
            {canClaim && (
              <Button
                label={t('illHelp')}
                loading={busy}
                onPress={() => run(() => claimCase(activeCase.id))}
              />
            )}
            {claimedByMe && (
              <>
                <View style={[styles.claimedPill, { flex: 1 }]}>
                  <Text style={styles.claimedPillLabel}>{t('onThisCase')}</Text>
                </View>
                <Pressable style={styles.chatButton} onPress={() => router.push(`/chat/${activeCase.id}`)}>
                  <Text style={styles.chatGlyph}>💬</Text>
                </Pressable>
              </>
            )}
            {canAdvance && (
              <Button
                label={advanceLabel}
                loading={busy}
                onPress={() => run(() => advanceCase(activeCase.id))}
              />
            )}
            {resolved && !claimedByMe && (
              <View style={[styles.disabledPill, { flex: 1 }]}>
                <Text style={styles.disabledPillLabel}>{t('caseResolvedLabel')}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <BottomSheet visible={reassignOpen} onClose={() => setReassignOpen(false)}>
        <Text style={styles.sheetTitle}>{t('assignedVolunteer')}</Text>
        {volunteers.map((v) => (
          <Pressable
            key={v.id}
            style={styles.sheetRow}
            onPress={() =>
              run(() => assignCase(activeCase.id, v.id)).then(() => setReassignOpen(false))
            }
          >
            <Text style={styles.sheetRowLabel}>{v.full_name}</Text>
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  photoHeader: { height: 190, backgroundColor: colors.hairline12 },
  photoPlaceholder: { backgroundColor: colors.mapCanvas, alignItems: 'center', justifyContent: 'center' },
  photoTopRow: { position: 'absolute', top: 56, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  iconButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  backChevron: { fontSize: 20, color: colors.textPrimary, marginTop: -2 },
  ngoBadge: { backgroundColor: 'rgba(255,255,255,0.7)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start' },
  ngoBadgeLabel: { fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted50 },
  body: { padding: spacing.xl },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  urgencyPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
  urgencyLabel: { fontFamily: fonts.bold, fontSize: 11.5 },
  metaText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted50 },
  speciesTitle: { fontFamily: fonts.extrabold, fontSize: 21, color: colors.textPrimary, marginBottom: 2 },
  subMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted60, marginBottom: 14 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tagChip: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 12, backgroundColor: colors.hairline06 },
  tagChipLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textPrimary },
  miniMap: { height: 90, borderRadius: 16, overflow: 'hidden', marginBottom: 18 },
  noteBox: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline08, borderRadius: 14, padding: 14, marginBottom: 20 },
  noteText: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.textPrimary, lineHeight: 20 },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted50, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 },
  timeline: {},
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineDotCol: { alignItems: 'center' },
  timelineDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.hairline15, alignItems: 'center', justifyContent: 'center' },
  timelineDotDone: { backgroundColor: colors.brand, borderColor: colors.brand },
  timelineCheck: { color: colors.white, fontSize: 11 },
  timelineLine: { width: 2, flex: 1, minHeight: 22, backgroundColor: colors.hairline15 },
  timelineLineDone: { backgroundColor: colors.brand },
  timelineLabel: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.textMuted50 },
  timelineLabelDone: { color: colors.textPrimary },
  timelineSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted50, marginTop: 2 },
  footer: { padding: spacing.xl, borderTopWidth: 1, borderTopColor: colors.hairline08 },
  footerRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  claimedPill: { height: 52, borderRadius: 26, backgroundColor: colors.monitoringBg, alignItems: 'center', justifyContent: 'center' },
  claimedPillLabel: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.monitoringDark },
  disabledPill: { height: 52, borderRadius: 26, backgroundColor: colors.hairline06, alignItems: 'center', justifyContent: 'center' },
  disabledPillLabel: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.textMuted50 },
  chatButton: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.hairline10, alignItems: 'center', justifyContent: 'center' },
  chatGlyph: { fontSize: 19 },
  assignRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline08, borderRadius: 14, padding: 12, marginBottom: 16 },
  assignBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  assignBadgeLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.white },
  assignName: { flex: 1, fontFamily: fonts.bold, fontSize: 13.5, color: colors.textPrimary },
  reassignButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.hairline06 },
  reassignLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.textPrimary },
  notesInput: { minHeight: 64, borderRadius: 14, borderWidth: 1.5, borderColor: colors.hairline15, padding: 12, fontFamily: fonts.regular, fontSize: 13.5, color: colors.textPrimary, backgroundColor: colors.white, marginBottom: 16, textAlignVertical: 'top' },
  sheetTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.textPrimary, textAlign: 'center', marginBottom: 14 },
  sheetRow: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14 },
  sheetRowLabel: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.textPrimary },
});
