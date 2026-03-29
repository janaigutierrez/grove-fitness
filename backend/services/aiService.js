const groqService = require('./groqService');
const mongoose = require('mongoose');
const User = require('../models/User');
const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');
const WorkoutSession = require('../models/WorkoutSession');
const profileService = require('./profileService');
const userService = require('./userService');

// Parse action block from AI response: [ACTION]{...}[/ACTION]
const parseActionFromResponse = (text) => {
    const match = text.match(/\[ACTION\]([\s\S]*?)\[\/ACTION\]/);
    if (!match) return { cleanText: text, action: null };
    try {
        const action = JSON.parse(match[1].trim());
        const cleanText = text.replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/g, '').trim();
        return { cleanText, action };
    } catch {
        const cleanText = text.replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/g, '').trim();
        return { cleanText, action: null };
    }
};

// Helper: Obtener contexto del usuario
const getUserContext = async (userId) => {
    const user = await User.findById(userId).select('-password');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // AFEGIR HISTÒRIC DE SESSIONS
    const recentSessions = await WorkoutSession.find({
        user_id: userId,
        completed: true
    })
        .sort({ completed_at: -1 })
        .limit(5)
        .populate('workout_id', 'name workout_type');

    // CALCULAR MITJANA DE DIFICULTAT
    const avgDifficulty = recentSessions.length > 0
        ? recentSessions.reduce((sum, s) => sum + (s.perceived_difficulty || 5), 0) / recentSessions.length
        : 5;

    // EXERCICIS MÉS FETS
    const topExercises = await Exercise.find({ user_id: userId })
        .sort({ times_performed: -1 })
        .limit(5)
        .select('name times_performed');

    // Últimes 10 entrades de pes corporal
    const weightHistory = (user.weight_history || [])
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10)
        .map(w => ({ weight: w.weight, date: w.date }));

    // Entrenaments existents de l'usuari (per al planning)
    const existingWorkouts = await Workout.find({ user_id: userId, is_template: true })
        .select('_id name workout_type')
        .limit(20);

    return {
        name: user.name,
        fitness_level: user.fitness_level,
        available_equipment: user.available_equipment || [],
        workout_location: user.workout_location,
        time_per_session: user.time_per_session,
        days_per_week: user.days_per_week,
        goals: user.goals || [],
        personality: user.personality_type || 'motivador',

        // DADES FÍSIQUES
        weight_kg: user.weight || null,
        height_cm: user.height || null,
        age: user.age || null,
        weight_history: weightHistory,

        // ÚLTIMES SESSIONS
        recent_sessions: recentSessions.map(s => ({
            workout: s.workout_id?.name,
            difficulty: s.perceived_difficulty,
            energy: s.energy_level,
            mood: s.mood_after,
            date: s.completed_at
        })),
        avg_difficulty: Math.round(avgDifficulty),
        top_exercises: topExercises.map(e => ({
            name: e.name,
            times: e.times_performed
        })),
        personal_bests: user.personal_bests || {},
        current_weights: user.current_weights || {},
        existing_workouts: existingWorkouts.map(w => ({
            id: w._id.toString(),
            name: w.name,
            type: w.workout_type
        }))
    };
};

