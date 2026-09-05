import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useDeviceLocation } from '@/hooks/useDeviceLocation';
import { useAdoptableAnimals, useShelters } from '@/hooks/useShelters';
import { formatDistance, haversineKm } from '@/lib/format';
import { colors, fonts, fontSize, spacing } from '@/theme';

export function AdoptGridScreen() {
  const { t } = useTranslation();
  const { coords } = useDeviceLocation();
  const { data: animals = [] } = useAdoptableAnimals(coords);
  const { data: shelters = [] } = useShelters(coords);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('readyAdoption')}</Text>
      <Text style={styles.subtitle}>{t('readyAdoptionSub')}</Text>

      <FlatList
        data={animals}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t('noAdoptablesNearby')}</Text>}
        renderItem={({ item }) => {
          const shelter = shelters.find((s) => s.id === item.shelter_id);
          const distance = shelter ? formatDistance(haversineKm(coords, shelter)) : '';
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/adopt/${item.id}`)}>
              {item.photo_url ? (
                <Image source={{ uri: item.photo_url }} style={styles.photo} contentFit="cover" />
              ) : (
                <View style={[styles.photo, styles.photoFallback]}>
                  <MaterialCommunityIcons name="paw" size={34} color={colors.brand} />
                </View>
              )}
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.breed} · {item.age_text}
              </Text>
              <Text style={styles.distance}>{distance}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 58 },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.textPrimary, paddingHorizontal: spacing.xl },
  subtitle: { fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textMuted60, paddingHorizontal: spacing.xl, marginBottom: 14 },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 100, gap: 12 },
  card: { flex: 1, backgroundColor: colors.white, borderRadius: 18, padding: 10 },
  empty: {
    fontFamily: fonts.regular,
    fontSize: fontSize.body,
    color: colors.textMuted55,
    textAlign: 'center',
    marginTop: 40,
  },
  photo: { height: 110, borderRadius: 14, backgroundColor: colors.monitoringBg, marginBottom: 8 },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.bold, fontSize: 14, color: colors.textPrimary },
  meta: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted55, marginTop: 2 },
  distance: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted50, marginTop: 2 },
});
