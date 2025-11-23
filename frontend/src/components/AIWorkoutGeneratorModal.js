import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { generateAIWorkout } from '../services/api';

export default function AIWorkoutGeneratorModal({ visible, onClose, onWorkoutGenerated }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  const quickPrompts = [
    {
      title: 'Push Upper Body',
      prompt: 'Crea un entrenamiento de empuje para parte superior del cuerpo, enfocado en pecho, hombros y tríceps'
    },
    {
      title: 'Pull Upper Body',
      prompt: 'Crea un entrenamiento de tirón para parte superior, enfocado en espalda y bíceps'
    },
    {
      title: 'Legs & Glutes',
      prompt: 'Crea un entrenamiento completo de piernas y glúteos con ejercicios compuestos'
    },
    {
      title: 'Full Body',
      prompt: 'Crea un entrenamiento de cuerpo completo para principiantes'
    },
    {
      title: 'Core & Abs',
      prompt: 'Crea un entrenamiento intenso de core y abdominales'
    },
    {
      title: 'HIIT Cardio',
      prompt: 'Crea una rutina HIIT de 20 minutos para quemar grasa'
    }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Por favor escribe qué tipo de entrenamiento quieres');
      return;
    }

    try {
      setLoading(true);
      const response = await generateAIWorkout(prompt.trim(), saveToLibrary);

      if (response.workout) {
        Alert.alert(
          '¡Workout Generado! 🎉',
          `Se ha creado "${response.workout.name}"`,
          [
            {
              text: 'OK',
              onPress: () => {
                setPrompt('');
                onClose();
                if (onWorkoutGenerated) {
                  onWorkoutGenerated(response.workout);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error generating workout:', error);
      Alert.alert('Error', error.message || 'No se pudo generar el workout');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (quickPrompt) => {
    setPrompt(quickPrompt);
  };

  const handleClose = () => {
    if (!loading) {
      setPrompt('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Icon name="sparkles" size={24} color="#4CAF50" />
              <Text style={styles.title}>Generar con IA</Text>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Description */}
            <View style={styles.descriptionCard}>
              <Icon name="information-circle" size={20} color="#4CAF50" />
              <Text style={styles.descriptionText}>
                Describe qué tipo de entrenamiento quieres y la IA lo creará para ti
              </Text>
            </View>

            {/* Quick Prompts */}
            <Text style={styles.sectionTitle}>Sugerencias rápidas:</Text>
            <View style={styles.quickPromptsGrid}>
              {quickPrompts.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickPromptChip}
                  onPress={() => handleQuickPrompt(item.prompt)}
                  disabled={loading}
                >
                  <Text style={styles.quickPromptText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Prompt Input */}
            <Text style={styles.sectionTitle}>O describe tu entrenamiento:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Crea una rutina de hipertrofia para pecho y tríceps con 6 ejercicios"
              placeholderTextColor="#999"
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />

            {/* Save to Library Toggle */}
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setSaveToLibrary(!saveToLibrary)}
              disabled={loading}
            >
              <View style={styles.toggleLeft}>
                <Icon
                  name={saveToLibrary ? 'checkbox' : 'square-outline'}
                  size={24}
                  color="#4CAF50"
                />
                <View style={styles.toggleTextContainer}>
                  <Text style={styles.toggleTitle}>Guardar en biblioteca</Text>
                  <Text style={styles.toggleSubtitle}>
                    Podrás reutilizar este workout más tarde
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Example */}
            <View style={styles.exampleCard}>
              <Text style={styles.exampleTitle}>💡 Ejemplo:</Text>
              <Text style={styles.exampleText}>
                "Crea un entrenamiento de 45 minutos para ganar masa muscular en piernas,
                con 5 ejercicios que incluyan sentadillas y peso muerto"
              </Text>
            </View>
          </ScrollView>

          {/* Generate Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.generateBtn,
                (!prompt.trim() || loading) && styles.generateBtnDisabled
              ]}
              onPress={handleGenerate}
              disabled={!prompt.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Icon name="sparkles" size={20} color="white" />
                  <Text style={styles.generateBtnText}>Generar Workout</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  content: {
    padding: 20,
  },
  descriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 10,
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    color: '#2D5016',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quickPromptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  quickPromptChip: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickPromptText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 15,
    color: '#333',
    minHeight: 100,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 20,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  exampleCard: {
    backgroundColor: '#fff8e1',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f57c00',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 10,
    gap: 8,
  },
  generateBtnDisabled: {
    backgroundColor: '#ccc',
  },
  generateBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
