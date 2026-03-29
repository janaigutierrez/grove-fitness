import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EXERCISE_TYPES = [
  { value: 'reps', label: 'Reps' },
  { value: 'time', label: 'Temps' },
  { value: 'cardio', label: 'Cardio' },
];

export default function ExerciseSelector({
    exercise,
    onChange,
    idx,
    availableExercises = []
}) {
    const [showSuggestions, setShowSuggestions] = useState(false);

    const exerciseType = exercise.type || 'reps';
    const repsPlaceholder = exerciseType === 'reps' ? 'Reps' : exerciseType === 'time' ? 'Seg.' : 'Min.';

    const suggestions = exercise.name.trim().length > 1
        ? availableExercises.filter(ex =>
            ex.name.toLowerCase().includes(exercise.name.toLowerCase())
          ).slice(0, 5)
        : [];

    const handleNameChange = (text) => {
        onChange(idx, 'name', text);
        onChange(idx, 'exercise_id', null);
        onChange(idx, 'newExercise', null);
        setShowSuggestions(true);
    };

    const handleSelectSuggestion = (ex) => {
        onChange(idx, 'exercise_id', ex.id);
        onChange(idx, 'name', ex.name);
        onChange(idx, 'sets', String(ex.default_sets || 3));
        onChange(idx, 'reps', String(ex.default_reps || 10));
        onChange(idx, 'type', ex.type || 'reps');
        setShowSuggestions(false);
    };

    const handleTypeChange = (type) => {
        onChange(idx, 'type', type);
        // If switching to time, set a sensible default if reps looks like a small rep count
        if ((type === 'time' || type === 'cardio') && parseInt(exercise.reps) < 15) {
            onChange(idx, 'reps', '30');
        }
    };

    return (
        <View style={styles.container}>
            {/* Type selector */}
            <View style={styles.typeRow}>
                {EXERCISE_TYPES.map(t => (
                    <TouchableOpacity
                        key={t.value}
                        style={[styles.typeChip, exerciseType === t.value && styles.typeChipSelected]}
                        onPress={() => handleTypeChange(t.value)}
                    >
                        <Text style={[styles.typeChipText, exerciseType === t.value && styles.typeChipTextSelected]}>
                            {t.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Name + sets + reps row */}
            <View style={styles.row}>
                {/* Nom de l'exercici - escriu lliurement */}
                <View style={{ flex: 2, position: 'relative' }}>
                    <TextInput
                        style={styles.input}
                        placeholder="Nom de l'exercici"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={exercise.name}
                        onChangeText={handleNameChange}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        onFocus={() => exercise.name.trim().length > 1 && setShowSuggestions(true)}
                    />
                    {exercise.exercise_id && (
                        <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#a5d6a7"
                            style={{ position: 'absolute', right: 10, top: '50%', marginTop: -8 }}
                        />
                    )}
                </View>

                {/* Sèries */}
                <View style={styles.inputWithLabel}>
                    <TextInput
                        style={styles.inputSmall}
                        placeholder="3"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={exercise.sets}
                        keyboardType="number-pad"
                        onChangeText={text => onChange(idx, 'sets', text)}
                    />
                    <Text style={styles.inputUnit}>sèr.</Text>
                </View>

                {/* Repeticions o Temps */}
                <View style={styles.inputWithLabel}>
                    <TextInput
                        style={styles.inputSmall}
                        placeholder={exerciseType === 'reps' ? '10' : exerciseType === 'time' ? '30' : '20'}
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={exercise.reps}
                        keyboardType="number-pad"
                        onChangeText={text => onChange(idx, 'reps', text)}
                    />
                    <Text style={styles.inputUnit}>{repsPlaceholder.toLowerCase()}</Text>
                </View>
            </View>

            {/* Suggeriments */}
            {showSuggestions && suggestions.length > 0 && (
                <ScrollView style={styles.suggestions} keyboardShouldPersistTaps="handled">
                    {suggestions.map((ex) => (
                        <TouchableOpacity
                            key={ex.id}
                            style={styles.suggestionItem}
                            onPress={() => handleSelectSuggestion(ex)}
                        >
                            <Text style={styles.suggestionName}>{ex.name}</Text>
                            <Text style={styles.suggestionDetails}>
                                {ex.type === 'time' ? `${ex.default_reps}s` : `${ex.default_sets}x${ex.default_reps}`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 8,
    },
    typeChip: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    typeChipSelected: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderColor: 'white',
    },
    typeChipText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '500',
    },
    typeChipTextSelected: {
        color: 'white',
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: 'white',
    },
    suggestions: {
        backgroundColor: 'white',
        borderRadius: 8,
        marginTop: 4,
        maxHeight: 160,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    suggestionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    suggestionName: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    suggestionDetails: {
        fontSize: 12,
        color: '#888',
        marginLeft: 8,
    },
    inputWithLabel: {
        flex: 1,
        alignItems: 'center',
        gap: 3,
    },
    inputSmall: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: 'white',
        textAlign: 'center',
    },
    inputUnit: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        textAlign: 'center',
    },
});