// Chat conversacional
const chatWithAI = async (userId, message) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    if (!message || message.trim() === '') {
        const error = new Error('Message is required');
        error.statusCode = 400;
        throw error;
    }

    const userContext = await getUserContext(userId);

    // Obtenir historial (últims 10 missatges)
    const conversationHistory = user.ai_context_history || [];
    const recentHistory = conversationHistory.slice(-10);

    // NETEJAR l'historial eliminant camps de MongoDB
    const cleanedHistory = recentHistory.map(msg => ({
        role: msg.role,
        content: msg.content
    }));

    // Llamar a Groq
    const result = await groqService.chat(
        message,
        cleanedHistory,
        userContext.personality,
        userContext
    );

    if (!result.success) {
        const error = new Error(result.error || 'AI processing error');
        error.statusCode = 500;
        throw error;
    }

    // Parsejar acció del missatge si n'hi ha
    const { cleanText, action } = parseActionFromResponse(result.response);

    // Guardar en historial (el text net, sense el bloc d'acció)
    if (!user.ai_context_history) {
        user.ai_context_history = [];
    }

    user.ai_context_history.push(
        { role: 'user', content: message },
        { role: 'assistant', content: cleanText }
    );

    // Mantenir només últims 20 missatges
    if (user.ai_context_history.length > 20) {
        user.ai_context_history = user.ai_context_history.slice(-20);
    }

    await user.save();

    return {
        response: cleanText,
        pending_action: action || null,
        personality: userContext.personality,
        usage: result.usage
    };
};

// Executar una acció confirmada per l'usuari
const executeAction = async (userId, action) => {
    if (!action || !action.type || !action.data) {
        const error = new Error('Invalid action');
        error.statusCode = 400;
        throw error;
    }

    switch (action.type) {
        case 'create_workout': {
            const result = await generateAIWorkout(userId, null, true, action.data);
            return {
                type: 'create_workout',
                message: `Entrenament "${result.workout?.name}" creat correctament!`,
                data: result.workout
            };
        }

        case 'update_schedule': {
            const scheduleData = action.data;
            const user = await User.findById(userId);
            if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

            const validKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const schedule = {};
            for (const day of validKeys) {
                if (day in scheduleData) {
                    const val = scheduleData[day];
                    if (val !== null && val !== undefined) {
                        if (!mongoose.Types.ObjectId.isValid(val)) {
                            const error = new Error(`ID d'entrenament invàlid per a "${day}": "${val}". Usa els IDs reals dels entrenaments existents.`);
                            error.statusCode = 400;
                            throw error;
                        }
                        schedule[day] = val;
                    } else {
                        schedule[day] = null;
                    }
                }
            }
            user.weekly_schedule = { ...user.weekly_schedule, ...schedule };
            await user.save();
            return {
                type: 'update_schedule',
                message: 'Planning setmanal actualitzat!',
                data: schedule
            };
        }

        case 'update_profile': {
            const updated = await userService.updateProfile(userId, action.data);
            return {
                type: 'update_profile',
                message: 'Dades personals actualitzades!',
                data: updated
            };
        }

        case 'log_weight': {
            const weight = parseFloat(action.data.weight);
            if (!weight || weight < 20 || weight > 400) {
                const error = new Error('Pes no vàlid');
                error.statusCode = 400;
                throw error;
            }
            const result = await profileService.addWeightEntry(userId, weight);
            return {
                type: 'log_weight',
                message: `Pes de ${weight} kg registrat!`,
                data: { weight, current_weight: result.current_weight }
            };
        }

        default: {
            const error = new Error(`Unknown action type: ${action.type}`);
            error.statusCode = 400;
            throw error;
        }
    }
};

