import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { setOnUnauthorizedCallback } from '../services/api';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL_PRODUCTION || 'http://localhost:5000';
const KEEP_ALIVE_INTERVAL_MS = 14 * 60 * 1000; // 14 min

const pingBackend = () => {
    fetch(`${BACKEND_URL.replace('/api', '')}/health`).catch(() => {});
};

// Screens d'autenticació
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

// Screens principals
import DashboardScreen from '../screens/DashboardScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import AIChatScreen from '../screens/AIChatScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WeeklyScheduleScreen from '../screens/WeeklyScheduleScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="WeeklySchedule" component={WeeklyScheduleScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Workout" component={WorkoutScreen} />
      <Tab.Screen name="AI Chat" component={AIChatScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, forceLogout } = useAuth();
  const keepAliveRef = useRef(null);

  useEffect(() => {
    setOnUnauthorizedCallback(forceLogout);
  }, [forceLogout]);

  // Keep-alive: ping backend every 14 min to prevent Render free tier sleep
  useEffect(() => {
    if (!user) return;

    pingBackend(); // ping on login

    keepAliveRef.current = setInterval(pingBackend, KEEP_ALIVE_INTERVAL_MS);

    const handleAppState = (nextState) => {
      if (nextState === 'active') pingBackend(); // ping on foreground
    };
    const sub = AppState.addEventListener('change', handleAppState);

    return () => {
      clearInterval(keepAliveRef.current);
      sub.remove();
    };
  }, [user]);

  return (
    <NavigationContainer>
      {!user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
      ) : (
        <MainTabs />
      )}
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
