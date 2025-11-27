import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getWorkouts,
  getWeeklySchedule,
  startWorkoutSession,
  completeWorkoutSession,
  abandonSession,
  createWorkout,
  getExercises,
  createExercise
} from '../services/api';
import { handleApiError, formatSuccessMessage, ValidationError } from '../utils/errorHandler';
import AIWorkoutGeneratorModal from '../components/AIWorkoutGeneratorModal';
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

export default function WorkoutScreen({ user }) {
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

  // Modal de creació de workout
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [aiGeneratorVisible, setAiGeneratorVisible] = useState(false);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [completingSession, setCompletingSession] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    description: '',
    workout_type: 'custom',
    difficulty: 'intermediate',
  });
  const [newExercises, setNewExercises] = useState([
    { name: '', sets: '3', reps: '10', exercise_id: null, newExercise: null }
  ]);
  const [creating, setCreating] = useState(false);
  const [availableExercises, setAvailableExercises] = useState([]);

  // System modals
  const confirmModal = useModal();
  const infoModal = useModal();
  const errorModal = useModal();

  useEffect(() => {
    loadWorkoutData();
  }, []);

  const loadWorkoutData = async () => {
    try {
      setLoading(true);

      const [workoutsData, scheduleData] = await Promise.all([
        getWorkouts({ is_template: 'true' }), // Solo plantillas
        getWeeklySchedule()
      ]);


      setWorkouts(workoutsData);
      setWeekSchedule(scheduleData);

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
    setCreateModalVisible(true);
    loadAvailableExercises();
  };

  // ============ FUNCIONS DE CREACIÓ DE WORKOUT ============

  const handleCreateWorkout = async () => {
    // Validacions
    if (!newWorkout.name.trim()) {
      const validationError = new ValidationError('El workout necesita un nombre', 'name');
      const errorInfo = handleApiError(validationError);
      errorModal.openModal({
        title: errorInfo.title,
        message: errorInfo.message,
        icon: errorInfo.icon,
      });
      return;
    }

    const validExercises = newExercises.filter(ex =>
      (ex.exercise_id || ex.newExercise) && ex.sets && ex.reps
    );

    if (validExercises.length === 0) {
      const validationError = new ValidationError('Debes añadir al menos un ejercicio válido', 'exercises');
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
          // Crear nou exercici

          const newEx = await createExercise({
            name: ex.newExercise.name.trim(),
            type: ex.newExercise.type,
            category: ex.newExercise.category, // Ara amb categoria vàlida
            default_sets: parseInt(ex.sets) || 3,
            default_reps: parseInt(ex.reps) || 10,
            default_rest_seconds: 60
          });

          exerciseId = newEx.id;
        } else {
          // Buscar per nom (fallback)
          const found = availableExercises.find(e =>
            e.name.toLowerCase() === ex.name.trim().toLowerCase()
          );

          if (found) {
            exerciseId = found.id;
          } else {
            // Crear amb categoria per defecte
            const newEx = await createExercise({
              name: ex.name.trim(),
              type: 'reps',
              category: 'full_body', // Categoria per defecte vàlida
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

      const createdWorkout = await createWorkout(workoutData);

      const successInfo = formatSuccessMessage(`El workout "${createdWorkout.name}" se ha creado correctamente`);
      infoModal.openModal({
        title: '✅ Workout Creado!',
        message: successInfo.message,
        icon: successInfo.icon,
        buttonText: 'Genial!',
        onClose: () => {
          infoModal.closeModal();
          setCreateModalVisible(false);
          resetCreateForm();
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
    setNewExercises([{ name: '', sets: '3', reps: '10', exercise_id: null, newExercise: null }]);
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...newExercises];
    updated[index][field] = value;
    setNewExercises(updated);
  };

  const addExercise = () => {
    setNewExercises([...newExercises, { name: '', sets: '3', reps: '10', exercise_id: null, newExercise: null }]);
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
        `Entrenamiento: ${workout.name}\nDuración estimada: ${workout.estimated_duration || 30} min\n\n¡A por ellas!`,
        'success'
      );
      infoModal.openModal({
        title: '🔥 SESIÓN INICIADA!',
        message: successInfo.message,
        icon: successInfo.icon,
        buttonText: '¡DALE!',
        onClose: infoModal.closeModal,
      });

    } catch (error) {
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
        `¡BRUTAL! Has acabado ${selectedWorkout.name}\n\n🔥 +1 hacia tus objetivos\n💪 Progresión registrada\n\n¡Un paso más cerca!`,
        'success'
      );
      infoModal.openModal({
        title: '🎉 ENTRENAMIENTO COMPLETADO!',
        message: successInfo.message,
        icon: successInfo.icon,
        buttonText: '🚀 GENIAL!',
        onClose: () => {
          infoModal.closeModal();
          setModalVisible(false);
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
      title: '❌ Abandonar Entrenamiento',
      message: '¿Seguro que quieres parar? ¡Estás tan cerca!',
      confirmText: 'Abandonar',
      cancelText: 'Continuar',
      variant: 'danger',
      icon: 'close-circle',
      onConfirm: async () => {
        confirmModal.closeModal();
        try {
          await abandonSession(currentSessionId, "Abandonado por el usuario");
          setModalVisible(false);

          const infoMessage = formatSuccessMessage('Sesión abandonada. ¡Vuelve a intentarlo pronto!', 'info');
          infoModal.openModal({
            title: 'Información',
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
      <ImageBackground
        source={{ uri: 'https://www.transparenttextures.com/patterns/green-fibers.png' }}
        style={styles.bg}
        resizeMode="repeat"
      >
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
            <Text style={styles.header}>🏋️‍♂️ Els teus Workouts</Text>
            <Text style={styles.subtitle}>
              {workouts.length} workouts disponibles
            </Text>

            {/* Calendari setmanal */}
            <View style={styles.weekContainer}>
              <Text style={styles.weekTitle}>📅 Aquesta Setmana:</Text>
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
                      <Ionicons name="play-circle" size={16} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Llista de workouts */}
            <Text style={styles.sectionTitle}>💪 Tots els Workouts:</Text>

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
                />
              ))
            )}
          </ScrollView>

          {/* BOTÓ FLOTANT PER GENERAR AMB IA */}
          <TouchableOpacity
            style={[styles.fabButton, styles.fabButtonSecondary]}
            onPress={() => setAiGeneratorVisible(true)}
          >
            <Ionicons name="sparkles" size={28} color="white" />
          </TouchableOpacity>

          {/* BOTÓ FLOTANT PER CREAR WORKOUT */}
          <TouchableOpacity
            style={styles.fabButton}
            onPress={handleOpenCreateModal}
          >
            <Ionicons name="add" size={32} color="white" />
          </TouchableOpacity>

          {/* MODAL DE CREACIÓ DE WORKOUT */}
          <CreateWorkoutModal
            visible={createModalVisible}
            onClose={() => {
              setCreateModalVisible(false);
              resetCreateForm();
            }}
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

          {/* MODAL DE GENERADOR DE AI */}
          <AIWorkoutGeneratorModal
            visible={aiGeneratorVisible}
            onClose={() => setAiGeneratorVisible(false)}
            onWorkoutGenerated={(workout) => {
              loadWorkoutData(); // Recargar workouts
            }}
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
      </ImageBackground>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { padding: 20, paddingBottom: 100 },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginBottom: 5,
    marginTop: 10,
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
  weekTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginBottom: 15,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginBottom: 15,
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
  fabButtonSecondary: {
    bottom: 100,
    backgroundColor: colors.secondary,
  },
});