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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// TUS DATOS REALES 💪
const realWorkouts = [
  {
    id: 1,
    title: 'LUNES - PUSH',
    description: 'Pectorals, hombros y tríceps',
    duration: '30-35 min',
    level: 'Bestia 🔥',
    exercises: [
      { name: 'Flexiones tabla (CHEST)', sets: 4, reps: '12-15', weight: 'corporal' },
      { name: 'Low to High Fly ⭐', sets: 3, reps: '8-10', weight: '5kg' },
      { name: 'Aperturas suelo ⭐', sets: 3, reps: '10-12', weight: '5kg' },
      { name: 'Close Push Up', sets: 3, reps: '8-10', weight: 'corporal' },
      { name: 'Plancha militar', sets: 3, reps: '30-45s', weight: '-' },
      { name: 'Crunches con peso', sets: 3, reps: '15-20', weight: '5kg' }
    ]
  },
  {
    id: 2,
    title: 'MARTES - PULL',
    description: 'Dominadas + espalda + bíceps',
    duration: '35-40 min',
    level: 'Bestia 🔥',
    exercises: [
      { name: 'Dominadas agarre ancho', sets: 4, reps: '5+', weight: 'corporal' },
      { name: 'Dominadas agarre estrecho', sets: 3, reps: '5+', weight: 'corporal' },
      { name: 'Remo invertido', sets: 4, reps: '10-12', weight: 'corporal' },
      { name: 'Pull aparts gomas', sets: 3, reps: '10-15', weight: '25kg' },
      { name: 'Shrugs intensos', sets: 3, reps: '12-15', weight: '6kg' }
    ]
  },
  {
    id: 3,
    title: 'JUEVES - LOWER',
    description: 'Piernas + glúteos',
    duration: '28-32 min',
    level: 'Bestia 🔥',
    exercises: [
      { name: 'Sentadillas goblet ⭐', sets: 4, reps: '12-15', weight: '6kg' },
      { name: 'Peso muerto rumano', sets: 4, reps: '10-12', weight: '6kg' },
      { name: 'Sentadillas profundas', sets: 3, reps: '10-12', weight: 'corporal' },
      { name: 'Zancadas alternas', sets: 3, reps: '8 c/pierna', weight: '4kg' },
      { name: 'Elevaciones pantorrillas', sets: 3, reps: '15-20', weight: '6kg' }
    ]
  },
  {
    id: 4,
    title: 'VIERNES - FULL BODY PUMP',
    description: 'Todo el cuerpo + pump',
    duration: '25-30 min',
    level: 'Bestia 🔥',
    exercises: [
      { name: 'Dominadas', sets: 2, reps: 'máx reps', weight: 'corporal' },
      { name: 'Flexiones tabla', sets: 2, reps: '15', weight: 'corporal' },
      { name: 'Sentadillas goblet', sets: 2, reps: '15', weight: '5kg' },
      { name: 'Low to High Fly', sets: 2, reps: '10', weight: '4kg' },
      { name: 'Plancha', sets: 2, reps: '30s', weight: '-' }
    ]
  }
];

