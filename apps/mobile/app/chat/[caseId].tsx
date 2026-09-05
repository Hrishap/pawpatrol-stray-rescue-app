import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { useCase } from '@/hooks/useCases';
import { sendChatMessage, useChat } from '@/hooks/useChat';
import { useProfile } from '@/hooks/useProfile';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function ChatScreen() {
  const { t } = useTranslation();
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const { session } = useAuth();
  const { data: activeCase } = useCase(caseId);
  const { data: messages = [] } = useChat(caseId);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const uid = session?.user.id;
  const counterpartId =
    activeCase && uid === activeCase.reporter_id ? activeCase.claimed_by : activeCase?.reporter_id;
  const { data: counterpart } = useProfile(counterpartId);

  const send = async () => {
    const text = input.trim();
    if (!text || !caseId) return;
    setInput('');
    await sendChatMessage(caseId, text);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{(counterpart?.full_name ?? '?').charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.name}>{counterpart?.full_name ?? '…'}</Text>
            <Text style={styles.subtitle}>
              {t('chatRePrefix')} {activeCase?.code}
            </Text>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const mine = item.sender_id === uid;
            return (
              <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.text}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t('chatInputPlaceholder')}
            placeholderTextColor={colors.textMuted45}
            style={styles.input}
            onSubmitEditing={send}
          />
          <Pressable style={styles.sendButton} onPress={send}>
            <Text style={styles.sendGlyph}>➤</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.chatBackground },
  header: { paddingTop: 58, paddingHorizontal: spacing.xl, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.background },
  iconButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline08, alignItems: 'center', justifyContent: 'center' },
  backChevron: { fontSize: 20, color: colors.textPrimary, marginTop: -2 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  avatarLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.background },
  name: { fontFamily: fonts.bold, fontSize: fontSize.body, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted50 },
  list: { padding: spacing.lg, gap: 8 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleMine: { backgroundColor: colors.brand, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.white, borderBottomLeftRadius: 4 },
  bubbleText: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.textPrimary, lineHeight: 19 },
  bubbleTextMine: { color: colors.background },
  inputRow: { flexDirection: 'row', gap: 8, padding: spacing.lg, backgroundColor: colors.background, alignItems: 'center' },
  input: { flex: 1, height: 44, borderRadius: 22, paddingHorizontal: 16, backgroundColor: colors.white, fontFamily: fonts.regular, fontSize: 13.5, color: colors.textPrimary },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  sendGlyph: { color: colors.background, fontSize: 16 },
});
