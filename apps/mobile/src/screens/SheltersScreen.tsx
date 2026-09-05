import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { LeafletMap, type MapPin } from '@/components/LeafletMap';
import { useDeviceLocation } from '@/hooks/useDeviceLocation';
import { useShelters } from '@/hooks/useShelters';
import { formatDistance, haversineKm } from '@/lib/format';
import { colors, fonts, fontSize, spacing } from '@/theme';
import type { Shelter } from '@/types/database';

type ViewMode = 'list' | 'map';

export function SheltersScreen() {
  const { t } = useTranslation();
  const { coords } = useDeviceLocation();
  // Postgres does the radius filter and nearest-first ordering.
  const { data: shelters = [] } = useShelters(coords);
  const [view, setView] = useState<ViewMode>('list');

  const pins: MapPin[] = shelters.map((s) => ({
    id: s.id,
    lat: s.lat,
    lng: s.lng,
    color: colors.brand,
    label: s.name,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('sheltersVets')}</Text>
        <View style={styles.toggle}>
          <Pressable
            style={[styles.toggleOption, view === 'list' && styles.toggleOptionActive]}
            onPress={() => setView('list')}
          >
            <Text style={[styles.toggleLabel, view === 'list' && styles.toggleLabelActive]}>
              {t('listView')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleOption, view === 'map' && styles.toggleOptionActive]}
            onPress={() => setView('map')}
          >
            <Text style={[styles.toggleLabel, view === 'map' && styles.toggleLabelActive]}>
              {t('mapView')}
            </Text>
          </Pressable>
        </View>
      </View>

      {view === 'list' ? (
        <FlatList
          data={shelters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t('noSheltersNearby')}</Text>}
          renderItem={({ item }) => (
            <ShelterRow item={item} distanceKm={haversineKm(coords, item)} />
          )}
        />
      ) : (
        <View style={styles.mapWrap}>
          <LeafletMap
            center={coords}
            pins={pins}
            zoom={12}
            fitToPins
            onPinPress={(id) => router.push(`/shelter/${id}`)}
          />
        </View>
      )}
    </View>
  );
}

function ShelterRow({ item, distanceKm }: { item: Shelter; distanceKm: number }) {
  return (
    <Pressable style={styles.row} onPress={() => router.push(`/shelter/${item.id}`)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarLabel}>{item.name.charAt(0)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          ★ {item.rating.toFixed(1)} · {item.review_count} reviews · {formatDistance(distanceKm)}
        </Text>
        <Text style={[styles.hours, { color: item.is_open ? colors.monitoring : colors.attention }]}>
          {item.hours_text}
        </Text>
        <View style={styles.servicesRow}>
          {item.services.slice(0, 3).map((s) => (
            <View key={s} style={styles.serviceChip}>
              <Text style={styles.serviceChipLabel}>{s}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 58 },
  headerRow: { paddingHorizontal: spacing.xl, marginBottom: 14 },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.textPrimary, marginBottom: 12 },
  toggle: { flexDirection: 'row', backgroundColor: colors.hairline06, borderRadius: 12, padding: 3 },
  toggleOption: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  toggleOptionActive: { backgroundColor: colors.white },
  toggleLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted55 },
  toggleLabelActive: { color: colors.textPrimary },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 100, gap: 12 },
  empty: {
    fontFamily: fonts.regular,
    fontSize: fontSize.body,
    color: colors.textMuted55,
    textAlign: 'center',
    marginTop: 40,
  },
  mapWrap: { flex: 1, marginHorizontal: 16, marginBottom: 16, borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 12, backgroundColor: colors.white, borderRadius: 18, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  avatarLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.background },
  name: { fontFamily: fonts.bold, fontSize: fontSize.emphasis, color: colors.textPrimary, marginBottom: 2 },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted55, marginBottom: 2 },
  hours: { fontFamily: fonts.semibold, fontSize: 12, marginBottom: 6 },
  servicesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  serviceChip: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 10, backgroundColor: colors.hairline06 },
  serviceChipLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textPrimary },
});
