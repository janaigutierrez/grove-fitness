import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
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
  updateSession,
  completeWorkoutSession,
  abandonSession
} from '../services/api';
import { handleApiError } from '../utils/errorHandler';

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
  const [currentExercise, setCurrentExercise] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [restTimer, setRestTimer] = useState(0);
  const [completedSets, setCompletedSets] = useState([]);

  useEffect(() => {
    loadWorkoutData();
  }, []);

  // Timer de descanso
  useEffect(() => {
    let interval;
    if (restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            Alert.alert("⏰ Descanso terminado!", "¡Siguiente serie!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

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

  const startWorkout = async (workout) => {
    try {
      console.log('🏋️ Iniciant workout:', workout.name);

      // Crear sessió al backend
      const session = await startWorkoutSession(workout.id);

      console.log('✅ Sessió creada:', session);

      setCurrentSessionId(session.id);
      setSelectedWorkout(workout);
      setCurrentExercise(0);
      setCurrentSet(1);
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

  const completeSet = () => {
    const exercise = selectedWorkout.exercises[currentExercise];
    const totalSets = exercise.custom_sets || exercise.exercise_id.default_sets || 3;

    // Guardar set completat
    const newCompletedSet = {
      exercise_index: currentExercise,
      set_number: currentSet,
      completed_at: new Date().toISOString()
    };

    setCompletedSets([...completedSets, newCompletedSet]);

    if (currentSet < totalSets) {
      // Següent sèrie del mateix exercici
      setCurrentSet(currentSet + 1);
      setRestTimer(exercise.custom_rest_seconds || exercise.exercise_id.default_rest_seconds || 60);
    } else if (currentExercise < selectedWorkout.exercises.length - 1) {
      // Següent exercici
      setCurrentExercise(currentExercise + 1);
      setCurrentSet(1);
      Alert.alert("✅ Exercici completat", "¡Següent exercici!");
    } else {
      // Workout completat
      handleCompleteWorkout();
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      Alert.alert(
        "💪 Completar Entrenament",
        "Com t'has sentit?",
        [
          {
            text: "Cancel·lar",
            style: "cancel"
          },
          {
            text: "Completar",
            onPress: async () => {
              try {
                // Completar sessió al backend
                const sessionData = {
                  perceived_difficulty: 7, // Podries demanar això amb un slider
                  energy_level: 8,
                  mood_after: 'great',
                  notes: 'Entrenament completat des de l\'app'
                };

                await completeWorkoutSession(currentSessionId, sessionData);

                Alert.alert(
                  "🎉 ENTRENAMENT COMPLETAT!",
                  `¡BRUTAL! Has acabat ${selectedWorkout.name}\n\n🔥 +1 cap als teus objectius\n💪 Progressió registrada\n\n¡Un pas més a prop!`,
                  [
                    {
                      text: "🚀 GENIAL!",
                      onPress: () => {
                        setModalVisible(false);
                        loadWorkoutData(); // Recarregar per actualitzar stats
                      }
                    }
                  ]
                );

              } catch (error) {
                console.error('❌ Error completant sessió:', error);
                const errorInfo = handleApiError(error);
                Alert.alert(errorInfo.title, errorInfo.message);
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error:', error);
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
              // Tanquem igualment
              setModalVisible(false);
            }
          }
        }
      ]
    );
  };

  // Generar calendari setmanal
  const getDaySchedule = () => {
    if (!weekSchedule) return [];

    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['DL', 'DM', 'DC', 'DJ', 'DV', 'DS', 'DG'];
    const today = new Date().getDay(); // 0 = diumenge
    const todayIndex = today === 0 ? 6 : today - 1; // Convertir a índex 0-6 (dilluns=0)

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
              <View style={styles.noWorkouts}>
                <Ionicons name="barbell-outline" size={64} color="rgba(255,255,255,0.3)" />
                <Text style={styles.noWorkoutsText}>Encara no tens workouts</Text>
                <Text style={styles.noWorkoutsSubtext}>Crea'n un o genera'n un amb IA!</Text>
              </View>
            ) : (
              workouts.map((workout) => (
                <View key={workout.id} style={styles.workoutCard}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="barbell" size={22} color="#4CAF50" />
                    <Text style={styles.cardTitle}>{workout.name}</Text>
                  </View>

                  <View style={styles.badgesRow}>
                    <Text style={styles.badge}>
                      ⏱ {workout.estimated_duration || 30} min
                    </Text>
                    <Text style={styles.badge}>
                      🔥 {workout.difficulty || 'intermediate'}
                    </Text>
                    <Text style={styles.badge}>
                      {workout.exercises?.length || 0} exercicis
                    </Text>
                  </View>

                  {workout.description && (
                    <Text style={styles.cardDescription}>{workout.description}</Text>
                  )}

                  {/* Exercicis */}
                  {workout.exercises && workout.exercises.length > 0 && (
                    <View style={styles.exerciseList}>
                      <Text style={styles.exerciseListTitle}>Exercicis:</Text>
                      {workout.exercises.slice(0, 3).map((ex, idx) => (
                        <View key={idx} style={styles.exerciseItem}>
                          <Text style={styles.exerciseName}>
                            • {ex.exercise_id?.name || 'Exercici'}
                          </Text>
                          <Text style={styles.exerciseDetails}>
                            {ex.custom_sets || ex.exercise_id?.default_sets || 3}x
                            {ex.custom_reps || ex.exercise_id?.default_reps || 10}
                          </Text>
                        </View>
                      ))}
                      {workout.exercises.length > 3 && (
                        <Text style={styles.moreExercises}>
                          +{workout.exercises.length - 3} més...
                        </Text>
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.cardButton}
                    onPress={() => startWorkout(workout)}
                  >
                    <Ionicons name="play" size={18} color="white" />
                    <Text style={styles.cardButtonText}>COMENÇAR</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          {/* MODAL D'ENTRENAMENT */}
          <Modal visible={modalVisible} animationType="slide" transparent={false}>
            <LinearGradient colors={['#2D5016', '#4CAF50']} style={{ flex: 1 }}>
              <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={handleAbandonWorkout} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>{selectedWorkout?.name}</Text>
                  <Text style={styles.modalProgress}>
                    Exercici {currentExercise + 1}/{selectedWorkout?.exercises?.length || 0}
                  </Text>
                </View>

                {selectedWorkout && selectedWorkout.exercises && selectedWorkout.exercises[currentExercise] && (
                  <View style={styles.exerciseContainer}>
                    <Text style={styles.exerciseNameModal}>
                      {selectedWorkout.exercises[currentExercise].exercise_id?.name || 'Exercici'}
                    </Text>

                    <View style={styles.setInfo}>
                      <Text style={styles.setCounter}>
                        Sèrie {currentSet} de{' '}
                        {selectedWorkout.exercises[currentExercise].custom_sets ||
                          selectedWorkout.exercises[currentExercise].exercise_id?.default_sets ||
                          3}
                      </Text>
                      <Text style={styles.repsInfo}>
                        {selectedWorkout.exercises[currentExercise].custom_reps ||
                          selectedWorkout.exercises[currentExercise].exercise_id?.default_reps ||
                          10}{' '}
                        repeticions
                      </Text>
                      {selectedWorkout.exercises[currentExercise].custom_weight && (
                        <Text style={styles.weightInfo}>
                          Pes: {selectedWorkout.exercises[currentExercise].custom_weight}
                        </Text>
                      )}
                    </View>

                    {restTimer > 0 && (
                      <View style={styles.restContainer}>
                        <Text style={styles.restTitle}>⏱️ Descans:</Text>
                        <Text style={styles.restTimer}>{restTimer}s</Text>
                      </View>
                    )}

                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.completeButton]}
                        onPress={completeSet}
                        disabled={restTimer > 0}
                      >
                        <Text style={styles.actionButtonText}>
                          {currentSet < (selectedWorkout.exercises[currentExercise].custom_sets ||
                            selectedWorkout.exercises[currentExercise].exercise_id?.default_sets ||
                            3)
                            ? '✅ Sèrie Completada'
                            : currentExercise < selectedWorkout.exercises.length - 1
                              ? '➡️ Següent Exercici'
                              : '🎉 Acabar Entreno'}
                        </Text>
                      </TouchableOpacity>

                      {restTimer > 0 && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.skipButton]}
                          onPress={() => setRestTimer(0)}
                        >
                          <Text style={styles.actionButtonText}>⏭️ Saltar Descans</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </SafeAreaView>
            </LinearGradient>
          </Modal>
        </SafeAreaView>
      </ImageBackground>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { padding: 20 },
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
  workoutCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#2D5016',
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#e8f5e9',
    color: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  exerciseList: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },
  exerciseListTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  exerciseName: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  exerciseDetails: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  moreExercises: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  cardButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 12,
  },
  cardButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 16,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
  },
  modalProgress: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  exerciseContainer: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNameModal: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  setInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  setCounter: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  repsInfo: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  weightInfo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  restContainer: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 15,
  },
  restTitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
  },
  restTimer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  actionButton: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  skipButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});