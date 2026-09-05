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
  const { data: animals = [] } = useAdoptableAnimals();
  const { data: shelters = [] } = useShelters();

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
        renderItem={({ item }) => {
          const shelter = shelters.find((s) => s.id === item.shelter_id);
          const distance = shelter ? formatDistance(haversineKm(coords, shelter)) : '';
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/adopt/${item.id}`)}>
              <View style={styles.photo} />
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
  photo: { height: 110, borderRadius: 14, backgroundColor: colors.hairline10, marginBottom: 8 },
  name: { fontFamily: fonts.bold, fontSize: 14, color: colors.textPrimary },
  meta: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted55, marginTop: 2 },
  distance: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted50, marginTop: 2 },
});
