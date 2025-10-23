// frontend/src/components/common/ProgressBar.js
import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function ProgressBar({ progress = 0, color = '#4CAF50' }) {
    return (
        <View style={styles.container}>
            <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: color }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 12,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 6,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 6,
    },
});
