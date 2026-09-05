import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { markAllNotificationsRead, markNotificationRead, useNotifications } from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/format';
import { colors, fonts, fontSize, spacing } from '@/theme';
import type { NotificationRow } from '@/types/database';

const TYPE_GLYPH: Record<NotificationRow['type'], string> = {
  new: '🔔',
  claim: '❤️',
  chat: '💬',
  status: '✓',
};

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { data: notifications = [], refetch } = useNotifications();

  const onPressRow = async (n: NotificationRow) => {
    if (!n.read_at) {
      await markNotificationRead(n.id);
      refetch();
    }
    if (n.related_case_id) router.push(`/case/${n.related_case_id}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{t('notifications')}</Text>
        <Pressable
          onPress={async () => {
            await markAllNotificationsRead();
            refetch();
          }}
        >
          <Text style={styles.markAll}>{t('markAllRead')}</Text>
        </Pressable>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t('noNotifications')}</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, !item.read_at && styles.rowUnread]}
            onPress={() => onPressRow(item)}
          >
            <Text style={styles.rowGlyph}>{TYPE_GLYPH[item.type]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>{item.text}</Text>
              <Text style={styles.rowTime}>{formatRelativeTime(item.created_at)}</Text>
            </View>
            {!item.read_at && <View style={styles.unreadDot} />}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 58, paddingHorizontal: spacing.xl, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline08, alignItems: 'center', justifyContent: 'center' },
  backChevron: { fontSize: 20, color: colors.textPrimary, marginTop: -2 },
  title: { flex: 1, fontFamily: fonts.extrabold, fontSize: fontSize.sectionTitle, color: colors.textPrimary },
  markAll: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.brand },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 40, gap: 8 },
  empty: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.textMuted55, textAlign: 'center', marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 14, padding: 12 },
  rowUnread: { backgroundColor: colors.white },
  rowGlyph: { fontSize: 18 },
  rowText: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.textPrimary },
  rowTime: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted50, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.critical },
});
