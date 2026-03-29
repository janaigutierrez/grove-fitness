import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

export default function ExerciseInput({ exercise, onChange, idx }) {
    return (
        <View style={styles.row}>
            <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Nom de l'exercici (ex: Flexions)"
                value={exercise.name}
                onChangeText={text => onChange(idx, 'name', text)}
            />
            <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Sèries"
                value={exercise.sets}
                keyboardType="number-pad"
                onChangeText={text => onChange(idx, 'sets', text)}
            />
            <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Repeticions"
                value={exercise.reps}
                keyboardType="number-pad"
                onChangeText={text => onChange(idx, 'reps', text)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        backgroundColor: '#f9f9f9',
    },
});