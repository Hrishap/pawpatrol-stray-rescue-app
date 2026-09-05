import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { useCases } from '@/hooks/useCases';
import i18n, { type LanguageCode, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { colors, fonts, fontSize, spacing } from '@/theme';

const ROLE_LABEL_KEY: Record<string, string> = {
  reporter: 'reporterLabel',
  volunteer: 'volunteerLabel',
  ngo: 'ngoLabel',
};

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  ml: 'മലയാളം',
  hi: 'हिन्दी',
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { profile, session, signOut, refreshProfile } = useAuth();
  const { data: cases = [] } = useCases();
  const [editOpen, setEditOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile?.full_name ?? '');

  const stats = useMemo(() => {
    const uid = session?.user.id;
    return {
      reported: cases.filter((c) => c.reporter_id === uid).length,
      claimed: cases.filter((c) => c.claimed_by === uid).length,
      resolved: cases.filter((c) => c.status === 'resolved' && (c.reporter_id === uid || c.claimed_by === uid)).length,
    };
  }, [cases, session]);

  if (!profile) return null;

  const saveName = async () => {
    await supabase.from('profiles').update({ full_name: nameDraft || profile.full_name }).eq('id', profile.id);
    await refreshProfile();
    setEditOpen(false);
  };

  const toggleNotifPrefs = async (value: boolean) => {
    await supabase.from('profiles').update({ notif_prefs_on: value }).eq('id', profile.id);
    await refreshProfile();
  };

  const setLanguage = async (lang: LanguageCode) => {
    i18n.changeLanguage(lang);
    await supabase.from('profiles').update({ language_code: lang }).eq('id', profile.id);
    await refreshProfile();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarLabel}>{profile.full_name.charAt(0)}</Text>
      </View>
      <Text style={styles.name}>{profile.full_name}</Text>
      <View style={styles.rolePill}>
        <Text style={styles.roleLabel}>{t(ROLE_LABEL_KEY[profile.role] ?? profile.role)}</Text>
      </View>

      <View style={styles.statsRow}>
        <StatTile value={stats.reported} label={t('statCases')} />
        <StatTile value={stats.claimed} label={t('statRescues')} />
        <StatTile value={stats.resolved} label={t('statResolved')} />
      </View>

      <View style={styles.settingsList}>
        <SettingRow
          label={t('editProfile')}
          onPress={() => {
            setNameDraft(profile.full_name);
            setEditOpen(true);
          }}
        />
        <SettingRow
          label={t('notifPrefs')}
          value={profile.notif_prefs_on ? t('on') : t('off')}
          right={<Switch value={profile.notif_prefs_on} onValueChange={toggleNotifPrefs} />}
        />
        <View style={styles.languageRow}>
          <Text style={styles.settingLabel}>{t('language')}</Text>
          <View style={styles.languageOptions}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Pressable
                key={lang}
                onPress={() => setLanguage(lang)}
                style={[styles.langChip, profile.language_code === lang && styles.langChipSelected]}
              >
                <Text
                  style={[
                    styles.langChipLabel,
                    profile.language_code === lang && styles.langChipLabelSelected,
                  ]}
                >
                  {LANGUAGE_NAMES[lang]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <SettingRow
          label={t('inviteFriends')}
          onPress={() => Alert.alert(t('toastInviteCopied'))}
        />
      </View>

      <View style={{ height: 20 }} />
      <Button label={t('logOut')} variant="ghost" onPress={signOut} />

      <BottomSheet visible={editOpen} onClose={() => setEditOpen(false)}>
        <Text style={styles.sheetTitle}>{t('editProfile')}</Text>
        <TextInput
          value={nameDraft}
          onChangeText={setNameDraft}
          placeholder={t('name')}
          style={styles.nameInput}
        />
        <Button label={t('save')} onPress={saveName} />
      </BottomSheet>
    </ScrollView>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingRow({
  label,
  value,
  right,
  onPress,
}: {
  label: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.settingRow} onPress={onPress} disabled={!onPress}>
      <Text style={styles.settingLabel}>{label}</Text>
      {right ?? (value ? <Text style={styles.settingValue}>{value}</Text> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, paddingTop: 64, paddingHorizontal: spacing.xl, paddingBottom: 40, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarLabel: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.background },
  name: { fontFamily: fonts.extrabold, fontSize: fontSize.sectionTitle, color: colors.textPrimary, marginBottom: 6 },
  rolePill: { backgroundColor: colors.monitoringBg, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12, marginBottom: 20 },
  roleLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.monitoringDark },
  statsRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 24 },
  statTile: { flex: 1, backgroundColor: colors.white, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.textPrimary },
  statLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted55, marginTop: 2, textAlign: 'center' },
  settingsList: { width: '100%', gap: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.hairline08 },
  settingLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textPrimary },
  settingValue: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted55 },
  languageRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.hairline08 },
  languageOptions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  langChip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline10 },
  langChipSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
  langChipLabel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textPrimary },
  langChipLabelSelected: { color: colors.background },
  sheetTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.textPrimary, textAlign: 'center', marginBottom: 14 },
  nameInput: { height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.hairline15, paddingHorizontal: 14, marginBottom: 16, fontFamily: fonts.regular, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.white },
});
