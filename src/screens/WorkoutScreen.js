import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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
import { handleApiError } from '../utils/errorHandler';
import AIWorkoutGeneratorModal from '../components/AIWorkoutGeneratorModal';
import WorkoutCompletionModal from '../components/WorkoutCompletionModal';
import ActiveWorkoutScreen from '../components/workout/ActiveWorkoutScreen';
import CreateWorkoutModal from '../components/workout/CreateWorkoutModal';
import WorkoutCard from '../components/workout/WorkoutCard';
import EmptyState from '../components/common/EmptyState';

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

      console.log('✅ Workouts carregats:', workoutsData);
      console.log('✅ Schedule carregat:', scheduleData);

      setWorkouts(workoutsData);
      setWeekSchedule(scheduleData);

    } catch (error) {
      console.error('❌ Error carregant workouts:', error);
      const errorInfo = handleApiError(error);
      Alert.alert(errorInfo.title, errorInfo.message);
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
      console.log('✅ Exercicis carregats:', exercises.length);
      setAvailableExercises(exercises);
    } catch (error) {
      console.error('❌ Error carregant exercicis:', error);
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
      Alert.alert('Error', 'El workout necessita un nom');
      return;
    }

    const validExercises = newExercises.filter(ex =>
      (ex.exercise_id || ex.newExercise) && ex.sets && ex.reps
    );

    if (validExercises.length === 0) {
      Alert.alert('Error', 'Has d\'afegir almenys un exercici vàlid');
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
          console.log('📝 Creant nou exercici:', ex.newExercise);

          const newEx = await createExercise({
            name: ex.newExercise.name.trim(),
            type: ex.newExercise.type,
            category: ex.newExercise.category, // Ara amb categoria vàlida
            default_sets: parseInt(ex.sets) || 3,
            default_reps: parseInt(ex.reps) || 10,
            default_rest_seconds: 60
          });

          exerciseId = newEx.id;
          console.log('✅ Exercici creat:', newEx.id);
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

      console.log('📝 Creant workout:', workoutData);
      const createdWorkout = await createWorkout(workoutData);

      Alert.alert(
        '✅ Workout Creat!',
        `El workout "${createdWorkout.name}" s'ha creat correctament`,
        [
          {
            text: 'Genial!',
            onPress: () => {
              setCreateModalVisible(false);
              resetCreateForm();
              loadWorkoutData(); // Recarregar llista
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error creant workout:', error);
      const errorInfo = handleApiError(error);
      Alert.alert(errorInfo.title, errorInfo.message);
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
      console.log('🏋️ Iniciant workout:', workout.name);

      const session = await startWorkoutSession(workout.id);
      console.log('✅ Sessió creada:', session);

      setCurrentSessionId(session.id);
      setSelectedWorkout(workout);
      setCompletedSets([]);
      setModalVisible(true);

      Alert.alert(
        "🔥 SESSIÓ INICIADA!",
        `Entrenament: ${workout.name}\nDurada estimada: ${workout.estimated_duration || 30} min\n\n¡A per elles!`,
        [{ text: "¡DALE!", style: "default" }]
      );

    } catch (error) {
      console.error('❌ Error iniciant workout:', error);
      const errorInfo = handleApiError(error);
      Alert.alert(errorInfo.title, errorInfo.message);
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

      Alert.alert(
        "🎉 ENTRENAMIENTO COMPLETADO!",
        `¡BRUTAL! Has acabado ${selectedWorkout.name}\n\n🔥 +1 hacia tus objetivos\n💪 Progresión registrada\n\n¡Un paso más cerca!`,
        [
          {
            text: "🚀 GENIAL!",
            onPress: () => {
              setModalVisible(false);
              loadWorkoutData();
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error completando sesión:', error);
      const errorInfo = handleApiError(error);
      Alert.alert(errorInfo.title, errorInfo.message);
    } finally {
      setCompletingSession(false);
    }
  };

  const handleAbandonWorkout = () => {
    Alert.alert(
      "❌ Abandonar Entrenament",
      "Segur que vols parar? Estàs tan a prop!",
      [
        { text: "Continuar", style: "cancel" },
        {
          text: "Abandonar",
          style: "destructive",
          onPress: async () => {
            try {
              await abandonSession(currentSessionId, "Abandonat per l'usuari");
              setModalVisible(false);
              Alert.alert("Info", "Sessió abandonada. Torna-ho a intentar aviat!");
            } catch (error) {
              console.error('❌ Error abandonant sessió:', error);
              setModalVisible(false);
            }
          }
        }
      ]
    );
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
      <LinearGradient colors={['#4CAF50', '#2D5016']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="white" />
          <Text style={{ color: 'white', marginTop: 10 }}>Carregant workouts...</Text>
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
    <LinearGradient colors={['#4CAF50', '#2D5016']} style={{ flex: 1 }}>
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
    color: 'white',
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
    color: 'white',
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
    color: 'white',
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
    color: 'white',
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
    color: 'white',
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
    backgroundColor: '#4CAF50',
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
    backgroundColor: '#FF9800',
  },
});