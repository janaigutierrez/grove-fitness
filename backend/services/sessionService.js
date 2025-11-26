const WorkoutSession = require('../models/WorkoutSession');
const Workout = require('../models/Workout');

const getSessions = async (userId, filters = {}) => {
    const { completed, limit = 50 } = filters;

    let filter = { user_id: userId };
    if (completed !== undefined) filter.completed = completed === 'true';

    const sessions = await WorkoutSession.find(filter)
        .populate('workout_id', 'name workout_type')
        .populate('exercises_performed.exercise_id', 'name type')
        .sort({ started_at: -1 })
        .limit(parseInt(limit));

    // Transform sessions with populated data
    return sessions.map(session => ({
        id: session._id.toString(),
        workout_id: session.workout_id ? {
            id: session.workout_id._id.toString(),
            name: session.workout_id.name,
            workout_type: session.workout_id.workout_type
        } : null,
        started_at: session.started_at,
        completed_at: session.completed_at,
        total_duration_minutes: session.total_duration_minutes,
        exercises_performed: session.exercises_performed.map(ex => ({
            exercise_id: ex.exercise_id ? {
                id: ex.exercise_id._id.toString(),
                name: ex.exercise_id.name,
                type: ex.exercise_id.type
            } : null,
            sets_completed: ex.sets_completed,
            total_sets: ex.total_sets,
            completed_sets: ex.completed_sets
        })),
        total_volume_kg: session.total_volume_kg,
        total_reps: session.total_reps,
        completion_percentage: session.completion_percentage,
        perceived_difficulty: session.perceived_difficulty,
        energy_level: session.energy_level,
        mood_after: session.mood_after,
        completed: session.completed,
        abandoned: session.abandoned,
        createdAt: session.createdAt
    }));
};

const getSessionById = async (sessionId, userId) => {
    const session = await WorkoutSession.findOne({
        _id: sessionId,
        user_id: userId
    })
        .populate('workout_id')
        .populate('exercises_performed.exercise_id');

    if (!session) {
        const error = new Error('Session not found');
        error.statusCode = 404;
        throw error;
    }

    return {
        id: session._id.toString(),
        workout_id: session.workout_id ? {
            id: session.workout_id._id.toString(),
            name: session.workout_id.name,
            workout_type: session.workout_id.workout_type
        } : null,
        started_at: session.started_at,
        completed_at: session.completed_at,
        total_duration_minutes: session.total_duration_minutes,
        exercises_performed: session.exercises_performed.map(ex => ({
            exercise_id: ex.exercise_id ? {
                id: ex.exercise_id._id.toString(),
                name: ex.exercise_id.name,
                type: ex.exercise_id.type,
                sets: ex.exercise_id.sets,
                reps: ex.exercise_id.reps
            } : null,
            sets_completed: ex.sets_completed,
            total_sets: ex.total_sets,
            completed_sets: ex.completed_sets,
            exercise_duration: ex.exercise_duration
        })),
        total_volume_kg: session.total_volume_kg,
        total_reps: session.total_reps,
        completion_percentage: session.completion_percentage,
        perceived_difficulty: session.perceived_difficulty,
        energy_level: session.energy_level,
        mood_after: session.mood_after,
        notes: session.notes,
        completed: session.completed,
        abandoned: session.abandoned
    };
};

const startSession = async (userId, workoutId) => {
    // Validate workout exists and belongs to user
    const workout = await Workout.findOne({
        _id: workoutId,
        user_id: userId
    }).populate('exercises.exercise_id');

    if (!workout) {
        const error = new Error('Workout not found');
        error.statusCode = 404;
        throw error;
    }

    // Check if there's an active session
    const activeSession = await WorkoutSession.findOne({
        user_id: userId,
        completed: false,
        abandoned: false
    });

    if (activeSession) {
        const error = new Error('You have an active workout session');
        error.statusCode = 400;
        throw error;
    }

    // Create new session
    const session = new WorkoutSession({
        user_id: userId,
        workout_id: workoutId,
        started_at: new Date(),
        exercises_performed: workout.exercises.map(e => ({
            exercise_id: e.exercise_id._id,
            sets_completed: [],
            total_sets: e.custom_sets || e.exercise_id.sets || 1,
            completed_sets: 0
        }))
    });

    await session.save();
    await session.populate('workout_id', 'name workout_type');
    await session.populate('exercises_performed.exercise_id', 'name type');

    return {
        id: session._id.toString(),
        workout_id: {
            id: session.workout_id._id.toString(),
            name: session.workout_id.name,
            workout_type: session.workout_id.workout_type
        },
        started_at: session.started_at,
        exercises_performed: session.exercises_performed.map(ex => ({
            exercise_id: {
                id: ex.exercise_id._id.toString(),
                name: ex.exercise_id.name,
                type: ex.exercise_id.type
            },
            sets_completed: ex.sets_completed,
            total_sets: ex.total_sets,
            completed_sets: ex.completed_sets
        })),
        completed: session.completed
    };
};

