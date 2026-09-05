import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

export function ReportHeader({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
        <Text style={styles.backChevron}>‹</Text>
      </Pressable>
      <View style={styles.dots}>
        {[1, 2, 3, 4].map((d) => (
          <View key={d} style={[styles.dot, d <= step && styles.dotFilled]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingTop: 58,
    paddingHorizontal: spacing.xl,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline08,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 22,
    color: colors.textPrimary,
    marginTop: -2,
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 5,
    flex: 1,
    borderRadius: 3,
    backgroundColor: colors.hairline12,
  },
  dotFilled: {
    backgroundColor: colors.brand,
  },
});