// Generar workout con IA
const generateAIWorkout = async (userId, prompt, saveToLibrary = true, workoutDataOverride = null) => {
    if (!workoutDataOverride && (!prompt || prompt.trim() === '')) {
        const error = new Error('Prompt is required');
        error.statusCode = 400;
        throw error;
    }

    let workoutData;

    if (workoutDataOverride) {
        // Use workout data provided directly by AI agent action (skip Groq call)
        workoutData = workoutDataOverride;
    } else {
        const userContext = await getUserContext(userId);
        const result = await groqService.generateWorkout(prompt, userContext);
        if (!result.success) {
            const error = new Error(result.error || 'Failed to generate workout');
            error.statusCode = 500;
            error.raw_response = result.raw_response;
            throw error;
        }
        workoutData = result.workout;
    }

    // Si save_to_library, crear ejercicios y workout
    if (saveToLibrary) {
        const createdExerciseIds = [];

        // 1. Crear ejercicios
        for (const exerciseData of workoutData.exercises) {
            let exercise = await Exercise.findOne({
                name: exerciseData.name,
                user_id: userId
            });

            if (!exercise) {
                exercise = new Exercise({
                    name: exerciseData.name,
                    user_id: userId,
                    type: exerciseData.type || 'reps',
                    category: exerciseData.category || 'custom',
                    sets: exerciseData.sets || 3,
                    reps: exerciseData.reps || 10,
                    rest_seconds: exerciseData.rest_seconds || 60,
                    difficulty: workoutData.difficulty || 'medium',
                    notes: exerciseData.notes || ''
                });

                await exercise.save();
            }

            createdExerciseIds.push({
                exercise_id: exercise._id,
                order: createdExerciseIds.length + 1,
                custom_sets: exerciseData.sets,
                custom_reps: exerciseData.reps,
                notes: exerciseData.notes || ''
            });
        }

        // 2. Crear workout
        const workout = new Workout({
            name: workoutData.name,
            user_id: userId,
            exercises: createdExerciseIds,
            workout_type: workoutData.workout_type || 'custom',
            difficulty: workoutData.difficulty || 'medium',
            estimated_duration: workoutData.estimated_duration_minutes
        });

        await workout.save();
        await workout.populate('exercises.exercise_id', 'name type category');

        // Transform workout to id
        return {
            success: true,
            saved: true,
            workout: {
                id: workout._id.toString(),
                name: workout.name,
                workout_type: workout.workout_type,
                difficulty: workout.difficulty,
                estimated_duration: workout.estimated_duration,
                exercises: workout.exercises.map(ex => ({
                    exercise_id: {
                        id: ex.exercise_id._id.toString(),
                        name: ex.exercise_id.name,
                        type: ex.exercise_id.type,
                        category: ex.exercise_id.category
                    },
                    order: ex.order,
                    custom_sets: ex.custom_sets,
                    custom_reps: ex.custom_reps
                })),
                createdAt: workout.createdAt
            },
            ai_notes: workoutData.ai_notes
        };
    }

    // No guardar, solo devolver datos
    return {
        success: true,
        saved: false,
        workout_data: workoutData
    };
};

// Analizar progreso
const analyzeUserProgress = async (userId) => {
    const userContext = await getUserContext(userId);

    // Stats básicos
    const totalWorkouts = await WorkoutSession.countDocuments({
        user_id: userId,
        completed: true
    });

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const thisWeekWorkouts = await WorkoutSession.countDocuments({
        user_id: userId,
        completed: true,
        completed_at: { $gte: weekStart }
    });

    // Calcular racha
    const sessions = await WorkoutSession.find({
        user_id: userId,
        completed: true
    }).sort({ completed_at: -1 }).select('completed_at');

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let session of sessions) {
        const sessionDate = new Date(session.completed_at);
        sessionDate.setHours(0, 0, 0, 0);

        const dayDiff = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));

        if (dayDiff === streak) {
            streak++;
        } else if (dayDiff > streak) {
            break;
        }
    }

    // Volumen total
    const volumeAggregate = await WorkoutSession.aggregate([
        { $match: { user_id: userId, completed: true } },
        { $group: { _id: null, totalVolume: { $sum: '$total_volume_kg' } } }
    ]);

    const totalVolume = volumeAggregate[0]?.totalVolume || 0;

    const userStats = {
        totalWorkouts,
        thisWeekWorkouts,
        currentStreak: streak,
        totalVolume: Math.round(totalVolume)
    };

    // Llamar a IA
    const result = await groqService.analyzeProgress(userStats, userContext.personality);

    if (!result.success) {
        const error = new Error(result.error || 'Failed to analyze progress');
        error.statusCode = 500;
        throw error;
    }

    return {
        stats: userStats,
        ai_feedback: result.feedback
    };
};

