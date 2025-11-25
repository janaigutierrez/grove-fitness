import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import CircularTimer from './CircularTimer';
import SetTracker from './SetTracker';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';

const { width } = Dimensions.get('window');

export default function ActiveWorkoutScreen({
  workout,
  sessionId,
  onComplete,
  onAbandon,
}) {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [restTimer, setRestTimer] = useState(0);
  const [completedSets, setCompletedSets] = useState([]);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);

  const exercise = workout?.exercises?.[currentExercise];
  const totalSets = exercise?.custom_sets || exercise?.exercise_id?.default_sets || 3;
  const reps = exercise?.custom_reps || exercise?.exercise_id?.default_reps || 10;
  const weight = exercise?.custom_weight;
  const restDuration = exercise?.custom_rest_seconds || exercise?.exercise_id?.default_rest_seconds || 60;

  const nextExercise = workout?.exercises?.[currentExercise + 1];
  const totalExercises = workout?.exercises?.length || 0;
  const progressPercentage = totalExercises > 0
    ? Math.round(((currentExercise + (currentSet / totalSets)) / totalExercises) * 100)
    : 0;

  // Timer de descanso
  useEffect(() => {
    let interval;
    if (restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  // Total elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCompleteSet = () => {
    const newCompletedSet = {
      exercise_index: currentExercise,
      set_number: currentSet,
      completed_at: new Date().toISOString(),
    };

    setCompletedSets([...completedSets, newCompletedSet]);

    // Si hay más series
    if (currentSet < totalSets) {
      setCurrentSet(currentSet + 1);
      setRestTimer(restDuration);
    }
    // Si hay más ejercicios
    else if (currentExercise < totalExercises - 1) {
      setCurrentExercise(currentExercise + 1);
      setCurrentSet(1);
      setRestTimer(120); // 2 minutes rest between exercises
    }
    // Workout completado
    else {
      onComplete([...completedSets, newCompletedSet]);
    }
  };

  const handleSkipRest = () => {
    setRestTimer(0);
  };

  const handleAddTime = () => {
    setRestTimer(prev => prev + 15);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonText = () => {
    if (restTimer > 0) return 'Resting...';
    if (currentSet < totalSets) return 'Complete Set';
    if (currentExercise < totalExercises - 1) return 'Next Exercise';
    return 'Finish Workout';
  };

  return (
    <LinearGradient
      colors={[colors.primaryDark, colors.primary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onAbandon} style={styles.closeButton}>
            <Icon name="close" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.workoutName}>{workout?.name}</Text>
            <Text style={styles.workoutProgress}>
              Exercise {currentExercise + 1} of {totalExercises}
            </Text>
          </View>
          <View style={styles.closeButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Content */}
          {restTimer > 0 ? (
            // REST MODE
            <View style={styles.mainContent}>
              <Text style={styles.restLabel}>REST TIME</Text>

              <CircularTimer
                duration={restDuration}
                timeRemaining={restTimer}
                size={Math.min(width * 0.6, 250)}
              />

              <TouchableOpacity
                onPress={handleAddTime}
                style={styles.addTimeButton}
              >
                <Icon name="add-circle-outline" size={20} color={colors.text.inverse} />
                <Text style={styles.addTimeText}>+15 seconds</Text>
              </TouchableOpacity>

              {/* Next Exercise Preview */}
              {nextExercise && (
                <View style={styles.nextUpCard}>
                  <Text style={styles.nextUpLabel}>NEXT UP</Text>
                  <Icon name="fitness" size={32} color={colors.primary} />
                  <Text style={styles.nextUpExercise}>
                    {nextExercise.exercise_id?.name || 'Next Exercise'}
                  </Text>
                  <Text style={styles.nextUpDetails}>
                    {nextExercise.custom_sets || nextExercise.exercise_id?.default_sets || 3} sets × {' '}
                    {nextExercise.custom_reps || nextExercise.exercise_id?.default_reps || 10} reps
                  </Text>
                </View>
              )}
            </View>
          ) : (
            // EXERCISE MODE
            <View style={styles.mainContent}>
              <Text style={styles.exerciseName}>
                {exercise?.exercise_id?.name || 'Exercise'}
              </Text>

              {/* Set Tracker */}
              <SetTracker currentSet={currentSet} totalSets={totalSets} />

              {/* Exercise Details */}
              <View style={styles.exerciseDetails}>
                <View style={styles.detailCard}>
                  <Icon name="repeat" size={32} color={colors.primary} />
                  <Text style={styles.detailValue}>{reps}</Text>
                  <Text style={styles.detailLabel}>Reps</Text>
                </View>

                {weight && (
                  <View style={styles.detailCard}>
                    <Icon name="barbell" size={32} color={colors.primary} />
                    <Text style={styles.detailValue}>{weight}</Text>
                    <Text style={styles.detailLabel}>kg</Text>
                  </View>
                )}

                <View style={styles.detailCard}>
                  <Icon name="time" size={32} color={colors.primary} />
                  <Text style={styles.detailValue}>{restDuration}s</Text>
                  <Text style={styles.detailLabel}>Rest</Text>
                </View>
              </View>

              {/* Instructions if available */}
              {exercise?.exercise_id?.instructions && (
                <View style={styles.instructionsCard}>
                  <Text style={styles.instructionsTitle}>Instructions</Text>
                  <Text style={styles.instructionsText}>
                    {exercise.exercise_id.instructions}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Workout Progress</Text>
              <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
              />
            </View>
            <View style={styles.progressStats}>
              <Text style={styles.progressStat}>
                <Icon name="time-outline" size={14} color={colors.overlay.white30} />
                {' '}{formatTime(totalElapsedTime)}
              </Text>
              <Text style={styles.progressStat}>
                {completedSets.length} sets completed
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          {restTimer > 0 ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handleSkipRest}
              >
                <Icon name="play-skip-forward" size={20} color={colors.text.inverse} />
                <Text style={styles.actionButtonText}>Skip Rest</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleCompleteSet}
            >
              <Icon
                name={currentExercise >= totalExercises - 1 && currentSet >= totalSets ? "checkmark-circle" : "checkmark"}
                size={20}
                color={colors.text.inverse}
              />
              <Text style={styles.actionButtonText}>{getButtonText()}</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.overlay.white20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  workoutName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  workoutProgress: {
    fontSize: 14,
    color: colors.overlay.white30,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  mainContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  restLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.overlay.white30,
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.overlay.white20,
    borderRadius: 20,
  },
  addTimeText: {
    fontSize: 14,
    color: colors.text.inverse,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  nextUpCard: {
    width: '100%',
    backgroundColor: colors.overlay.white10,
    borderRadius: spacing.card.radius,
    padding: spacing.md,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  nextUpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.overlay.white30,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  nextUpExercise: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginTop: spacing.sm,
  },
  nextUpDetails: {
    fontSize: 14,
    color: colors.overlay.white30,
    marginTop: spacing.xs,
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.inverse,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  exerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  detailCard: {
    backgroundColor: colors.overlay.white10,
    borderRadius: spacing.card.radius,
    padding: spacing.md,
    minWidth: 100,
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginTop: spacing.xs,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.overlay.white30,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  instructionsCard: {
    width: '100%',
    backgroundColor: colors.overlay.white10,
    borderRadius: spacing.card.radius,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
    marginBottom: spacing.sm,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.overlay.white30,
    lineHeight: 20,
  },
  progressContainer: {
    marginTop: spacing.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.overlay.white20,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  progressStat: {
    fontSize: 12,
    color: colors.overlay.white30,
  },
  bottomActions: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: spacing.button.radius,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.text.inverse,
  },
  secondaryButton: {
    backgroundColor: colors.overlay.white20,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
});
