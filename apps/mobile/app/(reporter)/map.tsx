import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FilterChip } from '@/components/FilterChip';
import { LeafletMap, type MapPin } from '@/components/LeafletMap';
import { useAuth } from '@/hooks/useAuth';
import { useCases } from '@/hooks/useCases';
import { useDeviceLocation } from '@/hooks/useDeviceLocation';
import { useNotifications } from '@/hooks/useNotifications';
import { colors, fonts, spacing, urgencyColor } from '@/theme';
import type { CaseSpecies, CaseUrgency } from '@/types/database';

const SPECIES_FILTERS: (CaseSpecies | 'All')[] = ['All', 'Dog', 'Cat', 'Cattle'];
const URGENCY_FILTERS: (CaseUrgency | 'All')[] = ['All', 'critical', 'attention', 'monitoring'];
const URGENCY_LABEL_KEY: Record<CaseUrgency, string> = {
  critical: 'urgencyCriticalLabel',
  attention: 'urgencyAttentionLabel',
  monitoring: 'urgencyMonitoringLabel',
};

export default function MapScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { coords } = useDeviceLocation();
  const { data: cases = [] } = useCases();
  const { data: notifications = [] } = useNotifications();
  const [speciesFilter, setSpeciesFilter] = useState<CaseSpecies | 'All'>('All');
  const [urgencyFilter, setUrgencyFilter] = useState<CaseUrgency | 'All'>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const hasUnread = notifications.some((n) => !n.read_at);

  const filtered = useMemo(
    () =>
      cases.filter(
        (c) =>
          c.status !== 'resolved' &&
          (speciesFilter === 'All' || c.species === speciesFilter) &&
          (urgencyFilter === 'All' || c.urgency === urgencyFilter),
      ),
    [cases, speciesFilter, urgencyFilter],
  );

  const pins: MapPin[] = filtered.map((c) => ({
    id: c.id,
    lat: c.lat,
    lng: c.lng,
    color: urgencyColor(c.urgency).color,
    pulse: c.urgency === 'critical' && c.status === 'open',
  }));

  const selectedCase = filtered.find((c) => c.id === selectedId) ?? null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerLabel}>{t('liveRescueMap')}</Text>
          <Text style={styles.headerLocation}>{t('location')}</Text>
        </View>
        <Pressable onPress={() => router.push('/notifications')} style={styles.iconButton}>
          <Text style={styles.iconGlyph}>🔔</Text>
          {hasUnread && <View style={styles.unreadDot} />}
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>{(profile?.full_name ?? '?').charAt(0)}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {SPECIES_FILTERS.map((sp) => (
          <View key={sp} style={{ marginRight: 8 }}>
            <FilterChip
              label={sp}
              selected={speciesFilter === sp}
              onPress={() => setSpeciesFilter(sp)}
            />
          </View>
        ))}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chipsRow, { paddingBottom: 10 }]}
      >
        {URGENCY_FILTERS.map((u) => (
          <View key={u} style={{ marginRight: 8 }}>
            <FilterChip
              label={u === 'All' ? 'All urgency' : t(URGENCY_LABEL_KEY[u])}
              selected={urgencyFilter === u}
              onPress={() => setUrgencyFilter(u)}
              dotColor={u === 'All' ? undefined : urgencyColor(u).color}
              size="small"
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.mapWrap}>
        <LeafletMap
          center={coords}
          pins={pins}
          zoom={13}
          onPinPress={setSelectedId}
          onMapPress={() => setSelectedId(null)}
        />

        {selectedCase && (
          <View style={styles.popup}>
            <View style={styles.popupThumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.popupTitle}>
                {selectedCase.species} · {t(URGENCY_LABEL_KEY[selectedCase.urgency])}
              </Text>
              <Text style={styles.popupMeta}>{selectedCase.address ?? selectedCase.code}</Text>
            </View>
            <Pressable
              style={styles.popupButton}
              onPress={() => router.push(`/case/${selectedCase.id}`)}
            >
              <Text style={styles.popupButtonLabel}>View</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.fab} onPress={() => router.push('/report/step1')}>
          <Text style={styles.fabPlus}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 58,
    paddingHorizontal: spacing.xl,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textMuted50,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  headerLocation: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline08,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: { fontSize: 16 },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.critical,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.background },
  chipsRow: { paddingHorizontal: spacing.xl, paddingVertical: 4 },
  mapWrap: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 100,
    borderRadius: 20,
    overflow: 'hidden',
  },
  popup: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  popupThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.hairline10,
  },
  popupTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.textPrimary },
  popupMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted55, marginTop: 2 },
  popupButton: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: colors.brand,
    borderRadius: 12,
  },
  popupButtonLabel: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.background },
  fab: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPlus: { fontSize: 28, color: colors.background, marginTop: -2 },
});
