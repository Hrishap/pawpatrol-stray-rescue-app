import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { ReportHeader } from '@/components/ReportHeader';
import { useReportDraft } from '@/hooks/useReportDraft';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function ReportStep1() {
  const { t } = useTranslation();
  const { draft, update } = useReportDraft();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handlePicked = (uri: string) => {
    update({ photoUri: uri });
    router.push('/report/step2');
  };

  const takePhoto = async () => {
    setSheetOpen(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false });
    if (!result.canceled && result.assets[0]) handlePicked(result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    setSheetOpen(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      mediaTypes: ['images'],
    });
    if (!result.canceled && result.assets[0]) handlePicked(result.assets[0].uri);
  };

  return (
    <View style={styles.container}>
      <ReportHeader step={1} onBack={() => router.replace('/(reporter)/map')} />
      <View style={styles.body}>
        <Text style={styles.title}>{t('snapPhoto')}</Text>
        <Text style={styles.subtitle}>{t('snapSub')}</Text>

        {draft.photoUri ? (
          <Image source={{ uri: draft.photoUri }} style={styles.preview} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>camera viewfinder</Text>
          </View>
        )}

        <View style={styles.shutterRow}>
          <Pressable
            onPress={() => setSheetOpen(true)}
            style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.94 }] }]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </View>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <Text style={styles.sheetTitle}>{t('snapPhoto')}</Text>
        <Pressable style={styles.sheetRow} onPress={takePhoto}>
          <Text style={styles.sheetRowLabel}>{t('snapPhoto')}</Text>
        </Pressable>
        <Pressable style={styles.sheetRow} onPress={pickFromGallery}>
          <Text style={styles.sheetRowLabel}>{t('uploadGallery')}</Text>
        </Pressable>
        <Pressable style={styles.sheetCancel} onPress={() => setSheetOpen(false)}>
          <Text style={styles.sheetCancelLabel}>{t('cancel')}</Text>
        </Pressable>
      </BottomSheet>
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
    marginBottom: 16,
  },
  preview: {
    flex: 1,
    borderRadius: 20,
  },
  placeholder: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.hairline15,
    borderStyle: 'dashed',
    backgroundColor: colors.hairline06,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textMuted55,
  },
  shutterRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  shutter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.brand,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.background,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 14,
  },
  sheetRow: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  sheetRowLabel: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: colors.textPrimary,
  },
  sheetCancel: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetCancelLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.textMuted50,
  },
});
