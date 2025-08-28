import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CoachMessage({ message }) {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>í´–</Text>
      </View>
      <View style={styles.messageContainer}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
  },
  messageContainer: {
    flex: 1,
  },
  message: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
});