// Responder pregunta
const answerFitnessQuestion = async (userId, question) => {
    if (!question || question.trim() === '') {
        const error = new Error('Question is required');
        error.statusCode = 400;
        throw error;
    }

    const userContext = await getUserContext(userId);

    const result = await groqService.answerFitnessQuestion(
        question,
        userContext.personality
    );

    if (!result.success) {
        const error = new Error(result.error || 'Failed to answer question');
        error.statusCode = 500;
        throw error;
    }

    return {
        answer: result.answer
    };
};

// Cambiar personalidad
const changePersonality = async (userId, personality) => {
    const validPersonalities = ['motivador', 'analitico', 'bestia', 'relajado'];

    if (!validPersonalities.includes(personality)) {
        const error = new Error('Invalid personality');
        error.statusCode = 400;
        error.validOptions = validPersonalities;
        throw error;
    }

    await User.findByIdAndUpdate(userId, {
        personality_type: personality
    });

    return {
        message: `Personalidad cambiada a: ${personality}`,
        personality
    };
};

// Limpiar historial
const clearChatHistory = async (userId) => {
    await User.findByIdAndUpdate(userId, {
        ai_context_history: []
    });

    return {
        message: 'Historial de conversación limpiado'
    };
};

// Generate starter workout based on onboarding preferences
const generateStarterWorkout = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    const preferences = {
        fitness_level: user.fitness_level || 'principiante',
        available_equipment: user.available_equipment || ['ninguno'],
        workout_location: user.workout_location || 'casa',
        time_per_session: user.time_per_session || 30,
        days_per_week: user.days_per_week || 3,
        goals: user.goals || []
    };

    // Use AI to generate a personalized starter workout
    const prompt = `Crea un workout inicial perfecto para un usuario con estas características:
- Nivel: ${preferences.fitness_level}
- Equipo disponible: ${preferences.available_equipment.join(', ')}
- Lugar: ${preferences.workout_location}
- Tiempo disponible: ${preferences.time_per_session} minutos
- Días por semana: ${preferences.days_per_week}
- Objetivos: ${preferences.goals.join(', ') || 'Fitness general'}

Crea un workout balanceado y efectivo con:
- Nombre atractivo y motivador
- Descripción breve
- 4-6 ejercicios apropiados para su nivel
- Series y repeticiones adecuadas
- Tiempos de descanso

Responde SOLO con JSON en este formato exacto:
{
  "name": "nombre del workout",
  "description": "descripción breve",
  "exercises": [
    {"name": "nombre ejercicio", "sets": 3, "reps": 10, "rest": 60, "category": "chest"}
  ]
}`;

    const response = await groqService.chat(prompt, [], 'motivador', {});

    if (!response.success) {
        const error = new Error('Failed to generate starter workout');
        error.statusCode = 500;
        throw error;
    }

    // Parse AI response
    try {
        const workoutData = JSON.parse(response.reply);
        return {
            workout: workoutData,
            preferences: preferences
        };
    } catch (parseError) {
        // Fallback to default workout if AI response isn't valid JSON
        return {
            workout: {
                name: "Tu Primer Entrenamiento",
                description: "Un workout perfecto para empezar tu viaje fitness",
                exercises: [
                    { name: "Squats", sets: 3, reps: 12, rest: 60, category: "legs" },
                    { name: "Push-ups", sets: 3, reps: 10, rest: 60, category: "chest" },
                    { name: "Plank", sets: 3, reps: 30, rest: 45, category: "core" },
                    { name: "Lunges", sets: 3, reps: 10, rest: 60, category: "legs" }
                ]
            },
            preferences: preferences
        };
    }
};

module.exports = {
    chatWithAI,
    executeAction,
    generateAIWorkout,
    generateStarterWorkout,
    analyzeUserProgress,
    answerFitnessQuestion,
    changePersonality,
    clearChatHistory
};