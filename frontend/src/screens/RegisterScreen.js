// frontend/src/screens/RegisterScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { register } from '../services/api';

export default function RegisterScreen({ navigation, onLogin }) {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);

    const validateUsername = (username) => {
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        return usernameRegex.test(username);
    };

    const handleRegister = async () => {
        // Validacions
        if (!formData.name || !formData.username || !formData.email || !formData.password) {
            Alert.alert('Error', 'Si us plau, omple tots els camps');
            return;
        }

        if (formData.username.length < 3) {
            Alert.alert('Error', 'El nom d\'usuari ha de tenir almenys 3 caràcters');
            return;
        }

        if (!validateUsername(formData.username)) {
            Alert.alert(
                'Error',
                'El nom d\'usuari només pot contenir lletres, números, guions (-) i guions baixos (_)'
            );
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Error', 'Les contrasenyes no coincideixen');
            return;
        }

        if (formData.password.length < 6) {
            Alert.alert('Error', 'La contrasenya ha de tenir almenys 6 caràcters');
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

            // Auto-login: Passar directament al Dashboard
            if (response.accessToken && response.user) {
                Alert.alert(
                    '🎉 Benvingut a Grove!',
                    `Hola ${formData.name}! El teu compte s'ha creat correctament.\n\n¡Preparat per començar la teva transformació! 💪`,
                    [
                        {
                            text: 'Començar',
                            onPress: () => onLogin(response.accessToken, response.user)
                        }
                    ]
                );
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Error al registrar-se');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#4CAF50', '#2D5016']} style={{ flex: 1 }}>
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
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
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
        color: 'white',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: 'white',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    hint: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        fontStyle: 'italic',
    },
    button: {
        backgroundColor: 'white',
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
        color: '#2D5016',
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkButton: {
        alignItems: 'center',
        padding: 10,
    },
    linkText: {
        color: 'white',
        fontSize: 16,
        textDecorationLine: 'underline',
    },
});