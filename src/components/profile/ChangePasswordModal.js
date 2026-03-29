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
            <Text style={styles.modalTitle}>Canviar Contrasenya</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <FormInput
            label="Contrasenya actual"
            placeholder="Introdueix la teva contrasenya actual"
            secureTextEntry
            value={passwordForm.current}
            onChangeText={(text) => onFormChange({ ...passwordForm, current: text })}
          />

          <FormInput
            label="Nova contrasenya"
            placeholder="Mínim 6 caràcters"
            secureTextEntry
            value={passwordForm.new}
            onChangeText={(text) => onFormChange({ ...passwordForm, new: text })}
          />

          <FormInput
            label="Confirmar nova contrasenya"
            placeholder="Torna a introduir la nova contrasenya"
            secureTextEntry
            value={passwordForm.confirm}
            onChangeText={(text) => onFormChange({ ...passwordForm, confirm: text })}
          />

          <Button
            text="Canviar contrasenya"
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
