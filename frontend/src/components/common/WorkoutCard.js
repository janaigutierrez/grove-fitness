import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WorkoutCard({ title, duration, description }) {
    return (
        <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.duration}>{duration}</Text>
            <Text style={styles.description}>{description}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        padding: 20,
        marginBottom: 15,
        borderRadius: 10,
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
    },
    duration: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    description: {
        fontSize: 14,
        color: '#333',
        marginTop: 10,
    },
});