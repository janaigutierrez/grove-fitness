import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header({ title = "Grove", showNotifications = true, showDropdown = true }) {
    const [dropdownVisible, setDropdownVisible] = useState(false);
    console.log('Header render - dropdownVisible:', dropdownVisible);

    const handleDropdownToggle = () => {
        setDropdownVisible(!dropdownVisible);
        console.log('Dropdown visible:', !dropdownVisible);
    };

    const handleMenuAction = (action) => {
        setDropdownVisible(false);

        switch (action) {
            case 'profile':
                // TODO: Navegar a perfil
                Alert.alert("Perfil", "Navegar a Mi Perfil");
                break;
            case 'settings':
                // TODO: Navegar a configuración
                Alert.alert("Configuración", "Navegar a Configuración");
                break;
            case 'zen':
                Alert.alert("🧘 Zen Mode", "Activar modo concentración?", [
                    { text: "Cancelar" },
                    { text: "Activar", onPress: () => console.log("Zen Mode activado") }
                ]);
                break;
            case 'logout':
                Alert.alert("Salir", "¿Seguro que quieres cerrar sesión?", [
                    { text: "Cancelar" },
                    { text: "Salir", style: "destructive", onPress: () => console.log("Logout") }
                ]);
                break;
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🌱 {title}</Text>

            <View style={styles.rightSection}>
                {showNotifications && (
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="notifications-outline" size={24} color="white" />
                    </TouchableOpacity>
                )}

                {showDropdown && (
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={handleDropdownToggle}
                    >
                        <Ionicons name="menu" size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Dropdown Menu */}
            {dropdownVisible && (
                <>
                    {/* Overlay para cerrar dropdown */}
                    <TouchableOpacity
                        style={styles.overlay}
                        onPress={() => setDropdownVisible(false)}
                    />

                    <View style={styles.dropdown}>
                        <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => handleMenuAction('profile')}
                        >
                            <Ionicons name="person-outline" size={20} color="#2D5016" />
                            <Text style={styles.dropdownText}>Mi Perfil</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => handleMenuAction('settings')}
                        >
                            <Ionicons name="settings-outline" size={20} color="#2D5016" />
                            <Text style={styles.dropdownText}>Configuración</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => handleMenuAction('zen')}
                        >
                            <Ionicons name="leaf-outline" size={20} color="#2D5016" />
                            <Text style={styles.dropdownText}>Zen Mode</Text>
                        </TouchableOpacity>

                        <View style={styles.separator} />

                        <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => handleMenuAction('logout')}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#d32f2f" />
                            <Text style={[styles.dropdownText, { color: '#d32f2f' }]}>Salir</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50, // Space for status bar
        paddingBottom: 15,
        backgroundColor: 'rgba(76, 175, 80, 1)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
        position: 'relative',
        zIndex: 1000,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        marginLeft: 15,
        padding: 5,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        zIndex: 999,
    },
    dropdown: {
        position: 'absolute',
        top: 80,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 8,
        minWidth: 180,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 1001,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    dropdownText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#2D5016',
        fontWeight: '500',
    },
    separator: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 4,
        marginHorizontal: 16,
    },
});