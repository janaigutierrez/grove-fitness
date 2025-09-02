// frontend/src/screens/Progress/ProgressScreen.js - ACTUALIZADO
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressCard from '../../components/common/ProgressCard';

export default function ProgressScreen() {
  // TUS DATOS REALES DE TRANSFORMACIÓN
  const transformationData = {
    startWeight: 71,
    currentWeight: 75,
    startDominadas: 0,
    currentDominadas: 5,
    weeksCompleted: 12,
    totalWeeks: 16,
    bodyFat: "12-15%"
  };

  const metrics = [
    `Peso: ${transformationData.currentWeight}kg (+${transformationData.currentWeight - transformationData.startWeight}kg músculo real)`,
    `Dominadas: ${transformationData.currentDominadas}+ por serie (de ${transformationData.startDominadas} negativas)`,
    `Grasa corporal: ${transformationData.bodyFat} estimado`,
    `Progreso: ${transformationData.weeksCompleted}/${transformationData.totalWeeks} semanas`,
    'Transformación: ÉPICA Y VISIBLE 🔥'
  ];

  const achievements = [
    '✅ Primera dominada completa',
    '✅ 5+ dominadas por serie',
    '✅ +4kg músculo real',
    '✅ Consistency 100%',
    '✅ Supercompensación dominada',
    '✅ Rutina personalizada',
    '✅ Ejercicios favoritos identificados'
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>📈 Tu Transformación</Text>
        <Text style={styles.subtitle}>{transformationData.weeksCompleted} semanas de puro trabajo épico</Text>

        <ProgressCard metrics={metrics} />

        <View style={styles.achievementsContainer}>
          <Text style={styles.achievementsTitle}>🏆 Logros Desbloqueados:</Text>
          {achievements.map((achievement, index) => (
            <Text key={index} style={styles.achievement}>{achievement}</Text>
          ))}
        </View>

        <View style={styles.progressBar}>
          <Text style={styles.progressText}>Progreso hacia SUPER TETAS:</Text>
          <View style={styles.barContainer}>
            <View style={[styles.progressFill, { width: `${(transformationData.weeksCompleted / transformationData.totalWeeks) * 100}%` }]} />
          </View>
          <Text style={styles.progressPercentage}>{Math.round((transformationData.weeksCompleted / transformationData.totalWeeks) * 100)}%</Text>
        </View>
      </ScrollView>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  achievementsContainer: {
    marginTop: 30,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 15,
  },
  achievement: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  progressBar: {
    marginTop: 30,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 10,
  },
  barContainer: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
});