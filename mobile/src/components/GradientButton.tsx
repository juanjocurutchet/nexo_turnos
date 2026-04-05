import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, View,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function GradientButton({ label, onPress, loading, disabled, style }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={style}
    >
      <View style={[styles.btn, disabled && styles.btnDisabled]}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.label}>{label}</Text>
        }
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  btnDisabled: {
    backgroundColor: '#4b5563',
  },
  label: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
