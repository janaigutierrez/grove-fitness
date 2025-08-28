import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View, TouchableOpacity, Modal, TextInput, Button } from 'react-native';
import WorkoutCard from '../../components/common/WorkoutCard';
import ExerciseInput from '../../components/common/ExerciseInput';
import { getWorkouts, createWorkout, deleteWorkout } from '../../services/api';

export default function WorkoutScreen() {
  const [workouts, setWorkouts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ title: '', duration: '', description: '', level: '' });
  const [exercises, setExercises] = useState([
    { name: '', sets: '', reps: '' },
    { name: '', sets: '', reps: '' }
  ]);

  useEffect(() => {
    getWorkouts().then(setWorkouts);
  }, []);

  const handleDelete = async (id) => {
    await deleteWorkout(id);
    const updated = await getWorkouts();
    setWorkouts(updated);
  };

  const updateExercise = (idx, field, value) => {
    const updated = exercises.map((ex, i) =>
      i === idx ? { ...ex, [field]: value } : ex
    );
    setExercises(updated);
  };

  const handleAddWorkout = async () => {
    await createWorkout({ ...form, exercises });
    const updated = await getWorkouts();
    setWorkouts(updated);
    setModalVisible(false);
    setForm({ title: '', duration: '', description: '', level: '' });
    setExercises([
      { name: '', sets: '', reps: '' },
      { name: '', sets: '', reps: '' }
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>🏋️‍♂️ Entrenamientos</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.createText}>+ Crear entrenament</Text>
        </TouchableOpacity>
        {workouts.map(w => (
          <View key={w.id} style={styles.cardContainer}>
            <WorkoutCard
              title={w.title}
              duration={w.duration}
              description={w.description}
              level={w.level}
              exercises={w.exercises}
            />
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(w.id)}>
              <Text style={styles.deleteText}>Eliminar</Text>
            </TouchableOpacity>
            {w.exercises && w.exercises.length > 0 && (
              <View style={styles.exerciseList}>
                <Text style={styles.exerciseTitle}>Exercicis:</Text>
                {w.exercises.map((ex, idx) => (
                  <Text key={idx} style={styles.exerciseItem}>
                    {ex.name} - {ex.sets}x{ex.reps}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nou entrenament</Text>
            <TextInput
              style={styles.input}
              placeholder="Títol (ex: Rutina Push)"
              value={form.title}
              onChangeText={text => setForm({ ...form, title: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Durada (ex: 30 min)"
              value={form.duration}
              onChangeText={text => setForm({ ...form, duration: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Descripció (ex: Pecho, tríceps...)"
              value={form.description}
              onChangeText={text => setForm({ ...form, description: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Nivell (ex: Bàsic, Intermedi)"
              value={form.level}
              onChangeText={text => setForm({ ...form, level: text })}
            />
            <Text style={styles.exerciseTitle}>Exercicis</Text>
            {exercises.map((ex, idx) => (
              <ExerciseInput
                key={idx}
                exercise={ex}
                idx={idx}
                onChange={updateExercise}
              />
            ))}
            <View style={styles.modalBtns}>
              <Button title="Crear" onPress={handleAddWorkout} />
              <Button title="Cancel·lar" color="#888" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
  createBtn: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  createText: {
    color: '#2D5016',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  deleteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ffebee',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  deleteText: {
    color: '#d32f2f',
    fontWeight: 'bold',
    fontSize: 12,
  },
  exerciseList: {
    marginTop: 10,
    marginLeft: 10,
  },
  exerciseTitle: {
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 5,
  },
  exerciseItem: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    width: '80%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2D5016',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});