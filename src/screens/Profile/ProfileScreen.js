import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

export default function ProfileScreen() {
  // Dades mock per MVP
  const user = {
    name: 'Janai',
    level: 'Intermedio',
    avatar: 'person-circle-outline',
    weeks: 11,
    workouts: 32,
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Icon name={user.avatar} size={80} color="#4CAF50" style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.level}>{user.level}</Text>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.weeks}</Text>
            <Text style={styles.statLabel}>Semanas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.workouts}</Text>
            <Text style={styles.statLabel}>Entrenamientos</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editBtn}>
          <Icon name="create-outline" size={20} color="#2D5016" />
          <Text style={styles.editText}>Editar perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  level: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 20,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: 30,
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editText: {
    marginLeft: 8,
    color: '#2D5016',
    fontWeight: 'bold',
    fontSize: 14,
  },
});