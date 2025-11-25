import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Header({ title = "Grove" }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🌱 {title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: 'rgba(76, 175, 80, 1)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
});