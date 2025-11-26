import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
import Button from '../components/common/Button';
import EditProfileModal from '../components/profile/EditProfileModal';
import ChangeUsernameModal from '../components/profile/ChangeUsernameModal';
import ChangePasswordModal from '../components/profile/ChangePasswordModal';
import ConfirmModal from '../components/common/ConfirmModal';
import InfoModal from '../components/common/InfoModal';
import ErrorModal from '../components/common/ErrorModal';
import useModal from '../hooks/useModal';

export default function ProfileScreen({ navigation, onLogout }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [changeUsernameModal, setChangeUsernameModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);

  // Custom modals
  const confirmModal = useModal();
  const infoModal = useModal();
  const errorModal = useModal();

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
      errorModal.openModal({
        message: 'No se pudo cargar el perfil',
      });
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
        errorModal.openModal({
          title: 'Permiso requerido',
          message: 'Necesitas permitir acceso a la galería',
        });
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
        setLoading(false);
        infoModal.openModal({
          title: 'Éxito',
          message: 'Avatar actualizado',
        });
      }
    } catch (error) {
      setLoading(false);
      console.error('Error uploading avatar:', error);
      errorModal.openModal({
        message: error.message || 'No se pudo subir el avatar',
      });
    }
  };

  const handleDeleteAvatar = async () => {
    confirmModal.openModal({
      title: 'Eliminar avatar',
      message: '¿Estás seguro de que quieres eliminar tu avatar?',
      confirmText: 'Eliminar',
      variant: 'danger',
      onConfirm: async () => {
        try {
          confirmModal.closeModal();
          setLoading(true);
          await deleteAvatar();
          setUser({ ...user, avatar_url: null });
          setLoading(false);
          infoModal.openModal({
            title: 'Éxito',
            message: 'Avatar eliminado',
          });
        } catch (error) {
          setLoading(false);
          console.error('Error deleting avatar:', error);
          errorModal.openModal({
            message: 'No se pudo eliminar el avatar',
          });
        }
      },
    });
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
      await loadUserData();
      infoModal.openModal({
        title: 'Éxito',
        message: 'Perfil actualizado',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      errorModal.openModal({
        message: error.message || 'No se pudo actualizar el perfil',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!newUsername.trim()) {
      errorModal.openModal({
        message: 'El nombre de usuario no puede estar vacío',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await changeUsername(newUsername.trim());
      setUser(response.user);
      setChangeUsernameModal(false);
      infoModal.openModal({
        title: 'Éxito',
        message: 'Nombre de usuario actualizado',
      });
    } catch (error) {
      console.error('Error changing username:', error);
      errorModal.openModal({
        message: error.message || 'No se pudo cambiar el nombre de usuario',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      errorModal.openModal({
        message: 'Por favor completa todos los campos',
      });
      return;
    }

    if (passwordForm.new !== passwordForm.confirm) {
      errorModal.openModal({
        message: 'Las contraseñas no coinciden',
      });
      return;
    }

    if (passwordForm.new.length < 6) {
      errorModal.openModal({
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
      return;
    }

    try {
      setLoading(true);
      await changePassword(passwordForm.current, passwordForm.new);
      setChangePasswordModal(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
      infoModal.openModal({
        title: 'Éxito',
        message: 'Contraseña cambiada. Por favor inicia sesión nuevamente',
        buttonText: 'Cerrar sesión',
        onClose: handleLogout,
      });
    } catch (error) {
      console.error('Error changing password:', error);
      errorModal.openModal({
        message: error.message || 'No se pudo cambiar la contraseña',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    confirmModal.openModal({
      title: 'Cerrar sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      confirmText: 'Salir',
      variant: 'danger',
      onConfirm: async () => {
        try {
          confirmModal.closeModal();
          await logout();
          if (onLogout) onLogout();
        } catch (error) {
          console.error('Error logging out:', error);
        }
      },
    });
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
        <View style={styles.actionsContainer}>
          <Button
            text="Editar perfil"
            icon="create-outline"
            variant="outline"
            onPress={() => setEditProfileModal(true)}
            fullWidth
            style={styles.actionBtn}
          />

          <Button
            text="Cambiar nombre de usuario"
            icon="at-outline"
            variant="outline"
            onPress={() => setChangeUsernameModal(true)}
            fullWidth
            style={styles.actionBtn}
          />

          <Button
            text="Cambiar contraseña"
            icon="lock-closed-outline"
            variant="outline"
            onPress={() => setChangePasswordModal(true)}
            fullWidth
            style={styles.actionBtn}
          />

          <Button
            text="Schedule semanal"
            icon="calendar-outline"
            variant="outline"
            onPress={() => navigation.navigate('WeeklySchedule')}
            fullWidth
            style={styles.actionBtn}
          />

          <Button
            text="Cerrar sesión"
            icon="log-out-outline"
            variant="danger"
            onPress={handleLogout}
            fullWidth
            style={styles.logoutBtn}
          />
        </View>
      </ScrollView>

      {/* Modals */}
      <EditProfileModal
        visible={editProfileModal}
        onClose={() => setEditProfileModal(false)}
        profileForm={profileForm}
        onFormChange={setProfileForm}
        onSave={handleUpdateProfile}
        loading={loading}
      />

      <ChangeUsernameModal
        visible={changeUsernameModal}
        onClose={() => setChangeUsernameModal(false)}
        username={newUsername}
        onUsernameChange={setNewUsername}
        onSave={handleChangeUsername}
        loading={loading}
      />

      <ChangePasswordModal
        visible={changePasswordModal}
        onClose={() => setChangePasswordModal(false)}
        passwordForm={passwordForm}
        onFormChange={setPasswordForm}
        onSave={handleChangePassword}
        loading={loading}
      />

      {/* System Modals */}
      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.modalData.title}
        message={confirmModal.modalData.message}
        confirmText={confirmModal.modalData.confirmText}
        cancelText={confirmModal.modalData.cancelText}
        variant={confirmModal.modalData.variant}
        icon={confirmModal.modalData.icon}
        onConfirm={confirmModal.modalData.onConfirm || confirmModal.closeModal}
        onCancel={confirmModal.closeModal}
      />

      <InfoModal
        visible={infoModal.visible}
        title={infoModal.modalData.title}
        message={infoModal.modalData.message}
        buttonText={infoModal.modalData.buttonText}
        variant={infoModal.modalData.variant}
        icon={infoModal.modalData.icon}
        onClose={infoModal.modalData.onClose || infoModal.closeModal}
      />

      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.modalData.title}
        message={errorModal.modalData.message}
        buttonText={errorModal.modalData.buttonText}
        icon={errorModal.modalData.icon}
        onClose={errorModal.closeModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text.secondary,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: colors.text.inverse,
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
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.text.inverse,
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
    color: colors.primaryDark,
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 3,
  },
  email: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: colors.text.inverse,
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
    color: colors.primaryDark,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  infoSection: {
    backgroundColor: colors.text.inverse,
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
    color: colors.primaryDark,
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
    color: colors.text.secondary,
    marginLeft: 10,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  actionBtn: {
    marginBottom: 10,
  },
  logoutBtn: {
    marginTop: 10,
  },
});