const updateSession = async (sessionId, userId, exercisesData) => {
    let session = await WorkoutSession.findOne({
        _id: sessionId,
        user_id: userId,
        completed: false
    });

    if (!session) {
        const error = new Error('Active session not found');
        error.statusCode = 404;
        throw error;
    }

    // Update exercises performed
    if (exercisesData) {
        session.exercises_performed = exercisesData;

        // Calculate completion percentage
        const totalSets = session.exercises_performed.reduce((acc, e) => acc + e.total_sets, 0);
        const completedSets = session.exercises_performed.reduce((acc, e) => acc + e.completed_sets, 0);
        session.completion_percentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
    }

    await session.save();

    return {
        id: session._id.toString(),
        exercises_performed: session.exercises_performed,
        completion_percentage: session.completion_percentage
    };
};

const completeSession = async (sessionId, userId, completionData) => {
    const { perceived_difficulty, energy_level, mood_after, notes } = completionData;

    let session = await WorkoutSession.findOne({
        _id: sessionId,
        user_id: userId,
        completed: false
    });

    if (!session) {
        const error = new Error('Active session not found');
        error.statusCode = 404;
        throw error;
    }

    // Calculate final stats
    const completedAt = new Date();
    const totalDuration = Math.round((completedAt - session.started_at) / (1000 * 60)); // minutes

    // Update session
    session.completed = true;
    session.abandoned = false; // Clear abandoned flag if it was set
    session.abandon_reason = undefined; // Clear abandon reason
    session.completed_at = completedAt;
    session.total_duration_minutes = totalDuration;
    session.perceived_difficulty = perceived_difficulty;
    session.energy_level = energy_level;
    session.mood_after = mood_after;
    session.notes = notes;

    // Calculate volume and reps
    let totalVolume = 0;
    let totalReps = 0;

    session.exercises_performed.forEach(exercise => {
        exercise.sets_completed.forEach(set => {
            if (set.weight_used && set.weight_used !== 'corporal') {
                const weight = parseFloat(set.weight_used.replace(/[^0-9.]/g, ''));
                if (!isNaN(weight)) {
                    totalVolume += weight * (set.reps_completed || 1);
                }
            }
            totalReps += set.reps_completed || 0;
        });
    });

    session.total_volume_kg = totalVolume;
    session.total_reps = totalReps;

    await session.save();

    return {
        id: session._id.toString(),
        completed: session.completed,
        completed_at: session.completed_at,
        total_duration_minutes: session.total_duration_minutes,
        total_volume_kg: session.total_volume_kg,
        total_reps: session.total_reps,
        perceived_difficulty: session.perceived_difficulty,
        energy_level: session.energy_level,
        mood_after: session.mood_after
    };
};

const abandonSession = async (sessionId, userId, reason) => {
    let session = await WorkoutSession.findOne({
        _id: sessionId,
        user_id: userId,
        completed: false
    });

    if (!session) {
        const error = new Error('Active session not found');
        error.statusCode = 404;
        throw error;
    }

    session.abandoned = true;
    session.abandon_reason = reason;
    session.completed_at = new Date();
    session.total_duration_minutes = Math.round((new Date() - session.started_at) / (1000 * 60));

    await session.save();

    return {
        id: session._id.toString(),
        abandoned: session.abandoned,
        abandon_reason: session.abandon_reason,
        completed_at: session.completed_at,
        total_duration_minutes: session.total_duration_minutes
    };
};

module.exports = {
    getSessions,
    getSessionById,
    startSession,
    updateSession,
    completeSession,
    abandonSession
};