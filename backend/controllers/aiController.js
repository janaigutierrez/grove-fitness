const groqService = require('../services/groqService');
const User = require('../models/User');
const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');
const mongoose = require('mongoose');

// Helper: Obtener contexto del usuario
const getUserContext = async (userId) => {
    const user = await User.findById(userId).select('-password -blacklisted_tokens');

    return {
        name: user.name,
        fitness_level: user.fitness_level,
        available_equipment: user.available_equipment || [],
        workout_location: user.workout_location,
        time_per_session: user.time_per_session,
        days_per_week: user.days_per_week,
        goals: user.goals || [],
        personality: user.ai_personality || 'motivador'
    };
};

// Chat conversacional con IA
const chat = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ msg: 'Message is required' });
        }

        const user = await User.findById(req.user._id);
        const userContext = await getUserContext(req.user._id);

        // Obtener historial de conversación (últimos 10 mensajes)
        const conversationHistory = user.ai_context_history || [];
        const recentHistory = conversationHistory.slice(-10);

        // Llamar a Groq
        const result = await groqService.chat(
            message,
            recentHistory,
            userContext.personality,
            userContext
        );

        if (!result.success) {
            return res.status(500).json({
                msg: 'Error al procesar mensaje',
                error: result.error
            });
        }

        // Guardar en historial
        user.ai_context_history.push(
            { role: 'user', content: message },
            { role: 'assistant', content: result.response }
        );

        // Mantener solo últimos 20 mensajes (10 pares)
        if (user.ai_context_history.length > 20) {
            user.ai_context_history = user.ai_context_history.slice(-20);
        }

        await user.save();

        res.json({
            response: result.response,
            personality: userContext.personality,
            usage: result.usage
        });
    } catch (error) {
        console.error('AI Chat error:', error.message);
        res.status(500).send('Server error');
    }
};

// Generar workout con IA
const generateWorkout = async (req, res) => {
    try {
        const { prompt, save_to_library = true } = req.body;

        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({ msg: 'Prompt is required' });
        }

        const userContext = await getUserContext(req.user._id);

        // Generar workout
        const result = await groqService.generateWorkout(prompt, userContext);

        if (!result.success) {
            return res.status(500).json({
                msg: 'Error al generar workout',
                error: result.error,
                raw_response: result.raw_response
            });
        }

        const workoutData = result.workout;

        // Si save_to_library, crear los ejercicios y el workout
        if (save_to_library) {
            try {
                // 1. Crear ejercicios que no existan
                const createdExerciseIds = [];

                for (const exerciseData of workoutData.exercises) {
                    // Buscar si el ejercicio ya existe
                    let exercise = await Exercise.findOne({
                        name: exerciseData.name,
                        user_id: req.user._id
                    });

                    // Si no existe, crearlo
                    if (!exercise) {
                        exercise = new Exercise({
                            name: exerciseData.name,
                            user_id: req.user._id,
                            type: exerciseData.type || 'reps',
                            category: exerciseData.category || 'custom',
                            muscle_groups: exerciseData.muscle_groups || [],
                            equipment: exerciseData.equipment || ['bodyweight'],
                            default_sets: exerciseData.sets || 3,
                            default_reps: exerciseData.reps || 10,
                            default_rest_seconds: exerciseData.rest_seconds || 60,
                            difficulty: workoutData.difficulty || 'intermediate',
                            is_custom: true
                        });

                        await exercise.save();
                    }

                    createdExerciseIds.push({
                        exercise_id: exercise._id,
                        order: createdExerciseIds.length + 1,
                        custom_sets: exerciseData.sets,
                        custom_reps: exerciseData.reps,
                        custom_rest_seconds: exerciseData.rest_seconds,
                        notes: exerciseData.notes || ''
                    });
                }

                // 2. Crear el workout
                const workout = new Workout({
                    name: workoutData.name,
                    user_id: req.user._id,
                    description: workoutData.description,
                    exercises: createdExerciseIds,
                    workout_type: workoutData.workout_type || 'custom',
                    difficulty: workoutData.difficulty || 'intermediate',
                    estimated_duration_minutes: workoutData.estimated_duration_minutes,
                    ai_generated: true,
                    ai_prompt: prompt
                });

                await workout.save();
                await workout.populate('exercises.exercise_id', 'name type category muscle_groups equipment');

                res.json({
                    success: true,
                    workout,
                    ai_notes: workoutData.ai_notes,
                    msg: '¡Workout creado y guardado en tu biblioteca!'
                });
            } catch (createError) {
                console.error('Error creating workout:', createError);
                // Si falla, devolver solo los datos sin guardar
                res.json({
                    success: true,
                    workout_data: workoutData,
                    saved: false,
                    error: 'No se pudo guardar en biblioteca',
                    msg: 'Workout generado pero no guardado. Puedes crearlo manualmente.'
                });
            }
        } else {
            // Solo devolver datos sin guardar
            res.json({
                success: true,
                workout_data: workoutData,
                saved: false
            });
        }
    } catch (error) {
        console.error('Generate workout error:', error.message);
        res.status(500).send('Server error');
    }
};

