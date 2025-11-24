import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';

export default function SetTracker({ currentSet, totalSets }) {
  const renderDots = () => {
    const dots = [];
    for (let i = 1; i <= totalSets; i++) {
      const isCompleted = i < currentSet;
      const isCurrent = i === currentSet;

      dots.push(
        <View key={i} style={styles.dotContainer}>
          {isCompleted ? (
            <Icon name="checkmark-circle" size={24} color={colors.success} />
          ) : isCurrent ? (
            <View style={[styles.dot, styles.dotCurrent]} />
          ) : (
            <View style={[styles.dot, styles.dotPending]} />
          )}
        </View>
      );
    }
    return dots;
  };

  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {renderDots()}
      </View>
      <Text style={styles.label}>
        Set {currentSet} of {totalSets}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dotContainer: {
    marginHorizontal: spacing.xs,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  dotCurrent: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.overlay.white30,
  },
  dotPending: {
    backgroundColor: colors.overlay.white20,
    borderWidth: 2,
    borderColor: colors.overlay.white30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
