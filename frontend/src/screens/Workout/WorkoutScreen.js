// ...existing imports...
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, Button } from 'react-native';
import WorkoutCard from '../../components/common/WorkoutCard';
import { getWorkouts, createWorkout, deleteWorkout } from '../../services/api';

export default function WorkoutScreen() {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    getWorkouts().then(setWorkouts);
  }, []);

  // Exemple per afegir un entrenament
  const handleAddWorkout = async () => {
    const newWorkout = {
      title: 'Nou entrenament',
      duration: '30 min',
      description: 'Exemple',
      level: 'Bàsic',
    };
    await createWorkout(newWorkout);
    const updated = await getWorkouts();
    setWorkouts(updated);
  };

  // Exemple per eliminar
  const handleDelete = async (id) => {
    await deleteWorkout(id);
    const updated = await getWorkouts();
    setWorkouts(updated);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>🏋️‍♂️ Entrenamientos</Text>
        <Button title="Afegir entrenament" onPress={handleAddWorkout} />
        {workouts.map(w => (
          <WorkoutCard
            key={w.id}
            title={w.title}
            duration={w.duration}
            description={w.description}
            level={w.level}
          />
        ))}
        {/* Pots afegir un botó d'eliminar a cada card si vols */}
      </ScrollView>
    </SafeAreaView>
  );
}

// ...existing styles...

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
});