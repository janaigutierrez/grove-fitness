// frontend/src/screens/LandingScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LandingScreen({ navigation }) {
    return (
        <ImageBackground
            source={{ uri: 'https://www.transparenttextures.com/patterns/green-fibers.png' }}
            resizeMode="repeat"
            style={styles.background}
        >
            <LinearGradient
                colors={['rgba(76, 175, 80, 0.95)', 'rgba(45, 80, 22, 0.95)']}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    {/* Logo i títol */}
                    <View style={styles.header}>
                        <Text style={styles.logo}>🌱</Text>
                        <Text style={styles.title}>Grove</Text>
                        <Text style={styles.subtitle}>El teu coach personal d'entrenament</Text>
                    </View>

                    {/* Característiques */}
                    <View style={styles.features}>
                        <Text style={styles.feature}>💪 Workouts personalitzats</Text>
                        <Text style={styles.feature}>📊 Seguiment del teu progrés</Text>
                        <Text style={styles.feature}>🤖 Coach IA sempre disponible</Text>
                        <Text style={styles.feature}>🔥 Resultats reals i mesurables</Text>
                    </View>

                    {/* Botons */}
                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={styles.primaryButtonText}>Començar ara</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.secondaryButtonText}>Ja tinc compte</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 30,
    },
    header: {
        alignItems: 'center',
        marginTop: 60,
    },
    logo: {
        fontSize: 80,
        marginBottom: 10,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: colors.text.inverse,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    features: {
        alignItems: 'center',
        gap: 15,
    },
    feature: {
        fontSize: 16,
        color: colors.text.inverse,
        fontWeight: '500',
    },
    buttons: {
        gap: 15,
        marginBottom: 20,
    },
    primaryButton: {
        backgroundColor: colors.text.inverse,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    primaryButtonText: {
        color: colors.primaryDark,
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.text.inverse,
    },
    secondaryButtonText: {
        color: colors.text.inverse,
        fontSize: 18,
        fontWeight: 'bold',
    },
});