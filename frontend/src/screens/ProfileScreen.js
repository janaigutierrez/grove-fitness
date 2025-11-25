import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import {
  getCurrentUser,
  updateUserProfile,
  changeUsername,
  changePassword,
  uploadAvatar,
  deleteAvatar,
  getUserStats,
  logout
} from '../services/api';

export default function ProfileScreen({ navigation, onLogout }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [changeUsernameModal, setChangeUsernameModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    weight: '',
    height: '',
    age: ''
  });
  const [newUsername, setNewUsername] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [userData, statsData] = await Promise.all([
        getCurrentUser(),
        getUserStats()
      ]);

      setUser(userData);
      setStats(statsData);
      setProfileForm({
        name: userData.name || '',
        weight: userData.weight?.toString() || '',
        height: userData.height?.toString() || '',
        age: userData.age?.toString() || ''
      });
      setNewUsername(userData.username || '');
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permiso requerido', 'Necesitas permitir acceso a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoading(true);
        const response = await uploadAvatar(result.assets[0].uri);
        setUser({ ...user, avatar_url: response.avatar_url });
        Alert.alert('Éxito', 'Avatar actualizado');
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', error.message || 'No se pudo subir el avatar');
    }
  };

  const handleDeleteAvatar = async () => {
    Alert.alert(
      'Eliminar avatar',
      '¿Estás seguro de que quieres eliminar tu avatar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteAvatar();
              setUser({ ...user, avatar_url: null });
              Alert.alert('Éxito', 'Avatar eliminado');
              setLoading(false);
            } catch (error) {
              setLoading(false);
              console.error('Error deleting avatar:', error);
              Alert.alert('Error', 'No se pudo eliminar el avatar');
            }
          }
        }
      ]
    );
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const updateData = {
        name: profileForm.name,
        weight: parseFloat(profileForm.weight),
        height: parseFloat(profileForm.height),
        age: parseInt(profileForm.age)
      };

      const response = await updateUserProfile(updateData);
      setUser(response.user);
      setEditProfileModal(false);
      Alert.alert('Éxito', 'Perfil actualizado');
      await loadUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert('Error', 'El nombre de usuario no puede estar vacío');
      return;
    }

    try {
      setLoading(true);
      const response = await changeUsername(newUsername.trim());
      setUser(response.user);
      setChangeUsernameModal(false);
      Alert.alert('Éxito', 'Nombre de usuario actualizado');
    } catch (error) {
      console.error('Error changing username:', error);
      Alert.alert('Error', error.message || 'No se pudo cambiar el nombre de usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (passwordForm.new !== passwordForm.confirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.new.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      await changePassword(passwordForm.current, passwordForm.new);
      setChangePasswordModal(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
      Alert.alert(
        'Éxito',
        'Contraseña cambiada. Por favor inicia sesión nuevamente',
        [{ text: 'OK', onPress: handleLogout }]
      );
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.message || 'No se pudo cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              if (onLogout) onLogout();
            } catch (error) {
              console.error('Error logging out:', error);
            }
          }
        }
      ]
    );
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayStats = [
    { label: 'Entrenamientos', value: stats?.total_workouts || 0 },
    { label: 'Semanas activas', value: stats?.weeks_active || 0 },
    { label: 'Peso actual', value: user?.weight ? `${user.weight}kg` : '-' },
    { label: 'Edad', value: user?.age || '-' }
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        {/* Header con Avatar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handlePickImage}
            style={styles.avatarContainer}
          >
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{getInitials(user?.name)}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Icon name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>

          {user?.avatar_url && (
            <TouchableOpacity onPress={handleDeleteAvatar} style={styles.deleteAvatarBtn}>
              <Text style={styles.deleteAvatarText}>Eliminar avatar</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.name}>{user?.name || 'Usuario'}</Text>
          <Text style={styles.username}>@{user?.username || 'username'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {displayStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información Física</Text>
          <View style={styles.infoRow}>
            <Icon name="fitness" size={20} color="#666" />
            <Text style={styles.infoLabel}>Peso:</Text>
            <Text style={styles.infoValue}>{user?.weight ? `${user.weight} kg` : '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="resize" size={20} color="#666" />
            <Text style={styles.infoLabel}>Altura:</Text>
            <Text style={styles.infoValue}>{user?.height ? `${user.height} cm` : '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="calendar" size={20} color="#666" />
            <Text style={styles.infoLabel}>Edad:</Text>
            <Text style={styles.infoValue}>{user?.age ? `${user.age} años` : '-'}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setEditProfileModal(true)}
        >
          <Icon name="create-outline" size={20} color="#2D5016" />
          <Text style={styles.actionText}>Editar perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setChangeUsernameModal(true)}
        >
          <Icon name="at-outline" size={20} color="#2D5016" />
          <Text style={styles.actionText}>Cambiar nombre de usuario</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setChangePasswordModal(true)}
        >
          <Icon name="lock-closed-outline" size={20} color="#2D5016" />
          <Text style={styles.actionText}>Cambiar contraseña</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('WeeklySchedule')}
        >
          <Icon name="calendar-outline" size={20} color="#2D5016" />
          <Text style={styles.actionText}>Schedule semanal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
        >
          <Icon name="log-out-outline" size={20} color="#d32f2f" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setEditProfileModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={profileForm.name}
              onChangeText={(text) => setProfileForm({ ...profileForm, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Peso (kg)"
              keyboardType="decimal-pad"
              value={profileForm.weight}
              onChangeText={(text) => setProfileForm({ ...profileForm, weight: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Altura (cm)"
              keyboardType="number-pad"
              value={profileForm.height}
              onChangeText={(text) => setProfileForm({ ...profileForm, height: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Edad"
              keyboardType="number-pad"
              value={profileForm.age}
              onChangeText={(text) => setProfileForm({ ...profileForm, age: text })}
            />

            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Guardar cambios</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Username Modal */}
      <Modal
        visible={changeUsernameModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChangeUsernameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Nombre de Usuario</Text>
              <TouchableOpacity onPress={() => setChangeUsernameModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nuevo nombre de usuario"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handleChangeUsername}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Cambiar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={changePasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={() => setChangePasswordModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Contraseña actual</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu contraseña actual"
                placeholderTextColor="#999"
                secureTextEntry
                value={passwordForm.current}
                onChangeText={(text) => setPasswordForm({ ...passwordForm, current: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nueva contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#999"
                secureTextEntry
                value={passwordForm.new}
                onChangeText={(text) => setPasswordForm({ ...passwordForm, new: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Confirmar nueva contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Vuelve a ingresar la nueva contraseña"
                placeholderTextColor="#999"
                secureTextEntry
                value={passwordForm.confirm}
                onChangeText={(text) => setPasswordForm({ ...passwordForm, confirm: text })}
              />
            </View>

            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Cambiar contraseña</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  deleteAvatarBtn: {
    marginTop: 8,
    paddingVertical: 4,
  },
  deleteAvatarText: {
    color: '#d32f2f',
    fontSize: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 3,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionText: {
    marginLeft: 8,
    color: '#2D5016',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  logoutText: {
    marginLeft: 8,
    color: '#d32f2f',
    fontWeight: 'bold',
    fontSize: 16,
  },
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
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  modalSaveBtn: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalSaveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 8,
  },
});
