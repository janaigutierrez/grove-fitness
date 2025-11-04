import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ExerciseSelector({
    exercise,
    onChange,
    idx,
    availableExercises = []
}) {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewExerciseForm, setShowNewExerciseForm] = useState(false);

    // Nou exercici personalitzat
    const [newExercise, setNewExercise] = useState({
        name: '',
        category: 'chest',
        type: 'reps'
    });

    // Filtrar exercicis segons la cerca
    const filteredExercises = availableExercises.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectExercise = (selectedEx) => {
        onChange(idx, 'exercise_id', selectedEx.id);
        onChange(idx, 'name', selectedEx.name);
        onChange(idx, 'sets', String(selectedEx.default_sets || 3));
        onChange(idx, 'reps', String(selectedEx.default_reps || 10));
        setModalVisible(false);
        setSearchQuery('');
    };

    const handleCreateNew = () => {
        if (!newExercise.name.trim()) {
            alert('El nom de l\'exercici és obligatori');
            return;
        }

        // Passar les dades del nou exercici al pare
        onChange(idx, 'newExercise', newExercise);
        onChange(idx, 'name', newExercise.name);
        setModalVisible(false);
        setShowNewExerciseForm(false);
        setNewExercise({ name: '', category: 'chest', type: 'reps' });
    };

    const categories = [
        { value: 'chest', label: '💪 Pit', icon: 'body' },
        { value: 'back', label: '🦸 Esquena', icon: 'fitness' },
        { value: 'legs', label: '🦵 Cames', icon: 'walk' },
        { value: 'shoulders', label: '👐 Espatlles', icon: 'hand-left' },
        { value: 'arms', label: '💪 Braços', icon: 'barbell' },
        { value: 'core', label: '🎯 Core', icon: 'radio-button-on' },
        { value: 'cardio', label: '❤️ Cardio', icon: 'heart' },
        { value: 'full_body', label: '🔥 Cos sencer', icon: 'flame' }
    ];

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {/* Camp de l'exercici (amb botó de selecció) */}
                <TouchableOpacity
                    style={[styles.input, { flex: 2 }]}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={[styles.inputText, !exercise.name && styles.placeholder]}>
                        {exercise.name || "Tria o crea exercici"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>

                {/* Sèries */}
                <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Sèries"
                    value={exercise.sets}
                    keyboardType="number-pad"
                    onChangeText={text => onChange(idx, 'sets', text)}
                />

                {/* Repeticions */}
                <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Reps"
                    value={exercise.reps}
                    keyboardType="number-pad"
                    onChangeText={text => onChange(idx, 'reps', text)}
                />
            </View>

            {/* MODAL DE SELECCIÓ */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setModalVisible(false);
                    setShowNewExerciseForm(false);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {showNewExerciseForm ? '✨ Nou Exercici' : '🏋️ Tria Exercici'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setModalVisible(false);
                                    setShowNewExerciseForm(false);
                                }}
                            >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {!showNewExerciseForm ? (
                            <>
                                {/* Cerca */}
                                <View style={styles.searchContainer}>
                                    <Ionicons name="search" size={20} color="#666" />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Cerca exercici..."
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                    />
                                </View>

                                {/* Llista d'exercicis */}
                                <ScrollView style={styles.exerciseList}>
                                    {filteredExercises.length > 0 ? (
                                        filteredExercises.map((ex) => (
                                            <TouchableOpacity
                                                key={ex.id}
                                                style={styles.exerciseItem}
                                                onPress={() => handleSelectExercise(ex)}
                                            >
                                                <View style={styles.exerciseInfo}>
                                                    <Text style={styles.exerciseName}>{ex.name}</Text>
                                                    <Text style={styles.exerciseDetails}>
                                                        {ex.default_sets}x{ex.default_reps} • {ex.category}
                                                    </Text>
                                                </View>
                                                <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <View style={styles.emptyState}>
                                            <Ionicons name="search-outline" size={48} color="#ccc" />
                                            <Text style={styles.emptyText}>
                                                {searchQuery ? 'Cap exercici trobat' : 'Carrega exercicis...'}
                                            </Text>
                                        </View>
                                    )}
                                </ScrollView>

                                {/* Botó per crear nou */}
                                <TouchableOpacity
                                    style={styles.createNewButton}
                                    onPress={() => setShowNewExerciseForm(true)}
                                >
                                    <Ionicons name="add-circle" size={20} color="white" />
                                    <Text style={styles.createNewText}>Crear Exercici Nou</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            // FORMULARI DE NOU EXERCICI
                            <ScrollView style={styles.newExerciseForm}>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Nom de l'exercici *</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="Ex: Press banca amb barres"
                                        value={newExercise.name}
                                        onChangeText={text => setNewExercise({ ...newExercise, name: text })}
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Categoria *</Text>
                                    <View style={styles.categoryGrid}>
                                        {categories.map((cat) => (
                                            <TouchableOpacity
                                                key={cat.value}
                                                style={[
                                                    styles.categoryChip,
                                                    newExercise.category === cat.value && styles.categoryChipSelected
                                                ]}
                                                onPress={() => setNewExercise({ ...newExercise, category: cat.value })}
                                            >
                                                <Text
                                                    style={[
                                                        styles.categoryChipText,
                                                        newExercise.category === cat.value && styles.categoryChipTextSelected
                                                    ]}
                                                >
                                                    {cat.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={handleCreateNew}
                                >
                                    <Ionicons name="checkmark-circle" size={20} color="white" />
                                    <Text style={styles.confirmButtonText}>Crear Exercici</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => setShowNewExerciseForm(false)}
                                >
                                    <Text style={styles.backButtonText}>← Tornar a la llista</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    inputText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    placeholder: {
        color: '#999',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D5016',
    },

    // Cerca
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 12,
        margin: 20,
        marginBottom: 10,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },

    // Llista
    exerciseList: {
        maxHeight: 400,
    },
    exerciseItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    exerciseDetails: {
        fontSize: 12,
        color: '#666',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        marginTop: 10,
    },

    // Botó crear nou
    createNewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        padding: 16,
        margin: 20,
        marginTop: 10,
        borderRadius: 12,
    },
    createNewText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },

    // Formulari nou exercici
    newExerciseForm: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    formInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    categoryChipSelected: {
        backgroundColor: '#e8f5e9',
        borderColor: '#4CAF50',
    },
    categoryChipText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    categoryChipTextSelected: {
        color: '#2D5016',
        fontWeight: 'bold',
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    backButton: {
        alignItems: 'center',
        padding: 12,
        marginTop: 10,
    },
    backButtonText: {
        color: '#666',
        fontSize: 14,
    },
});