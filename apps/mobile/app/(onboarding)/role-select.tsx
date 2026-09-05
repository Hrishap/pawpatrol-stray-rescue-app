import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { UserRole } from '@/types/database';
import { colors, fonts, fontSize, spacing } from '@/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const ROLES: { id: UserRole; labelKey: string; descKey: string; icon: IconName }[] = [
  { id: 'reporter', labelKey: 'reporterLabel', descKey: 'reporterDesc', icon: 'camera-outline' },
  { id: 'volunteer', labelKey: 'volunteerLabel', descKey: 'volunteerDesc', icon: 'hand-heart' },
  { id: 'ngo', labelKey: 'ngoLabel', descKey: 'ngoDesc', icon: 'home-heart' },
];

export default function RoleSelectScreen() {
  const { t } = useTranslation();
  const [role, setRole] = useState<UserRole | null>(null);

  const confirm = () => {
    if (!role) return;
    router.push({ pathname: '/(auth)/signup', params: { role } });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('howHelp')}</Text>
      <Text style={styles.subtitle}>{t('howHelpSub')}</Text>

      <View style={styles.cards}>
        {ROLES.map((r) => {
          const selected = role === r.id;
          return (
            <Pressable
              key={r.id}
              onPress={() => setRole(r.id)}
              style={[styles.card, selected && styles.cardSelected]}
            >
              <View style={[styles.iconTile, selected && styles.iconTileSelected]}>
                <MaterialCommunityIcons
                  name={r.icon}
                  size={24}
                  color={selected ? colors.background : colors.brand}
                />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardLabel}>{t(r.labelKey)}</Text>
                <Text style={styles.cardDesc}>{t(r.descKey)}</Text>
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]} />
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={confirm}
        disabled={!role}
        style={[styles.cta, !role && styles.ctaDisabled]}
      >
        <Text style={styles.ctaLabel}>{t('continueBtn')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingTop: 64,
    paddingHorizontal: spacing.xl,
    paddingBottom: 32,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.body,
    lineHeight: 20,
    color: colors.textMuted60,
    marginBottom: 24,
  },
  cards: {
    gap: 12,
  },
  card: {
    borderWidth: 2,
    borderColor: colors.hairline12,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  cardSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.monitoringBg,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.monitoringBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileSelected: {
    backgroundColor: colors.brand,
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted60,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.hairline12,
    marginTop: 2,
  },
  radioSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
  },
  cta: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  ctaDisabled: {
    backgroundColor: colors.hairline15,
  },
  ctaLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.background,
  },
});
