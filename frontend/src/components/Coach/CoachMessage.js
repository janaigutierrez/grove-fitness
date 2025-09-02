// frontend/src/components/Coach/CoachMessage.js - CREAR ESTE ARCHIVO
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CoachMessage({ message }) {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.coachIcon}>🤖</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  message: {
    flex: 1,
    fontSize: 16,
    color: '#2D5016',
    fontWeight: '500',
  },
});