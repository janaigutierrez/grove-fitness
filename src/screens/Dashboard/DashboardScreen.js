import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressBar from '../../components/common/ProgressBar';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#4CAF50', '#2D5016']}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Logo/nom app a dalt a l'esquerra */}
          <Text style={styles.logo}>🌱 Groove</Text>

          {/* Avatar rodó i nom d'usuari */}
          <View style={styles.avatarSection}>
            <Image
              source={{ uri: 'https://placekitten.com/200/200' }}
              style={styles.avatar}
            />
            <Text style={styles.username}>Usuari Pro</Text>
            <Text style={styles.level}>Nivell 7 · Explorador</Text>
          </View>

          {/* Barres de progrés per estadístiques */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Estadístiques</Text>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>💪 Força</Text>
              <ProgressBar progress={0.7} color="#FFD700" />
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>🏃‍♂️ Resistència</Text>
              <ProgressBar progress={0.4} color="#00BFFF" />
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>⚡ Velocitat</Text>
              <ProgressBar progress={0.55} color="#FF4500" />
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>🧠 Estratègia</Text>
              <ProgressBar progress={0.8} color="#8A2BE2" />
            </View>
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
  logo: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'white',
    marginBottom: 15,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  level: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsSection: {
    width: '100%',
    marginTop: 10,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  statRow: {
    marginBottom: 12,
  },
  statLabel: {
    color: '#fff',
    marginBottom: 4,
    fontSize: 14,
  },
});
