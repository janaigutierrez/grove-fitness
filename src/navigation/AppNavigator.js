import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import WorkoutScreen from '../screens/Workout/WorkoutScreen';
import ProgressScreen from '../screens/Progress/ProgressScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
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
                <Tab.Screen name="Dashboard" component={DashboardScreen} />
                <Tab.Screen name="Workout" component={WorkoutScreen} />
                <Tab.Screen name="Progress" component={ProgressScreen} />
                <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}