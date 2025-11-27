const groqService = require('./groqService');
const User = require('../models/User');
const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');
const WorkoutSession = require('../models/WorkoutSession');

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

    return {
        name: user.name,
        fitness_level: user.fitness_level,
        available_equipment: user.available_equipment || [],
        workout_location: user.workout_location,
        time_per_session: user.time_per_session,
        days_per_week: user.days_per_week,
        goals: user.goals || [],
        personality: user.personality_type || 'motivador',

        // HISTÒRIC
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
        current_weights: user.current_weights || {}
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

    // Guardar en historial
    if (!user.ai_context_history) {
        user.ai_context_history = [];
    }

    user.ai_context_history.push(
        { role: 'user', content: message },
        { role: 'assistant', content: result.response }
    );

    // Mantenir només últims 20 missatges
    if (user.ai_context_history.length > 20) {
        user.ai_context_history = user.ai_context_history.slice(-20);
    }

    await user.save();

    return {
        response: result.response,
        personality: userContext.personality,
        usage: result.usage
    };
};

// Generar workout con IA
const generateAIWorkout = async (userId, prompt, saveToLibrary = true) => {
    if (!prompt || prompt.trim() === '') {
        const error = new Error('Prompt is required');
        error.statusCode = 400;
        throw error;
    }

    const userContext = await getUserContext(userId);

    // Generar workout
    const result = await groqService.generateWorkout(prompt, userContext);

    if (!result.success) {
        const error = new Error(result.error || 'Failed to generate workout');
        error.statusCode = 500;
        error.raw_response = result.raw_response;
        throw error;
    }

    const workoutData = result.workout;

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
    generateAIWorkout,
    generateStarterWorkout,
    analyzeUserProgress,
    answerFitnessQuestion,
    changePersonality,
    clearChatHistory
};