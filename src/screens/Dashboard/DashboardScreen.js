// frontend/src/screens/Dashboard/DashboardScreen.js - CORREGIR IMPORT
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient'; // ← ESTE FALTABA
import CoachMessage from '../../components/Coach/CoachMessage';
import StatsCard from '../../components/common/StatsCard';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#4CAF50', '#2D5016']}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>🌱 Grove</Text>
          <Text style={styles.subtitle}>Your AI Fitness Coach</Text>

          <CoachMessage
            message="¡Hola crack! 🌟 ¿Listo para otro entreno épico? Las dominadas están subiendo, ¡lo noto!"
          />

          <View style={styles.statsContainer}>
            <StatsCard number="5+" label="Dominadas" />
            <StatsCard number="12" label="Semanas" />
            <StatsCard number="+4kg" label="Músculo" />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 50,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 30,
  },
});