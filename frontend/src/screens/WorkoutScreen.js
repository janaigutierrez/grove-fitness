import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, Calendar, Play, Plus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getWorkouts,
  getWeeklySchedule,
  startWorkoutSession,
  completeWorkoutSession,
  abandonSession,
  createWorkout,
  updateWorkout,
  getExercises,
  createExercise,
  getWorkoutSessions
} from '../services/api';
import { handleApiError, formatSuccessMessage, ValidationError } from '../utils/errorHandler';
import WorkoutCompletionModal from '../components/WorkoutCompletionModal';
import ActiveWorkoutScreen from '../components/workout/ActiveWorkoutScreen';
import CreateWorkoutModal from '../components/workout/CreateWorkoutModal';
import WorkoutCard from '../components/workout/WorkoutCard';
import EmptyState from '../components/common/EmptyState';
import ConfirmModal from '../components/common/ConfirmModal';
import InfoModal from '../components/common/InfoModal';
import ErrorModal from '../components/common/ErrorModal';
import useModal from '../hooks/useModal';
import colors from '../constants/colors';

export default function WorkoutScreen() {
  // Estados principals
  const [workouts, setWorkouts] = useState([]);
  const [weekSchedule, setWeekSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal d'entrenament
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [completedSets, setCompletedSets] = useState([]);

  // Modal de creació/edició de workout
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null); // null = create, string = edit
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [completingSession, setCompletingSession] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    description: '',
    workout_type: 'custom',
    difficulty: 'intermediate',
  });
  const [newExercises, setNewExercises] = useState([
    { name: '', sets: '3', reps: '10', type: 'reps', exercise_id: null, newExercise: null }
  ]);
  const [creating, setCreating] = useState(false);
  const [availableExercises, setAvailableExercises] = useState([]);

  // System modals
  const confirmModal = useModal();
  const infoModal = useModal();
  const errorModal = useModal();

  useFocusEffect(
    useCallback(() => {
      loadWorkoutData();
    }, [])
  );

  const loadWorkoutData = async () => {
    try {
      setLoading(true);

      const [workoutsData, scheduleData, sessionsData] = await Promise.all([
        getWorkouts({ is_template: 'true' }),
        getWeeklySchedule(),
        getWorkoutSessions({ completed: 'false' })
      ]);

      setWorkouts(workoutsData);
      setWeekSchedule(scheduleData);

      // Detectar sessió activa (interrompuda per sortir de l'app)
      const activeSessions = Array.isArray(sessionsData) ? sessionsData : (sessionsData?.sessions || []);
      const activeSession = activeSessions.find(s => !s.completed && !s.abandoned);

      if (activeSession && !modalVisible) {
        const resumeWorkout = workoutsData.find(w => w.id === activeSession.workout_id?.id);

        if (resumeWorkout) {
          confirmModal.openModal({
            title: 'Entrenament pendent',
            message: `Tens l'entrenament "${resumeWorkout.name}" en curs. Vols reprendre'l o abandonar-lo?`,
            confirmText: 'Reprendre',
            cancelText: 'Abandonar',
            variant: 'info',
            icon: 'play-circle',
            onConfirm: () => {
              confirmModal.closeModal();
              setCurrentSessionId(activeSession.id);
              setSelectedWorkout(resumeWorkout);
              setCompletedSets([]);
              setModalVisible(true);
            },
            onCancel: async () => {
              confirmModal.closeModal();
              try { await abandonSession(activeSession.id, "Abandonada per l'usuari"); } catch {}
            },
          });
        } else {
          // Workout eliminat — netejar la sessió òrfena
          abandonSession(activeSession.id, 'Workout eliminat').catch(() => {});
        }
      }

    } catch (error) {
      const errorInfo = handleApiError(error);
      errorModal.openModal({
        title: errorInfo.title,
        message: errorInfo.message,
        icon: errorInfo.icon,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkoutData();
  };

  // Carregar exercicis disponibles quan s'obre el modal
  const loadAvailableExercises = async () => {
    try {
      const exercises = await getExercises();
      setAvailableExercises(exercises);
    } catch (error) {
      // No mostrem error, simplement no hi haurà exercicis predefinits
    }
  };

  const handleOpenCreateModal = () => {
    setEditingWorkoutId(null);
    resetCreateForm();
    setCreateModalVisible(true);
    loadAvailableExercises();
  };

  const handleOpenEditModal = (workout) => {
    setEditingWorkoutId(workout.id || workout._id);
    setNewWorkout({
      name: workout.name || '',
      description: workout.description || '',
      workout_type: workout.workout_type || 'custom',
      difficulty: workout.difficulty || 'intermediate',
    });
    setNewExercises(
      workout.exercises?.length > 0
        ? workout.exercises.map(ex => ({
            name: ex.exercise_id?.name || '',
            sets: String(ex.custom_sets || ex.exercise_id?.default_sets || 3),
            reps: String(ex.custom_reps || ex.exercise_id?.default_reps || 10),
            type: ex.exercise_id?.type || 'reps',
            exercise_id: ex.exercise_id?.id || ex.exercise_id?._id || null,
            newExercise: null,
          }))
        : [{ name: '', sets: '3', reps: '10', type: 'reps', exercise_id: null, newExercise: null }]
    );
    setCreateModalVisible(true);
    loadAvailableExercises();
  };

  // ============ FUNCIONS DE CREACIÓ DE WORKOUT ============

  const handleCreateWorkout = async () => {
    // Validacions
    if (!newWorkout.name.trim()) {
      const validationError = new ValidationError("El workout necessita un nom", 'name');
      const errorInfo = handleApiError(validationError);
      errorModal.openModal({
        title: errorInfo.title,
        message: errorInfo.message,
        icon: errorInfo.icon,
      });
      return;
    }

    const validExercises = newExercises.filter(ex =>
      (ex.exercise_id || ex.newExercise || ex.name.trim()) && ex.sets && ex.reps
    );

    if (validExercises.length === 0) {
      const validationError = new ValidationError('Has d\'afegir almenys un exercici vàlid', 'exercises');
      const errorInfo = handleApiError(validationError);
      errorModal.openModal({
        title: errorInfo.title,
        message: errorInfo.message,
        icon: errorInfo.icon,
      });
      return;
    }

    setCreating(true);

    try {
      // 1. Processar exercicis (crear nous si cal)
      const exerciseIds = [];

      for (let i = 0; i < validExercises.length; i++) {
        const ex = validExercises[i];

        let exerciseId;

        if (ex.exercise_id) {
          // Exercici existent
          exerciseId = ex.exercise_id;
        } else if (ex.newExercise) {
          // Crear nou exercici (via formulari antic - mantenim compatibilitat)
          const newEx = await createExercise({
            name: ex.newExercise.name.trim(),
            type: ex.newExercise.type || ex.type || 'reps',
            category: ex.newExercise.category || 'full_body',
            default_sets: parseInt(ex.sets) || 3,
            default_reps: parseInt(ex.reps) || 10,
            default_rest_seconds: 60
          });
          exerciseId = newEx.id;
        } else {
          // Buscar per nom
          const found = availableExercises.find(e =>
            e.name.toLowerCase() === ex.name.trim().toLowerCase()
          );

          if (found) {
            exerciseId = found.id;
          } else {
            // Crear amb el tipus seleccionat
            const newEx = await createExercise({
              name: ex.name.trim(),
              type: ex.type || 'reps',
              category: 'full_body',
              default_sets: parseInt(ex.sets) || 3,
              default_reps: parseInt(ex.reps) || 10,
              default_rest_seconds: 60
            });
            exerciseId = newEx.id;
          }
        }

        exerciseIds.push({
          exercise_id: exerciseId,
          order: i + 1,
          custom_sets: parseInt(ex.sets),
          custom_reps: parseInt(ex.reps),
        });
      }

      // 2. Crear workout
      const workoutData = {
        name: newWorkout.name.trim(),
        description: newWorkout.description.trim() || undefined,
        workout_type: newWorkout.workout_type,
        difficulty: newWorkout.difficulty,
        exercises: exerciseIds,
        is_template: true
      };

      let savedWorkout;
      if (editingWorkoutId) {
        savedWorkout = await updateWorkout(editingWorkoutId, workoutData);
      } else {
        savedWorkout = await createWorkout(workoutData);
      }

      // Tancar el modal primer, després mostrar confirmació
      setCreateModalVisible(false);
      resetCreateForm();
      setEditingWorkoutId(null);
      loadWorkoutData();

      const action = editingWorkoutId ? 'actualitzat' : 'creat';
      const successInfo = formatSuccessMessage(`El workout "${savedWorkout.name}" s'ha ${action} correctament`);
      infoModal.openModal({
        title: editingWorkoutId ? 'Workout Actualitzat!' : 'Workout Creat!',
        message: successInfo.message,
        icon: successInfo.icon,
        buttonText: 'Genial!',
        onClose: infoModal.closeModal,
      });

    } catch (error) {
      const errorInfo = handleApiError(error);
      errorModal.openModal({
        title: errorInfo.title,
        message: errorInfo.message,
        icon: errorInfo.icon,
      });
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewWorkout({
      name: '',
      description: '',
      workout_type: 'custom',
      difficulty: 'intermediate',
    });
    setNewExercises([{ name: '', sets: '3', reps: '10', type: 'reps', exercise_id: null, newExercise: null }]);
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...newExercises];
    updated[index][field] = value;
    setNewExercises(updated);
  };

  const addExercise = () => {
    setNewExercises([...newExercises, { name: '', sets: '3', reps: '10', type: 'reps', exercise_id: null, newExercise: null }]);
  };

  const removeExercise = (index) => {
    if (newExercises.length > 1) {
      const updated = newExercises.filter((_, i) => i !== index);
      setNewExercises(updated);
    }
  };

  // ============ FUNCIONS D'ENTRENAMENT (ja existents) ============

  const startWorkout = async (workout) => {
    try {
      const session = await startWorkoutSession(workout.id);
      setCurrentSessionId(session.id);
      setSelectedWorkout(workout);
      setCompletedSets([]);
      setModalVisible(true);

      const successInfo = formatSuccessMessage(
        `Entrenament: ${workout.name}\nDurada estimada: ${workout.estimated_duration || 30} min\n\nA per-hi!`,
        'success'
      );
      infoModal.openModal({
        title: 'SESSIÓ INICIADA!',
        message: successInfo.message,
        icon: successInfo.icon,
        buttonText: 'ANEM-HI!',
        onClose: infoModal.closeModal,
      });

    } catch (error) {
      // Active session already open (409)
      if (error.statusCode === 409 || error.message?.toLowerCase().includes('active session')) {
        confirmModal.openModal({
          title: 'Sessió Activa Detectada',
          message: 'Tens una sessió d\'entrenament en curs. Vols abandonar-la per iniciar una de nova?',
          confirmText: 'Abandonar i Iniciar',
          cancelText: 'Cancel·lar',
          variant: 'danger',
          icon: 'warning',
          onConfirm: async () => {
            confirmModal.closeModal();
            try {
              // Find and abandon active session
              const sessions = await getWorkoutSessions({ completed: 'false' });
              const activeSession = sessions.find(s => !s.completed && !s.abandoned);
              if (activeSession) {
                await abandonSession(activeSession.id, 'Abandonada per iniciar nova sessió');
              }
              // Retry starting the workout
              const newSession = await startWorkoutSession(workout.id);
              setCurrentSessionId(newSession.id);
              setSelectedWorkout(workout);
              setCompletedSets([]);
              setModalVisible(true);
            } catch (retryError) {
              const errInfo = handleApiError(retryError);
              errorModal.openModal({ title: errInfo.title, message: errInfo.message, icon: errInfo.icon });
            }
          },
          onCancel: confirmModal.closeModal,
        });
        return;
      }

      const errorInfo = handleApiError(error);
      errorModal.openModal({
        title: errorInfo.title,
        message: errorInfo.message,
        icon: errorInfo.icon,
      });
    }
  };

  const handleCompleteWorkout = (completedSets) => {
    // Called from ActiveWorkoutScreen when workout is finished
    setCompletedSets(completedSets || []);
    setModalVisible(false); // Hide active workout screen
    setCompletionModalVisible(true); // Show completion modal
  };

  const handleCompletionSubmit = async (sessionData) => {
    try {
      setCompletingSession(true);
      await completeWorkoutSession(currentSessionId, sessionData);

      setCompletionModalVisible(false);

      const successInfo = formatSuccessMessage(
        `BRUTAL! Has acabat ${selectedWorkout.name}\n\n+1 cap als teus objectius\nProgressió registrada\n\nUn pas més!`,
        'success'
      );
      infoModal.openModal({
        title: 'ENTRENAMENT COMPLETAT!',
        message: successInfo.message,
        icon: successInfo.icon,
        buttonText: 'GENIAL!',
        onClose: () => {
          infoModal.closeModal();
          // Reset all workout states
          setModalVisible(false);
          setCurrentSessionId(null);
          setSelectedWorkout(null);
          setCompletedSets([]);
          loadWorkoutData();
        }
      });

    } catch (error) {
      const errorInfo = handleApiError(error);
      errorModal.openModal({
        title: errorInfo.title,
        message: errorInfo.message,
        icon: errorInfo.icon,
      });
    } finally {
      setCompletingSession(false);
    }
  };

  const handleAbandonWorkout = () => {
    confirmModal.openModal({
      title: 'Abandonar Entrenament',
      message: 'Segur que vols parar? Ets tan a prop!',
      confirmText: 'Abandonar',
      cancelText: 'Continuar',
      variant: 'danger',
      icon: 'close-circle',
      onConfirm: async () => {
        confirmModal.closeModal();
        try {
          await abandonSession(currentSessionId, "Abandonat per l'usuari");
          setModalVisible(false);

          const infoMessage = formatSuccessMessage('Sessió abandonada. Torna-ho a intentar aviat!', 'info');
          infoModal.openModal({
            title: 'Informació',
            message: infoMessage.message,
            icon: infoMessage.icon,
            onClose: infoModal.closeModal,
          });
        } catch (error) {
          setModalVisible(false);
        }
      },
      onCancel: confirmModal.closeModal,
    });
  };

  const getDaySchedule = () => {
    if (!weekSchedule) return [];

    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['DL', 'DM', 'DC', 'DJ', 'DV', 'DS', 'DG'];
    const today = new Date().getDay();
    const todayIndex = today === 0 ? 6 : today - 1;

    return daysOfWeek.map((day, index) => ({
      day: dayNames[index],
      dayKey: day,
      workout: weekSchedule[day],
      active: !!weekSchedule[day],
      today: index === todayIndex
    }));
  };

  if (loading) {
    return (
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="white" />
          <Text style={{ color: colors.text.inverse, marginTop: 10 }}>Carregant workouts...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Show active workout screen if workout is in progress
  if (modalVisible && selectedWorkout) {
    return (
      <ActiveWorkoutScreen
        workout={selectedWorkout}
        sessionId={currentSessionId}
        onComplete={handleCompleteWorkout}
        onAbandon={handleAbandonWorkout}
      />
    );
  }

  return (
    <LinearGradient colors={[colors.primary, colors.primaryDark]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="white"
              />
            }
          >
            <View style={styles.headerContainer}>
              <Dumbbell size={28} color="white" />
              <Text style={styles.header}> Els teus Workouts</Text>
            </View>
            <Text style={styles.subtitle}>
              {workouts.length} workouts disponibles
            </Text>

            {/* Calendari setmanal */}
            <View style={styles.weekContainer}>
              <View style={styles.weekTitleContainer}>
                <Calendar size={18} color="white" />
                <Text style={styles.weekTitle}> Aquesta Setmana</Text>
              </View>
              <View style={styles.weekGrid}>
                {getDaySchedule().map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCard,
                      item.active ? styles.workoutDay : styles.restDay,
                      item.today ? styles.todayHighlight : null
                    ]}
                    onPress={() => {
                      if (item.workout) {
                        const workout = workouts.find(w => w.id === item.workout.id);
                        if (workout) startWorkout(workout);
                      }
                    }}
                    disabled={!item.active}
                  >
                    <Text style={[styles.dayText, item.today ? styles.todayText : null]}>
                      {item.day}
                    </Text>
                    <Text style={styles.dayDescription}>
                      {item.workout ? item.workout.name.split(' - ')[1] || item.workout.name.substring(0, 8) : 'Rest'}
                    </Text>
                    {item.active && (
                      <Play size={16} color="#4CAF50" fill="#4CAF50" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Llista de workouts */}
            <View style={styles.sectionTitleContainer}>
              <Dumbbell size={20} color="white" />
              <Text style={styles.sectionTitle}> Tots els Workouts</Text>
            </View>

            {workouts.length === 0 ? (
              <EmptyState
                icon="barbell-outline"
                title="Encara no tens workouts"
                message="Crea'n un o genera'n un amb IA!"
              />
            ) : (
              workouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onStart={startWorkout}
                  onEdit={handleOpenEditModal}
                />
              ))
            )}
          </ScrollView>

          {/* BOTÓ FLOTANT PER CREAR WORKOUT */}
          <TouchableOpacity
            style={styles.fabButton}
            onPress={handleOpenCreateModal}
          >
            <Plus size={32} color="white" />
          </TouchableOpacity>

          {/* MODAL DE CREACIÓ DE WORKOUT */}
          <CreateWorkoutModal
            visible={createModalVisible}
            onClose={() => {
              setCreateModalVisible(false);
              resetCreateForm();
              setEditingWorkoutId(null);
            }}
            isEditing={!!editingWorkoutId}
            newWorkout={newWorkout}
            onWorkoutChange={setNewWorkout}
            newExercises={newExercises}
            onExerciseChange={handleExerciseChange}
            onAddExercise={addExercise}
            onRemoveExercise={removeExercise}
            availableExercises={availableExercises}
            onSubmit={handleCreateWorkout}
            creating={creating}
          />

          {/* MODAL DE COMPLETAR WORKOUT */}
          <WorkoutCompletionModal
            visible={completionModalVisible}
            onComplete={handleCompletionSubmit}
            onCancel={() => setCompletionModalVisible(false)}
            loading={completingSession}
          />

          {/* System Modals */}
          <ConfirmModal
            visible={confirmModal.visible}
            title={confirmModal.modalData.title}
            message={confirmModal.modalData.message}
            confirmText={confirmModal.modalData.confirmText}
            cancelText={confirmModal.modalData.cancelText}
            variant={confirmModal.modalData.variant}
            icon={confirmModal.modalData.icon}
            onConfirm={confirmModal.modalData.onConfirm || confirmModal.closeModal}
            onCancel={confirmModal.modalData.onCancel || confirmModal.closeModal}
          />
          <InfoModal
            visible={infoModal.visible}
            title={infoModal.modalData.title}
            message={infoModal.modalData.message}
            buttonText={infoModal.modalData.buttonText}
            variant={infoModal.modalData.variant}
            icon={infoModal.modalData.icon}
            onClose={infoModal.modalData.onClose || infoModal.closeModal}
          />
          <ErrorModal
            visible={errorModal.visible}
            title={errorModal.modalData.title}
            message={errorModal.modalData.message}
            buttonText={errorModal.modalData.buttonText}
            icon={errorModal.modalData.icon}
            onClose={errorModal.modalData.onClose || errorModal.closeModal}
          />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 100 },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 25,
  },
  weekContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 25,
  },
  weekTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCard: {
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    width: 40,
    minHeight: 60,
  },
  workoutDay: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  restDay: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  todayHighlight: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  dayText: {
    color: colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 4,
  },
  todayText: {
    color: '#FFD700',
  },
  dayDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  noWorkouts: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  noWorkoutsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginTop: 15,
    marginBottom: 5,
  },
  noWorkoutsSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },

  // FAB Button
  fabButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});