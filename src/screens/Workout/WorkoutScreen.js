// frontend/src/screens/Workout/WorkoutScreen.js - CONECTADO AL BACKEND
import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WorkoutCard from '../../components/common/WorkoutCard';
import { realWorkouts } from '../../data/realWorkouts';
import {
  startWorkoutSession,
  updateWorkoutSession,
  completeWorkoutSession,
  abandonWorkoutSession,
  getWorkouts,
  createWorkout,
  deleteWorkout,
  getUserStats
} from '../../services/api';

export default function WorkoutScreen({ token }) {
  const [activeSession, setActiveSession] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [restTimer, setRestTimer] = useState(0);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [userWorkouts, setUserWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState({
    exercises_performed: [],
    session_notes: ''
  });

  // Cargar workouts del usuario al montar
  useEffect(() => {
    if (token) {
      loadUserWorkouts();
    }
  }, [token]);

  const loadUserWorkouts = async () => {
    try {
      const workouts = await getWorkouts(token);
      setUserWorkouts(workouts);
    } catch (error) {
      console.error('Error loading workouts:', error);
      // Usar datos locales como fallback
      setUserWorkouts(realWorkouts);
    }
  };

  // Función para empezar un entrenamiento - CONECTADA AL BACKEND
  const startWorkout = async (workout) => {
    setLoading(true);
    try {
      // Crear sesión en el backend
      const session = await startWorkoutSession(workout.id, token);
      console.log('Sesión iniciada:', session);

      setActiveSession(session);
      setSelectedWorkout(workout);
      setModalVisible(true);
      setCurrentExercise(0);
      setCurrentSet(1);
      setWorkoutStarted(true);

      // Inicializar datos de la sesión
      setSessionData({
        exercises_performed: workout.exercises.map(ex => ({
          exercise_id: ex.id || ex.name, // Fallback si no hay ID
          sets_completed: [],
          total_sets: ex.sets,
          completed_sets: 0
        })),
        session_notes: ''
      });

      Alert.alert(
        "🔥 ¡SESIÓN INICIADA!",
        `Entrenamiento: ${workout.title}\nDuración: ${workout.duration}\n\n¡A por esas SUPER TETAS!`,
        [{ text: "¡DALE CAÑA!", style: "default" }]
      );
    } catch (error) {
      console.error('Error starting workout:', error);
      Alert.alert("Error", "No se pudo iniciar la sesión. ¿Backend corriendo?");
    }
    setLoading(false);
  };

  // Función para completar una serie - GUARDAR EN BACKEND
  const completeSet = async () => {
    const totalSets = selectedWorkout.exercises[currentExercise].sets;

    // Actualizar datos de la sesión
    const updatedSessionData = { ...sessionData };
    const exerciseData = updatedSessionData.exercises_performed[currentExercise];

    // Añadir set completado
    exerciseData.sets_completed.push({
      set_number: currentSet,
      reps_completed: selectedWorkout.exercises[currentExercise].reps,
      weight_used: selectedWorkout.exercises[currentExercise].weight || 'corporal',
      completed: true,
      notes: ''
    });
    exerciseData.completed_sets = currentSet;

    setSessionData(updatedSessionData);

    try {
      // Actualizar sesión en el backend
      if (activeSession) {
        await updateWorkoutSession(activeSession.id, updatedSessionData.exercises_performed, token);
      }
    } catch (error) {
      console.error('Error updating session:', error);
    }

    if (currentSet < totalSets) {
      // Siguiente serie del mismo ejercicio
      setCurrentSet(currentSet + 1);
      setRestTimer(60); // 60 segundos de descanso
      startRestTimer();
    } else if (currentExercise < selectedWorkout.exercises.length - 1) {
      // Siguiente ejercicio
      setCurrentExercise(currentExercise + 1);
      setCurrentSet(1);
      Alert.alert("✅ Ejercicio completado", "¡Siguiente ejercicio!");
    } else {
      // Entrenamiento completado
      completeWorkout();
    }
  };

  // Timer de descanso
  const startRestTimer = () => {
    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          Alert.alert("⏰ ¡Descanso terminado!", "¡Siguiente serie!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Completar entrenamiento - GUARDAR EN BACKEND
  const completeWorkout = async () => {
    try {
      if (activeSession) {
        const completionData = {
          difficulty: 8, // Podrías pedirle al usuario que lo evalúe
          energy: 7,
          mood: 'great',
          notes: 'Entrenamiento completado desde la app Grove!'
        };

        await completeWorkoutSession(activeSession.id, completionData, token);
        console.log('Entrenamiento completado y guardado');
      }

      Alert.alert(
        "🎉 ¡ENTRENAMIENTO COMPLETADO!",
        `¡BESTIAL! Has terminado ${selectedWorkout.title}\n\n🔥 +1 hacia las SUPER TETAS\n💪 Consistency mantenida\n⚡ Progreso guardado en el backend\n\n¡${48 + 1} entrenamientos completados!`,
        [
          {
            text: "🚀 ¡BRUTAL!", onPress: () => {
              setModalVisible(false);
              setWorkoutStarted(false);
              setActiveSession(null);
              // Recargar estadísticas
              loadUserWorkouts();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error completing workout:', error);
      Alert.alert("Entrenamiento completado", "¡Genial! (Error guardando en backend)");
      setModalVisible(false);
      setWorkoutStarted(false);
    }
  };

  // Abandonar entrenamiento - MARCAR EN BACKEND
  const abandonWorkout = () => {
    Alert.alert(
      "❌ Abandonar Entrenamiento",
      "¿Seguro que quieres parar? ¡Estás tan cerca de las SUPER TETAS!",
      [
        { text: "Continuar", style: "cancel" },
        {
          text: "Abandonar",
          style: "destructive",
          onPress: async () => {
            try {
              if (activeSession) {
                await abandonWorkoutSession(activeSession.id, "Usuario abandonó desde la app", token);
              }
            } catch (error) {
              console.error('Error abandoning workout:', error);
            }
            setModalVisible(false);
            setWorkoutStarted(false);
            setActiveSession(null);
          }
        }
      ]
    );
  };

  // Función para crear un nuevo workout
  const createNewWorkout = async () => {
    Alert.alert(
      "🏗️ Crear Nuevo Entrenamiento",
      "¿Quieres crear un entrenamiento personalizado?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Crear",
          onPress: async () => {
            try {
              const newWorkout = {
                name: "Mi Entrenamiento Personalizado",
                exercises: [
                  { exercise_id: "1", order: 1, custom_sets: 3, custom_reps: 10 }
                ],
                workout_type: "custom",
                difficulty: "medium",
                estimated_duration: 30
              };

              const created = await createWorkout(newWorkout, token);
              Alert.alert("✅ Creado", `Nuevo entrenamiento: ${created.name}`);
              loadUserWorkouts();
            } catch (error) {
              Alert.alert("Error", "No se pudo crear el entrenamiento");
            }
          }
        }
      ]
    );
  };

  const weekSchedule = [
    { day: 'LUN', workout: realWorkouts[0], active: true, today: true },
    { day: 'MAR', workout: realWorkouts[1], active: true, today: false },
    { day: 'MIE', workout: null, active: false, rest: 'Descanso', today: false },
    { day: 'JUE', workout: realWorkouts[2], active: true, today: false },
    { day: 'VIE', workout: realWorkouts[3], active: true, today: false },
    { day: 'SAB', workout: null, active: false, rest: 'Cardio', today: false },
    { day: 'DOM', workout: null, active: false, rest: 'Rest', today: false }
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🏋️‍♂️ Tu Rutina 4 Días</Text>
          <TouchableOpacity style={styles.addButton} onPress={createNewWorkout}>
            <Ionicons name="add-circle" size={24} color="#4CAF50" />
            <Text style={styles.addButtonText}>Nuevo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Semana 12 - Nivel Bestia 🔥</Text>

        {/* Calendario semanal con botones */}
        <View style={styles.weekOverview}>
          <Text style={styles.weekTitle}>📅 Esta Semana:</Text>
          <View style={styles.weekGrid}>
            {weekSchedule.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  item.active ? styles.workoutDay : styles.restDay,
                  item.today ? styles.todayHighlight : null
                ]}
                onPress={() => item.workout ? startWorkout(item.workout) : null}
                disabled={!item.active || loading}
              >
                <Text style={[styles.dayName, item.today ? styles.todayText : null]}>
                  {item.day}
                </Text>
                <Text style={styles.dayDescription}>
                  {item.workout ? item.workout.title.split(' - ')[1] : item.rest}
                </Text>
                {item.active && !loading && (
                  <Ionicons name="play-circle" size={20} color="#4CAF50" />
                )}
                {loading && (
                  <Text style={styles.loadingText}>...</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Entrenamientos con botones START */}
        <Text style={styles.sectionTitle}>💪 Entrenamientos:</Text>

        {realWorkouts.map(workout => (
          <View key={workout.id} style={styles.workoutContainer}>
            <WorkoutCard
              title={workout.title}
              duration={workout.duration}
              description={workout.description}
              level={workout.level}
              exercises={workout.exercises}
            />
            <TouchableOpacity
              style={[styles.startButton, loading && styles.buttonDisabled]}
              onPress={() => startWorkout(workout)}
              disabled={loading}
            >
              <Ionicons name="play" size={20} color="white" />
              <Text style={styles.startButtonText}>
                {loading ? 'INICIANDO...' : 'EMPEZAR AHORA'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* MODAL DE ENTRENAMIENTO ACTIVO - SIN CAMBIOS */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={abandonWorkout}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={abandonWorkout} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedWorkout?.title}</Text>
            <Text style={styles.modalProgress}>
              Ejercicio {currentExercise + 1}/{selectedWorkout?.exercises.length}
            </Text>
          </View>

          {selectedWorkout && (
            <View style={styles.exerciseContainer}>
              <Text style={styles.exerciseName}>
                {selectedWorkout.exercises[currentExercise].name}
              </Text>

              <View style={styles.setInfo}>
                <Text style={styles.setCounter}>
                  Serie {currentSet} de {selectedWorkout.exercises[currentExercise].sets}
                </Text>
                <Text style={styles.repsInfo}>
                  {selectedWorkout.exercises[currentExercise].reps} repeticiones
                </Text>
              </View>

              {restTimer > 0 && (
                <View style={styles.restContainer}>
                  <Text style={styles.restTitle}>⏱️ Descanso:</Text>
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
                    {currentSet < selectedWorkout.exercises[currentExercise].sets ?
                      '✅ Serie Completada' :
                      currentExercise < selectedWorkout.exercises.length - 1 ?
                        '➡️ Siguiente Ejercicio' :
                        '🎉 Terminar Entreno'
                    }
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.skipButton]}
                  onPress={() => setRestTimer(0)}
                >
                  <Text style={styles.actionButtonText}>⏭️ Saltar Descanso</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 14,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
  },
  weekOverview: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 15,
  },
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: '13%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 10,
    padding: 5,
  },
  workoutDay: {
    backgroundColor: '#e8f5e9',
  },
  restDay: {
    backgroundColor: '#f0f0f0',
  },
  todayHighlight: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  dayName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 2,
  },
  todayText: {
    color: '#4CAF50',
  },
  dayDescription: {
    fontSize: 9,
    color: '#333',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 10,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 15,
  },
  workoutContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  startButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 14,
  },
  // Modal styles (sin cambios)
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    backgroundColor: '#2D5016',
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
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
  exerciseName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D5016',
    textAlign: 'center',
    marginBottom: 30,
  },
  setInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  setCounter: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  repsInfo: {
    fontSize: 18,
    color: '#666',
  },
  restContainer: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#fff3e0',
    padding: 20,
    borderRadius: 15,
  },
  restTitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  restTimer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff9800',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  actionButton: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  skipButton: {
    backgroundColor: '#666',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});