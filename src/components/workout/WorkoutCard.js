import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutCard({ workout, onStart }) {
  return (
    <View style={styles.workoutCard}>
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
        onPress={() => onStart(workout)}
      >
        <Ionicons name="play" size={18} color="white" />
        <Text style={styles.cardButtonText}>COMENÇAR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontWeight: '600',
  },
  moreExercises: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginTop: 4,
  },
  cardButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  cardButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
