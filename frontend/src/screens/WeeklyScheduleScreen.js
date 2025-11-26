import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  getWeeklySchedule,
  updateWeeklySchedule,
  getWorkouts
} from '../services/api';
import { handleApiError, formatSuccessMessage } from '../utils/errorHandler';
import ConfirmModal from '../components/common/ConfirmModal';
import InfoModal from '../components/common/InfoModal';
import ErrorModal from '../components/common/ErrorModal';
import useModal from '../hooks/useModal';
import colors from '../constants/colors';

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

  // System modals
  const confirmModal = useModal();
  const infoModal = useModal();
  const errorModal = useModal();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scheduleData, workoutsData] = await Promise.all([
        getWeeklySchedule(),
        getWorkouts() // Get ALL workouts, not just templates
      ]);

      setSchedule(scheduleData.weekly_schedule || {});
      setWorkouts(workoutsData.workouts || []);
    } catch (error) {
      const errorInfo = handleApiError(error);
      errorModal.openModal({
        title: errorInfo.title,
        message: 'No se pudo cargar el schedule',
        icon: errorInfo.icon,
      });
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
      [selectedDay]: workout.id || workout._id
    };

    setSchedule(newSchedule);
    setWorkoutPickerVisible(false);
    setSelectedDay(null);

    // Guardar automáticamente
    await saveSchedule(newSchedule);
  };

  const handleRemoveWorkout = async (dayKey) => {
    confirmModal.openModal({
      title: 'Eliminar entrenamiento',
      message: '¿Estás seguro de que quieres eliminar este entrenamiento del día?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: async () => {
        confirmModal.closeModal();
        const newSchedule = { ...schedule };
        delete newSchedule[dayKey];
        setSchedule(newSchedule);
        await saveSchedule(newSchedule);
      },
      onCancel: confirmModal.closeModal,
    });
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

      const successInfo = formatSuccessMessage('Schedule actualizado', 'success');
      infoModal.openModal({
        title: successInfo.title,
        message: successInfo.message,
        icon: successInfo.icon,
        onClose: infoModal.closeModal,
      });
    } catch (error) {
      const errorInfo = handleApiError(error);
      errorModal.openModal({
        title: errorInfo.title,
        message: 'No se pudo guardar el schedule',
        icon: errorInfo.icon,
      });
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
            color={hasWorkout ? (isRestDay ? colors.text.tertiary : colors.primary) : colors.text.disabled}
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
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
                <View style={[styles.workoutIconContainer, { backgroundColor: colors.text.tertiary }]}>
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
        icon={infoModal.modalData.icon}
        onClose={infoModal.modalData.onClose || infoModal.closeModal}
      />
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.modalData.title}
        message={errorModal.modalData.message}
        icon={errorModal.modalData.icon}
        onClose={errorModal.modalData.onClose || errorModal.closeModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: colors.text.inverse,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryDark,
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
    color: colors.primaryDark,
  },
  scrollContainer: {
    flex: 1,
  },
  daysContainer: {
    padding: 20,
    paddingTop: 0,
  },
  dayCard: {
    backgroundColor: colors.text.inverse,
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
    borderColor: colors.primary,
  },
  dayCardRest: {
    borderColor: colors.text.tertiary,
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
    color: colors.text.tertiary,
  },
  dayLabelActive: {
    color: colors.primaryDark,
  },
  workoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workoutName: {
    flex: 1,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  workoutNameRest: {
    color: colors.text.tertiary,
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
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  savingIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  savingText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.text.inverse,
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
    color: colors.primaryDark,
  },
  workoutList: {
    padding: 20,
  },
  workoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.background.main,
    borderRadius: 10,
    marginBottom: 10,
  },
  workoutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
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
    color: colors.text.primary,
    marginBottom: 3,
  },
  workoutOptionDesc: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  emptyWorkouts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyWorkoutsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginTop: 15,
  },
  emptyWorkoutsSubtext: {
    fontSize: 14,
    color: colors.text.disabled,
    marginTop: 5,
  },
});
