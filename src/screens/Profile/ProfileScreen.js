// frontend/src/screens/Profile/ProfileScreen.js - ACTUALIZADO
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

export default function ProfileScreen({ user }) {
  // TUS DATOS REALES
  const userData = {
    name: user?.name || 'Coach Bestia',
    level: 'Nivel Épico',
    avatar: 'person-circle-outline',
    weeks: 12,
    workouts: 48, // 12 semanas * 4 días
    startWeight: 71,
    currentWeight: 75,
    dominadas: '5+ por serie',
    routine: 'Rutina 4 días personalizada'
  };

  const stats = [
    { label: 'Semanas', value: userData.weeks },
    { label: 'Entrenos', value: userData.workouts },
    { label: 'Peso', value: `${userData.currentWeight}kg` },
    { label: 'Ganancia', value: `+${userData.currentWeight - userData.startWeight}kg` }
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Icon name={userData.avatar} size={80} color="#4CAF50" style={styles.avatar} />
          <Text style={styles.name}>{userData.name}</Text>
          <Text style={styles.level}>{userData.level}</Text>
          <Text style={styles.routine}>{userData.routine}</Text>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>🏆 Logros Principales</Text>
          <View style={styles.achievementsList}>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementIcon}>💪</Text>
              <Text style={styles.achievementText}>Dominadas: {userData.dominadas}</Text>
            </View>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementIcon}>🔥</Text>
              <Text style={styles.achievementText}>Consistency: 100%</Text>
            </View>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementIcon}>⚡</Text>
              <Text style={styles.achievementText}>Supercompensación dominada</Text>
            </View>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementIcon}>🎯</Text>
              <Text style={styles.achievementText}>Rutina personalizada</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.editBtn}>
          <Icon name="create-outline" size={20} color="#2D5016" />
          <Text style={styles.editText}>Editar perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsBtn}>
          <Icon name="settings-outline" size={20} color="#666" />
          <Text style={styles.settingsText}>Configuración</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  avatar: {
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 5,
  },
  level: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 5,
  },
  routine: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  achievementsSection: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 15,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  achievementIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 25,
  },
  achievementText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5e9',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  editText: {
    marginLeft: 8,
    color: '#2D5016',
    fontWeight: 'bold',
    fontSize: 16,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  settingsText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 16,
  },
});