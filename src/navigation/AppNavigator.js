// frontend/src/navigation/AppNavigator.js
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import LoginScreen from '../screens/Auth/LoginScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import WorkoutScreen from '../screens/Workout/WorkoutScreen';
import ProgressScreen from '../screens/Progress/ProgressScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    const handleLogin = (userToken, userData) => {
        setToken(userToken);
        setUser(userData);
    };

    if (!user) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <NavigationContainer>
            <Tab.Navigator
                initialRouteName="Dashboard"
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ color, size }) => {
                        let iconName;
                        if (route.name === 'Dashboard') iconName = 'home-outline';
                        else if (route.name === 'Workout') iconName = 'barbell-outline';
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
                    {(props) => <WorkoutScreen {...props} token={token} />}
                </Tab.Screen>
                <Tab.Screen name="Progress" component={ProgressScreen} />
                <Tab.Screen name="Profile">
                    {(props) => <ProfileScreen {...props} user={user} />}
                </Tab.Screen>
            </Tab.Navigator>
        </NavigationContainer>
    );
}