// Analizar progreso con IA
const analyzeProgress = async (req, res) => {
    try {
        const userContext = await getUserContext(req.user._id);

        // Obtener stats del usuario (usamos el controller de user)
        const WorkoutSession = require('../models/WorkoutSession');

        const totalWorkouts = await WorkoutSession.countDocuments({
            user_id: req.user._id,
            completed: true
        });

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const thisWeekWorkouts = await WorkoutSession.countDocuments({
            user_id: req.user._id,
            completed: true,
            completed_at: { $gte: weekStart }
        });

        // Calcular racha
        const sessions = await WorkoutSession.find({
            user_id: req.user._id,
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
            { $match: { user_id: req.user._id, completed: true } },
            { $group: { _id: null, totalVolume: { $sum: '$total_volume_kg' } } }
        ]);

        const totalVolume = volumeAggregate[0]?.totalVolume || 0;

        const userStats = {
            totalWorkouts,
            thisWeekWorkouts,
            currentStreak: streak,
            totalVolume: Math.round(totalVolume)
        };

        // Llamar a IA para análisis
        const result = await groqService.analyzeProgress(userStats, userContext.personality);

        if (!result.success) {
            return res.status(500).json({
                msg: 'Error al analizar progreso',
                error: result.error
            });
        }

        res.json({
            stats: userStats,
            ai_feedback: result.feedback
        });
    } catch (error) {
        console.error('Analyze progress error:', error.message);
        res.status(500).send('Server error');
    }
};

// Responder preguntas de fitness
const askQuestion = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question || question.trim() === '') {
            return res.status(400).json({ msg: 'Question is required' });
        }

        const userContext = await getUserContext(req.user._id);

        const result = await groqService.answerFitnessQuestion(
            question,
            userContext.personality
        );

        if (!result.success) {
            return res.status(500).json({
                msg: 'Error al responder pregunta',
                error: result.error
            });
        }

        res.json({
            answer: result.answer
        });
    } catch (error) {
        console.error('Ask question error:', error.message);
        res.status(500).send('Server error');
    }
};

// Cambiar personalidad del coach
const changePersonality = async (req, res) => {
    try {
        const { personality } = req.body;

        const validPersonalities = ['motivador', 'analitico', 'bestia', 'relajado'];
        if (!validPersonalities.includes(personality)) {
            return res.status(400).json({
                msg: 'Invalid personality',
                valid_options: validPersonalities
            });
        }

        await User.findByIdAndUpdate(req.user._id, {
            ai_personality: personality
        });

        res.json({
            msg: `Personalidad cambiada a: ${personality}`,
            personality
        });
    } catch (error) {
        console.error('Change personality error:', error.message);
        res.status(500).send('Server error');
    }
};

// Limpiar historial de conversación
const clearHistory = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            ai_context_history: []
        });

        res.json({ msg: 'Historial de conversación limpiado' });
    } catch (error) {
        console.error('Clear history error:', error.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    chat,
    generateWorkout,
    analyzeProgress,
    askQuestion,
    changePersonality,
    clearHistory
};