import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';

export default function Button({
  text,
  onPress,
  variant = 'primary', // primary, secondary, outline, ghost, danger
  size = 'medium', // small, medium, large
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`${size}Button`]];

    if (fullWidth) baseStyle.push(styles.fullWidth);
    if (disabled || loading) baseStyle.push(styles.disabled);

    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryButton);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryButton);
        break;
      case 'outline':
        baseStyle.push(styles.outlineButton);
        break;
      case 'ghost':
        baseStyle.push(styles.ghostButton);
        break;
      case 'danger':
        baseStyle.push(styles.dangerButton);
        break;
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];

    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        baseStyle.push(styles.whiteText);
        break;
      case 'outline':
      case 'ghost':
        baseStyle.push(styles.primaryText);
        break;
    }

    return baseStyle;
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.text.inverse} />;
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <Icon
            name={icon}
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.text.inverse}
            style={styles.iconLeft}
          />
        )}
        <Text style={[...getTextStyle(), textStyle]}>{text}</Text>
        {icon && iconPosition === 'right' && (
          <Icon
            name={icon}
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.text.inverse}
            style={styles.iconRight}
          />
        )}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: spacing.button.radius,
    minHeight: spacing.button.minHeight,
  },

  // Sizes
  smallButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 36,
  },
  mediumButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: spacing.button.minHeight,
  },
  largeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
  },

  // Variants
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },

  // Text
  text: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  whiteText: {
    color: colors.text.inverse,
  },
  primaryText: {
    color: colors.primary,
  },

  // Icons
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
});
