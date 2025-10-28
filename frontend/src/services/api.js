// frontend/src/services/api.js
import { Platform } from 'react-native';

// Detectar plataforma per usar la IP correcta
const getBaseUrl = () => {
    if (Platform.OS === 'web') {
        return 'http://localhost:5000/api'; // Per navegador
    }
    return 'http://192.168.1.138:5000/api'; // Per mòbil (Expo Go)
};

const BASE_URL = getBaseUrl();

console.log('🌐 BASE_URL:', BASE_URL);

// ====== FUNCIONS AUTENTICACIÓ ======
export async function login(email, password) {
    console.log('📤 LOGIN: Enviant a', `${BASE_URL}/auth/login`);

    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log('📥 LOGIN: Resposta', data);

    if (!res.ok) throw new Error(data.msg || 'Error al iniciar sessió');
    return data;
}

export async function register(userData) {
    console.log('📤 REGISTER: Enviant a', `${BASE_URL}/auth/register`);
    console.log('📤 REGISTER: Dades', { ...userData, password: '***' });

    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });

    const data = await res.json();
    console.log('📥 REGISTER: Resposta status', res.status);
    console.log('📥 REGISTER: Resposta data', data);

    if (!res.ok) throw new Error(data.msg || 'Error al registrar-se');
    return data;
}

// ====== FUNCIONS WORKOUTS ======
export async function getWorkouts(token) {
    console.log('📤 GET WORKOUTS: Enviant a', `${BASE_URL}/workouts`);

    const res = await fetch(`${BASE_URL}/workouts`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });

    const data = await res.json();
    console.log('📥 GET WORKOUTS: Resposta', data);

    if (!res.ok) throw new Error(data.msg || 'Error al carregar workouts');
    return data;
}

export async function createWorkout(workoutData, token) {
    console.log('📤 CREATE WORKOUT: Enviant a', `${BASE_URL}/workouts`);

    const res = await fetch(`${BASE_URL}/workouts`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(workoutData),
    });

    const data = await res.json();
    console.log('📥 CREATE WORKOUT: Resposta', data);

    if (!res.ok) throw new Error(data.msg || 'Error al crear workout');
    return data;
}

export async function updateWorkout(workoutId, workoutData, token) {
    const res = await fetch(`${BASE_URL}/workouts/${workoutId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(workoutData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Error al actualitzar workout');
    return data;
}

export async function deleteWorkout(workoutId, token) {
    const res = await fetch(`${BASE_URL}/workouts/${workoutId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.msg || 'Error al eliminar workout');
    }
    return true;
}

// ====== FUNCIONS SESSIONS ======
export async function startWorkoutSession(workoutId, token) {
    const res = await fetch(`${BASE_URL}/sessions/start`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workout_id: workoutId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Error al iniciar sessió');
    return data;
}

export async function completeWorkoutSession(sessionId, sessionData, token) {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Error al completar sessió');
    return data;
}

export async function getWorkoutSessions(token, limit = 20) {
    const res = await fetch(`${BASE_URL}/sessions?limit=${limit}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Error al carregar sessions');
    return data;
}

// ====== FUNCIONS USER ======
export async function getUserStats(token) {
    console.log('📤 GET USER STATS: Enviant a', `${BASE_URL}/users/stats`);

    const res = await fetch(`${BASE_URL}/users/stats`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });

    const data = await res.json();
    console.log('📥 GET USER STATS: Resposta', data);

    if (!res.ok) throw new Error(data.msg || 'Error al carregar estadístiques');
    return data;
}

export async function updateUserProfile(userData, token) {
    const res = await fetch(`${BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Error al actualitzar perfil');
    return data;
}