export default function WorkoutScreen({ token }) {
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [restTimer, setRestTimer] = useState(0);
  const [workoutStarted, setWorkoutStarted] = useState(false);

  // Timer de descanso
  useEffect(() => {
    let interval;
    if (restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            Alert.alert("⏰ ¡Descanso terminado!", "¡Siguiente serie!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const startWorkout = (workout) => {
    setSelectedWorkout(workout);
    setModalVisible(true);
    setCurrentExercise(0);
    setCurrentSet(1);
    setWorkoutStarted(true);

    Alert.alert(
      "🔥 ¡SESIÓN INICIADA!",
      `Entrenamiento: ${workout.title}\nDuración: ${workout.duration}\n\n¡A por esas SUPER TETAS!`,
      [{ text: "¡DALE CAÑA!", style: "default" }]
    );
  };

  const completeSet = () => {
    const totalSets = selectedWorkout.exercises[currentExercise].sets;

    if (currentSet < totalSets) {
      setCurrentSet(currentSet + 1);
      setRestTimer(60); // 60 segundos descanso
    } else if (currentExercise < selectedWorkout.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setCurrentSet(1);
      Alert.alert("✅ Ejercicio completado", "¡Siguiente ejercicio!");
    } else {
      completeWorkout();
    }
  };

  const completeWorkout = () => {
    Alert.alert(
      "🎉 ¡ENTRENAMIENTO COMPLETADO!",
      `¡BESTIAL! Has terminado ${selectedWorkout.title}\n\n🔥 +1 hacia las SUPER TETAS\n💪 Consistency mantenida\n\n¡Un paso más cerca del objetivo!`,
      [
        {
          text: "🚀 ¡BRUTAL!",
          onPress: () => {
            setModalVisible(false);
            setWorkoutStarted(false);
          }
        }
      ]
    );
  };

  const abandonWorkout = () => {
    Alert.alert(
      "❌ Abandonar Entrenamiento",
      "¿Seguro que quieres parar? ¡Estás tan cerca de las SUPER TETAS!",
      [
        { text: "Continuar", style: "cancel" },
        {
          text: "Abandonar",
          style: "destructive",
          onPress: () => {
            setModalVisible(false);
            setWorkoutStarted(false);
          }
        }
      ]
    );
  };

  // Calendario semanal con TU rutina real
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
    <LinearGradient colors={['#4CAF50', '#2D5016']} style={{ flex: 1 }}>
      <ImageBackground
        source={{ uri: 'https://www.transparenttextures.com/patterns/green-fibers.png' }}
        style={styles.bg}
        resizeMode="repeat"
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>🏋️‍♂️ Tu Rutina 4 Días</Text>
            <Text style={styles.subtitle}>Semana 12 - Nivel Bestia 🔥</Text>

            {/* Calendario semanal */}
            <View style={styles.weekContainer}>
              <Text style={styles.weekTitle}>📅 Esta Semana:</Text>
              <View style={styles.weekGrid}>
                {weekSchedule.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCard,
                      item.active ? styles.workoutDay : styles.restDay,
                      item.today ? styles.todayHighlight : null
                    ]}
                    onPress={() => item.workout ? startWorkout(item.workout) : null}
                    disabled={!item.active}
                  >
                    <Text style={[styles.dayText, item.today ? styles.todayText : null]}>
                      {item.day}
                    </Text>
                    <Text style={styles.dayDescription}>
                      {item.workout ? item.workout.title.split(' - ')[1] : item.rest}
                    </Text>
                    {item.active && (
                      <Ionicons name="play-circle" size={16} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Lista entrenamientos con TODOS los ejercicios visibles */}
            <Text style={styles.sectionTitle}>💪 Entrenamientos:</Text>

            {realWorkouts.map((workout) => (
              <View key={workout.id} style={styles.workoutCard}>
                {/* Header con icono y título */}
                <View style={styles.cardHeader}>
                  <Ionicons name="barbell" size={22} color="#4CAF50" />
                  <Text style={styles.cardTitle}>{workout.title}</Text>
                </View>

                {/* Badges informativos */}
                <View style={styles.badgesRow}>
                  <Text style={styles.badge}>⏱ {workout.duration}</Text>
                  <Text style={styles.badge}>🔥 {workout.level}</Text>
                  <Text style={styles.badge}>{workout.exercises.length} ejercicios</Text>
                </View>

                <Text style={styles.cardDescription}>{workout.description}</Text>

                {/* EJERCICIOS VISIBLES - ESTO FALTABA */}
                <View style={styles.exerciseList}>
                  <Text style={styles.exerciseListTitle}>Ejercicios:</Text>
                  {workout.exercises.map((exercise, idx) => (
                    <View key={idx} style={styles.exerciseItem}>
                      <Text style={styles.exerciseName}>
                        {exercise.name.includes('⭐') ? '⭐ ' : '• '}{exercise.name.replace('⭐', '')}
                      </Text>
                      <Text style={styles.exerciseDetails}>
                        {exercise.sets}x{exercise.reps} {exercise.weight !== '-' && exercise.weight !== 'corporal' ? `(${exercise.weight})` : ''}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Botón empezar */}
                <TouchableOpacity
                  style={styles.cardButton}
                  onPress={() => startWorkout(workout)}
                >
                  <Ionicons name="play" size={18} color="white" />
                  <Text style={styles.cardButtonText}>EMPEZAR</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* MODAL FUNCIONAL - TU DISEÑO ANTERIOR MEJORADO */}
          <Modal visible={modalVisible} animationType="slide" transparent={false}>
            <LinearGradient colors={['#2D5016', '#4CAF50']} style={{ flex: 1 }}>
              <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={abandonWorkout} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="white" />
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
                      <Text style={styles.weightInfo}>
                        Peso: {selectedWorkout.exercises[currentExercise].weight}
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
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
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
    marginBottom: 10
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#2D5016',
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
    marginBottom: 12
  },
  exerciseList: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },
  exerciseListTitle: {
    fontSize: 16,
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
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  exerciseDetails: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
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