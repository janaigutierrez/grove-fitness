import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function WorkoutCompletionModal({ visible, onComplete, onCancel, loading }) {
  const [rpe, setRpe] = useState(5); // Rate of Perceived Exertion (1-10)
  const [energyLevel, setEnergyLevel] = useState(5); // 1-10
  const [mood, setMood] = useState('good');

  const rpeLabels = {
    1: 'Muy fácil',
    2: 'Fácil',
    3: 'Moderado',
    4: 'Algo difícil',
    5: 'Difícil',
    6: 'Muy difícil',
    7: 'Extremo',
    8: 'Casi máximo',
    9: 'Máximo',
    10: 'Imposible'
  };

  const moodOptions = [
    { value: 'great', label: 'Excelente', icon: 'happy', color: '#4CAF50' },
    { value: 'good', label: 'Bien', icon: 'happy-outline', color: '#8BC34A' },
    { value: 'ok', label: 'Normal', icon: 'remove-circle-outline', color: '#FFC107' },
    { value: 'tired', label: 'Cansado', icon: 'sad-outline', color: '#FF9800' },
    { value: 'exhausted', label: 'Agotado', icon: 'sad', color: '#f44336' }
  ];

  const handleComplete = () => {
    onComplete({
      perceived_difficulty: rpe,
      energy_level: energyLevel,
      mood_after: mood,
      notes: `RPE: ${rpe}/10, Energy: ${energyLevel}/10, Mood: ${mood}`
    });
  };

  const renderScale = (value, setValue, max = 10) => {
    return (
      <View style={styles.scaleContainer}>
        <View style={styles.scaleNumbers}>
          {Array.from({ length: max }, (_, i) => i + 1).map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.scaleButton,
                value === num && styles.scaleButtonActive
              ]}
              onPress={() => setValue(num)}
            >
              <Text style={[
                styles.scaleButtonText,
                value === num && styles.scaleButtonTextActive
              ]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabel}>Bajo</Text>
          <Text style={styles.scaleLabel}>Alto</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Icon name="trophy" size={32} color="#FFD700" />
            <Text style={styles.title}>¡Entrenamiento Completado!</Text>
            <Text style={styles.subtitle}>Cuéntanos cómo te fue</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* RPE Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="speedometer" size={20} color="#4CAF50" />
                <Text style={styles.sectionTitle}>Dificultad percibida (RPE)</Text>
              </View>
              <Text style={styles.sectionDesc}>¿Qué tan difícil fue el entrenamiento?</Text>
              {renderScale(rpe, setRpe)}
              <Text style={styles.rpeLabel}>{rpeLabels[rpe]}</Text>
            </View>

            {/* Energy Level Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="flash" size={20} color="#FF9800" />
                <Text style={styles.sectionTitle}>Nivel de energía</Text>
              </View>
              <Text style={styles.sectionDesc}>¿Cómo te sientes ahora?</Text>
              {renderScale(energyLevel, setEnergyLevel)}
            </View>

            {/* Mood Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="heart" size={20} color="#E91E63" />
                <Text style={styles.sectionTitle}>Estado de ánimo</Text>
              </View>
              <Text style={styles.sectionDesc}>¿Cómo te sientes después del entrenamiento?</Text>
              <View style={styles.moodGrid}>
                {moodOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.moodOption,
                      mood === option.value && {
                        borderColor: option.color,
                        backgroundColor: `${option.color}15`
                      }
                    ]}
                    onPress={() => setMood(option.value)}
                  >
                    <Icon
                      name={option.icon}
                      size={32}
                      color={mood === option.value ? option.color : '#999'}
                    />
                    <Text style={[
                      styles.moodLabel,
                      mood === option.value && { color: option.color, fontWeight: 'bold' }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleComplete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Icon name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.completeButtonText}>Completar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D5016',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
  },
  scaleContainer: {
    marginVertical: 10,
  },
  scaleNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scaleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  scaleButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  scaleButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  scaleButtonTextActive: {
    color: 'white',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  scaleLabel: {
    fontSize: 11,
    color: '#999',
  },
  rpeLabel: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 8,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodOption: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    padding: 10,
  },
  moodLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  completeButton: {
    flex: 2,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
