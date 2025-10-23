const WorkoutSession = require('../models/WorkoutSession');
const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');
const mongoose = require('mongoose');

// Helper: Calcular volumen total de una sesión
const calculateTotalVolume = (exercises_performed) => {
    let totalVolume = 0;
    let totalReps = 0;

    exercises_performed.forEach(exercise => {
        exercise.sets_completed.forEach(set => {
            totalReps += set.reps_completed || 0;

            // Solo contar volumen si hay peso
            if (set.weight_used && set.weight_used !== 'corporal' && set.weight_used !== 'bodyweight') {
                const weight = parseFloat(set.weight_used.replace(/[^0-9.]/g, ''));
                if (!isNaN(weight)) {
                    totalVolume += weight * (set.reps_completed || 0);
                }
            }
        });
    });

    return { totalVolume, totalReps };
};

// Helper: Calcular completion percentage
const calculateCompletion = (exercises_performed) => {
    let totalSets = 0;
    let completedSets = 0;

    exercises_performed.forEach(ex => {
        totalSets += ex.planned_sets || 0;
        completedSets += ex.completed_sets || 0;
    });

    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
};

// Helper: Calcular descanso total
const calculateTotalRest = (exercises_performed) => {
    let totalRestSeconds = 0;

    exercises_performed.forEach(ex => {
        ex.sets_completed.forEach(set => {
            totalRestSeconds += set.rest_after_seconds || 0;
        });
    });

    return totalRestSeconds;
};

// Helper: Detectar personal best
const detectPersonalBest = async (userId, exerciseId, currentSet) => {
    try {
        // Buscar sesiones anteriores con este ejercicio
        const previousSessions = await WorkoutSession.find({
            user_id: userId,
            completed: true,
            'exercises_performed.exercise_id': exerciseId
        }).sort({ completed_at: -1 }).limit(10);

        if (previousSessions.length === 0) {
            return { isPersonalBest: true, previous_best: null };
        }

        // Extraer mejores stats anteriores
        let bestReps = 0;
        let bestWeight = 0;

        previousSessions.forEach(session => {
            const exercise = session.exercises_performed.find(
                ex => ex.exercise_id.toString() === exerciseId.toString()
            );

            if (exercise) {
                exercise.sets_completed.forEach(set => {
                    if (set.reps_completed > bestReps) {
                        bestReps = set.reps_completed;
                    }

                    const weight = parseFloat((set.weight_used || '0').replace(/[^0-9.]/g, ''));
                    if (!isNaN(weight) && weight > bestWeight) {
                        bestWeight = weight;
                    }
                });
            }
        });

        // Comparar con set actual
        const currentReps = currentSet.reps_completed || 0;
        const currentWeight = parseFloat((currentSet.weight_used || '0').replace(/[^0-9.]/g, ''));

        const isPersonalBest = currentReps > bestReps ||
            (!isNaN(currentWeight) && currentWeight > bestWeight);

        return {
            isPersonalBest,
            previous_best: { reps: bestReps, weight: bestWeight }
        };
    } catch (error) {
        console.error('Error detecting personal best:', error);
        return { isPersonalBest: false, previous_best: null };
    }
};

