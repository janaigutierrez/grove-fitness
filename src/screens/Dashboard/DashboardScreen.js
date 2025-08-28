import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CoachMessage from '../../components/Coach/CoachMessage';

export default function DashboardScreen() {
  return (
    <LinearGradient
      colors={['#4CAF50', '#2D5016']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>í¼² Grove</Text>
        <Text style={styles.subtitle}>Your AI Fitness Coach</Text>
        
        <CoachMessage 
          message="Â¡Hola crack! í²ª Â¿Listo para otro entreno Ã©pico? Las dominadas estÃ¡n subiendo, Â¡lo noto!"
        />
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5+</Text>
            <Text style={styles.statLabel}>Dominadas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>11</Text>
            <Text style={styles.statLabel}>Semanas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>+4kg</Text>
            <Text style={styles.statLabel}>MÃºsculo</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
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
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
});
