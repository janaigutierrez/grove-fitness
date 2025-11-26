import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';

export default function Card({
  children,
  onPress,
  variant = 'default', // default, elevated, outlined
  style,
}) {
  const Component = onPress ? TouchableOpacity : View;

  const getCardStyle = () => {
    const baseStyle = [styles.card];

    switch (variant) {
      case 'elevated':
        baseStyle.push(styles.elevated);
        break;
      case 'outlined':
        baseStyle.push(styles.outlined);
        break;
      default:
        baseStyle.push(styles.default);
    }

    return baseStyle;
  };

  return (
    <Component
      style={[...getCardStyle(), style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: spacing.card.radius,
    padding: spacing.card.padding,
    marginBottom: spacing.card.margin,
  },
  default: {
    // Base card with subtle shadow
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  elevated: {
    // Elevated card with more shadow
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outlined: {
    // Outlined card without shadow
    borderWidth: 1,
    borderColor: colors.text.disabled,
  },
});
