import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function WorkoutScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ì≤™ Entrenamientos</Text>
      
      <View style={styles.workoutCard}>
        <Text style={styles.workoutTitle}>LUNES - Push (Empujar)</Text>
        <Text style={styles.workoutDuration}>30-35 min</Text>
        <Text style={styles.workoutDescription}>
          Pectoral + Hombros + Tr√≠ceps + Core
        </Text>
      </View>
      
      <View style={styles.workoutCard}>
        <Text style={styles.workoutTitle}>MARTES - Pull (Tirar)</Text>
        <Text style={styles.workoutDuration}>35-40 min</Text>
        <Text style={styles.workoutDescription}>
          Dominadas + Espalda + B√≠ceps
        </Text>
      </View>
      
      <View style={styles.workoutCard}>
        <Text style={styles.workoutTitle}>JUEVES - Lower (Piernas)</Text>
        <Text style={styles.workoutDuration}>28-32 min</Text>
        <Text style={styles.workoutDescription}>
          Gl√∫teo + Cu√°driceps + Abdomen
        </Text>
      </View>
      
      <View style={styles.workoutCard}>
        <Text style={styles.workoutTitle}>VIERNES - Full Body</Text>
        <Text style={styles.workoutDuration}>25-30 min</Text>
        <Text style={styles.workoutDescription}>
          Todo el cuerpo + Definici√≥n
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2D5016',
  },
  workoutCard: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  workoutDuration: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  workoutDescription: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
  },
});
