import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, spacing } from '@/theme';

const SLIDE_COUNT = 3;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  const [title, body] = t(`slide${index + 1}`, { returnObjects: true }) as [string, string];
  const isLast = index === SLIDE_COUNT - 1;

  const next = () => {
    if (isLast) {
      router.replace('/(onboarding)/role-select');
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={12}>
          <Text style={styles.skip}>{t('skip')}</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.illustration}>
          <View style={[styles.blob, styles.blobA]} />
          <View style={[styles.blob, styles.blobB]} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>

      <View style={styles.dots}>
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.ctaWrap}>
        <Pressable
          onPress={next}
          style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.97 }] }]}
        >
          <Text style={styles.ctaLabel}>{isLast ? t('getStarted') : t('next')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingDark,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
  },
  skip: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: 'rgba(251,246,234,0.7)',
    padding: 6,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  illustration: {
    width: '100%',
    maxWidth: 280,
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(251,246,234,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(251,246,234,0.22)',
    marginBottom: 36,
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blobA: {
    width: 120,
    height: 120,
    top: -30,
    left: -20,
    backgroundColor: 'rgba(251,246,234,0.18)',
  },
  blobB: {
    width: 90,
    height: 90,
    bottom: -20,
    right: 10,
    backgroundColor: 'rgba(232,162,58,0.22)',
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.onboardingHeadline,
    lineHeight: 33,
    color: colors.background,
    textAlign: 'center',
    marginBottom: 14,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(251,246,234,0.75)',
    textAlign: 'center',
    maxWidth: 300,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingBottom: 26,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(251,246,234,0.3)',
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.background,
  },
  ctaWrap: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: 40,
  },
  cta: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.onboardingDark,
  },
});
