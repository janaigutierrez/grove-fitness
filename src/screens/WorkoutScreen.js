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
  TextInput,
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
  abandonSession,
  createWorkout,
  getExercises,
  createExercise
} from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import ExerciseSelector from '../components/common/ExerciseSelector';
import AIWorkoutGeneratorModal from '../components/AIWorkoutGeneratorModal';
import WorkoutCompletionModal from '../components/WorkoutCompletionModal';

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

    const newCompletedSet = {
      exercise_index: currentExercise,
      set_number: currentSet,
      completed_at: new Date().toISOString()
    };

    setCompletedSets([...completedSets, newCompletedSet]);

    if (currentSet < totalSets) {
      setCurrentSet(currentSet + 1);
      setRestTimer(exercise.custom_rest_seconds || exercise.exercise_id.default_rest_seconds || 60);
    } else if (currentExercise < selectedWorkout.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setCurrentSet(1);
      Alert.alert("✅ Exercici completat", "¡Següent exercici!");
    } else {
      handleCompleteWorkout();
    }
  };

  const handleCompleteWorkout = () => {
    setCompletionModalVisible(true);
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
          <Modal
            visible={createModalVisible}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setCreateModalVisible(false)}
          >
            <LinearGradient colors={['#4CAF50', '#2D5016']} style={{ flex: 1 }}>
              <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.createModalHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setCreateModalVisible(false);
                      resetCreateForm();
                    }}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                  <Text style={styles.createModalTitle}>✨ Crear Workout</Text>
                </View>

                <ScrollView style={styles.createModalContent}>
                  {/* Nom del workout */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nom del Workout *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: Push Day, Dia de Pit"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={newWorkout.name}
                      onChangeText={(text) => setNewWorkout({ ...newWorkout, name: text })}
                    />
                  </View>

                  {/* Descripció */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Descripció (opcional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Ex: Pectoral, espatlles i tríceps"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={newWorkout.description}
                      onChangeText={(text) => setNewWorkout({ ...newWorkout, description: text })}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  {/* Dificultat */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Dificultat</Text>
                    <View style={styles.pickerContainer}>
                      {['beginner', 'intermediate', 'advanced'].map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.pickerOption,
                            newWorkout.difficulty === level && styles.pickerOptionSelected
                          ]}
                          onPress={() => setNewWorkout({ ...newWorkout, difficulty: level })}
                        >
                          <Text
                            style={[
                              styles.pickerOptionText,
                              newWorkout.difficulty === level && styles.pickerOptionTextSelected
                            ]}
                          >
                            {level === 'beginner' ? 'Principiant' : level === 'intermediate' ? 'Intermedi' : 'Avançat'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Exercicis */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Exercicis *</Text>
                    {newExercises.map((exercise, index) => (
                      <View key={index} style={styles.exerciseInputRow}>
                        <ExerciseSelector
                          exercise={exercise}
                          onChange={handleExerciseChange}
                          idx={index}
                          availableExercises={availableExercises}
                        />
                        {newExercises.length > 1 && (
                          <TouchableOpacity
                            onPress={() => removeExercise(index)}
                            style={styles.removeButton}
                          >
                            <Ionicons name="trash" size={20} color="#ff5252" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}

                    <TouchableOpacity
                      style={styles.addExerciseButton}
                      onPress={addExercise}
                    >
                      <Ionicons name="add-circle-outline" size={20} color="white" />
                      <Text style={styles.addExerciseText}>Afegir Exercici</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Botó de creació */}
                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreateWorkout}
                    disabled={creating}
                  >
                    {creating ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="white" />
                        <Text style={styles.createButtonText}>CREAR WORKOUT</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </SafeAreaView>
            </LinearGradient>
          </Modal>

          {/* MODAL D'ENTRENAMENT (ja existent) */}
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

  // Create Modal styles
  createModalHeader: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  createModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  createModalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerOption: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pickerOptionSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: 'white',
  },
  pickerOptionText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    fontSize: 14,
  },
  pickerOptionTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  exerciseInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  removeButton: {
    marginLeft: 10,
    padding: 8,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  addExerciseText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  createButtonText: {
    color: '#2D5016',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },

  // Modal styles (workout session)
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