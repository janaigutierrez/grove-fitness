import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

// Screens d'autenticació
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Screens principals
import DashboardScreen from '../screens/DashboardScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import AIChatScreen from '../screens/AIChatScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navegador de tabs (app principal)
function MainTabs({ user, token, onLogout }) {
    return (
        <Tab.Navigator
            initialRouteName="Dashboard"
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === 'Dashboard') iconName = 'home-outline';
                    else if (route.name === 'Workout') iconName = 'barbell-outline';
                    else if (route.name === 'AI Chat') iconName = 'chatbubbles-outline';
                    else if (route.name === 'Progress') iconName = 'stats-chart-outline';
                    else if (route.name === 'Profile') iconName = 'person-outline';
                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#2D5016',
                tabBarInactiveTintColor: '#666',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Dashboard">
                {(props) => <DashboardScreen {...props} user={user} token={token} />}
            </Tab.Screen>
            <Tab.Screen name="Workout">
                {(props) => <WorkoutScreen {...props} user={user} token={token} />}
            </Tab.Screen>
            <Tab.Screen name="AI Chat">
                {(props) => <AIChatScreen {...props} user={user} token={token} />}
            </Tab.Screen>
            <Tab.Screen name="Progress">
                {(props) => <ProgressScreen {...props} user={user} token={token} />}
            </Tab.Screen>
            <Tab.Screen name="Profile">
                {(props) => <ProfileScreen {...props} user={user} onLogout={onLogout} />}
            </Tab.Screen>
        </Tab.Navigator>
    );
}

// Navegador principal
export default function AppNavigator() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    const handleLogin = (userToken, userData) => {
        setToken(userToken);
        setUser(userData);
    };

    const handleLogout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <NavigationContainer>
            {!user ? (
                // Stack d'autenticació
                <Stack.Navigator
                    screenOptions={{
                        headerShown: false,
                    }}
                >
                    <Stack.Screen name="Landing" component={LandingScreen} />
                    <Stack.Screen name="Login">
                        {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
                    </Stack.Screen>
                    <Stack.Screen name="Register">
                        {(props) => <RegisterScreen {...props} onLogin={handleLogin} />}
                    </Stack.Screen>
                </Stack.Navigator>
            ) : (
                // App principal amb tabs
                <MainTabs user={user} token={token} onLogout={handleLogout} />
            )}
        </NavigationContainer>
    );
}