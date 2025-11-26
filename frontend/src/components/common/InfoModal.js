import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from './Button';

export default function InfoModal({
  visible,
  title,
  message,
  buttonText = 'OK',
  onClose,
  variant = 'success', // success, info, warning
  icon,
}) {
  const getVariantConfig = () => {
    switch (variant) {
      case 'success':
        return {
          color: '#4CAF50',
          icon: icon || 'checkmark-circle',
          bgColor: '#4CAF5015',
        };
      case 'warning':
        return {
          color: '#FF9800',
          icon: icon || 'alert-circle',
          bgColor: '#FF980015',
        };
      case 'info':
        return {
          color: '#2196F3',
          icon: icon || 'information-circle',
          bgColor: '#2196F315',
        };
      default:
        return {
          color: '#4CAF50',
          icon: icon || 'checkmark-circle',
          bgColor: '#4CAF5015',
        };
    }
  };

  const config = getVariantConfig();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
            <Icon name={config.icon} size={48} color={config.color} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          {message && (
            <Text style={styles.message}>{message}</Text>
          )}

          {/* Button */}
          <Button
            text={buttonText}
            variant="primary"
            onPress={onClose}
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
});
