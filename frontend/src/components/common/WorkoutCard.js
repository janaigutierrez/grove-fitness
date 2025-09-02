import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WorkoutCard({ title, duration, description, level, exercises }) {
    return (
        <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.detail}>⏱ {duration}</Text>
            <Text style={styles.detail}>💪 {description}</Text>
            <Text style={styles.level}>{level}</Text>
            {exercises && exercises.length > 0 && (
                <View style={styles.exerciseList}>
                    <Text style={styles.exerciseTitle}>Exercicis:</Text>
                    {exercises.map((ex, idx) => (
                        <Text key={idx} style={styles.exerciseItem}>
                            {ex.name} - {ex.sets}x{ex.reps}
                        </Text>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D5016',
        marginBottom: 5,
    },
    detail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    level: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    exerciseList: {
        marginTop: 8,
    },
    exerciseTitle: {
        fontWeight: 'bold',
        color: '#2D5016',
        marginBottom: 3,
    },
    exerciseItem: {
        fontSize: 13,
        color: '#333',
        marginBottom: 2,
    },
});