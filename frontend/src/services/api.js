import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '../utils/errorHandler';

// ============ CONFIGURACIÓ ============
const API_CONFIG = {
    development: {
        web: 'http://localhost:5000/api',
        mobile: 'http://192.168.1.138:5000/api' // CANVIA AIXÒ segons la teva IP
    },
    production: {
        web: 'https://tu-api.com/api',
        mobile: 'https://tu-api.com/api'
    }
};

const ENV = 'development'; // Canviar a 'production' en producció

const getBaseUrl = () => {
    const platform = Platform.OS === 'web' ? 'web' : 'mobile';
    return API_CONFIG[ENV][platform];
};

const BASE_URL = getBaseUrl();

console.log('🌐 API URL:', BASE_URL);

// ============ FUNCIÓ FETCH CENTRALITZADA ============
const fetchWithAuth = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;

    // Obtenir token si existeix
    const token = await AsyncStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token && !options.skipAuth) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        console.log(`📤 ${options.method || 'GET'} ${url}`);

        const response = await fetch(url, {
            ...options,
            headers,
        });

        const data = await response.json();
        console.log(`📥 Response (${response.status}):`, data);

        if (!response.ok) {
            // Si és 401 (no autoritzat) i no estem en login/register
            if (response.status === 401 && !endpoint.includes('/auth/')) {
                // Netejar sessió i forçar logout
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
                // Aquí podriesemitir un event per redirigir a login
            }

            throw new ApiError(
                data.message || data.error || 'Error en la petició',
                response.status,
                data.errors
            );
        }

        return data;

    } catch (error) {
        console.error('❌ Error en fetch:', error);

        if (error instanceof ApiError) {
            throw error;
        }

        // Error de xarxa
        throw new ApiError(
            'No es pot connectar amb el servidor',
            0
        );
    }
};

// ============ AUTENTICACIÓ ============
export const login = async (email, password) => {
    const data = await fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true
    });

    // Guardar token i usuari
    if (data.accessToken) {
        await AsyncStorage.setItem('token', data.accessToken);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
};

export const register = async (userData) => {
    const data = await fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        skipAuth: true
    });

    // Guardar token i usuari
    if (data.accessToken) {
        await AsyncStorage.setItem('token', data.accessToken);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
};

export const logout = async () => {
    try {
        await fetchWithAuth('/auth/logout', {
            method: 'POST'
        });
    } catch (error) {
        console.log('Error en logout del servidor, però netejant local');
    } finally {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    }
};

export const getCurrentUser = async () => {
    return fetchWithAuth('/auth/me');
};

// ============ WORKOUTS ============
export const getWorkouts = async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = `/workouts${queryString ? `?${queryString}` : ''}`;
    return fetchWithAuth(endpoint);
};

export const getWorkoutById = async (workoutId) => {
    return fetchWithAuth(`/workouts/${workoutId}`);
};

export const createWorkout = async (workoutData) => {
    return fetchWithAuth('/workouts', {
        method: 'POST',
        body: JSON.stringify(workoutData)
    });
};

export const updateWorkout = async (workoutId, workoutData) => {
    return fetchWithAuth(`/workouts/${workoutId}`, {
        method: 'PUT',
        body: JSON.stringify(workoutData)
    });
};

export const deleteWorkout = async (workoutId) => {
    return fetchWithAuth(`/workouts/${workoutId}`, {
        method: 'DELETE'
    });
};

export const duplicateWorkout = async (workoutId) => {
    return fetchWithAuth(`/workouts/${workoutId}/duplicate`, {
        method: 'POST'
    });
};

// ============ SESSIONS ============
export const startWorkoutSession = async (workoutId) => {
    return fetchWithAuth('/sessions/start', {
        method: 'POST',
        body: JSON.stringify({ workout_id: workoutId })
    });
};

export const updateSession = async (sessionId, exercisesData) => {
    return fetchWithAuth(`/sessions/${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify({ exercises_performed: exercisesData })
    });
};

export const completeWorkoutSession = async (sessionId, sessionData) => {
    return fetchWithAuth(`/sessions/${sessionId}/complete`, {
        method: 'POST',
        body: JSON.stringify(sessionData)
    });
};

export const abandonSession = async (sessionId, reason) => {
    return fetchWithAuth(`/sessions/${sessionId}/abandon`, {
        method: 'POST',
        body: JSON.stringify({ abandon_reason: reason })
    });
};

export const getWorkoutSessions = async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = `/sessions${queryString ? `?${queryString}` : ''}`;
    return fetchWithAuth(endpoint);
};

export const getSessionById = async (sessionId) => {
    return fetchWithAuth(`/sessions/${sessionId}`);
};

// ============ EXERCISES ============
export const getExercises = async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = `/exercises${queryString ? `?${queryString}` : ''}`;
    return fetchWithAuth(endpoint);
};

export const createExercise = async (exerciseData) => {
    return fetchWithAuth('/exercises', {
        method: 'POST',
        body: JSON.stringify(exerciseData)
    });
};

// ============ USER ============
export const getUserStats = async () => {
    return fetchWithAuth('/users/stats');
};

export const updateUserProfile = async (userData) => {
    return fetchWithAuth('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(userData)
    });
};

export const updatePreferences = async (preferences) => {
    return fetchWithAuth('/users/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences)
    });
};

export const getWeeklySchedule = async () => {
    return fetchWithAuth('/users/weekly-schedule');
};

export const updateWeeklySchedule = async (scheduleData) => {
    return fetchWithAuth('/users/weekly-schedule', {
        method: 'PUT',
        body: JSON.stringify(scheduleData)
    });
};

export const getTodayWorkout = async () => {
    return fetchWithAuth('/users/today-workout');
};

// ============ AI ============
export const chatWithAI = async (message) => {
    return fetchWithAuth('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message })
    });
};

export const generateAIWorkout = async (prompt, saveToLibrary = true) => {
    return fetchWithAuth('/ai/generate-workout', {
        method: 'POST',
        body: JSON.stringify({ prompt, save_to_library: saveToLibrary })
    });
};

export const analyzeProgress = async () => {
    return fetchWithAuth('/ai/analyze-progress');
};

// ============ PROFILE ============
export const changeUsername = async (username) => {
    return fetchWithAuth('/users/username', {
        method: 'PUT',
        body: JSON.stringify({ username })
    });
};

export const changePassword = async (currentPassword, newPassword) => {
    return fetchWithAuth('/users/password', {
        method: 'PUT',
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
        })
    });
};

export const addWeightEntry = async (weight) => {
    return fetchWithAuth('/users/weight', {
        method: 'POST',
        body: JSON.stringify({ weight })
    });
};

export const getWeightHistory = async (limit = 30) => {
    return fetchWithAuth(`/users/weight-history?limit=${limit}`);
};