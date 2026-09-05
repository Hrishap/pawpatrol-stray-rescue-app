import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { LeafletMap } from '@/components/LeafletMap';
import { ReportHeader } from '@/components/ReportHeader';
import { useReportDraft } from '@/hooks/useReportDraft';
import { reverseGeocode } from '@/lib/geocode';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function ReportStep3() {
  const { t } = useTranslation();
  const { draft, update } = useReportDraft();
  const [locating, setLocating] = useState(true);
  // The map recenters whenever `center` changes, so track the pin position
  // separately: feeding the live draft coords back in would yank the map
  // back under the user's finger on every drag.
  const [mapCenter, setMapCenter] = useState({ lat: draft.lat, lng: draft.lng });
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.granted) {
        try {
          const pos = await Location.getCurrentPositionAsync({});
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          update({ lat, lng });
          setMapCenter({ lat, lng });
          const address = await reverseGeocode(lat, lng);
          update({ address });
        } catch {
          // keep the default Kochi center if location fails
        }
      }
      setLocating(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMarkerMove = (coords: { lat: number; lng: number }) => {
    update({ lat: coords.lat, lng: coords.lng, address: null });
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      const address = await reverseGeocode(coords.lat, coords.lng);
      update({ address });
    }, 600);
  };

  return (
    <View style={styles.container}>
      <ReportHeader step={3} onBack={() => router.back()} />
      <View style={styles.body}>
        <Text style={styles.title}>{t('confirmLocation')}</Text>
        <Text style={styles.subtitle}>{t('locationSub')}</Text>

        <View style={styles.mapWrap}>
          <LeafletMap
            center={mapCenter}
            draggableMarker={{ lat: draft.lat, lng: draft.lng }}
            onDraggableMarkerMove={onMarkerMove}
            onMapPress={onMarkerMove}
            zoom={16}
          />
        </View>
        <Text style={styles.hint}>{t('dragPinHint')}</Text>

        <View style={styles.addressRow}>
          <Text style={styles.addressText} numberOfLines={2}>
            {locating ? t('loading') : (draft.address ?? `${draft.lat.toFixed(5)}, ${draft.lng.toFixed(5)}`)}
          </Text>
        </View>

        <Button label={t('looksRight')} onPress={() => router.push('/report/step4')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: 20 },
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
    marginBottom: 10,
  },
  mapWrap: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textMuted45,
    marginTop: 8,
    textAlign: 'center',
  },
  addressRow: {
    marginVertical: 16,
  },
  addressText: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
});
