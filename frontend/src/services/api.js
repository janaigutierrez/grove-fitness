// frontend/src/services/api.js - AÑADIR FUNCIONES WORKOUT SESSIONS
const BASE_URL = 'http://192.168.1.138:5000/api';

// ====== FUNCIONES EXISTENTES ======
export async function login(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return res.json();
}

export async function register(userData) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    return res.json();
}

// ====== NUEVAS FUNCIONES WORKOUT SESSIONS ======

// Iniciar una sesión de entrenamiento
export async function startWorkoutSession(workoutId, token) {
    const res = await fetch(`${BASE_URL}/sessions/start`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workout_id: workoutId }),
    });
    return res.json();
}

// Actualizar progreso de la sesión
export async function updateWorkoutSession(sessionId, exercisesData, token) {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ exercises_performed: exercisesData }),
    });
    return res.json();
}

// Completar sesión de entrenamiento
export async function completeWorkoutSession(sessionId, sessionData, token) {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            perceived_difficulty: sessionData.difficulty,
            energy_level: sessionData.energy,
            mood_after: sessionData.mood,
            notes: sessionData.notes
        }),
    });
    return res.json();
}

// Abandonar sesión
export async function abandonWorkoutSession(sessionId, reason, token) {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/abandon`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ abandon_reason: reason }),
    });
    return res.json();
}

// Obtener historial de sesiones
export async function getWorkoutSessions(token, limit = 20) {
    const res = await fetch(`${BASE_URL}/sessions?limit=${limit}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    return res.json();
}

// Obtener sesión específica
export async function getWorkoutSession(sessionId, token) {
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    return res.json();
}

// ====== FUNCIONES WORKOUTS (CREAR/EDITAR/DELETE) ======

// Crear nuevo workout
export async function createWorkout(workoutData, token) {
    const res = await fetch(`${BASE_URL}/workouts`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(workoutData),
    });
    return res.json();
}

// Obtener todos los workouts del usuario
export async function getWorkouts(token) {
    const res = await fetch(`${BASE_URL}/workouts`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    return res.json();
}

// Actualizar workout existente
export async function updateWorkout(workoutId, workoutData, token) {
    const res = await fetch(`${BASE_URL}/workouts/${workoutId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(workoutData),
    });
    return res.json();
}

// Eliminar workout
export async function deleteWorkout(workoutId, token) {
    const res = await fetch(`${BASE_URL}/workouts/${workoutId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    return res.ok;
}

// Duplicar workout
export async function duplicateWorkout(workoutId, token) {
    const res = await fetch(`${BASE_URL}/workouts/${workoutId}/duplicate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    return res.json();
}

// ====== FUNCIONES EXERCISES (CREAR/EDITAR/DELETE) ======

// Crear nuevo ejercicio
export async function createExercise(exerciseData, token) {
    const res = await fetch(`${BASE_URL}/exercises`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(exerciseData),
    });
    return res.json();
}

// Obtener ejercicios del usuario
export async function getExercises(token, type = null, category = null) {
    let url = `${BASE_URL}/exercises`;
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (category) params.append('category', category);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    return res.json();
}

// Actualizar ejercicio
export async function updateExercise(exerciseId, exerciseData, token) {
    const res = await fetch(`${BASE_URL}/exercises/${exerciseId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(exerciseData),
    });
    return res.json();
}

// Eliminar ejercicio
export async function deleteExercise(exerciseId, token) {
    const res = await fetch(`${BASE_URL}/exercises/${exerciseId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    return res.ok;
}

// ====== FUNCIONES USER STATS ======

// Obtener estadísticas del usuario
export async function getUserStats(token) {
    const res = await fetch(`${BASE_URL}/users/stats`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    return res.json();
}