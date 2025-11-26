import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FormInput from '../common/FormInput';
import Button from '../common/Button';

export default function EditProfileModal({
  visible,
  onClose,
  profileForm,
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
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <FormInput
            placeholder="Nombre"
            value={profileForm.name}
            onChangeText={(text) => onFormChange({ ...profileForm, name: text })}
          />

          <FormInput
            placeholder="Peso (kg)"
            keyboardType="decimal-pad"
            value={profileForm.weight}
            onChangeText={(text) => onFormChange({ ...profileForm, weight: text })}
          />

          <FormInput
            placeholder="Altura (cm)"
            keyboardType="number-pad"
            value={profileForm.height}
            onChangeText={(text) => onFormChange({ ...profileForm, height: text })}
          />

          <FormInput
            placeholder="Edad"
            keyboardType="number-pad"
            value={profileForm.age}
            onChangeText={(text) => onFormChange({ ...profileForm, age: text })}
          />

          <Button
            text="Guardar cambios"
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
