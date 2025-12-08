import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Dumbbell, Clock, TrendingUp, Play, ChevronDown, ChevronUp } from 'lucide-react-native';

export default function WorkoutCard({ workout, onStart }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.workoutCard}>
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Dumbbell size={22} color="#4CAF50" />
          <Text style={styles.cardTitle}>{workout.name}</Text>
          {isExpanded ? (
            <ChevronUp size={20} color="#666" />
          ) : (
            <ChevronDown size={20} color="#666" />
          )}
        </View>

        <View style={styles.badgesRow}>
          <View style={styles.badgeWithIcon}>
            <Clock size={12} color="#4CAF50" />
            <Text style={styles.badge}>
              {workout.estimated_duration || 30} min
            </Text>
          </View>
          <View style={styles.badgeWithIcon}>
            <TrendingUp size={12} color="#4CAF50" />
            <Text style={styles.badge}>
              {workout.difficulty || 'intermediate'}
            </Text>
          </View>
          <View style={styles.badgeWithIcon}>
            <Dumbbell size={12} color="#4CAF50" />
            <Text style={styles.badge}>
              {workout.exercises?.length || 0} exercicis
            </Text>
          </View>
        </View>

        {workout.description && (
          <Text style={styles.cardDescription}>{workout.description}</Text>
        )}
      </TouchableOpacity>

      {isExpanded && workout.exercises && workout.exercises.length > 0 && (
        <View style={styles.exerciseList}>
          <Text style={styles.exerciseListTitle}>Exercicis:</Text>
          {workout.exercises.map((ex, idx) => (
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
        </View>
      )}

      <TouchableOpacity
        style={styles.cardButton}
        onPress={() => onStart(workout)}
      >
        <Play size={18} color="white" fill="white" />
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
  badgeWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badge: {
    color: '#4CAF50',
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
