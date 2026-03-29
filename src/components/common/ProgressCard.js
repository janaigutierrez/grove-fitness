import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProgressCard({ metrics }) {
    return (
        <View style={styles.card}>
            {metrics.map((metric, idx) => (
                <Text key={idx} style={styles.metric}>{metric}</Text>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    metric: {
        fontSize: 16,
        marginBottom: 10,
        color: '#333',
    },
});