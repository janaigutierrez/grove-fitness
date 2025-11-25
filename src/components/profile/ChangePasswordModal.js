import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FormInput from '../common/FormInput';
import Button from '../common/Button';

export default function ChangePasswordModal({
  visible,
  onClose,
  passwordForm,
  onFormChange,
  onSave,
  loading,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <FormInput
            label="Contraseña actual"
            placeholder="Ingresa tu contraseña actual"
            secureTextEntry
            value={passwordForm.current}
            onChangeText={(text) => onFormChange({ ...passwordForm, current: text })}
          />

          <FormInput
            label="Nueva contraseña"
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            value={passwordForm.new}
            onChangeText={(text) => onFormChange({ ...passwordForm, new: text })}
          />

          <FormInput
            label="Confirmar nueva contraseña"
            placeholder="Vuelve a ingresar la nueva contraseña"
            secureTextEntry
            value={passwordForm.confirm}
            onChangeText={(text) => onFormChange({ ...passwordForm, confirm: text })}
          />

          <Button
            text="Cambiar contraseña"
            onPress={onSave}
            loading={loading}
            disabled={loading}
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
  },
});
