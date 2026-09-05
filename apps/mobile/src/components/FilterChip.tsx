import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  dotColor?: string;
  size?: 'default' | 'small';
}

export function FilterChip({ label, selected, onPress, dotColor, size = 'default' }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        size === 'small' && styles.chipSmall,
        selected && (size === 'small' ? styles.chipSelectedDark : styles.chipSelectedTeal),
      ]}
    >
      {dotColor && !selected && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
      <Text
        style={[
          size === 'small' ? styles.labelSmall : styles.label,
          selected && styles.labelSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline10,
  },
  chipSmall: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  chipSelectedTeal: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipSelectedDark: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  labelSmall: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textPrimary,
  },
  labelSelected: {
    color: colors.background,
  },
});
