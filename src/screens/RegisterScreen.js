// frontend/src/screens/RegisterScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { register } from '../services/api';
import { handleApiError, ValidationError, formatSuccessMessage } from '../utils/errorHandler';
import ErrorModal from '../components/common/ErrorModal';
import InfoModal from '../components/common/InfoModal';
import useModal from '../hooks/useModal';

export default function RegisterScreen({ navigation, onLogin }) {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);

    // System modals
    const errorModal = useModal();
    const infoModal = useModal();

    const validateUsername = (username) => {
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        return usernameRegex.test(username);
    };

    const handleRegister = async () => {
        // Validacions
        if (!formData.name || !formData.username || !formData.email || !formData.password) {
            const validationError = new ValidationError('Por favor, completa todos los campos');
            const errorInfo = handleApiError(validationError);
            errorModal.openModal({
                title: errorInfo.title,
                message: errorInfo.message,
                icon: errorInfo.icon,
            });
            return;
        }

        if (formData.username.length < 3) {
            const validationError = new ValidationError('El nombre de usuario debe tener al menos 3 caracteres', 'username');
            const errorInfo = handleApiError(validationError);
            errorModal.openModal({
                title: errorInfo.title,
                message: errorInfo.message,
                icon: errorInfo.icon,
            });
            return;
        }

        if (!validateUsername(formData.username)) {
            const validationError = new ValidationError(
                'El nombre de usuario solo puede contener letras, números, guiones (-) y guiones bajos (_)',
                'username'
            );
            const errorInfo = handleApiError(validationError);
            errorModal.openModal({
                title: errorInfo.title,
                message: errorInfo.message,
                icon: errorInfo.icon,
            });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            const validationError = new ValidationError('Las contraseñas no coinciden', 'password');
            const errorInfo = handleApiError(validationError);
            errorModal.openModal({
                title: errorInfo.title,
                message: errorInfo.message,
                icon: errorInfo.icon,
            });
            return;
        }

        if (formData.password.length < 6) {
            const validationError = new ValidationError('La contraseña debe tener al menos 6 caracteres', 'password');
            const errorInfo = handleApiError(validationError);
            errorModal.openModal({
                title: errorInfo.title,
                message: errorInfo.message,
                icon: errorInfo.icon,
            });
            return;
        }

        setLoading(true);

        try {
            const response = await register({
                name: formData.name,
                username: formData.username.toLowerCase(),
                email: formData.email.toLowerCase(),
                password: formData.password,
            });

            // Navegar a Onboarding
            if (response.accessToken && response.user) {
                const successInfo = formatSuccessMessage(
                    `Hola ${formData.name}! Tu cuenta se ha creado correctamente.\n\n¡Vamos a configurar tu perfil! 💪`,
                    'success'
                );
                infoModal.openModal({
                    title: '🎉 Bienvenido a Grove!',
                    message: successInfo.message,
                    icon: successInfo.icon,
                    buttonText: 'Continuar',
                    onClose: () => {
                        infoModal.closeModal();
                        navigation.navigate('Onboarding', {
                            token: response.accessToken,
                            user: response.user,
                            onComplete: onLogin
                        });
                    }
                });
            }
        } catch (error) {
            const errorInfo = handleApiError(error);
            errorModal.openModal({
                title: errorInfo.title,
                message: errorInfo.message || 'Error al registrarse',
                icon: errorInfo.icon,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backButtonText}>← Enrere</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>🌱 Crear compte</Text>
                        <Text style={styles.subtitle}>Comença la teva transformació</Text>
                    </View>

                    {/* Formulari */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nom complet</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Marc García"
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                value={formData.name}
                                onChangeText={(text) => setFormData({ ...formData, name: text })}
                                autoCapitalize="words"
                            />
                            <Text style={styles.hint}>Aquest nom l'usarà la IA per parlar amb tu</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nom d'usuari</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="bestiagrove"
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                value={formData.username}
                                onChangeText={(text) =>
                                    setFormData({ ...formData, username: text.toLowerCase() })
                                }
                                autoCapitalize="none"
                            />
                            <Text style={styles.hint}>
                                Només lletres, números, - i _ (mínim 3 caràcters)
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="correu@exemple.com"
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                value={formData.email}
                                onChangeText={(text) =>
                                    setFormData({ ...formData, email: text.toLowerCase() })
                                }
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Contrasenya</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Mínim 6 caràcters"
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                value={formData.password}
                                onChangeText={(text) => setFormData({ ...formData, password: text })}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirmar contrasenya</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Repeteix la contrasenya"
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                value={formData.confirmPassword}
                                onChangeText={(text) =>
                                    setFormData({ ...formData, confirmPassword: text })
                                }
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Crear compte</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.linkText}>
                                Ja tens compte? Inicia sessió
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* System Modals */}
                <ErrorModal
                    visible={errorModal.visible}
                    title={errorModal.modalData.title}
                    message={errorModal.modalData.message}
                    icon={errorModal.modalData.icon}
                    onClose={errorModal.modalData.onClose || errorModal.closeModal}
                />
                <InfoModal
                    visible={infoModal.visible}
                    title={infoModal.modalData.title}
                    message={infoModal.modalData.message}
                    buttonText={infoModal.modalData.buttonText}
                    icon={infoModal.modalData.icon}
                    onClose={infoModal.modalData.onClose || infoModal.closeModal}
                />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flexGrow: 1,
    },
    header: {
        marginBottom: 40,
    },
    backButton: {
        marginBottom: 20,
    },
    backButtonText: {
        color: colors.text.inverse,
        fontSize: 16,
        fontWeight: '500',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: colors.text.inverse,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.inverse,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.text.inverse,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    hint: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        fontStyle: 'italic',
    },
    button: {
        backgroundColor: colors.text.inverse,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: colors.primaryDark,
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkButton: {
        alignItems: 'center',
        padding: 10,
    },
    linkText: {
        color: colors.text.inverse,
        fontSize: 16,
        textDecorationLine: 'underline',
    },
});