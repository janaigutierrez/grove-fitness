import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  getWeeklySchedule,
  updateWeeklySchedule,
  getWorkouts
} from '../services/api';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes', icon: 'moon' },
  { key: 'tuesday', label: 'Martes', icon: 'planet' },
  { key: 'wednesday', label: 'Miércoles', icon: 'sunny' },
  { key: 'thursday', label: 'Jueves', icon: 'thunderstorm' },
  { key: 'friday', label: 'Viernes', icon: 'flame' },
  { key: 'saturday', label: 'Sábado', icon: 'basketball' },
  { key: 'sunday', label: 'Domingo', icon: 'bed' }
];

export default function WeeklyScheduleScreen({ navigation }) {
  const [schedule, setSchedule] = useState({});
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [workoutPickerVisible, setWorkoutPickerVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scheduleData, workoutsData] = await Promise.all([
        getWeeklySchedule(),
        getWorkouts({ is_template: true })
      ]);

      setSchedule(scheduleData.weekly_schedule || {});
      setWorkouts(workoutsData.workouts || []);
    } catch (error) {
      console.error('Error loading schedule:', error);
      Alert.alert('Error', 'No se pudo cargar el schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (dayKey) => {
    setSelectedDay(dayKey);
    setWorkoutPickerVisible(true);
  };

  const handleSelectWorkout = async (workout) => {
    if (!selectedDay) return;

    const newSchedule = {
      ...schedule,
      [selectedDay]: workout._id
    };

    setSchedule(newSchedule);
    setWorkoutPickerVisible(false);
    setSelectedDay(null);

    // Guardar automáticamente
    await saveSchedule(newSchedule);
  };

  const handleRemoveWorkout = async (dayKey) => {
    Alert.alert(
      'Eliminar entrenamiento',
      '¿Estás seguro de que quieres eliminar este entrenamiento del día?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const newSchedule = { ...schedule };
            delete newSchedule[dayKey];
            setSchedule(newSchedule);
            await saveSchedule(newSchedule);
          }
        }
      ]
    );
  };

  const handleSetRestDay = async (dayKey) => {
    const newSchedule = {
      ...schedule,
      [dayKey]: null
    };

    setSchedule(newSchedule);
    setWorkoutPickerVisible(false);
    setSelectedDay(null);

    await saveSchedule(newSchedule);
  };

  const saveSchedule = async (newSchedule) => {
    try {
      setSaving(true);
      await updateWeeklySchedule({ weekly_schedule: newSchedule });
      Alert.alert('Éxito', 'Schedule actualizado');
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'No se pudo guardar el schedule');
    } finally {
      setSaving(false);
    }
  };

  const getWorkoutForDay = (dayKey) => {
    const workoutId = schedule[dayKey];
    if (!workoutId) return null;
    if (workoutId === null) return { name: 'Descanso', _id: null };
    return workouts.find(w => w._id === workoutId);
  };

  const renderDay = (day) => {
    const workout = getWorkoutForDay(day.key);
    const hasWorkout = workout !== null && workout !== undefined;
    const isRestDay = schedule[day.key] === null;

    return (
      <TouchableOpacity
        key={day.key}
        style={[
          styles.dayCard,
          hasWorkout && styles.dayCardActive,
          isRestDay && styles.dayCardRest
        ]}
        onPress={() => handleDayPress(day.key)}
      >
        <View style={styles.dayHeader}>
          <Icon
            name={day.icon}
            size={24}
            color={hasWorkout ? (isRestDay ? '#999' : '#4CAF50') : '#ccc'}
          />
          <Text style={[
            styles.dayLabel,
            hasWorkout && styles.dayLabelActive
          ]}>
            {day.label}
          </Text>
        </View>

        {hasWorkout ? (
          <View style={styles.workoutInfo}>
            <Text style={[
              styles.workoutName,
              isRestDay && styles.workoutNameRest
            ]} numberOfLines={2}>
              {workout?.name || 'Descanso'}
            </Text>
            {!isRestDay && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveWorkout(day.key)}
              >
                <Icon name="close-circle" size={20} color="#f44336" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.emptyWorkout}>
            <Icon name="add-circle-outline" size={24} color="#ccc" />
            <Text style={styles.emptyText}>Añadir entrenamiento</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Cargando schedule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#2D5016" />
          </TouchableOpacity>
          <Text style={styles.title}>Schedule Semanal</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Icon name="information-circle" size={24} color="#4CAF50" />
          <Text style={styles.infoText}>
            Configura tus entrenamientos para cada día de la semana
          </Text>
        </View>

        {/* Days Grid */}
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.daysContainer}>
            {DAYS_OF_WEEK.map(renderDay)}
          </View>
        </ScrollView>

        {/* Saving Indicator */}
        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="white" />
            <Text style={styles.savingText}>Guardando...</Text>
          </View>
        )}
      </View>

      {/* Workout Picker Modal */}
      <Modal
        visible={workoutPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWorkoutPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Seleccionar Entrenamiento
              </Text>
              <TouchableOpacity onPress={() => setWorkoutPickerVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.workoutList}>
              {/* Rest Day Option */}
              <TouchableOpacity
                style={styles.workoutOption}
                onPress={() => handleSetRestDay(selectedDay)}
              >
                <View style={[styles.workoutIconContainer, { backgroundColor: '#999' }]}>
                  <Icon name="bed" size={24} color="white" />
                </View>
                <View style={styles.workoutOptionContent}>
                  <Text style={styles.workoutOptionName}>Día de descanso</Text>
                  <Text style={styles.workoutOptionDesc}>Sin entrenamiento</Text>
                </View>
              </TouchableOpacity>

              {/* Workout Options */}
              {workouts.map((workout) => (
                <TouchableOpacity
                  key={workout._id}
                  style={styles.workoutOption}
                  onPress={() => handleSelectWorkout(workout)}
                >
                  <View style={styles.workoutIconContainer}>
                    <Icon name="barbell" size={24} color="white" />
                  </View>
                  <View style={styles.workoutOptionContent}>
                    <Text style={styles.workoutOptionName}>{workout.name}</Text>
                    <Text style={styles.workoutOptionDesc}>
                      {workout.exercises?.length || 0} ejercicios
                      {workout.estimated_duration ? ` • ${workout.estimated_duration} min` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {workouts.length === 0 && (
                <View style={styles.emptyWorkouts}>
                  <Icon name="barbell-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyWorkoutsText}>
                    No hay workouts disponibles
                  </Text>
                  <Text style={styles.emptyWorkoutsSubtext}>
                    Crea un workout primero
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2D5016',
  },
  scrollContainer: {
    flex: 1,
  },
  daysContainer: {
    padding: 20,
    paddingTop: 0,
  },
  dayCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayCardActive: {
    borderColor: '#4CAF50',
  },
  dayCardRest: {
    borderColor: '#999',
    backgroundColor: '#f9f9f9',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  dayLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
  },
  dayLabelActive: {
    color: '#2D5016',
  },
  workoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workoutName: {
    flex: 1,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  workoutNameRest: {
    color: '#999',
    fontStyle: 'italic',
  },
  removeBtn: {
    padding: 4,
  },
  emptyWorkout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  savingIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  savingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  workoutList: {
    padding: 20,
  },
  workoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 10,
  },
  workoutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  workoutOptionContent: {
    flex: 1,
  },
  workoutOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  workoutOptionDesc: {
    fontSize: 13,
    color: '#666',
  },
  emptyWorkouts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyWorkoutsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 15,
  },
  emptyWorkoutsSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
});
