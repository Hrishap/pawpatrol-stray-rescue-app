import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

export function Loading() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
