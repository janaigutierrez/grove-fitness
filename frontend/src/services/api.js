import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '../utils/errorHandler';
import logger from '../utils/logger';
import cache, { TTL } from './cache';

// ============ CALLBACK DE LOGOUT (evita circular dependency amb AuthContext) ============
let onUnauthorizedCallback = null;

export const setOnUnauthorizedCallback = (cb) => {
    onUnauthorizedCallback = cb;
};

// ============ CONFIGURACIÓ ============
const getBaseUrl = () => {
    const platform = Platform.OS === 'web' ? 'web' : 'mobile';
    const env = process.env.EXPO_PUBLIC_ENV || 'development';

    // Use environment variables with fallback to hardcoded values
    if (env === 'production') {
        return process.env.EXPO_PUBLIC_API_URL_PRODUCTION || 'https://tu-api.com/api';
    }

    // Development environment
    if (platform === 'web') {
        return process.env.EXPO_PUBLIC_API_URL_WEB || 'http://localhost:5000/api';
    } else {
        return process.env.EXPO_PUBLIC_API_URL_MOBILE || 'http://localhost:5000/api';
    }
};

const BASE_URL = getBaseUrl();

logger.info('API URL:', BASE_URL);
logger.info('Environment:', process.env.EXPO_PUBLIC_ENV || 'development');

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
        logger.api.request(options.method || 'GET', url);

        const response = await fetch(url, {
            ...options,
            headers,
        });

        const data = await response.json();
        logger.api.response(response.status, data);

        if (!response.ok) {
            // Si és 401 (no autoritzat) i no estem en login/register
            if (response.status === 401 && !endpoint.includes('/auth/')) {
                logger.warn('401 Unauthorized - token expirat o invàlid, forçant logout');
                if (onUnauthorizedCallback) onUnauthorizedCallback();
            }

            throw new ApiError(
                data.message || data.error || 'Error en la petició',
                response.status,
                data.errors
            );
        }

        return data;

    } catch (error) {
        logger.api.error(error);

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
        logger.warn('Error en logout del servidor, però netejant local');
    } finally {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    }
};

export const getCurrentUser = async () => {
    const cached = cache.get('user:me');
    if (cached) return cached;
    const data = await fetchWithAuth('/auth/me');
    cache.set('user:me', data, TTL.USER_ME);
    return data;
};

// ============ WORKOUTS ============
export const getWorkouts = async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const cacheKey = `workouts:${queryString || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    const endpoint = `/workouts${queryString ? `?${queryString}` : ''}`;
    const data = await fetchWithAuth(endpoint);
    cache.set(cacheKey, data, TTL.WORKOUTS);
    return data;
};

export const getWorkoutById = async (workoutId) => {
    return fetchWithAuth(`/workouts/${workoutId}`);
};

export const createWorkout = async (workoutData) => {
    const data = await fetchWithAuth('/workouts', {
        method: 'POST',
        body: JSON.stringify(workoutData)
    });
    cache.invalidatePrefix('workouts:');
    return data;
};

export const updateWorkout = async (workoutId, workoutData) => {
    const data = await fetchWithAuth(`/workouts/${workoutId}`, {
        method: 'PUT',
        body: JSON.stringify(workoutData)
    });
    cache.invalidatePrefix('workouts:');
    return data;
};

export const deleteWorkout = async (workoutId) => {
    const data = await fetchWithAuth(`/workouts/${workoutId}`, {
        method: 'DELETE'
    });
    cache.invalidatePrefix('workouts:');
    return data;
};

export const duplicateWorkout = async (workoutId) => {
    const data = await fetchWithAuth(`/workouts/${workoutId}/duplicate`, {
        method: 'POST'
    });
    cache.invalidatePrefix('workouts:');
    return data;
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
    const data = await fetchWithAuth(`/sessions/${sessionId}/complete`, {
        method: 'POST',
        body: JSON.stringify(sessionData)
    });
    cache.invalidate('user:stats');
    return data;
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
    const cacheKey = `exercises:${queryString || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    const endpoint = `/exercises${queryString ? `?${queryString}` : ''}`;
    const data = await fetchWithAuth(endpoint);
    cache.set(cacheKey, data, TTL.EXERCISES);
    return data;
};

export const createExercise = async (exerciseData) => {
    return fetchWithAuth('/exercises', {
        method: 'POST',
        body: JSON.stringify(exerciseData)
    });
};

export const updateExercise = async (exerciseId, exerciseData) => {
    return fetchWithAuth(`/exercises/${exerciseId}`, {
        method: 'PUT',
        body: JSON.stringify(exerciseData)
    });
};

export const deleteExercise = async (exerciseId) => {
    return fetchWithAuth(`/exercises/${exerciseId}`, {
        method: 'DELETE'
    });
};

// ============ USER ============
export const getUserStats = async () => {
    const cached = cache.get('user:stats');
    if (cached) return cached;
    const data = await fetchWithAuth('/users/stats');
    cache.set('user:stats', data, TTL.USER_STATS);
    return data;
};

export const updateUserProfile = async (userData) => {
    const data = await fetchWithAuth('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(userData)
    });
    cache.invalidate('user:me');
    cache.invalidate('user:stats');
    return data;
};

export const updatePreferences = async (preferences) => {
    return fetchWithAuth('/users/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences)
    });
};

export const getWeeklySchedule = async () => {
    const cached = cache.get('user:weekly-schedule');
    if (cached) return cached;
    const data = await fetchWithAuth('/users/weekly-schedule');
    cache.set('user:weekly-schedule', data, TTL.WEEKLY_SCHEDULE);
    return data;
};

export const updateWeeklySchedule = async (scheduleData) => {
    const data = await fetchWithAuth('/users/weekly-schedule', {
        method: 'PUT',
        body: JSON.stringify(scheduleData)
    });
    cache.invalidate('user:weekly-schedule');
    return data;
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

export const generateStarterWorkout = async () => {
    return fetchWithAuth('/ai/generate-starter-workout', {
        method: 'POST'
    });
};

export const analyzeProgress = async () => {
    return fetchWithAuth('/ai/analyze-progress');
};

export const executeAIAction = async (action) => {
    return fetchWithAuth('/ai/execute-action', {
        method: 'POST',
        body: JSON.stringify({ action })
    });
};

export const changeAIPersonality = async (personalityType) => {
    const data = await fetchWithAuth('/ai/personality', {
        method: 'PUT',
        body: JSON.stringify({ personality: personalityType })
    });
    cache.invalidate('user:me');
    return data;
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

export const uploadAvatar = async (imageUri) => {
    const token = await AsyncStorage.getItem('token');

    // Crear FormData para el upload
    const formData = new FormData();

    // Para React Native, necesitamos extraer el filename y tipo
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    formData.append('avatar', {
        uri: imageUri,
        name: `avatar.${fileType}`,
        type: `image/${fileType}`
    });

    const url = `${BASE_URL}/users/avatar`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // NO establecer Content-Type, fetch lo hace automáticamente para FormData
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(
                data.message || data.error || 'Error al subir avatar',
                response.status
            );
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError('No se pudo subir el avatar', 0);
    }
};

export const deleteAvatar = async () => {
    return fetchWithAuth('/users/avatar', {
        method: 'DELETE'
    });
};