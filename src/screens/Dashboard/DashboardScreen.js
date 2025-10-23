import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressBar from '../../components/common/ProgressBar';
import Header from '../../components/common/Header';

export default function DashboardScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={{ uri: 'https://www.transparenttextures.com/patterns/green-fibers.png' }}
        resizeMode="repeat"
        style={styles.background}
      >
        <LinearGradient
          colors={['rgba(76, 175, 80, 0.9)', 'rgba(45, 80, 22, 0.95)']}
          style={styles.container}
        >
          {/* Header añadido */}
          <Header title="Grove" />

          <ScrollView contentContainerStyle={styles.content}>
            {/* Avatar y usuario */}
            <View style={styles.avatarSection}>
              <Image
                source={{ uri: 'https://placekitten.com/200/200' }}
                style={styles.avatar}
              />
              <Text style={styles.username}>Coach Bestia</Text>
              <Text style={styles.level}>Nivell 12 · Beast Mode</Text>
            </View>

            {/* Estadístiques */}
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

            {/* Resum del dia */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>📅 Resum del dia</Text>
              <Text style={styles.sectionText}>Avui tens 3 exercicis pendents.</Text>
              <Text style={styles.sectionText}>Has entrenat 2 dies aquesta setmana 💪</Text>
            </View>

            {/* Motivació */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>🔥 Motivació</Text>
              <Text style={styles.sectionText}>
                "Els petits hàbits creen grans resultats."
              </Text>
            </View>

            {/* Chat IA mock */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>🤖 Xat IA (mock)</Text>
              <TextInput
                placeholder="Escriu aquí per parlar amb el teu coach..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                style={styles.input}
                editable={false}
              />
            </View>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  // Logo removido - ya está en header
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10, // Añadido pequeño margen superior
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
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
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
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  statRow: {
    marginBottom: 12,
  },
  statLabel: {
    color: '#fff',
    marginBottom: 4,
    fontSize: 14,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    color: 'white',
    marginTop: 8,
  },
});