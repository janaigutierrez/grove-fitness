import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { updatePreferences, updateUserProfile } from '../services/api';
import { handleApiError, formatSuccessMessage } from '../utils/errorHandler';
import ErrorModal from '../components/common/ErrorModal';
import InfoModal from '../components/common/InfoModal';
import useModal from '../hooks/useModal';

export default function OnboardingScreen({ route, onComplete }) {
  const { token, user } = route?.params || {};
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // System modals
  const errorModal = useModal();
  const infoModal = useModal();

  const [preferences, setPreferences] = useState({
    fitness_level: '',
    available_equipment: [],
    workout_location: '',
    time_per_session: '',
    days_per_week: '',
    goals: [],
    weight: '',
    height: '',
    age: ''
  });

  const steps = [
    {
      title: '¿Cuál es tu nivel de fitness?',
      icon: 'fitness',
      options: [
        { value: 'principiante', label: 'Principiante', desc: 'Nuevo en el entrenamiento' },
        { value: 'intermedio', label: 'Intermedio', desc: 'Entreno regularmente' },
        { value: 'avanzado', label: 'Avanzado', desc: 'Muy experimentado' }
      ],
      field: 'fitness_level',
      type: 'single'
    },
    {
      title: '¿Dónde vas a entrenar?',
      icon: 'home',
      options: [
        { value: 'gimnasio', label: 'Gimnasio', desc: 'Equipo completo' },
        { value: 'casa', label: 'Casa', desc: 'Espacio limitado' },
        { value: 'parque', label: 'Parque', desc: 'Al aire libre' },
        { value: 'mixto', label: 'Mixto', desc: 'Varía según el día' }
      ],
      field: 'workout_location',
      type: 'single'
    },
    {
      title: '¿Qué equipo tienes disponible?',
      icon: 'barbell',
      options: [
        { value: 'ninguno', label: 'Sin equipo', icon: 'body' },
        { value: 'mancuernas', label: 'Mancuernas', icon: 'fitness' },
        { value: 'barra', label: 'Barra y discos', icon: 'barbell' },
        { value: 'bandas', label: 'Bandas elásticas', icon: 'git-branch' },
        { value: 'completo', label: 'Gimnasio completo', icon: 'business' }
      ],
      field: 'available_equipment',
      type: 'multiple'
    },
    {
      title: '¿Cuánto tiempo puedes entrenar?',
      icon: 'time',
      options: [
        { value: '30', label: '30 minutos', desc: 'Sesiones cortas' },
        { value: '45', label: '45 minutos', desc: 'Duración media' },
        { value: '60', label: '60 minutos', desc: 'Sesión completa' },
        { value: '90', label: '90+ minutos', desc: 'Sesiones largas' }
      ],
      field: 'time_per_session',
      type: 'single'
    },
    {
      title: '¿Cuántos días por semana entrenarás?',
      icon: 'calendar',
      options: [
        { value: '2', label: '2 días', desc: 'Inicio suave' },
        { value: '3', label: '3 días', desc: 'Balance perfecto' },
        { value: '4', label: '4 días', desc: 'Progreso sólido' },
        { value: '5', label: '5 días', desc: 'Dedicación alta' },
        { value: '6', label: '6+ días', desc: 'Máximo rendimiento' }
      ],
      field: 'days_per_week',
      type: 'single'
    },
    {
      title: '¿Cuáles son tus objetivos?',
      icon: 'trophy',
      options: [
        { value: 'ganar_musculo', label: 'Ganar músculo', icon: 'trending-up' },
        { value: 'perder_grasa', label: 'Perder grasa', icon: 'flame' },
        { value: 'fuerza', label: 'Aumentar fuerza', icon: 'fitness' },
        { value: 'resistencia', label: 'Mejorar resistencia', icon: 'pulse' },
        { value: 'salud', label: 'Salud general', icon: 'heart' },
        { value: 'rendimiento', label: 'Rendimiento deportivo', icon: 'basketball' }
      ],
      field: 'goals',
      type: 'multiple'
    }
  ];

  const currentStepData = steps[currentStep];

  const handleSelectOption = (value) => {
    const field = currentStepData.field;

    if (currentStepData.type === 'single') {
      setPreferences({ ...preferences, [field]: value });
    } else {
      // Multiple selection
      const current = preferences[field] || [];
      const newSelection = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      setPreferences({ ...preferences, [field]: newSelection });
    }
  };

  const isOptionSelected = (value) => {
    const field = currentStepData.field;
    if (currentStepData.type === 'single') {
      return preferences[field] === value;
    } else {
      return (preferences[field] || []).includes(value);
    }
  };

  const canProceed = () => {
    const field = currentStepData.field;
    if (currentStepData.type === 'single') {
      return preferences[field] !== '';
    } else {
      return (preferences[field] || []).length > 0;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setLoading(true);

    try {
      // Guardar preferencias
      await updatePreferences({
        fitness_level: preferences.fitness_level,
        available_equipment: preferences.available_equipment,
        workout_location: preferences.workout_location,
        time_per_session: parseInt(preferences.time_per_session),
        days_per_week: parseInt(preferences.days_per_week),
        goals: preferences.goals
      });

      const successInfo = formatSuccessMessage('¡Todo listo para empezar! Vamos a crear tu primera rutina personalizada.', 'success');
      infoModal.openModal({
        title: '🎉 ¡Configuración completa!',
        message: successInfo.message,
        icon: successInfo.icon,
        buttonText: 'Comenzar',
        onClose: () => {
          infoModal.closeModal();
          if (onComplete) {
            onComplete(token, user);
          }
        }
      });
    } catch (error) {
      const errorInfo = handleApiError(error);
      errorModal.openModal({
        title: 'Error',
        message: 'No se pudieron guardar las preferencias. Puedes configurarlas más tarde desde el perfil.',
        icon: errorInfo.icon,
        onClose: () => {
          errorModal.closeModal();
          if (onComplete) {
            onComplete(token, user);
          }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const renderOption = (option) => {
    const selected = isOptionSelected(option.value);

    return (
      <TouchableOpacity
        key={option.value}
        style={[styles.optionCard, selected && styles.optionCardSelected]}
        onPress={() => handleSelectOption(option.value)}
      >
        {option.icon && (
          <Icon
            name={option.icon}
            size={28}
            color={selected ? colors.primary : colors.text.secondary}
            style={styles.optionIcon}
          />
        )}
        <View style={styles.optionContent}>
          <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
            {option.label}
          </Text>
          {option.desc && (
            <Text style={styles.optionDesc}>{option.desc}</Text>
          )}
        </View>
        {selected && (
          <Icon name="checkmark-circle" size={24} color="#4CAF50" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={[colors.primary, colors.primaryDark]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentStep + 1) / steps.length) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {currentStep + 1} de {steps.length}
            </Text>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Icon name={currentStepData.icon} size={48} color="white" style={styles.headerIcon} />
            <Text style={styles.title}>{currentStepData.title}</Text>
            {currentStepData.type === 'multiple' && (
              <Text style={styles.subtitle}>Puedes seleccionar múltiples opciones</Text>
            )}
          </View>

          {/* Options */}
          <ScrollView
            style={styles.optionsContainer}
            contentContainerStyle={styles.optionsContent}
            showsVerticalScrollIndicator={false}
          >
            {currentStepData.options.map(renderOption)}
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {currentStep > 0 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                disabled={loading}
              >
                <Icon name="arrow-back" size={20} color="white" />
                <Text style={styles.backButtonText}>Atrás</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.nextButton,
                !canProceed() && styles.nextButtonDisabled,
                currentStep === 0 && styles.nextButtonFull
              ]}
              onPress={handleNext}
              disabled={!canProceed() || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                  </Text>
                  <Icon name="arrow-forward" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* System Modals */}
          <ErrorModal
            visible={errorModal.visible}
            title={errorModal.modalData.title}
            message={errorModal.modalData.message}
            icon={errorModal.modalData.icon}
            onClose={errorModal.modalData.onClose || errorModal.closeModal}
          />
          <InfoModal
            visible={infoModal.visible}
            title={infoModal.modalData.title}
            message={infoModal.modalData.message}
            buttonText={infoModal.modalData.buttonText}
            icon={infoModal.modalData.icon}
            onClose={infoModal.modalData.onClose || infoModal.closeModal}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.overlay.white30,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.text.inverse,
    borderRadius: 2,
  },
  progressText: {
    color: colors.text.inverse,
    fontSize: 12,
    textAlign: 'right',
    opacity: 0.9,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerIcon: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.inverse,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
  },
  optionsContent: {
    paddingBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: colors.text.inverse,
    borderColor: colors.primary,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  optionLabelSelected: {
    color: colors.primaryDark,
  },
  optionDesc: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay.white20,
    padding: 16,
    borderRadius: 12,
    flex: 1,
    gap: 8,
  },
  backButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text.inverse,
    padding: 16,
    borderRadius: 12,
    flex: 2,
    gap: 8,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
