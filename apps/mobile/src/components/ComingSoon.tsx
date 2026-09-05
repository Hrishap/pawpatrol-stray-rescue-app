import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, spacing } from '@/theme';

export function ComingSoon({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.body,
    color: colors.textMuted60,
    textAlign: 'center',
  },
});
