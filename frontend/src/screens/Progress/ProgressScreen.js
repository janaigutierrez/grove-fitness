import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressCard from '../../components/common/ProgressCard';

export default function ProgressScreen() {
  const metrics = [
    'Peso: 75kg (+4kg)',
    'Dominadas: 5+ por serie',
    'Grasa: 12-15% estimado',
    'Transformación: VISIBLE'
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>🌱 Tu Progreso</Text>
        <Text style={styles.subtitle}>11 semanas de transformación</Text>
        <ProgressCard metrics={metrics} />
      </View>
    </SafeAreaView>
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
});