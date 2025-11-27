import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ExerciseSelector from '../common/ExerciseSelector';

export default function CreateWorkoutModal({
  visible,
  onClose,
  newWorkout,
  onWorkoutChange,
  newExercises,
  onExerciseChange,
  onAddExercise,
  onRemoveExercise,
  availableExercises,
  onSubmit,
  creating,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <LinearGradient colors={['#4CAF50', '#2D5016']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.createModalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
                onChangeText={(text) => onWorkoutChange({ ...newWorkout, name: text })}
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
                onChangeText={(text) => onWorkoutChange({ ...newWorkout, description: text })}
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
                    onPress={() => onWorkoutChange({ ...newWorkout, difficulty: level })}
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
                    onChange={onExerciseChange}
                    idx={index}
                    availableExercises={availableExercises}
                  />
                  {newExercises.length > 1 && (
                    <TouchableOpacity
                      onPress={() => onRemoveExercise(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash" size={20} color="#ff5252" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={onAddExercise}
              >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text style={styles.addExerciseText}>Afegir Exercici</Text>
              </TouchableOpacity>
            </View>

            {/* Botó de creació */}
            <TouchableOpacity
              style={styles.createButton}
              onPress={onSubmit}
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
  );
}

const styles = StyleSheet.create({
  createModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10, // Reduced from paddingVertical to give more space
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  closeButton: {
    marginRight: 15,
    padding: 8, // Increase touch area
    margin: -8, // Negative margin to maintain visual spacing
  },
  createModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  createModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'white',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerOption: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pickerOptionSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'white',
  },
  pickerOptionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
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
    padding: 10,
    marginLeft: 10,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  addExerciseText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  createButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  createButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
