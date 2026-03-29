import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import colors from '../../constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CircularTimer({
  duration,
  timeRemaining,
  size = 200,
  strokeWidth = 12
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    const progress = duration > 0 ? (duration - timeRemaining) / duration : 0;

    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Pulse animation for last 10 seconds
    if (timeRemaining <= 10 && timeRemaining > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [timeRemaining, duration]);

  // Determine color based on time remaining
  const getTimerColor = () => {
    if (timeRemaining <= 5) return colors.timer.danger;
    if (timeRemaining <= 10) return colors.timer.warning;
    return colors.timer.normal;
  };

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const timerColor = getTimerColor();

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: pulseAnim }] }
      ]}
    >
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.overlay.white20}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={timerColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Time display in center */}
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: timerColor }]}>
          {timeRemaining}
        </Text>
        <Text style={styles.secondsLabel}>seconds</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  timeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  secondsLabel: {
    fontSize: 14,
    color: colors.overlay.white30,
    marginTop: -8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