// Get all user sessions
const getSessions = async (req, res) => {
    try {
        const { completed, limit = 50 } = req.query;

        let filter = { user_id: req.user._id };
        if (completed !== undefined) filter.completed = completed === 'true';

        const sessions = await WorkoutSession.find(filter)
            .populate('workout_id', 'name workout_type description')
            .populate('exercises_performed.exercise_id', 'name type category')
            .sort({ started_at: -1 })
            .limit(parseInt(limit));

        res.json(sessions);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Get single session
const getSession = async (req, res) => {
    try {
        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid session ID' });
        }

        const session = await WorkoutSession.findOne({
            _id: req.params.id,
            user_id: req.user._id
        })
            .populate('workout_id')
            .populate('exercises_performed.exercise_id');

        if (!session) {
            return res.status(404).json({ msg: 'Session not found' });
        }

        res.json(session);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Start workout session
const startSession = async (req, res) => {
    try {
        const { workout_id, mood_before } = req.body;

        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(workout_id)) {
            return res.status(400).json({ msg: 'Invalid workout ID' });
        }

        // Validar workout existe
        const workout = await Workout.findOne({
            _id: workout_id,
            user_id: req.user._id
        }).populate('exercises.exercise_id');

        if (!workout) {
            return res.status(404).json({ msg: 'Workout not found' });
        }

        // Check si hay sesión activa
        const activeSession = await WorkoutSession.findOne({
            user_id: req.user._id,
            completed: false,
            abandoned: false
        });

        if (activeSession) {
            return res.status(400).json({
                msg: 'You have an active workout session',
                active_session_id: activeSession._id
            });
        }

        // Crear nueva sesión
        const session = new WorkoutSession({
            user_id: req.user._id,
            workout_id,
            started_at: new Date(),
            mood_before: mood_before || 'good',
            exercises_performed: workout.exercises.map(ex => ({
                exercise_id: ex.exercise_id._id,
                planned_sets: ex.custom_sets || ex.exercise_id.default_sets || 3,
                completed_sets: 0,
                sets_completed: []
            }))
        });

        await session.save();
        await session.populate('workout_id', 'name workout_type description estimated_duration_minutes');
        await session.populate('exercises_performed.exercise_id', 'name type category equipment');

        res.json(session);
    } catch (error) {
        console.error('Start session error:', error.message);
        res.status(500).send('Server error');
    }
};

// Add set to session
const addSet = async (req, res) => {
    try {
        const { exercise_index, set_data } = req.body;
        // set_data = { reps_completed, weight_used, rest_after_seconds, rpe, notes }

        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid session ID' });
        }

        let session = await WorkoutSession.findOne({
            _id: req.params.id,
            user_id: req.user._id,
            completed: false,
            abandoned: false
        });

        if (!session) {
            return res.status(404).json({ msg: 'Active session not found' });
        }

        const exercise = session.exercises_performed[exercise_index];
        if (!exercise) {
            return res.status(400).json({ msg: 'Invalid exercise index' });
        }

        // Crear nuevo set
        const newSet = {
            set_number: exercise.sets_completed.length + 1,
            reps_completed: set_data.reps_completed,
            weight_used: set_data.weight_used || 'corporal',
            rest_after_seconds: set_data.rest_after_seconds || 0,
            rpe: set_data.rpe || null,
            completed: true,
            notes: set_data.notes || '',
            timestamp: new Date()
        };

        // Detectar personal best
        const pbCheck = await detectPersonalBest(req.user._id, exercise.exercise_id, newSet);
        exercise.personal_best_achieved = pbCheck.isPersonalBest;
        exercise.previous_best = pbCheck.previous_best;

        // Añadir set
        exercise.sets_completed.push(newSet);
        exercise.completed_sets = exercise.sets_completed.length;

        // Recalcular stats
        const { totalVolume, totalReps } = calculateTotalVolume(session.exercises_performed);
        session.total_volume_kg = totalVolume;
        session.total_reps = totalReps;
        session.total_rest_time_seconds = calculateTotalRest(session.exercises_performed);
        session.completion_percentage = calculateCompletion(session.exercises_performed);

        await session.save();

        res.json({
            session,
            personal_best_achieved: pbCheck.isPersonalBest
        });
    } catch (error) {
        console.error('Add set error:', error.message);
        res.status(500).send('Server error');
    }
};

// Update session progress (bulk update)
const updateSession = async (req, res) => {
    try {
        const { exercises_performed } = req.body;

        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid session ID' });
        }

        let session = await WorkoutSession.findOne({
            _id: req.params.id,
            user_id: req.user._id,
            completed: false
        });

        if (!session) {
            return res.status(404).json({ msg: 'Active session not found' });
        }

        // Update exercises performed
        if (exercises_performed) {
            session.exercises_performed = exercises_performed;

            // Recalcular stats
            const { totalVolume, totalReps } = calculateTotalVolume(session.exercises_performed);
            session.total_volume_kg = totalVolume;
            session.total_reps = totalReps;
            session.total_rest_time_seconds = calculateTotalRest(session.exercises_performed);
            session.completion_percentage = calculateCompletion(session.exercises_performed);
        }

        await session.save();
        res.json(session);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Pause session
const pauseSession = async (req, res) => {
    try {
        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid session ID' });
        }

        const session = await WorkoutSession.findOne({
            _id: req.params.id,
            user_id: req.user._id,
            completed: false
        });

        if (!session) {
            return res.status(404).json({ msg: 'Active session not found' });
        }

        session.paused_at = new Date();
        await session.save();

        res.json({ msg: 'Session paused', paused_at: session.paused_at });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Resume session
const resumeSession = async (req, res) => {
    try {
        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid session ID' });
        }

        const session = await WorkoutSession.findOne({
            _id: req.params.id,
            user_id: req.user._id,
            completed: false
        });

        if (!session) {
            return res.status(404).json({ msg: 'Active session not found' });
        }

        if (!session.paused_at) {
            return res.status(400).json({ msg: 'Session is not paused' });
        }

        // Calcular tiempo pausado (no lo contamos en duración)
        const pauseDuration = (new Date() - session.paused_at) / 1000; // segundos
        session.paused_at = null;

        await session.save();

        res.json({
            msg: 'Session resumed',
            pause_duration_seconds: Math.round(pauseDuration)
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Complete session
const completeSession = async (req, res) => {
    try {
        const { perceived_difficulty, energy_level, mood_after, session_rating, notes } = req.body;

        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid session ID' });
        }

        let session = await WorkoutSession.findOne({
            _id: req.params.id,
            user_id: req.user._id,
            completed: false
        });

        if (!session) {
            return res.status(404).json({ msg: 'Active session not found' });
        }

        // Calcular stats finales
        const completedAt = new Date();
        const totalDuration = Math.round((completedAt - session.started_at) / (1000 * 60)); // minutos

        const { totalVolume, totalReps } = calculateTotalVolume(session.exercises_performed);

        // Update session
        session.completed = true;
        session.completed_at = completedAt;
        session.total_duration_minutes = totalDuration;
        session.total_volume_kg = totalVolume;
        session.total_reps = totalReps;
        session.total_rest_time_seconds = calculateTotalRest(session.exercises_performed);
        session.completion_percentage = calculateCompletion(session.exercises_performed);
        session.perceived_difficulty = perceived_difficulty;
        session.energy_level = energy_level;
        session.mood_after = mood_after;
        session.session_rating = session_rating;
        session.notes = notes;

        // Detectar mejoras y challenges
        session.improvements = [];
        session.challenges = [];

        // Si hay personal bests
        const pbExercises = session.exercises_performed.filter(ex => ex.personal_best_achieved);
        if (pbExercises.length > 0) {
            session.improvements.push(`¡${pbExercises.length} nuevo(s) récord(s) personal(es)!`);
        }

        // Si completion < 80%, hay challenges
        if (session.completion_percentage < 80) {
            session.challenges.push('No completaste todo el workout');
        }

        await session.save();

        // Actualizar stats del workout
        await Workout.findByIdAndUpdate(session.workout_id, {
            $inc: { times_completed: 1 },
            last_performed: completedAt
        });

        // Actualizar stats de ejercicios
        for (const ex of session.exercises_performed) {
            await Exercise.findByIdAndUpdate(ex.exercise_id, {
                $inc: { times_performed: 1 },
                last_performed: completedAt
            });
        }

        res.json(session);
    } catch (error) {
        console.error('Complete session error:', error.message);
        res.status(500).send('Server error');
    }
};

// Abandon session
const abandonSession = async (req, res) => {
    try {
        const { abandon_reason } = req.body;

        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid session ID' });
        }

        let session = await WorkoutSession.findOne({
            _id: req.params.id,
            user_id: req.user._id,
            completed: false
        });

        if (!session) {
            return res.status(404).json({ msg: 'Active session not found' });
        }

        session.abandoned = true;
        session.abandon_reason = abandon_reason || 'User abandoned';
        session.completed_at = new Date();
        session.total_duration_minutes = Math.round((new Date() - session.started_at) / (1000 * 60));

        // Calcular stats parciales
        const { totalVolume, totalReps } = calculateTotalVolume(session.exercises_performed);
        session.total_volume_kg = totalVolume;
        session.total_reps = totalReps;
        session.completion_percentage = calculateCompletion(session.exercises_performed);

        await session.save();
        res.json(session);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Get active session
const getActiveSession = async (req, res) => {
    try {
        const session = await WorkoutSession.findOne({
            user_id: req.user._id,
            completed: false,
            abandoned: false
        })
            .populate('workout_id', 'name workout_type description')
            .populate('exercises_performed.exercise_id', 'name type category equipment');

        if (!session) {
            return res.status(404).json({ msg: 'No active session' });
        }

        res.json(session);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    getSessions,
    getSession,
    startSession,
    addSet,
    updateSession,
    pauseSession,
    resumeSession,
    completeSession,
    abandonSession,
    getActiveSession
};