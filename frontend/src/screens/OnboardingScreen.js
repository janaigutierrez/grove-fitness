import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { updatePreferences, updateUserProfile } from '../services/api';
import { handleApiError, formatSuccessMessage } from '../utils/errorHandler';
import ErrorModal from '../components/common/ErrorModal';
import InfoModal from '../components/common/InfoModal';
import useModal from '../hooks/useModal';
import colors from '../constants/colors';

export default function OnboardingScreen({ route }) {
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
      title: 'Quin és el teu nivell de fitness?',
      icon: 'fitness',
      options: [
        { value: 'principiante', label: 'Principiant', desc: 'Nou en l\'entrenament' },
        { value: 'intermedio', label: 'Intermedi', desc: 'Entreno regularment' },
        { value: 'avanzado', label: 'Avançat', desc: 'Molt experimentat' }
      ],
      field: 'fitness_level',
      type: 'single'
    },
    {
      title: 'On vas a entrenar?',
      icon: 'home',
      options: [
        { value: 'gimnasio', label: 'Gimnàs', desc: 'Equipament complet' },
        { value: 'casa', label: 'Casa', desc: 'Espai limitat' },
        { value: 'parque', label: 'Parc', desc: 'A l\'aire lliure' },
        { value: 'mixto', label: 'Mixt', desc: 'Varia segons el dia' }
      ],
      field: 'workout_location',
      type: 'single'
    },
    {
      title: 'Quin equipament tens disponible?',
      icon: 'barbell',
      options: [
        { value: 'ninguno', label: 'Sense equip', icon: 'body' },
        { value: 'mancuernas', label: 'Manuelles', icon: 'fitness' },
        { value: 'barra', label: 'Barra i discos', icon: 'barbell' },
        { value: 'bandas', label: 'Bandes elàstiques', icon: 'git-branch' },
        { value: 'completo', label: 'Gimnàs complet', icon: 'business' }
      ],
      field: 'available_equipment',
      type: 'multiple'
    },
    {
      title: 'Quant de temps pots entrenar?',
      icon: 'time',
      options: [
        { value: '30', label: '30 minuts', desc: 'Sessions curtes' },
        { value: '45', label: '45 minuts', desc: 'Durada mitjana' },
        { value: '60', label: '60 minuts', desc: 'Sessió completa' },
        { value: '90', label: '90+ minuts', desc: 'Sessions llargues' }
      ],
      field: 'time_per_session',
      type: 'single'
    },
    {
      title: 'Quants dies per setmana entrenaràs?',
      icon: 'calendar',
      options: [
        { value: '2', label: '2 dies', desc: 'Inici suau' },
        { value: '3', label: '3 dies', desc: 'Balanç perfecte' },
        { value: '4', label: '4 dies', desc: 'Progrés sòlid' },
        { value: '5', label: '5 dies', desc: 'Dedicació alta' },
        { value: '6', label: '6+ dies', desc: 'Màxim rendiment' }
      ],
      field: 'days_per_week',
      type: 'single'
    },
    {
      title: 'Quins són els teus objectius?',
      icon: 'trophy',
      options: [
        { value: 'ganar_musculo', label: 'Guanyar múscul', icon: 'trending-up' },
        { value: 'perder_grasa', label: 'Perdre greix', icon: 'flame' },
        { value: 'fuerza', label: 'Augmentar força', icon: 'fitness' },
        { value: 'resistencia', label: 'Millorar resistència', icon: 'pulse' },
        { value: 'salud', label: 'Salut general', icon: 'heart' },
        { value: 'rendimiento', label: 'Rendiment esportiu', icon: 'basketball' }
      ],
      field: 'goals',
      type: 'multiple'
    },
    {
      title: 'Dades físiques (opcional)',
      icon: 'body',
      type: 'physical',
      field: 'physical'
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
    if (currentStepData.type === 'physical') return true; // always optional
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

      // Guardar dades físiques si s'han introduït
      const physicalData = {};
      if (preferences.weight) physicalData.weight = parseFloat(preferences.weight);
      if (preferences.height) physicalData.height = parseFloat(preferences.height);
      if (preferences.age) physicalData.age = parseInt(preferences.age);
      if (Object.keys(physicalData).length > 0) {
        await updateUserProfile(physicalData);
      }

      const successInfo = formatSuccessMessage('Tot llest per començar! Anem a crear la teva primera rutina personalitzada.', 'success');
      infoModal.openModal({
        title: '🎉 Configuració completa!',
        message: successInfo.message,
        icon: successInfo.icon,
        buttonText: 'Començar',
        onClose: () => {
          infoModal.closeModal();
          // El login ja és actiu (fet a RegisterScreen), la navegació es fa sola
        }
      });
    } catch (error) {
      const errorInfo = handleApiError(error);
      errorModal.openModal({
        title: 'Error',
        message: 'No s\'han pogut guardar les preferències. Pots configurar-les més tard des del perfil.',
        icon: errorInfo.icon,
        onClose: () => {
          errorModal.closeModal();
          // El login ja és actiu
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

  const renderPhysicalStep = () => (
    <ScrollView style={styles.optionsContainer} contentContainerStyle={styles.optionsContent} keyboardShouldPersistTaps="handled">
      <View style={styles.physicalField}>
        <Text style={styles.physicalLabel}>Pes (kg)</Text>
        <TextInput
          style={styles.physicalInput}
          placeholder="Ex: 70"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={preferences.weight}
          onChangeText={v => setPreferences({ ...preferences, weight: v })}
          keyboardType="decimal-pad"
        />
      </View>
      <View style={styles.physicalField}>
        <Text style={styles.physicalLabel}>Alçada (cm)</Text>
        <TextInput
          style={styles.physicalInput}
          placeholder="Ex: 175"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={preferences.height}
          onChangeText={v => setPreferences({ ...preferences, height: v })}
          keyboardType="number-pad"
        />
      </View>
      <View style={styles.physicalField}>
        <Text style={styles.physicalLabel}>Edat (anys)</Text>
        <TextInput
          style={styles.physicalInput}
          placeholder="Ex: 28"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={preferences.age}
          onChangeText={v => setPreferences({ ...preferences, age: v })}
          keyboardType="number-pad"
        />
      </View>
      <Text style={styles.physicalNote}>
        Aquestes dades ajuden a personalitzar els teus entrenaments. Pots omplir-les ara o més tard des del perfil.
      </Text>
    </ScrollView>
  );

  return (
    <LinearGradient colors={[colors.primary, colors.primaryDark]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
              <Text style={styles.subtitle}>Pots seleccionar múltiples opcions</Text>
            )}
            {currentStepData.type === 'physical' && (
              <Text style={styles.subtitle}>Opcional — podràs modificar-les al perfil</Text>
            )}
          </View>

          {/* Options or Physical step */}
          {currentStepData.type === 'physical' ? renderPhysicalStep() : (
          <ScrollView
            style={styles.optionsContainer}
            contentContainerStyle={styles.optionsContent}
            showsVerticalScrollIndicator={false}
          >
            {currentStepData.options.map(renderOption)}
          </ScrollView>
          )}

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {currentStep > 0 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                disabled={loading}
              >
                <Icon name="arrow-back" size={20} color="white" />
                <Text style={styles.backButtonText}>Enrere</Text>
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
                    {currentStep === steps.length - 1 ? 'Finalitzar' : 'Següent'}
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
        </KeyboardAvoidingView>
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
  physicalField: {
    marginBottom: 20,
  },
  physicalLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  physicalInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: 'white',
  },
  physicalNote: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
});
