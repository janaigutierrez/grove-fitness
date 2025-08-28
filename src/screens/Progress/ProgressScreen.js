import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ì≥à Tu Progreso</Text>
      <Text style={styles.subtitle}>11 semanas de transformaci√≥n</Text>
      
      <View style={styles.progressCard}>
        <Text style={styles.metric}>Peso: 75kg (+4kg)</Text>
        <Text style={styles.metric}>Dominadas: 5+ por serie</Text>
        <Text style={styles.metric}>Grasa: 12-15% estimado</Text>
        <Text style={styles.metric}>Transformaci√≥n: VISIBLE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  progressCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metric: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
});
