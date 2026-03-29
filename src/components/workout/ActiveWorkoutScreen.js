import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

// Format seconds to m:ss
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function ActiveWorkoutScreen({
  workout,
  sessionId,
  onComplete,
  onAbandon,
}) {
  const [started, setStarted] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [restTimer, setRestTimer] = useState(0);
  const [exerciseTimer, setExerciseTimer] = useState(0); // for time-based exercises
  const [exerciseTimerRunning, setExerciseTimerRunning] = useState(false);
  const [completedSets, setCompletedSets] = useState([]);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const exercise = workout?.exercises?.[currentExercise];
  const exerciseInfo = exercise?.exercise_id;
  const exerciseType = exerciseInfo?.type || 'reps'; // 'reps' | 'time' | 'cardio'
  const totalSets = exercise?.custom_sets || exerciseInfo?.default_sets || 3;
  const reps = exercise?.custom_reps || exerciseInfo?.default_reps || 10;
  // For time-based exercises, reps is interpreted as seconds
  const timeDuration = exercise?.custom_reps || exerciseInfo?.default_duration_seconds || exerciseInfo?.default_reps || 30;
  const weight = exercise?.custom_weight;
  const restDuration = exercise?.custom_rest_seconds || exerciseInfo?.default_rest_seconds || 60;

  const nextExercise = restTimer > 0
    ? workout?.exercises?.[currentExercise]
    : workout?.exercises?.[currentExercise + 1];
  const totalExercises = workout?.exercises?.length || 0;

  const totalSetsInWorkout = workout?.exercises?.reduce((sum, ex) => {
    return sum + (ex.custom_sets || ex.exercise_id?.default_sets || 3);
  }, 0) || 0;
  const totalSetsCompleted = completedSets.length;

  // Rest timer
  useEffect(() => {
    if (!started || isPaused) return;
    let interval;
    if (restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer, isPaused, started]);

  // Exercise countdown timer (time-based exercises)
  useEffect(() => {
    if (!started || isPaused || !exerciseTimerRunning) return;
    let interval;
    if (exerciseTimer > 0) {
      interval = setInterval(() => {
        setExerciseTimer(prev => {
          if (prev <= 1) {
            setExerciseTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [exerciseTimer, isPaused, started, exerciseTimerRunning]);

  // Total elapsed time
  useEffect(() => {
    if (!started || isPaused) return;
    const interval = setInterval(() => {
      setTotalElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, started]);

  // When switching to a time-based exercise, initialize timer
  useEffect(() => {
    if (exerciseType === 'time' || exerciseType === 'cardio') {
      setExerciseTimer(timeDuration);
      setExerciseTimerRunning(false);
    }
  }, [currentExercise, currentSet]);

  const handleStart = () => {
    setStarted(true);
  };

  const handleStartExerciseTimer = () => {
    setExerciseTimerRunning(true);
  };

  const handleCompleteSet = () => {
    const newCompletedSet = {
      exercise_index: currentExercise,
      set_number: currentSet,
      completed_at: new Date().toISOString(),
    };
    const updatedSets = [...completedSets, newCompletedSet];
    setCompletedSets(updatedSets);

    if (currentSet < totalSets) {
      setCurrentSet(currentSet + 1);
      setRestTimer(restDuration);
    } else if (currentExercise < totalExercises - 1) {
      setCurrentExercise(currentExercise + 1);
      setCurrentSet(1);
      setRestTimer(120);
    } else {
      onComplete(updatedSets);
    }
  };

  const getButtonLabel = () => {
    if (restTimer > 0) return null; // handled separately
    if (currentSet < totalSets) return `Sèrie completada`;
    if (currentExercise < totalExercises - 1) return 'Exercici següent';
    return 'Acabar entrenament';
  };

  const isLastAction = currentExercise >= totalExercises - 1 && currentSet >= totalSets;

  // ── READY SCREEN ──────────────────────────────────────────
  if (!started) {
    return (
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity onPress={onAbandon} style={styles.closeButtonTop}>
            <Icon name="close" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <View style={styles.readyContent}>
            <Icon name="barbell" size={64} color="rgba(255,255,255,0.9)" />
            <Text style={styles.readyWorkoutName}>{workout?.name}</Text>
            <Text style={styles.readySubtitle}>
              {totalExercises} exercicis · {totalSetsInWorkout} sèries totals
            </Text>

            <View style={styles.readyExerciseList}>
              {workout?.exercises?.slice(0, 5).map((ex, idx) => (
                <View key={idx} style={styles.readyExerciseItem}>
                  <Text style={styles.readyExerciseNum}>{idx + 1}</Text>
                  <View style={styles.readyExerciseInfo}>
                    <Text style={styles.readyExerciseName}>
                      {ex.exercise_id?.name || 'Exercici'}
                    </Text>
                    <Text style={styles.readyExerciseDetail}>
                      {ex.custom_sets || ex.exercise_id?.default_sets || 3} sèries ·{' '}
                      {(ex.exercise_id?.type === 'time' || ex.exercise_id?.type === 'cardio')
                        ? `${ex.custom_reps || ex.exercise_id?.default_duration_seconds || 30}s`
                        : `${ex.custom_reps || ex.exercise_id?.default_reps || 10} reps`
                      }
                    </Text>
                  </View>
                </View>
              ))}
              {totalExercises > 5 && (
                <Text style={styles.readyMoreExercises}>
                  +{totalExercises - 5} exercicis més...
                </Text>
              )}
            </View>

            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Icon name="play" size={28} color={colors.primaryDark} />
              <Text style={styles.startButtonText}>INICIAR ENTRENAMENT</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── ACTIVE WORKOUT ─────────────────────────────────────────
  return (
    <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onAbandon} style={styles.closeButton}>
            <Icon name="close" size={22} color={colors.text.inverse} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.workoutName} numberOfLines={1}>{workout?.name}</Text>
            <Text style={styles.workoutProgress}>
              Exercici {currentExercise + 1} de {totalExercises}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsPaused(!isPaused)}
            style={[styles.closeButton, isPaused && styles.pauseButtonActive]}
          >
            <Icon name={isPaused ? 'play' : 'pause'} size={22} color={colors.text.inverse} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {restTimer > 0 ? (
            // ── REST MODE ──
            <View style={styles.mainContent}>
              <Text style={styles.restLabel}>DESCANS</Text>
              <CircularTimer
                duration={restDuration}
                timeRemaining={restTimer}
                size={Math.min(width * 0.6, 240)}
              />
              <TouchableOpacity onPress={() => setRestTimer(prev => prev + 15)} style={styles.addTimeButton}>
                <Icon name="add-circle-outline" size={18} color={colors.text.inverse} />
                <Text style={styles.addTimeText}>+15 s</Text>
              </TouchableOpacity>
              {nextExercise && (
                <View style={styles.nextUpCard}>
                  <Text style={styles.nextUpLabel}>PROPERA SÈRIE</Text>
                  <Text style={styles.nextUpExercise}>
                    {nextExercise.exercise_id?.name || 'Exercici'}
                  </Text>
                  <Text style={styles.nextUpDetails}>
                    Sèrie {currentSet} de {totalSets}
                  </Text>
                </View>
              )}
            </View>
          ) : (exerciseType === 'time' || exerciseType === 'cardio') ? (
            // ── TIME-BASED EXERCISE MODE ──
            <View style={styles.mainContent}>
              <Text style={styles.exerciseName}>
                {exerciseInfo?.name || 'Exercici'}
              </Text>
              <SetTracker currentSet={currentSet} totalSets={totalSets} />

              <View style={styles.timedExerciseContainer}>
                {!exerciseTimerRunning && exerciseTimer === timeDuration ? (
                  // Not started yet
                  <TouchableOpacity style={styles.startTimerButton} onPress={handleStartExerciseTimer}>
                    <Icon name="play-circle" size={80} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.startTimerText}>{formatTime(timeDuration)}</Text>
                    <Text style={styles.startTimerHint}>Prem per iniciar</Text>
                  </TouchableOpacity>
                ) : exerciseTimerRunning ? (
                  // Running
                  <View style={styles.timerDisplay}>
                    <CircularTimer
                      duration={timeDuration}
                      timeRemaining={exerciseTimer}
                      size={Math.min(width * 0.6, 240)}
                    />
                    <Text style={styles.timerRunningHint}>En curs...</Text>
                  </View>
                ) : (
                  // Finished
                  <View style={styles.timerDoneContainer}>
                    <Icon name="checkmark-circle" size={80} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.timerDoneText}>Temps completat!</Text>
                  </View>
                )}
              </View>

              <View style={styles.exerciseDetailsRow}>
                <View style={styles.detailCard}>
                  <Icon name="time" size={28} color={colors.primary} />
                  <Text style={styles.detailValue}>{timeDuration}s</Text>
                  <Text style={styles.detailLabel}>Durada</Text>
                </View>
                <View style={styles.detailCard}>
                  <Icon name="reload" size={28} color={colors.primary} />
                  <Text style={styles.detailValue}>{restDuration}s</Text>
                  <Text style={styles.detailLabel}>Descans</Text>
                </View>
              </View>
            </View>
          ) : (
            // ── REPS MODE ──
            <View style={styles.mainContent}>
              <Text style={styles.exerciseName}>
                {exerciseInfo?.name || 'Exercici'}
              </Text>
              <SetTracker currentSet={currentSet} totalSets={totalSets} />

              {/* Big reps display */}
              <View style={styles.repsDisplay}>
                <Text style={styles.repsNumber}>{reps}</Text>
                <Text style={styles.repsLabel}>repeticions</Text>
              </View>

              <View style={styles.exerciseDetailsRow}>
                {weight && (
                  <View style={styles.detailCard}>
                    <Icon name="barbell" size={28} color={colors.primary} />
                    <Text style={styles.detailValue}>{weight}</Text>
                    <Text style={styles.detailLabel}>kg</Text>
                  </View>
                )}
                <View style={styles.detailCard}>
                  <Icon name="time" size={28} color={colors.primary} />
                  <Text style={styles.detailValue}>{restDuration}s</Text>
                  <Text style={styles.detailLabel}>Descans</Text>
                </View>
              </View>

              {exerciseInfo?.instructions && (
                <View style={styles.instructionsCard}>
                  <Text style={styles.instructionsTitle}>Instruccions</Text>
                  <Text style={styles.instructionsText}>{exerciseInfo.instructions}</Text>
                </View>
              )}
            </View>
          )}

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progrés</Text>
              <Text style={styles.sessionTimer}>{formatTime(totalElapsedTime)}</Text>
            </View>
            <View style={styles.segmentedProgressBar}>
              {Array.from({ length: totalSetsInWorkout }).map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.progressSegment,
                    idx < totalSetsCompleted && styles.progressSegmentCompleted,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.progressText}>
              {totalSetsCompleted} / {totalSetsInWorkout} sèries
            </Text>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={styles.bottomActions}>
          {restTimer > 0 ? (
            <TouchableOpacity
              style={[styles.bigActionButton, styles.skipRestButton, isPaused && styles.actionButtonDisabled]}
              onPress={() => setRestTimer(0)}
              disabled={isPaused}
            >
              <Icon name="play-skip-forward" size={26} color={colors.text.inverse} />
              <Text style={styles.bigActionButtonText}>Saltar descans</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.bigActionButton,
                isLastAction ? styles.finishButton : styles.completeSetButton,
                isPaused && styles.actionButtonDisabled
              ]}
              onPress={handleCompleteSet}
              disabled={isPaused}
            >
              <Icon
                name={isLastAction ? 'trophy' : 'checkmark'}
                size={28}
                color={isLastAction ? '#FFD700' : colors.primaryDark}
              />
              <Text style={[styles.bigActionButtonText, isLastAction && { color: '#FFD700' }]}>
                {getButtonLabel()}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Pause Overlay */}
        {isPaused && (
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseContent}>
              <Icon name="pause-circle" size={80} color={colors.text.inverse} />
              <Text style={styles.pauseTitle}>PAUSAT</Text>
              <Text style={styles.pauseSubtitle}>Pren-te el temps que necessitis</Text>
              <TouchableOpacity style={styles.resumeButton} onPress={() => setIsPaused(false)}>
                <Icon name="play" size={26} color={colors.primaryDark} />
                <Text style={styles.resumeButtonText}>REPRENDRE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // ── READY SCREEN ──
  closeButtonTop: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  readyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 30,
  },
  readyWorkoutName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginTop: 20,
    textAlign: 'center',
  },
  readySubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    marginBottom: 28,
  },
  readyExerciseList: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  readyExerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  readyExerciseNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginRight: 12,
  },
  readyExerciseInfo: { flex: 1 },
  readyExerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  readyExerciseDetail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  readyMoreExercises: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    paddingTop: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text.inverse,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },

  // ── ACTIVE HEADER ──
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
  pauseButtonActive: { backgroundColor: colors.warning },
  headerContent: { flex: 1, alignItems: 'center' },
  workoutName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  workoutProgress: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  // ── SCROLL ──
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  mainContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },

  // ── EXERCISE NAME ──
  exerciseName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.text.inverse,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },

  // ── REPS DISPLAY ──
  repsDisplay: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 48,
    width: '80%',
  },
  repsNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: colors.text.inverse,
    lineHeight: 80,
  },
  repsLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ── TIME EXERCISE ──
  timedExerciseContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  startTimerButton: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  startTimerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginTop: 8,
  },
  startTimerHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },
  timerDisplay: { alignItems: 'center' },
  timerRunningHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: spacing.sm,
  },
  timerDoneContainer: { alignItems: 'center' },
  timerDoneText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginTop: spacing.sm,
  },

  // ── DETAIL CARDS ──
  exerciseDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  detailCard: {
    backgroundColor: colors.overlay.white10,
    borderRadius: 16,
    padding: spacing.md,
    minWidth: 90,
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── INSTRUCTIONS ──
  instructionsCard: {
    width: '100%',
    backgroundColor: colors.overlay.white10,
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  instructionsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },

  // ── REST MODE ──
  restLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 3,
    marginBottom: spacing.lg,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.overlay.white20,
    borderRadius: 20,
    gap: 6,
  },
  addTimeText: {
    fontSize: 14,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  nextUpCard: {
    width: '100%',
    backgroundColor: colors.overlay.white10,
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  nextUpLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  nextUpExercise: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  nextUpDetails: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },

  // ── PROGRESS ──
  progressContainer: { marginTop: spacing.xl },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sessionTimer: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.secondary,
    letterSpacing: 1,
  },
  segmentedProgressBar: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: spacing.sm,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
  },
  progressSegmentCompleted: { backgroundColor: colors.secondary },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // ── BOTTOM ACTION ──
  bottomActions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  bigActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 20,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  completeSetButton: { backgroundColor: colors.text.inverse },
  skipRestButton: { backgroundColor: colors.secondary },
  finishButton: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 2, borderColor: '#FFD700' },
  actionButtonDisabled: { opacity: 0.5 },
  bigActionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },

  // ── PAUSE OVERLAY ──
  pauseOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pauseContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  pauseTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginTop: spacing.lg,
    letterSpacing: 3,
  },
  pauseSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text.inverse,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: 30,
    gap: spacing.sm,
  },
  resumeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryDark,
    letterSpacing: 1,
  },
});
