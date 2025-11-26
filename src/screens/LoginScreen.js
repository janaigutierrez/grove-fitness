// frontend/src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { login } from '../services/api';
import { handleApiError, ValidationError } from '../utils/errorHandler';
import ErrorModal from '../components/common/ErrorModal';
import useModal from '../hooks/useModal';
import colors from '../constants/colors';

export default function LoginScreen({ navigation, onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // System modals
    const errorModal = useModal();

    const handleLogin = async () => {
        if (!email || !password) {
            const validationError = new ValidationError('Por favor, completa todos los campos');
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
            const response = await login(email, password);

            if (response.accessToken && response.user) {
                onLogin(response.accessToken, response.user);
            } else {
                const errorInfo = handleApiError(new Error('Respuesta inesperada del servidor'));
                errorModal.openModal({
                    title: errorInfo.title,
                    message: errorInfo.message,
                    icon: errorInfo.icon,
                });
            }
        } catch (error) {
            const errorInfo = handleApiError(error);
            errorModal.openModal({
                title: errorInfo.title,
                message: errorInfo.message || 'Error al iniciar sesión',
                icon: errorInfo.icon,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>← Enrere</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>🌱 Grove</Text>
                    <Text style={styles.subtitle}>Benvingut de nou!</Text>
                </View>

                {/* Formulari */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="correu@exemple.com"
                            placeholderTextColor="rgba(255,255,255,0.6)"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Contrasenya</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Contrasenya"
                            placeholderTextColor="rgba(255,255,255,0.6)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>Iniciar sessió</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.linkText}>No tens compte? Registra't</Text>
                    </TouchableOpacity>
                </View>

                {/* System Modals */}
                <ErrorModal
                    visible={errorModal.visible}
                    title={errorModal.modalData.title}
                    message={errorModal.modalData.message}
                    icon={errorModal.modalData.icon}
                    onClose={errorModal.modalData.onClose || errorModal.closeModal}
                />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 50,
        alignItems: 'center',
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 30,
    },
    backButtonText: {
        color: colors.text.inverse,
        fontSize: 16,
        fontWeight: '500',
    },
    title: {
        fontSize: 64,
        fontWeight: 'bold',
        color: colors.text.inverse,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 20,
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