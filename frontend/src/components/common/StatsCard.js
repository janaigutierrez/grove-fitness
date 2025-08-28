import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatsCard({ number, label }) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statNumber}>{number}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    statCard: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        minWidth: 80,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
});